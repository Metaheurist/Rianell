/**
 * WebLLM MLC adapter (Path 2) - lazy worker + IndexedDB cache.
 * Pin: @mlc-ai/web-llm@0.2.84
 */
(function (global) {
  'use strict';

  var MLC_VERSION = '0.2.84';
  var MLC_ESM = 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@' + MLC_VERSION + '/+esm';
  // Allowlisted models (mirrors packages/llm/src/mlc-config.mjs). Both ship in the
  // pinned @mlc-ai/web-llm prebuilt config. Small model powers device tiers 1-2.
  var MLC_BASE_MODEL = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';
  var MLC_SMALL_MODEL = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';
  var ALLOWED_MODELS = [MLC_SMALL_MODEL, MLC_BASE_MODEL];
  var enginePromise = null;
  var activeModelId = null;

  function isAllowedModel(id) {
    return ALLOWED_MODELS.indexOf(String(id || '').trim()) !== -1;
  }

  function resolveModelForTier(tier) {
    var t = String(tier || '').trim();
    if (t === 'tier1' || t === 'tier2' || t === 'small') return MLC_SMALL_MODEL;
    return MLC_BASE_MODEL;
  }

  function getWorkerUrl() {
    var base = '/';
    if (typeof window !== 'undefined' && window.location) {
      var origin = window.location.origin || '';
      var pathname = window.location.pathname || '/';
      if (origin.indexOf('.github.io') !== -1) {
        var parts = pathname.split('/').filter(Boolean);
        if (parts.length > 0 && parts[0].indexOf('.') === -1) {
          base = origin + '/' + parts[0] + '/';
        } else {
          base = origin + '/';
        }
      } else {
        base = origin + '/';
      }
    }
    return base + 'llm-mlc-worker.js';
  }

  function loadWebLlmModule() {
    return import(MLC_ESM);
  }

  async function ensureMlcEngine(modelId, progressCallback) {
    var mid = modelId || MLC_BASE_MODEL;
    if (!isAllowedModel(mid)) {
      throw new Error('MLC model not allowlisted');
    }
    // Dedup by the *requested* model. activeModelId is claimed up-front (before the
    // ~30s reload) so a second call arriving mid-download returns the SAME in-flight
    // promise instead of spawning a duplicate Worker + duplicate download (the cause
    // of the "reaches 100% then restarts" loop).
    if (enginePromise && activeModelId === mid) return enginePromise;
    // A different model is being switched to: tear the old engine down first.
    if (enginePromise && activeModelId && activeModelId !== mid) {
      try { await disposeMlcEngine(); } catch (e) { /* fall through to fresh load */ }
    }
    activeModelId = mid;
    var thisPromise = (async function () {
      try {
        var webllm = await loadWebLlmModule();
        var worker = new Worker(getWorkerUrl(), { type: 'module' });
        var initProgress = function (report) {
          if (typeof progressCallback === 'function') {
            progressCallback({
              status: 'progress',
              progress: report.progress,
              file: report.text || 'MLC weights',
            });
          }
        };
        // Callback must be set on main thread only - never in engineConfig (postMessage clone error).
        var engine = new webllm.WebWorkerMLCEngine(worker, {});
        if (typeof engine.setInitProgressCallback === 'function') {
          engine.setInitProgressCallback(initProgress);
        }
        await engine.reload(mid);
        return engine;
      } catch (e) {
        // Only clear shared state if we still own the in-flight slot (a newer call
        // for a different model may have already taken over).
        if (enginePromise === thisPromise) {
          enginePromise = null;
          activeModelId = null;
        }
        throw e;
      }
    })();
    enginePromise = thisPromise;
    return enginePromise;
  }

  async function runMlcChat(engine, userPrompt, systemPrompt, options) {
    options = options || {};
    var messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: userPrompt });
    var reply = await engine.chat.completions.create({
      messages: messages,
      temperature: options.temperature != null ? options.temperature : 0.3,
      max_tokens: options.max_new_tokens != null ? options.max_new_tokens : 256,
      stream: false,
    });
    var text = reply && reply.choices && reply.choices[0] && reply.choices[0].message
      ? reply.choices[0].message.content
      : '';
    return String(text || '').trim();
  }

  async function disposeMlcEngine() {
    if (enginePromise) {
      try {
        var eng = await enginePromise;
        if (eng && typeof eng.unload === 'function') await eng.unload();
      } catch (e) {}
    }
    enginePromise = null;
    activeModelId = null;
  }

  global.RianellLlmMlc = {
    version: MLC_VERSION,
    allowedModel: MLC_BASE_MODEL,
    baseModel: MLC_BASE_MODEL,
    smallModel: MLC_SMALL_MODEL,
    allowedModels: ALLOWED_MODELS.slice(),
    isAllowedModel: isAllowedModel,
    resolveModelForTier: resolveModelForTier,
    ensureMlcEngine: ensureMlcEngine,
    runMlcChat: runMlcChat,
    disposeMlcEngine: disposeMlcEngine,
  };
})(typeof window !== 'undefined' ? window : globalThis);
