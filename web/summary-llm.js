/**
 * In-browser LLM for the AI summary note and suggest note (Transformers.js).
 * Model is chosen by device performance: small on low-end, base on medium/high for better quality.
 * Falls back to rule-based note if the model is unavailable or fails.
 */
(function () {
  'use strict';

  var cachedPipeline = null;
  var cachedModelId = null;
  var summaryResultCache = null;
  var suggestResultCache = null;
  var MAX_SUMMARY_CACHE = 8;
  var MAX_SUGGEST_CACHE = 5;
  var MAX_CONTEXT_CHARS = 720;
  var MAX_SUGGEST_CONTEXT_CHARS = 280;
  var TIMEOUT_MS = 28000;
  var TIMEOUT_SUGGEST_MS = 12000;

  var MODEL_SMALL = 'Xenova/flan-t5-small';
  var MODEL_BASE = 'Xenova/flan-t5-base';

  /**
   * Returns device performance tier: 'low' | 'medium' | 'high'.
   * Used to select model: low -> small, medium/high -> base.
   */
  function getDevicePerformanceClass() {
    var nav = typeof navigator !== 'undefined' ? navigator : {};
    var deviceMemory = nav.deviceMemory;
    var cores = nav.hardwareConcurrency;
    var isSecure = typeof window !== 'undefined' && window.isSecureContext === true;

    if (isSecure && typeof deviceMemory === 'number' && deviceMemory > 0) {
      if (deviceMemory <= 2) return 'low';
      if (deviceMemory >= 8) return 'high';
      return 'medium';
    }
    if (typeof cores === 'number' && cores > 0) {
      if (cores <= 2) return 'low';
      if (cores >= 6) return 'high';
      return 'medium';
    }
    var mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(nav.userAgent || '') || (nav.maxTouchPoints && nav.maxTouchPoints > 1);
    if (mobile) return 'low';
    return 'medium';
  }

  function getModelIdForDeviceClass(deviceClass) {
    return deviceClass === 'low' ? MODEL_SMALL : MODEL_BASE;
  }

  async function getPipeline() {
    var modelId = cachedModelId;
    if (cachedPipeline && modelId) return cachedPipeline;

    var deviceClass = (typeof window !== 'undefined' && window.PerformanceUtils && window.PerformanceUtils.platform && window.PerformanceUtils.platform.deviceClass)
      ? window.PerformanceUtils.platform.deviceClass
      : getDevicePerformanceClass();
    modelId = getModelIdForDeviceClass(deviceClass);
    if (typeof window !== 'undefined' && window.healthAppDebug && typeof console !== 'undefined' && console.debug) {
      console.debug('Summary LLM getPipeline: modelId=' + modelId + ', revision=main');
    }

    // Use 3.2.0 to avoid "n.env is not a function" (flags_webgl.ts) with 3.4.x + ONNX Runtime Web
    var mod = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.2.0');
    // Do not set mod.env.allowLocalModels here; default is false in browser and avoids env API issues

    try {
      // Xenova models: config/tokenizer are on main; ONNX weights in onnx/ subfolder (library loads them automatically)
      cachedPipeline = await mod.pipeline('text2text-generation', modelId, { revision: 'main' });
      cachedModelId = modelId;
      return cachedPipeline;
    } catch (e) {
      if (modelId === MODEL_BASE && typeof console !== 'undefined' && console.warn) {
        console.warn('Summary LLM: flan-t5-base failed, retrying with flan-t5-small:', e.message || e);
      }
      if (modelId === MODEL_BASE) {
        try {
          cachedPipeline = await mod.pipeline('text2text-generation', MODEL_SMALL, { revision: 'main' });
          cachedModelId = MODEL_SMALL;
          return cachedPipeline;
        } catch (e2) {
          throw e2;
        }
      }
      throw e;
    }
  }

  function simpleHash(s) {
    if (typeof s !== 'string' || s.length === 0) return '0';
    var h = 5381;
    for (var i = 0; i < s.length; i++) {
      h = ((h << 5) + h) + s.charCodeAt(i);
    }
    return (h >>> 0).toString(36);
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
    // Optional: one line from stressors or symptoms if present (enrich without bloating)
    if (analysis.stressorAnalysis && analysis.stressorAnalysis.topStressors && analysis.stressorAnalysis.topStressors.length > 0) {
      var top = analysis.stressorAnalysis.topStressors[0];
      if (top && top.name && !parts.some(function (p) { return p.indexOf(top.name) >= 0; })) {
        parts.push('Top stressor: ' + (top.name || '').trim() + (top.pct != null ? ' (' + Math.round(top.pct) + '%).' : '.'));
      }
    }

    var text = parts.join(' ');
    return text.length > MAX_CONTEXT_CHARS ? text.slice(0, MAX_CONTEXT_CHARS) : text;
  }

  function stripTrailingIncompleteSentence(text) {
    if (!text || text.length < 20) return text;
    var last = text.lastIndexOf('.');
    if (last === -1) return text;
    return text.slice(0, last + 1).trim();
  }

  /**
   * Generate a short, data-informed summary (2–3 sentences) for the patient.
   * Result is cached by context hash so the same analysis/options return cached text (only update on change).
   */
  async function generateSummaryWithLLM(analysis, options, fallbackNote) {
    var context = buildSummaryContext(analysis, options);
    if (!context || context.length < 10) return fallbackNote;

    var contextHash = simpleHash(context);
    if (!summaryResultCache) summaryResultCache = new Map();
    var cached = summaryResultCache.get(contextHash);
    if (cached != null) return cached;

    var prompt = 'Summarise in 2 short sentences for the patient. Use only the data below. Mention 1-2 specific findings (e.g. trends or flares). Be clear and encouraging. Data: ' + context;

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
      if (text && text.length > 15) {
        text = stripTrailingIncompleteSentence(text);
        if (summaryResultCache.size >= MAX_SUMMARY_CACHE) {
          var firstKey = summaryResultCache.keys().next().value;
          if (firstKey != null) summaryResultCache.delete(firstKey);
        }
        summaryResultCache.set(contextHash, text);
        return text;
      }
    } catch (e) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('Summary LLM failed, using rule-based note:', e.message || e);
      }
      if (typeof window !== 'undefined' && window.healthAppDebug && typeof console !== 'undefined' && console.debug) {
        console.debug('Summary LLM: using rule-based fallback');
      }
    }
    return fallbackNote;
  }

  /**
   * Build short context for suggest note: today's metrics vs recent 14-day average.
   * Metrics: backPain, stiffness, fatigue, sleep, jointPain, mobility, dailyFunction, swelling, mood, irritability.
   */
  function buildSuggestContext(todayStub, recentLogs) {
    var metrics = ['backPain', 'stiffness', 'fatigue', 'sleep', 'jointPain', 'mobility', 'dailyFunction', 'swelling', 'mood', 'irritability'];
    var recent = (recentLogs || []).filter(function (l) { return l.date !== (todayStub && todayStub.date); }).slice(-14);
    if (recent.length < 2) return '';

    var todayParts = [];
    var avgParts = [];
    metrics.forEach(function (m) {
      var v = todayStub[m];
      if (v === undefined || v === null || v === '') return;
      var num = m === 'weight' ? parseFloat(v) : (parseInt(v, 10) || 0);
      if (isNaN(num)) return;
      var vals = recent.map(function (l) { return m === 'weight' ? parseFloat(l[m]) : (parseInt(l[m], 10) || 0); }).filter(function (x) { return !isNaN(x); });
      if (vals.length < 2) return;
      var avg = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
      var name = metricLabel(m);
      todayParts.push(name + ' ' + (m === 'weight' ? num.toFixed(1) : num));
      avgParts.push(name + ' ' + avg.toFixed(1));
    });
    if (todayParts.length < 2) return '';

    var line1 = 'Today: ' + todayParts.slice(0, 5).join(', ') + '.';
    var line2 = 'Recent 14-day average: ' + avgParts.slice(0, 5).join(', ') + '.';
    var flare = (todayStub.flare === 'Yes') ? ' Flare: Yes.' : ' Flare: No.';
    var text = line1 + ' ' + line2 + flare;
    return text.length > MAX_SUGGEST_CONTEXT_CHARS ? text.slice(0, MAX_SUGGEST_CONTEXT_CHARS) : text;
  }

  /**
   * Generate one short sentence for a daily log note using the same pipeline. Resolves with fallbackText on failure.
   * Result is cached by context hash so the same context returns cached text (only update on change).
   */
  async function generateSuggestNoteWithLLM(contextString, fallbackText) {
    if (!contextString || contextString.length < 10) return fallbackText || '';

    var contextHash = simpleHash(contextString);
    if (!suggestResultCache) suggestResultCache = new Map();
    var cached = suggestResultCache.get(contextHash);
    if (cached != null) return cached;

    var prompt = 'Write one short sentence for a daily log note. Use only the data below. Compare today to average. Data: ' + contextString;

    try {
      var pipe = await getPipeline();
      var run = pipe(prompt, {
        max_new_tokens: 48,
        do_sample: false,
        truncation: true
      });
      var timeoutPromise = new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error('Suggest note LLM timeout')); }, TIMEOUT_SUGGEST_MS);
      });
      var out = await Promise.race([run, timeoutPromise]);

      var text = (out && out[0] && out[0].generated_text) ? out[0].generated_text.trim() : '';
      if (text && text.length > 8) {
        text = stripTrailingIncompleteSentence(text);
        if (suggestResultCache.size >= MAX_SUGGEST_CACHE) {
          var firstKey = suggestResultCache.keys().next().value;
          if (firstKey != null) suggestResultCache.delete(firstKey);
        }
        suggestResultCache.set(contextHash, text);
        return text;
      }
    } catch (e) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('Suggest note LLM failed, using rule-based:', e.message || e);
      }
    }
    return fallbackText || '';
  }

  window.generateSummaryWithLLM = generateSummaryWithLLM;
  window.generateSuggestNoteWithLLM = generateSuggestNoteWithLLM;
  window.buildSuggestContext = buildSuggestContext;
})();
