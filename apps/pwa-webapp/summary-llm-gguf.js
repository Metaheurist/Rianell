/**
 * GGUF / llama.cpp browser adapter (Path 3) — lazy load behind engine preference.
 * Runtime WASM is optional; adapter API is complete for load-ladder integration.
 */
(function (global) {
  'use strict';

  var ALLOWED_MODEL_ID = 'bartowski/Llama-3.2-1B-Instruct-GGUF';
  var ggufEngine = null;
  var ggufReady = false;
  var wasmProbePromise = null;

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

  function isAllowedGgufModel(modelId) {
    var id = String(modelId || '');
    return id === ALLOWED_MODEL_ID || id.indexOf(ALLOWED_MODEL_ID) === 0;
  }

  function getGgufWasmModuleUrl() {
    return getAppOriginBase() + 'vendor/llama-cpp/llama.js';
  }

  async function probeGgufWasmBundled() {
    if (wasmProbePromise) return wasmProbePromise;
    wasmProbePromise = (async function () {
      if (typeof window === 'undefined' || typeof document === 'undefined') return false;
      var url = getGgufWasmModuleUrl();
      try {
        var res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
        return res.ok;
      } catch (e) {
        return false;
      }
    })();
    return wasmProbePromise;
  }

  function getGgufPathStatus() {
    return {
      allowedModelId: ALLOWED_MODEL_ID,
      ready: ggufReady,
      wasmBundled: false,
      reason: ggufReady ? 'ready' : 'wasm_not_bundled',
    };
  }

  async function ensureGgufEngine(modelId, progressCallback) {
    if (!isAllowedGgufModel(modelId)) {
      throw new Error('GGUF model not allowlisted');
    }
    if (ggufEngine && ggufReady) return ggufEngine;
    if (typeof progressCallback === 'function') {
      progressCallback({ status: 'progress', progress: 0, file: 'GGUF runtime' });
    }
    var wasmBundled = await probeGgufWasmBundled();
    if (!wasmBundled) {
      throw new Error('GGUF Path 3 runtime not bundled - add vendor/llama-cpp/llama.js');
    }
    throw new Error('GGUF Path 3 WASM probe found asset but loader is not wired yet');
  }

  async function runGgufChat(engine, userPrompt, systemPrompt, options) {
    if (!ggufReady || !engine) {
      throw new Error('GGUF inference unavailable');
    }
    throw new Error('GGUF inference unavailable');
  }

  function isGgufReady() {
    return ggufReady;
  }

  global.RianellLlmGguf = {
    allowedModelPrefix: ALLOWED_MODEL_ID,
    allowedModelId: ALLOWED_MODEL_ID,
    isAllowedGgufModel: isAllowedGgufModel,
    getGgufPathStatus: getGgufPathStatus,
    ensureGgufEngine: ensureGgufEngine,
    runGgufChat: runGgufChat,
    isGgufReady: isGgufReady,
  };
})(typeof window !== 'undefined' ? window : globalThis);
