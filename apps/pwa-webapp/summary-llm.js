/**
 * In-browser LLM for AI summary note, suggest note, and dashboard MOTD (Transformers.js).
 * Tier 1–2 and tier 3–5 on-device packages (internal HF ids are not shown in UI).
 */
(function () {
  'use strict';

  var cachedPipeline = null;
  var cachedModelId = null;
  var cachedActiveBackend = null;
  var cachedActiveDtype = null;
  var llmWorkQueue = Promise.resolve();
  var summaryResultCache = null;
  var suggestResultCache = null;
  var homeQuestionResultCache = null;
  var downloadProgressState = { pct: 0, status: 'idle', file: '', active: false };
  var downloadCancelled = false;
  var lastDownloadError = null;
  var loadGeneration = 0;
  var MAX_SUMMARY_CACHE = 8;
  var MAX_SUGGEST_CACHE = 5;
  var MAX_HOME_QUESTION_CACHE = 8;
  var MAX_CONTEXT_CHARS = 720;
  var MAX_SUGGEST_CONTEXT_CHARS = 280;
  var TIMEOUT_MS = 45000;
  var TIMEOUT_SUGGEST_MS = 20000;
  var TIMEOUT_SUGGEST_TOTAL_MS = 120000;
  var TIMEOUT_MOTD_MS = 25000;
  var TIMEOUT_HOME_QUESTION_MS = 35000;
  var MAX_MOTD_CHARS = 160;

  var MODEL_SMALL = 'onnx-community/SmolLM2-360M-Instruct-ONNX';
  var MODEL_BASE = 'onnx-community/Llama-3.2-1B-Instruct-ONNX';

  var LLM_TIER_MODELS = {
    tier1: { id: MODEL_SMALL, size: '~200 MB', approxBytes: 209715200 },
    tier2: { id: MODEL_SMALL, size: '~200 MB', approxBytes: 209715200 },
    tier3: { id: MODEL_BASE, size: '~670 MB', approxBytes: 702545920 },
    tier4: { id: MODEL_BASE, size: '~670 MB', approxBytes: 702545920 },
    tier5: { id: MODEL_BASE, size: '~670 MB', approxBytes: 702545920 }
  };

  var promptPackByLocale = {};
  var promptPackLoadPromises = {};

  function getActiveLocale() {
    if (typeof window !== 'undefined' && window.RianellI18n && typeof window.RianellI18n.getLocale === 'function') {
      return window.RianellI18n.getLocale() || 'en-GB';
    }
    return 'en-GB';
  }

  function promptString(pack, key, fallback) {
    if (pack && pack.strings && typeof pack.strings[key] === 'string') return pack.strings[key];
    return fallback;
  }

  function loadPromptPack(locale) {
    var loc = locale || 'en-GB';
    if (window.__rianellPromptPack && window.__rianellPromptPack.locale === loc) {
      promptPackByLocale[loc] = window.__rianellPromptPack;
      return Promise.resolve(window.__rianellPromptPack);
    }
    if (promptPackByLocale[loc]) return Promise.resolve(promptPackByLocale[loc]);
    if (promptPackLoadPromises[loc]) return promptPackLoadPromises[loc];
    var url = getAppOriginBase() + 'i18n-packs/prompt-packs/v1/' + encodeURIComponent(loc) + '.json';
    promptPackLoadPromises[loc] = fetch(url, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (data) {
          promptPackByLocale[loc] = data;
          window.__rianellPromptPack = data;
          return data;
        }
        if (loc !== 'en-GB') return loadPromptPack('en-GB');
        return { locale: 'en-GB', strings: {} };
      })
      .catch(function () {
        if (loc !== 'en-GB') return loadPromptPack('en-GB');
        return { locale: 'en-GB', strings: {} };
      })
      .finally(function () { delete promptPackLoadPromises[loc]; });
    return promptPackLoadPromises[loc];
  }

  function buildMotdPromptFromPack(pack, theme) {
    var system = promptString(pack, 'motd.system',
      'You write one short, simple quote about healthy living for a health tracking app. '
      + 'Topics: sleep, water, gentle movement, rest, fresh air, balanced food, or stress relief. '
      + 'Use plain everyday words. Max 18 words. No names. No medical advice. No quotation marks. '
      + 'Reply with only the quote sentence.');
    var userBase = promptString(pack, 'motd.user', 'Write one healthy-lifestyle quote.');
    return { system: system, user: theme ? (userBase + ' Theme: ' + theme + '.') : userBase };
  }

  function buildSummaryPromptFromPack(pack, context) {
    var system = promptString(pack, 'summary.system',
      'You summarise health tracking data for the patient in exactly 2 short sentences. '
      + 'Use only the data provided. Mention 1-2 specific findings. Be clear and encouraging. '
      + 'Reply with only the summary text.');
    return { system: system, user: 'Data: ' + context };
  }

  function buildSuggestPromptFromPack(pack, context) {
    var system = promptString(pack, 'suggest.system',
      'You write one short sentence for a daily health log note. Compare today to the recent average. '
      + 'Use only the data provided. Reply with only the note sentence.');
    return { system: system, user: 'Data: ' + context };
  }

  function buildHomeQuestionPromptFromPack(pack, context) {
    var system = promptString(pack, 'homeQuestion.system',
      'You answer one specific health-tracking question using only the data provided. '
      + 'Write 3–5 short sentences in plain language. No diagnosis or medical orders. '
      + 'Be encouraging. Reply with only the answer text.');
    return { system: system, user: context };
  }

  function llmTierOrSizeToModelId(tierOrSize) {
    if (tierOrSize === 'tier1' || tierOrSize === 'tier2' || tierOrSize === 'small') return MODEL_SMALL;
    if (tierOrSize === 'tier3' || tierOrSize === 'tier4' || tierOrSize === 'tier5' || tierOrSize === 'base' || tierOrSize === 'large') return MODEL_BASE;
    return MODEL_BASE;
  }

  function resolvePreferredTierKey() {
    var prefs = typeof window !== 'undefined' && window.appSettings;
    var preferred = prefs && prefs.preferredLlmModelSize;
    if (preferred && preferred !== 'recommended' && /^tier[1-5]$/.test(preferred)) {
      return preferred;
    }
    if (typeof window !== 'undefined' && window.DeviceBenchmark && typeof window.DeviceBenchmark.isBenchmarkReady === 'function' && window.DeviceBenchmark.isBenchmarkReady()) {
      var platformType = (typeof window.DeviceBenchmark.getPlatformTypeCached === 'function')
        ? window.DeviceBenchmark.getPlatformTypeCached()
        : (typeof window.DeviceBenchmark.getPlatformType === 'function' ? window.DeviceBenchmark.getPlatformType() : 'desktop');
      var tier = window.DeviceBenchmark.getPerformanceTier();
      var full = window.DeviceBenchmark.getFullProfile(platformType, tier, {});
      if (full && full.llmModelSize && /^tier[1-5]$/.test(full.llmModelSize)) {
        return full.llmModelSize;
      }
    }
    var deviceClass = getDeviceClassForModel();
    return deviceClass === 'low' ? 'tier1' : 'tier5';
  }

  function tierKeyToDisplay(tierKey) {
    var key = tierKey && /^tier[1-5]$/.test(tierKey) ? tierKey : 'tier3';
    var tierMeta = LLM_TIER_MODELS[key] || LLM_TIER_MODELS.tier3;
    var tierNum = key.replace('tier', '');
    return {
      tierKey: key,
      tier: tierNum,
      tierLabel: 'Tier ' + tierNum,
      size: tierMeta.size,
      approxBytes: tierMeta.approxBytes
    };
  }

  function getResolvedLlmTierInfo() {
    return tierKeyToDisplay(resolvePreferredTierKey());
  }

  function getModelDisplayInfo(modelId) {
    var tierInfo = getResolvedLlmTierInfo();
    if (modelId === MODEL_SMALL && (tierInfo.tier === '3' || tierInfo.tier === '4' || tierInfo.tier === '5')) {
      return tierKeyToDisplay('tier2');
    }
    if (modelId === MODEL_BASE && (tierInfo.tier === '1' || tierInfo.tier === '2')) {
      return tierKeyToDisplay('tier3');
    }
    return tierInfo;
  }

  function sanitizeDownloadFileLabel(file) {
    if (!file) return '';
    var text = String(file).trim();
    if (!text) return '';
    var partMatch = text.match(/part\s+(\d+)\s*\/\s*(\d+)/i);
    if (partMatch) return 'Hugging Face file ' + partMatch[1] + '/' + partMatch[2];
    var base = text.split(/[/\\]/).pop() || text;
    if (/\.(onnx|json|bin|txt|model)$/i.test(base) || base.length <= 64) return base;
    return text.length <= 64 ? text : text.slice(0, 61) + '…';
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

  function detectGpuBackendFallback() {
    // Do not treat navigator.gpu alone as WebGPU-capable (headless/CI false positives).
    try {
      if (typeof document !== 'undefined') {
        var canvas = document.createElement('canvas');
        if (canvas.getContext('webgl2') || canvas.getContext('webgl')) return 'webgl';
      }
    } catch (e) {}
    return null;
  }

  /** Ordered GPU backends to try before WASM/CPU (benchmark cache, then live probe). */
  function getGpuDeviceCandidates() {
    var ordered = [];
    var seen = Object.create(null);
    function add(dev) {
      if (!dev || dev === 'none' || seen[dev]) return;
      seen[dev] = true;
      ordered.push(dev);
    }
    if (typeof window !== 'undefined' && window.DeviceBenchmark && typeof window.DeviceBenchmark.getCachedResult === 'function') {
      var cached = window.DeviceBenchmark.getCachedResult();
      if (cached && cached.gpu && cached.gpu.available) {
        add(cached.gpu.backend);
      }
    }
    add(detectGpuBackendFallback());
    return ordered;
  }

  /** GPU load attempts in priority order; WASM is never included here. */
  function buildGpuAttemptPlans(devices) {
    var plans = [];
    (devices || []).forEach(function (device) {
      if (device === 'webgpu') {
        plans.push({ device: 'webgpu', dtype: 'q4f16' });
        plans.push({ device: 'webgpu', dtype: 'q4' });
      } else if (device === 'webgl') {
        plans.push({ device: 'webgl', dtype: 'q4' });
      }
    });
    return plans;
  }

  function getPlatformKindForLoad() {
    if (typeof window !== 'undefined' && window.RianellLlmLoadLadder &&
        typeof window.RianellLlmLoadLadder.resolvePlatformKindFromWindow === 'function') {
      return window.RianellLlmLoadLadder.resolvePlatformKindFromWindow();
    }
    if (typeof window !== 'undefined' && window.DeviceBenchmark) {
      var pt = (typeof window.DeviceBenchmark.getPlatformTypeCached === 'function')
        ? window.DeviceBenchmark.getPlatformTypeCached()
        : (typeof window.DeviceBenchmark.getPlatformType === 'function' ? window.DeviceBenchmark.getPlatformType() : 'desktop');
      return pt === 'mobile' ? 'pwa_mobile' : 'pwa_desktop';
    }
    return 'pwa_desktop';
  }

  function buildLoadPlansForPwa(gpuCandidates, platformKind) {
    if (typeof window !== 'undefined' && window.RianellLlmLoadLadder &&
        typeof window.RianellLlmLoadLadder.buildPwaLoadAttempts === 'function') {
      return window.RianellLlmLoadLadder.buildPwaLoadAttempts({
        platformKind: platformKind,
        gpuCandidates: gpuCandidates
      });
    }
    return buildGpuAttemptPlans(gpuCandidates);
  }

  function buildWasmAttempt() {
    if (typeof window !== 'undefined' && window.RianellLlmLoadLadder &&
        typeof window.RianellLlmLoadLadder.buildPwaWasmAttempt === 'function') {
      return window.RianellLlmLoadLadder.buildPwaWasmAttempt();
    }
    return { revision: 'main', dtype: 'q4' };
  }

  function buildWasmPipelineOpts() {
    return buildWasmAttempt();
  }

  function parseOomError(err) {
    var msg = String(err && err.message ? err.message : err || '').toLowerCase();
    return /out of memory|oom|memory allocation|failed to allocate|array buffer allocation/i.test(msg);
  }

  function persistLastStablePreset(modelId, backend, dtype) {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem('rianell.llm.lastStablePreset', JSON.stringify({
        modelId: modelId,
        activeBackend: backend,
        activeDtype: dtype,
        ts: Date.now()
      }));
    } catch (e) {}
  }

  function maybeWarnMemoryCap(platformKind) {
    var nav = typeof navigator !== 'undefined' ? navigator : {};
    var dm = (typeof window !== 'undefined' && window.isSecureContext === true &&
      typeof nav.deviceMemory === 'number' && nav.deviceMemory > 0) ? nav.deviceMemory : null;
    if (dm == null || platformKind !== 'pwa_mobile') return;
    var tierKey = resolvePreferredTierKey();
    if (dm < 4 && (tierKey === 'tier5' || tierKey === 'tier4') &&
        typeof window !== 'undefined' && typeof window.showToast === 'function') {
      window.showToast('Large model tier on limited memory — may fall back automatically.', { type: 'info' });
    }
  }

  async function tryLoadWithPlans(mod, loadModelId, plans, myGen) {
    var lastErr = null;
    for (var i = 0; i < plans.length; i++) {
      if (isStaleLoad(myGen) || downloadCancelled) throw new Error('AI model download deferred');
      var plan = plans[i];
      var label = plan.device ? (plan.device + ' ' + (plan.dtype || '')) : 'wasm';
      reportDownloadProgress({ status: 'progress', progress: 0, file: 'Trying ' + label.trim() + '…' });
      try {
        applyHuggingFaceRemote(mod);
        var pipe = await runChatGenerationPipeline(mod, loadModelId, plan);
        if (isStaleLoad(myGen)) throw new Error('AI model download deferred');
        cachedActiveBackend = plan.device || 'wasm';
        cachedActiveDtype = plan.dtype || 'q4';
        return pipe;
      } catch (e) {
        lastErr = e;
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('Summary LLM: attempt failed (' + label + '):', e.message || e);
        }
      }
    }
    throw lastErr || new Error('All GPU load attempts failed');
  }

  async function warmupPipelineOrThrow() {
    await runChatInference(
      'Reply with OK.',
      'OK',
      { max_new_tokens: 2, do_sample: false, temperature: 0.1 }
    );
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

  function applyTransformersRemote(mod, remoteHost, remotePathTemplate) {
    if (!mod || !mod.env) return;
    mod.env.remoteHost = remoteHost;
    mod.env.remotePathTemplate = remotePathTemplate;
  }

  function applyHuggingFaceRemote(mod) {
    applyTransformersRemote(mod, 'https://huggingface.co/', '{model}/resolve/{revision}/');
  }

  function failDownloadProgress(errorMsg) {
    if (downloadCancelled) return;
    downloadProgressState.active = false;
    lastDownloadError = errorMsg ? formatDownloadError(errorMsg) : 'Download failed';
    if (typeof window !== 'undefined' && typeof window.hideAiModelDownloadProgressUI === 'function') {
      window.hideAiModelDownloadProgressUI();
    }
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('rianell-llm-download-progress', {
          detail: Object.assign({}, downloadProgressState, { failed: true, error: lastDownloadError })
        }));
      } catch (e) {}
    }
  }

  async function resolveModelsRemote(mod) {
    applyHuggingFaceRemote(mod);
    if (mod && mod.env) {
      mod.env.useBrowserCache = true;
    }
    return 'huggingface';
  }

  function formatDownloadError(err) {
    if (err == null) return 'Download failed';
    if (typeof err === 'string') return err;
    if (err.message) return String(err.message);
    return String(err);
  }

  function cancelDownloadInFlight() {
    bumpLoadGeneration();
    downloadCancelled = true;
    cachedPipeline = null;
    cachedModelId = null;
    llmWorkQueue = Promise.resolve();
    lastDownloadError = null;
    downloadProgressState = { pct: 0, status: 'idle', file: '', active: false };
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('rianell-llm-download-progress', { detail: downloadProgressState }));
      } catch (e) {}
      if (typeof window.hideAiModelDownloadProgressUI === 'function') {
        window.hideAiModelDownloadProgressUI();
      }
    }
  }

  function reportDownloadProgress(data) {
    if (downloadCancelled) return;
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
      file: sanitizeDownloadFileLabel(data.file || ''),
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

  function bumpLoadGeneration() {
    loadGeneration += 1;
    return loadGeneration;
  }

  function isStaleLoad(gen) {
    return gen !== loadGeneration || downloadCancelled;
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
    cachedActiveBackend = null;
    cachedActiveDtype = null;

    downloadProgressState.active = true;
    downloadCancelled = false;
    lastDownloadError = null;
    var myGen = loadGeneration;
    var platformKind = getPlatformKindForLoad();
    maybeWarnMemoryCap(platformKind);
    reportDownloadProgress({ status: 'initiate', progress: 0, file: modelId });

    var mod = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.2');
    await resolveModelsRemote(mod);

    var gpuPlans = buildLoadPlansForPwa(getGpuDeviceCandidates(), platformKind);
    var wasmPlan = buildWasmAttempt();
    var loadModelId = modelId;
    var loaded = false;

    try {
      cachedPipeline = await tryLoadWithPlans(mod, loadModelId, gpuPlans, myGen);
      loaded = true;
    } catch (gpuErr) {
      if (isStaleLoad(myGen)) throw new Error('AI model download deferred');
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('Summary LLM: GPU attempts failed, trying WASM:', gpuErr.message || gpuErr);
      }
      try {
        applyHuggingFaceRemote(mod);
        cachedPipeline = await runChatGenerationPipeline(mod, loadModelId, wasmPlan);
        if (isStaleLoad(myGen)) throw new Error('AI model download deferred');
        cachedActiveBackend = 'wasm';
        cachedActiveDtype = 'q4';
        loaded = true;
      } catch (wasmErr) {
        if (isStaleLoad(myGen)) throw new Error('AI model download deferred');
        var oom = parseOomError(wasmErr) || parseOomError(gpuErr);
        if (loadModelId === MODEL_BASE) {
          if (typeof console !== 'undefined' && console.warn) {
            console.warn('Summary LLM: large package failed' + (oom ? ' (OOM)' : '') + ', retrying smaller model');
          }
          if (typeof window !== 'undefined' && typeof window.showToast === 'function' && oom) {
            window.showToast('Not enough memory for the large model — using the smaller package.', { type: 'info' });
          }
          try {
            applyHuggingFaceRemote(mod);
            cachedPipeline = await runChatGenerationPipeline(mod, MODEL_SMALL, wasmPlan);
            if (isStaleLoad(myGen)) throw new Error('AI model download deferred');
            loadModelId = MODEL_SMALL;
            cachedActiveBackend = 'wasm';
            cachedActiveDtype = 'q4';
            loaded = true;
          } catch (smallErr) {
            failDownloadProgress(formatDownloadError(smallErr));
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
            throw smallErr;
          }
        } else {
          failDownloadProgress(formatDownloadError(wasmErr));
          throw wasmErr;
        }
      }
    }

    if (!loaded || !cachedPipeline) {
      failDownloadProgress('Model load failed');
      throw new Error('Model load failed');
    }

    cachedModelId = loadModelId;
    try {
      await warmupPipelineOrThrow();
    } catch (warmErr) {
      cachedPipeline = null;
      cachedModelId = null;
      cachedActiveBackend = null;
      cachedActiveDtype = null;
      failDownloadProgress(formatDownloadError(warmErr));
      throw warmErr;
    }

    lastDownloadError = null;
    persistLastStablePreset(cachedModelId, cachedActiveBackend, cachedActiveDtype);
    finishDownloadProgress();
    await requestPersistentStorageIfPossible();
    return cachedPipeline;
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

  function wrapUserNoteForLlm(note) {
    var raw = String(note || '').trim();
    if (!raw) return '';
    return '---USER_NOTE---\n' + raw + '\n---END_USER_NOTE---';
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

    var recentNotes = (logs || []).map(function (l) { return l && l.notes ? String(l.notes).trim() : ''; }).filter(Boolean);
    if (recentNotes.length > 0) {
      parts.push(wrapUserNoteForLlm(recentNotes[recentNotes.length - 1]));
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

  async function generateSummaryWithLLM(analysis, options, fallbackNote) {
    var context = buildSummaryContext(analysis, options);
    if (!context || context.length < 10) return fallbackNote;

    var contextHash = simpleHash(context);
    if (!summaryResultCache) summaryResultCache = new Map();
    var cached = summaryResultCache.get(contextHash);
    if (cached != null) return cached;

    try {
      var pack = await loadPromptPack(getActiveLocale());
      var prompts = buildSummaryPromptFromPack(pack, context);
      var timeoutPromise = new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error('Summary LLM timeout')); }, TIMEOUT_MS);
      });
      var text = await Promise.race([
        runChatInference(prompts.system, prompts.user, {
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
    if (todayStub.notes && String(todayStub.notes).trim()) {
      text += ' ' + wrapUserNoteForLlm(todayStub.notes);
    }
    return text.length > MAX_SUGGEST_CONTEXT_CHARS ? text.slice(0, MAX_SUGGEST_CONTEXT_CHARS) : text;
  }

  async function generateSuggestNoteWithLLM(contextString, fallbackText) {
    if (!contextString || contextString.length < 10) return fallbackText || '';

    var contextHash = simpleHash(contextString);
    if (!suggestResultCache) suggestResultCache = new Map();
    var cached = suggestResultCache.get(contextHash);
    if (cached != null) return cached;

    async function runSuggest() {
      try {
        var pack = await loadPromptPack(getActiveLocale());
        var prompts = buildSuggestPromptFromPack(pack, contextString);
        var timeoutPromise = new Promise(function (_, reject) {
          setTimeout(function () { reject(new Error('Suggest note LLM timeout')); }, TIMEOUT_SUGGEST_MS);
        });
        var text = await Promise.race([
          runChatInference(prompts.system, prompts.user, {
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

  async function generateHomeQuestionWithLLM(contextString, fallbackText, questionId) {
    if (!contextString || contextString.length < 10) return fallbackText || '';

    var cacheKey = simpleHash(String(questionId || 'q') + ':' + contextString);
    if (!homeQuestionResultCache) homeQuestionResultCache = new Map();
    var cached = homeQuestionResultCache.get(cacheKey);
    if (cached != null) return cached;

    try {
      var pack = await loadPromptPack(getActiveLocale());
      var prompts = buildHomeQuestionPromptFromPack(pack, contextString);
      var timeoutPromise = new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error('Home question LLM timeout')); }, TIMEOUT_HOME_QUESTION_MS);
      });
      var text = await Promise.race([
        runChatInference(prompts.system, prompts.user, {
          max_new_tokens: 180,
          do_sample: false,
          temperature: 0.2,
          truncation: true
        }),
        timeoutPromise
      ]);

      if (text && text.length > 15) {
        text = stripTrailingIncompleteSentence(text);
        if (homeQuestionResultCache.size >= MAX_HOME_QUESTION_CACHE) {
          var firstKey = homeQuestionResultCache.keys().next().value;
          if (firstKey != null) homeQuestionResultCache.delete(firstKey);
        }
        homeQuestionResultCache.set(cacheKey, text);
        return text;
      }
    } catch (e) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('Home question LLM failed, using fallback:', e.message || e);
      }
    }
    return fallbackText || '';
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

    try {
      var pack = await loadPromptPack(getActiveLocale());
      var motdPrompts = buildMotdPromptFromPack(pack, theme);
      var userPrompt = motdPrompts.user + ' Unique: ' + nonce + '.';
      var timeoutPromise = new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error('MOTD LLM timeout')); }, TIMEOUT_MOTD_MS);
      });
      var text = await Promise.race([
        runChatInference(motdPrompts.system, userPrompt, {
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
    return warmupPipelineOrThrow();
  }

  function getAiModelStatus() {
    var info = getResolvedLlmModelInfo();
    var base = {
      modelId: info.id,
      tierLabel: info.tierLabel,
      size: info.size,
      approxBytes: info.approxBytes,
      activeBackend: cachedActiveBackend,
      activeDtype: cachedActiveDtype
    };
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
      return Object.assign({
        state: 'ready',
        inMemory: true,
        cachedModelId: cachedModelId
      }, base);
    }
    if (getDownloadConsent() === 'granted') {
      return Object.assign({ state: 'consented', inMemory: false }, base);
    }
    return Object.assign({ state: 'not_downloaded' }, base);
  }

  function clearSummaryLLMCache() {
    bumpLoadGeneration();
    cachedPipeline = null;
    cachedModelId = null;
    cachedActiveBackend = null;
    cachedActiveDtype = null;
    lastDownloadError = null;
    llmWorkQueue = Promise.resolve();
    if (summaryResultCache) summaryResultCache.clear();
    if (suggestResultCache) suggestResultCache.clear();
  }

  async function clearTransformersIndexedDb() {
    if (typeof indexedDB === 'undefined') return;
    var names = [
      'transformers-cache',
      'transformersjs-cache',
      'hf-transformers-cache',
      'xenova-transformers-cache',
    ];
    if (indexedDB.databases) {
      try {
        var dbs = await indexedDB.databases();
        dbs.forEach(function (db) {
          if (db.name && /transformers|xenova|hf-|huggingface|onnx/i.test(db.name)) {
            names.push(db.name);
          }
        });
      } catch (e) {}
    }
    await Promise.all([].concat(Array.from(new Set(names))).map(function (name) {
      return new Promise(function (resolve) {
        var req = indexedDB.deleteDatabase(name);
        req.onsuccess = req.onerror = req.onblocked = function () { resolve(); };
      });
    }));
  }

  async function clearAiModelCache(options) {
    options = options || {};
    clearSummaryLLMCache();
    lastDownloadError = null;
    downloadProgressState = { pct: 0, status: '', file: '', active: false };
    try {
      if (typeof caches !== 'undefined') {
        var keys = await caches.keys();
        await Promise.all(keys.map(function (key) {
          if (/transformers|huggingface|onnx|models|rianell/i.test(key)) {
            return caches.delete(key);
          }
          return Promise.resolve(false);
        }));
      }
    } catch (e) {}
    try {
      await clearTransformersIndexedDb();
    } catch (e) {}
    if (options.resetConsent && typeof window !== 'undefined' && window.appSettings) {
      window.appSettings.aiModelDownloadConsent = 'deferred';
      if (typeof window.saveSettings === 'function') window.saveSettings();
    }
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('rianell-llm-download-progress', { detail: downloadProgressState }));
      } catch (e2) {}
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
  window.generateHomeQuestionWithLLM = generateHomeQuestionWithLLM;
  window.generateMotdWithLLM = generateMotdWithLLM;
  window.buildSuggestContext = buildSuggestContext;
  window.LLM_TIER_MODELS = LLM_TIER_MODELS;
  window.getResolvedLlmModelInfo = getResolvedLlmModelInfo;
  window.getResolvedLlmTierInfo = getResolvedLlmTierInfo;
  window.getAiModelDownloadProgress = function () { return downloadProgressState; };
  window.getAiModelStatus = getAiModelStatus;
  window.getAiModelStorageEstimate = getAiModelStorageEstimate;
  window.clearAiModelCache = clearAiModelCache;
  window.preloadSummaryLLM = function (options) {
    return getPipeline(options || {}).then(function (pipe) {
      return warmupPipeline().then(function () { return pipe; });
    });
  };
  window.clearSummaryLLMCache = clearSummaryLLMCache;
  window.needsAiModelDownloadConsent = needsDownloadConsent;
  window.resetAiModelDownloadState = function () {
    bumpLoadGeneration();
    downloadCancelled = false;
    lastDownloadError = null;
    downloadProgressState = { pct: 0, status: '', file: '', active: false };
    llmWorkQueue = Promise.resolve();
  };
  window.cancelAiModelDownload = cancelDownloadInFlight;
})();
