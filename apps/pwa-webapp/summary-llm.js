/**
 * In-browser LLM for AI summary note, suggest note, and dashboard MOTD (Transformers.js).
 * Chat models: Llama-3.2-1B-Instruct (tier 3–5) / SmolLM2-360M-Instruct (tier 1–2).
 */
(function () {
  'use strict';

  var cachedPipeline = null;
  var cachedModelId = null;
  var llmWorkQueue = Promise.resolve();
  var summaryResultCache = null;
  var suggestResultCache = null;
  var downloadProgressState = { pct: 0, status: 'idle', file: '', active: false };
  var downloadCancelled = false;
  var lastDownloadError = null;
  var MAX_SUMMARY_CACHE = 8;
  var MAX_SUGGEST_CACHE = 5;
  var MAX_CONTEXT_CHARS = 720;
  var MAX_SUGGEST_CONTEXT_CHARS = 280;
  var TIMEOUT_MS = 45000;
  var TIMEOUT_SUGGEST_MS = 20000;
  var TIMEOUT_SUGGEST_TOTAL_MS = 120000;
  var TIMEOUT_MOTD_MS = 25000;
  var MAX_MOTD_CHARS = 160;

  var MODEL_SMALL = 'onnx-community/SmolLM2-360M-Instruct';
  var MODEL_BASE = 'onnx-community/Llama-3.2-1B-Instruct';

  var LLM_TIER_MODELS = {
    tier1: { id: MODEL_SMALL, link: 'https://huggingface.co/onnx-community/SmolLM2-360M-Instruct', label: 'SmolLM2 360M', size: '~200 MB' },
    tier2: { id: MODEL_SMALL, link: 'https://huggingface.co/onnx-community/SmolLM2-360M-Instruct', label: 'SmolLM2 360M', size: '~200 MB' },
    tier3: { id: MODEL_BASE, link: 'https://huggingface.co/onnx-community/Llama-3.2-1B-Instruct', label: 'Llama 3.2 1B', size: '~670 MB' },
    tier4: { id: MODEL_BASE, link: 'https://huggingface.co/onnx-community/Llama-3.2-1B-Instruct', label: 'Llama 3.2 1B', size: '~670 MB' },
    tier5: { id: MODEL_BASE, link: 'https://huggingface.co/onnx-community/Llama-3.2-1B-Instruct', label: 'Llama 3.2 1B', size: '~670 MB' }
  };

  var MOTD_SYSTEM =
    'You write one short, simple quote about healthy living for a health tracking app. '
    + 'Topics: sleep, water, gentle movement, rest, fresh air, balanced food, or stress relief. '
    + 'Use plain everyday words. Max 18 words. No names. No medical advice. No quotation marks. '
    + 'Reply with only the quote sentence.';

  function llmTierOrSizeToModelId(tierOrSize) {
    if (tierOrSize === 'tier1' || tierOrSize === 'tier2' || tierOrSize === 'small') return MODEL_SMALL;
    if (tierOrSize === 'tier3' || tierOrSize === 'tier4' || tierOrSize === 'tier5' || tierOrSize === 'base' || tierOrSize === 'large') return MODEL_BASE;
    return MODEL_BASE;
  }

  function getModelDisplayInfo(modelId) {
    if (modelId === MODEL_SMALL) return { label: 'SmolLM2 360M', size: '~200 MB' };
    return { label: 'Llama 3.2 1B', size: '~670 MB' };
  }

  function getDeviceClassForModel() {
    if (typeof window !== 'undefined' && window.PerformanceUtils && typeof window.PerformanceUtils.getDevicePerformanceClass === 'function') {
      return window.PerformanceUtils.getDevicePerformanceClass();
    }
    return 'medium';
  }

  function getModelIdForDeviceClass(deviceClass) {
    return deviceClass === 'low' ? MODEL_SMALL : MODEL_BASE;
  }

  function getPreferredDevice() {
    if (typeof window === 'undefined' || !window.DeviceBenchmark || typeof window.DeviceBenchmark.getCachedResult !== 'function') return null;
    var cached = window.DeviceBenchmark.getCachedResult();
    if (!cached || !cached.gpu || !cached.gpu.available) return null;
    var backend = cached.gpu.backend;
    if (backend === 'webgpu') return 'webgpu';
    if (backend === 'webgl') return 'webgl';
    return null;
  }

  function getResolvedModelId() {
    var prefs = typeof window !== 'undefined' && window.appSettings;
    var preferred = prefs && prefs.preferredLlmModelSize;
    if (preferred && preferred !== 'recommended') {
      return llmTierOrSizeToModelId(preferred);
    }
    if (typeof window !== 'undefined' && window.DeviceBenchmark && typeof window.DeviceBenchmark.isBenchmarkReady === 'function' && window.DeviceBenchmark.isBenchmarkReady()) {
      var platformType = (typeof window.DeviceBenchmark.getPlatformTypeCached === 'function')
        ? window.DeviceBenchmark.getPlatformTypeCached()
        : (typeof window.DeviceBenchmark.getPlatformType === 'function' ? window.DeviceBenchmark.getPlatformType() : 'desktop');
      var tier = window.DeviceBenchmark.getPerformanceTier();
      var full = window.DeviceBenchmark.getFullProfile(platformType, tier, {});
      var size = full && full.llmModelSize;
      if (size) return llmTierOrSizeToModelId(size);
    }
    var deviceClass = (typeof window !== 'undefined' && window.PerformanceUtils && window.PerformanceUtils.platform && window.PerformanceUtils.platform.deviceClass)
      ? window.PerformanceUtils.platform.deviceClass
      : getDeviceClassForModel();
    return getModelIdForDeviceClass(deviceClass);
  }

  function getDownloadConsent() {
    var prefs = typeof window !== 'undefined' && window.appSettings;
    return prefs && prefs.aiModelDownloadConsent;
  }

  function needsDownloadConsent() {
    return getDownloadConsent() !== 'granted';
  }

  var selfHostedProbeCache = {};

  /** GitHub Pages project sites live at /RepoName/ — include that in model URLs. */
  function getAppOriginBase() {
    if (typeof window === 'undefined' || !window.location) return '/';
    var origin = window.location.origin || '';
    var pathname = window.location.pathname || '/';
    var base = '';
    if (origin.indexOf('.github.io') !== -1) {
      var parts = pathname.split('/').filter(Boolean);
      if (parts.length > 0 && parts[0].indexOf('.') === -1) {
        base = '/' + parts[0];
      }
    }
    return origin + base + '/';
  }

  function getSupabaseModelsConfig() {
    var cfg = typeof window !== 'undefined' && window.SUPABASE_CONFIG;
    if (!cfg || !cfg.url || String(cfg.url).indexOf('YOUR_PROJECT') !== -1) return null;
    return {
      supabaseUrl: cfg.url,
      modelsStorageBucket: cfg.modelsStorageBucket || 'llm-models'
    };
  }

  function buildSupabaseModelsPublicBase(supabaseUrl, bucket) {
    var url = String(supabaseUrl || '').replace(/\/$/, '');
    var b = String(bucket || '').trim();
    if (!url || !b) return '';
    return url + '/storage/v1/object/public/' + b + '/';
  }

  function applyTransformersRemote(mod, remoteHost, remotePathTemplate) {
    if (!mod || !mod.env) return;
    mod.env.remoteHost = remoteHost;
    mod.env.remotePathTemplate = remotePathTemplate;
  }

  async function probeModelsHost(baseUrl, modelId) {
    if (!baseUrl) return false;
    var url = String(baseUrl).replace(/\/?$/, '/') + 'models/' + modelId + '/resolve/main/config.json';
    try {
      var res = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
      return !!(res && res.ok);
    } catch (e) {
      return false;
    }
  }

  async function resolveModelsRemote(mod, modelId) {
    var pathTemplate = 'models/{model}/resolve/{revision}/';
    var sb = getSupabaseModelsConfig();
    if (sb) {
      var sbBase = buildSupabaseModelsPublicBase(sb.supabaseUrl, sb.modelsStorageBucket);
      if (sbBase && await probeModelsHost(sbBase, modelId)) {
        applyTransformersRemote(mod, sbBase, pathTemplate);
        return 'supabase';
      }
    }
    var originBase = getAppOriginBase();
    if (await probeModelsHost(originBase, modelId)) {
      applyTransformersRemote(mod, originBase, pathTemplate);
      return 'app-origin';
    }
    applyTransformersRemote(mod, 'https://huggingface.co/', '{model}/resolve/{revision}/');
    return 'huggingface';
  }

  function loadScriptOnce(src) {
    return new Promise(function (resolve, reject) {
      if (typeof document === 'undefined') {
        resolve();
        return;
      }
      var existing = document.querySelector('script[data-rianell-src="' + src + '"]');
      if (existing) {
        if (existing.getAttribute('data-loaded') === '1') resolve();
        else existing.addEventListener('load', function () { resolve(); });
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.setAttribute('data-rianell-src', src);
      s.onload = function () {
        s.setAttribute('data-loaded', '1');
        resolve();
      };
      s.onerror = function () { reject(new Error('Failed to load ' + src)); };
      document.head.appendChild(s);
    });
  }

  async function ensureChunkedModelArtifacts(remoteBase, modelId, mod) {
    if (!window.RianellModelChunkLoader) {
      if (typeof window.PerformanceUtils !== 'undefined' && typeof window.PerformanceUtils.lazyLoadScript === 'function') {
        await window.PerformanceUtils.lazyLoadScript('model-chunk-loader.js');
      } else {
        await loadScriptOnce('model-chunk-loader.js');
      }
    }
    if (!window.RianellModelChunkLoader) return;
    await window.RianellModelChunkLoader.preloadChunkedModelFiles(remoteBase, modelId, function (p) {
      reportDownloadProgress({
        status: 'progress',
        file: (p.file || '') + ' (part ' + p.chunk + '/' + p.chunks + ')',
        progress: p.chunks ? p.chunk / p.chunks : 0
      });
    });
    window.RianellModelChunkLoader.installModelFetchShim(mod);
  }

  function reportDownloadProgress(data) {
    if (!data) return;
    var pct = downloadProgressState.pct;
    if (data.status === 'progress' && data.total) {
      pct = Math.min(100, Math.round((data.loaded / data.total) * 100));
    } else if (data.progress != null) {
      pct = Math.min(100, Math.round(Number(data.progress) * 100));
    } else if (data.status === 'done') {
      pct = 100;
    }
    downloadProgressState = {
      pct: pct,
      status: data.status || downloadProgressState.status,
      file: data.file || '',
      active: data.status !== 'done' && data.status !== 'ready'
    };
    if (typeof window !== 'undefined') {
      window.__rianellLlmDownloadProgress = downloadProgressState;
      try {
        window.dispatchEvent(new CustomEvent('rianell-llm-download-progress', { detail: downloadProgressState }));
      } catch (e) {}
      if (typeof window.updateAiModelDownloadProgressUI === 'function') {
        window.updateAiModelDownloadProgressUI(downloadProgressState);
      }
    }
  }

  function finishDownloadProgress() {
    reportDownloadProgress({ status: 'done', progress: 1 });
    downloadProgressState.active = false;
    if (typeof window !== 'undefined' && typeof window.hideAiModelDownloadProgressUI === 'function') {
      window.hideAiModelDownloadProgressUI();
    }
  }

  async function ensureDownloadConsent() {
    if (!needsDownloadConsent()) return true;
    if (typeof window !== 'undefined' && typeof window.promptAiModelDownloadConsent === 'function') {
      return window.promptAiModelDownloadConsent(getResolvedModelId());
    }
    return false;
  }

  async function requestPersistentStorageIfPossible() {
    try {
      if (typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.persist === 'function') {
        await navigator.storage.persist();
      }
    } catch (e) {}
  }

  function runQueued(taskFn) {
    var result = llmWorkQueue.then(taskFn);
    llmWorkQueue = result.then(function () {}, function () {});
    return result;
  }

  function resolveDtype(device) {
    if (device === 'webgpu') return 'q4f16';
    return 'q4';
  }

  async function runChatGenerationPipeline(mod, pipelineModelId, opts) {
    var base = Object.assign({ revision: 'main' }, opts || {});
    if (base.dtype == null) {
      base.dtype = resolveDtype(base.device);
    }
    base.progress_callback = function (data) {
      reportDownloadProgress(data);
    };
    var origWarn = console.warn;
    if (typeof console !== 'undefined' && console.warn) {
      console.warn = function () {
        var s = arguments[0] != null ? String(arguments[0]) : '';
        if (s.indexOf('dtype not specified') !== -1) return;
        return origWarn.apply(console, arguments);
      };
    }
    try {
      return await mod.pipeline('text-generation', pipelineModelId, base);
    } finally {
      if (typeof console !== 'undefined') console.warn = origWarn;
    }
  }

  async function ensurePipelineLoaded(options) {
    options = options || {};
    if (downloadCancelled) throw new Error('AI model download deferred');
    if (!options.skipConsent && needsDownloadConsent()) {
      var ok = await ensureDownloadConsent();
      if (!ok || downloadCancelled) throw new Error('AI model download deferred');
    }

    var modelId = getResolvedModelId();
    if (cachedPipeline && cachedModelId === modelId) return cachedPipeline;
    cachedPipeline = null;
    cachedModelId = null;

    downloadProgressState.active = true;
    downloadCancelled = false;
    lastDownloadError = null;
    reportDownloadProgress({ status: 'initiate', progress: 0, file: modelId });

    var mod = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.2');
    await resolveModelsRemote(mod, modelId);
    var remoteHost = mod.env && mod.env.remoteHost;
    if (remoteHost && typeof window !== 'undefined') {
      await ensureChunkedModelArtifacts(remoteHost, modelId, mod);
    }
    var device = getPreferredDevice();
    var pipelineOpts = { revision: 'main' };
    if (device) pipelineOpts.device = device;

    async function loadPipeline(opts) {
      return runChatGenerationPipeline(mod, modelId, opts || pipelineOpts);
    }

    try {
      cachedPipeline = await loadPipeline(pipelineOpts);
      cachedModelId = modelId;
      lastDownloadError = null;
      finishDownloadProgress();
      await requestPersistentStorageIfPossible();
      return cachedPipeline;
    } catch (e) {
      if (device && typeof console !== 'undefined' && console.warn) {
        console.warn('Summary LLM: GPU device ' + device + ' failed, falling back to CPU:', e.message || e);
      }
      try {
        var cpuOpts = { revision: 'main' };
        delete cpuOpts.device;
        cachedPipeline = await runChatGenerationPipeline(mod, modelId, cpuOpts);
        cachedModelId = modelId;
        lastDownloadError = null;
        finishDownloadProgress();
        await requestPersistentStorageIfPossible();
        return cachedPipeline;
      } catch (eCpu) {
        if (modelId === MODEL_BASE && typeof console !== 'undefined' && console.warn) {
          console.warn('Summary LLM: ' + modelId + ' failed, retrying with smaller model:', eCpu.message || eCpu);
        }
        if (modelId === MODEL_BASE) {
          try {
            cachedPipeline = await runChatGenerationPipeline(mod, MODEL_SMALL, { revision: 'main' });
            cachedModelId = MODEL_SMALL;
            lastDownloadError = null;
            finishDownloadProgress();
            await requestPersistentStorageIfPossible();
            return cachedPipeline;
          } catch (e2) {
            downloadProgressState.active = false;
            lastDownloadError = (e2 && e2.message) ? String(e2.message) : 'Download failed';
            if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
              window.showToast('AI model download failed. Using text-only fallbacks.', {
                type: 'error',
                action: {
                  label: 'Retry',
                  onClick: function () {
                    if (typeof window.downloadOrRedownloadAiModel === 'function') {
                      window.downloadOrRedownloadAiModel(true);
                    } else if (typeof window.clearSummaryLLMCache === 'function') {
                      window.clearSummaryLLMCache();
                    }
                  }
                }
              });
            }
            throw e2;
          }
        }
        downloadProgressState.active = false;
        lastDownloadError = (eCpu && eCpu.message) ? String(eCpu.message) : 'Download failed';
        throw eCpu;
      }
    }
  }

  async function getPipeline(options) {
    return runQueued(function () {
      return ensurePipelineLoaded(options);
    });
  }

  function extractChatReply(out) {
    if (!out || !out[0]) return '';
    var gt = out[0].generated_text;
    if (Array.isArray(gt)) {
      for (var i = gt.length - 1; i >= 0; i--) {
        var msg = gt[i];
        if (msg && (msg.role === 'assistant' || msg.role === 'model') && msg.content) {
          return String(msg.content).trim();
        }
      }
      var last = gt[gt.length - 1];
      if (last && typeof last.content === 'string') return last.content.trim();
    }
    if (typeof gt === 'string') return gt.trim();
    return '';
  }

  function buildChatMessages(systemText, userText) {
    return [
      { role: 'system', content: systemText },
      { role: 'user', content: userText }
    ];
  }

  async function runChatInference(systemText, userText, genOpts) {
    var messages = buildChatMessages(systemText, userText);
    var out = await runQueued(async function () {
      var pipe = await ensurePipelineLoaded();
      return pipe(messages, genOpts);
    });
    return extractChatReply(out);
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

  function buildSummaryContext(analysis, options) {
    var parts = [];
    var logs = (options && options.logs) ? options.logs : [];
    var dayCount = (options && options.dayCount) || logs.length;

    var flareCount = logs.filter(function (l) { return l.flare === 'Yes'; }).length;
    var dataLine = dayCount + ' day(s) of data.';
    if (flareCount > 0 && dayCount >= 1) {
      dataLine += ' Flares: ' + flareCount + ' day(s).';
    }
    parts.push(dataLine);

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

  var SUMMARY_SYSTEM =
    'You summarise health tracking data for the patient in exactly 2 short sentences. '
    + 'Use only the data provided. Mention 1-2 specific findings. Be clear and encouraging. '
    + 'Reply with only the summary text.';

  async function generateSummaryWithLLM(analysis, options, fallbackNote) {
    var context = buildSummaryContext(analysis, options);
    if (!context || context.length < 10) return fallbackNote;

    var contextHash = simpleHash(context);
    if (!summaryResultCache) summaryResultCache = new Map();
    var cached = summaryResultCache.get(contextHash);
    if (cached != null) return cached;

    try {
      var timeoutPromise = new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error('Summary LLM timeout')); }, TIMEOUT_MS);
      });
      var text = await Promise.race([
        runChatInference(SUMMARY_SYSTEM, 'Data: ' + context, {
          max_new_tokens: 120,
          do_sample: false,
          temperature: 0.2,
          truncation: true
        }),
        timeoutPromise
      ]);

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
    }
    return fallbackNote;
  }

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

  var SUGGEST_SYSTEM =
    'You write one short sentence for a daily health log note. Compare today to the recent average. '
    + 'Use only the data provided. Reply with only the note sentence.';

  async function generateSuggestNoteWithLLM(contextString, fallbackText) {
    if (!contextString || contextString.length < 10) return fallbackText || '';

    var contextHash = simpleHash(contextString);
    if (!suggestResultCache) suggestResultCache = new Map();
    var cached = suggestResultCache.get(contextHash);
    if (cached != null) return cached;

    async function runSuggest() {
      try {
        var timeoutPromise = new Promise(function (_, reject) {
          setTimeout(function () { reject(new Error('Suggest note LLM timeout')); }, TIMEOUT_SUGGEST_MS);
        });
        var text = await Promise.race([
          runChatInference(SUGGEST_SYSTEM, 'Data: ' + contextString, {
            max_new_tokens: 60,
            do_sample: false,
            temperature: 0.2,
            truncation: true
          }),
          timeoutPromise
        ]);

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

    try {
      var totalReject = new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error('Suggest note total timeout')); }, TIMEOUT_SUGGEST_TOTAL_MS);
      });
      return await Promise.race([runSuggest(), totalReject]);
    } catch (e) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('Suggest note LLM failed, using rule-based:', e.message || e);
      }
      return fallbackText || '';
    }
  }

  function sanitizeMotdText(raw) {
    if (!raw || typeof raw !== 'string') return '';
    var t = raw.replace(/\s+/g, ' ').trim();
    t = t.replace(/^["'""]+|["'""]+$/g, '').trim();
    if (t.length > MAX_MOTD_CHARS) {
      var cut = t.slice(0, MAX_MOTD_CHARS);
      var lastSpace = cut.lastIndexOf(' ');
      if (lastSpace > 40) cut = cut.slice(0, lastSpace);
      t = cut.trim();
      if (t.length > 0 && !/[.!?]$/.test(t)) t += '…';
    }
    return t;
  }

  var MOTD_BLOCKLIST_RE = /\b(users?|devices?|alarms?|passwords?|log\s?in|login|account|click|tap|button|settings?|website|browser|android|iphone|ios|alexa|google|siri|according to|the answer|years? old|per cent|percent|hti|app is helpful)\b/i;
  var MOTD_RELEVANCE_RE = /\b(water|sleep|walk|stretch|breathe|breath|food|eat|meal|rest|sunlight|sun|fresh air|move|movement|steps|hydrat|calm|gentle|balance|health|well|body|mind|stress|pause|quiet|nature|outdoor|warm|cool|light|day|morning|evening|night|energy|recover|repair|kind|simple|small|daily|habit|care|self)\b/i;

  function isUsableMotdText(t) {
    if (!t) return false;
    if (/\d/.test(t)) return false;
    if (MOTD_BLOCKLIST_RE.test(t)) return false;
    return MOTD_RELEVANCE_RE.test(t);
  }

  async function generateMotdWithLLM(fallbackText) {
    var themes = [
      'drinking water', 'starting the day with water', 'sleep as repair', 'going to bed on time',
      'gentle morning stretch', 'a short walk outside', 'fresh air break', 'balanced breakfast',
      'eating with kindness', 'rest between tasks', 'slowing down at lunch', 'evening wind-down',
      'breathing before stress', 'stretching your shoulders', 'standing up often', 'sunlight in the morning',
      'hydration through the day', 'choosing whole foods', 'cooking a simple meal', 'fruit as a snack',
      'vegetables on your plate', 'walking after dinner', 'quiet time before sleep', 'gratitude for your body',
      'moving without pressure', 'listening when tired', 'a calm bedtime routine', 'warm tea and rest',
      'outdoor steps', 'posture with ease', 'one healthy choice today', 'small habits that add up',
      'permission to rest', 'gentle movement on hard days', 'stress relief through breath', 'mindful eating',
      'sleep and recovery', 'water with every meal', 'stretching your legs', 'fresh fruit and colour',
      'balanced meals not perfect meals', 'walking in nature', 'deep breaths when overwhelmed'
    ];
    var theme = themes[Math.floor(Math.random() * themes.length)];
    var nonce = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    var userPrompt = 'Write one simple healthy-lifestyle quote. Theme: ' + theme + '. Unique: ' + nonce + '.';

    try {
      var timeoutPromise = new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error('MOTD LLM timeout')); }, TIMEOUT_MOTD_MS);
      });
      var text = await Promise.race([
        runChatInference(MOTD_SYSTEM, userPrompt, {
          max_new_tokens: 40,
          do_sample: true,
          temperature: 0.65,
          top_p: 0.88,
          truncation: true
        }),
        timeoutPromise
      ]);

      text = sanitizeMotdText(text);
      if (text.length >= 12 && text.length <= MAX_MOTD_CHARS + 20) {
        text = stripTrailingIncompleteSentence(text);
        text = sanitizeMotdText(text);
        if (text.length >= 12 && isUsableMotdText(text)) return text;
        if (text.length >= 12 && typeof console !== 'undefined' && console.warn) {
          console.warn('MOTD LLM output rejected as off-topic, using default title.');
        }
      }
    } catch (e) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('MOTD LLM failed, using default title:', e.message || e);
      }
    }
    return fallbackText || '';
  }

  async function warmupPipeline() {
    try {
      await runChatInference(
        'Reply with OK.',
        'OK',
        { max_new_tokens: 2, do_sample: false, temperature: 0.1 }
      );
    } catch (e) {}
  }

  function getAiModelStatus() {
    var info = getResolvedLlmModelInfo();
    var base = { modelId: info.id, label: info.label, size: info.size };
    if (downloadProgressState.active) {
      return Object.assign({
        state: 'downloading',
        pct: downloadProgressState.pct || 0,
        file: downloadProgressState.file || info.id
      }, base);
    }
    if (lastDownloadError) {
      return Object.assign({ state: 'failed', error: lastDownloadError }, base);
    }
    if (cachedPipeline && cachedModelId) {
      return Object.assign({ state: 'ready', inMemory: true, cachedModelId: cachedModelId }, base);
    }
    if (getDownloadConsent() === 'granted') {
      return Object.assign({ state: 'ready', inMemory: false }, base);
    }
    return Object.assign({ state: 'not_downloaded' }, base);
  }

  function clearSummaryLLMCache() {
    cachedPipeline = null;
    cachedModelId = null;
    lastDownloadError = null;
    llmWorkQueue = Promise.resolve();
    if (summaryResultCache) summaryResultCache.clear();
    if (suggestResultCache) suggestResultCache.clear();
  }

  async function clearAiModelCache(options) {
    options = options || {};
    clearSummaryLLMCache();
    lastDownloadError = null;
    try {
      if (typeof caches !== 'undefined') {
        var keys = await caches.keys();
        await Promise.all(keys.map(function (key) {
          if (/transformers|huggingface|onnx|models/i.test(key)) {
            return caches.delete(key);
          }
          return Promise.resolve(false);
        }));
      }
    } catch (e) {}
    if (options.resetConsent && typeof window !== 'undefined' && window.appSettings) {
      window.appSettings.aiModelDownloadConsent = 'deferred';
      if (typeof window.saveSettings === 'function') window.saveSettings();
    }
  }

  async function getAiModelStorageEstimate() {
    try {
      if (typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.estimate === 'function') {
        var est = await navigator.storage.estimate();
        return { usage: est.usage || 0, quota: est.quota || 0 };
      }
    } catch (e) {}
    return { usage: 0, quota: 0 };
  }

  function getResolvedLlmModelInfo() {
    var id = getResolvedModelId();
    return Object.assign({ id: id }, getModelDisplayInfo(id));
  }

  window.generateSummaryWithLLM = generateSummaryWithLLM;
  window.generateSuggestNoteWithLLM = generateSuggestNoteWithLLM;
  window.generateMotdWithLLM = generateMotdWithLLM;
  window.buildSuggestContext = buildSuggestContext;
  window.LLM_TIER_MODELS = LLM_TIER_MODELS;
  window.getResolvedLlmModelInfo = getResolvedLlmModelInfo;
  window.getAiModelDownloadProgress = function () { return downloadProgressState; };
  window.getAiModelStatus = getAiModelStatus;
  window.getAiModelStorageEstimate = getAiModelStorageEstimate;
  window.clearAiModelCache = clearAiModelCache;
  window.preloadSummaryLLM = function () {
    return getPipeline().then(function (pipe) {
      return warmupPipeline().then(function () { return pipe; });
    });
  };
  window.clearSummaryLLMCache = clearSummaryLLMCache;
  window.needsAiModelDownloadConsent = needsDownloadConsent;
  window.cancelAiModelDownload = function () {
    downloadCancelled = true;
    downloadProgressState.active = false;
    lastDownloadError = null;
    cachedPipeline = null;
    cachedModelId = null;
    if (typeof window !== 'undefined' && window.appSettings) {
      window.appSettings.aiModelDownloadConsent = 'deferred';
      if (typeof window.saveSettings === 'function') window.saveSettings();
    }
    if (typeof window !== 'undefined' && typeof window.hideAiModelDownloadProgressUI === 'function') {
      window.hideAiModelDownloadProgressUI();
    }
  };
})();
