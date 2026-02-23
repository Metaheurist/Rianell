/**
 * In-browser small LLM for the AI summary note (Transformers.js).
 * Light model, context rich in data (trends, flares, insights) so output is short and insightful.
 * Falls back to rule-based note if the model is unavailable or fails.
 */
(function () {
  'use strict';

  var cachedPipeline = null;
  var MAX_CONTEXT_CHARS = 720;
  var TIMEOUT_MS = 28000;

  async function getPipeline() {
    if (cachedPipeline) return cachedPipeline;
    var mod = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.4.0');
    mod.env.allowLocalModels = false;
    cachedPipeline = await mod.pipeline('text2text-generation', 'Xenova/flan-t5-small', { revision: 'onnx' });
    return cachedPipeline;
  }

  function stripMarkdown(s) {
    return (s || '').replace(/\*\*([^*]+)\*\*/g, '$1').trim();
  }

  function metricLabel(metric) {
    return (metric || '')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, function (c) { return c.toUpperCase(); })
      .trim();
  }

  /**
   * Build data-rich context: trends snapshot, flare count, then summary/insights/advice.
   * Keeps the model light by feeding clear, factual bullets so it can be concise and insightful.
   */
  function buildSummaryContext(analysis, options) {
    var parts = [];
    var logs = (options && options.logs) ? options.logs : [];
    var dayCount = (options && options.dayCount) || logs.length;

    // 1) Data snapshot: period + flares
    var flareCount = logs.filter(function (l) { return l.flare === 'Yes'; }).length;
    var dataLine = dayCount + ' day(s) of data.';
    if (flareCount > 0 && dayCount >= 1) {
      dataLine += ' Flares: ' + flareCount + ' day(s).';
    }
    parts.push(dataLine);

    // 2) Trend bullets (improving / stable / worsening) from analysis.trends
    var trends = analysis.trends || {};
    var improving = [];
    var worsening = [];
    var stable = [];
    Object.keys(trends).forEach(function (metric) {
      var t = trends[metric];
      if (!t || !t.regression) return;
      var sig = t.regression.normalizedSignificance;
      if (sig != null && sig < 0.5) return;
      var dir = (t.regression && t.regression.direction) || t.predictedStatus;
      var name = metricLabel(metric);
      if (dir === 'improving') improving.push(name);
      else if (dir === 'worsening') worsening.push(name);
      else if (dir === 'stable') stable.push(name);
    });
    if (improving.length) parts.push('Improving: ' + improving.slice(0, 4).join(', ') + '.');
    if (worsening.length) parts.push('Worsening: ' + worsening.slice(0, 4).join(', ') + '.');
    if (stable.length && parts.length <= 2) parts.push('Stable: ' + stable.slice(0, 3).join(', ') + '.');

    // 3) Narrative summary + top insights + one advice
    if (analysis.summary && analysis.summary.trim()) {
      parts.push(stripMarkdown(analysis.summary));
    }
    if (analysis.prioritisedInsights && analysis.prioritisedInsights.length > 0) {
      analysis.prioritisedInsights.slice(0, 3).forEach(function (insight) {
        parts.push(stripMarkdown(insight));
      });
    }
    if (analysis.advice && analysis.advice.length > 0) {
      parts.push(stripMarkdown(analysis.advice[0]));
    }

    var text = parts.join(' ');
    return text.length > MAX_CONTEXT_CHARS ? text.slice(0, MAX_CONTEXT_CHARS) : text;
  }

  /**
   * Generate a short, data-informed summary (2–3 sentences) for the patient.
   */
  async function generateSummaryWithLLM(analysis, options, fallbackNote) {
    var context = buildSummaryContext(analysis, options);
    if (!context || context.length < 10) return fallbackNote;

    var prompt = 'Write 2 short sentences for a patient. Use only the data below. Mention 1-2 specific findings (e.g. trends or flares). Data: ' + context;

    try {
      var pipe = await getPipeline();
      var run = pipe(prompt, {
        max_new_tokens: 90,
        do_sample: false,
        truncation: true
      });
      var timeoutPromise = new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error('Summary LLM timeout')); }, TIMEOUT_MS);
      });
      var out = await Promise.race([run, timeoutPromise]);

      var text = (out && out[0] && out[0].generated_text) ? out[0].generated_text.trim() : '';
      if (text && text.length > 15) return text;
    } catch (e) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('Summary LLM failed, using rule-based note:', e.message || e);
      }
    }
    return fallbackNote;
  }

  window.generateSummaryWithLLM = generateSummaryWithLLM;
})();
