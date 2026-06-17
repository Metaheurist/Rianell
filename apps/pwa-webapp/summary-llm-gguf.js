/**
 * GGUF / llama.cpp browser adapter (Path 3) — lazy spike behind feature flag.
 * Full inference requires a vendored WASM build; this module gates and documents the path.
 */
(function (global) {
  'use strict';

  var ALLOWED_MODEL_PREFIX = 'bartowski/Llama-3.2-1B-Instruct-GGUF';
  var ggufReady = false;

  function isAllowedGgufModel(modelId) {
    return String(modelId || '').indexOf(ALLOWED_MODEL_PREFIX) === 0
      || String(modelId || '') === ALLOWED_MODEL_PREFIX;
  }

  async function ensureGgufEngine(modelId, progressCallback) {
    if (!isAllowedGgufModel(modelId)) {
      throw new Error('GGUF model not allowlisted');
    }
    if (typeof progressCallback === 'function') {
      progressCallback({ status: 'progress', progress: 0, file: 'GGUF runtime' });
    }
    throw new Error('GGUF Path 3 runtime not bundled — enable after llama.cpp WASM vendor step');
  }

  async function runGgufChat(engine, userPrompt, systemPrompt, options) {
    throw new Error('GGUF inference unavailable');
  }

  function isGgufReady() {
    return ggufReady;
  }

  global.RianellLlmGguf = {
    allowedModelPrefix: ALLOWED_MODEL_PREFIX,
    isAllowedGgufModel: isAllowedGgufModel,
    ensureGgufEngine: ensureGgufEngine,
    runGgufChat: runGgufChat,
    isGgufReady: isGgufReady,
  };
})(typeof window !== 'undefined' ? window : globalThis);
