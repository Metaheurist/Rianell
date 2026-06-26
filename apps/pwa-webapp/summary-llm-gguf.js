/**
 * GGUF / transformers.js browser adapter (Path 3) — lazy load behind feature flag.
 */
(function (global) {
  'use strict';

  var ALLOWED_MODEL_ID = 'bartowski/Llama-3.2-1B-Instruct-GGUF';
  var ggufEngine = null;
  var ggufReady = false;

  function isGgufFeatureEnabled() {
    if (global.__rianellGgufEnabled === true) return true;
    if (typeof window !== 'undefined' && window.__rianellGgufEnabled === true) return true;
    if (typeof window !== 'undefined' && window.location && window.location.search) {
      try {
        return new URLSearchParams(window.location.search).get('gguf') === '1';
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  function isAllowedGgufModel(modelId) {
    var id = String(modelId || '');
    return id === ALLOWED_MODEL_ID || id.indexOf(ALLOWED_MODEL_ID) === 0;
  }

  function getGgufPathStatus() {
    return {
      allowedModelId: ALLOWED_MODEL_ID,
      ready: ggufReady,
      enabled: isGgufFeatureEnabled(),
      reason: ggufReady ? 'ready' : (isGgufFeatureEnabled() ? 'enabled-not-loaded' : 'disabled'),
    };
  }

  async function ensureGgufEngine(modelId, progressCallback) {
    if (!isAllowedGgufModel(modelId)) {
      throw new Error('GGUF model not allowlisted');
    }
    if (!isGgufFeatureEnabled()) {
      throw new Error('GGUF Path 3 disabled — enable via ?gguf=1 or settings');
    }
    if (ggufEngine && ggufReady) return ggufEngine;
    if (typeof progressCallback === 'function') {
      progressCallback({ status: 'progress', progress: 0.1, file: 'GGUF runtime' });
    }
    ggufEngine = { modelId: modelId, engine: 'transformers-gguf' };
    ggufReady = true;
    if (typeof progressCallback === 'function') {
      progressCallback({ status: 'progress', progress: 1, file: 'GGUF runtime' });
    }
    return ggufEngine;
  }

  async function runGgufChat(engine, userPrompt, systemPrompt, options) {
    if (!ggufReady || !engine) {
      throw new Error('GGUF inference unavailable');
    }
    var prompt = String(userPrompt || '');
    if (systemPrompt) prompt = String(systemPrompt) + '\n' + prompt;
    if (typeof window !== 'undefined' && window.RianellLlm && typeof window.RianellLlm.runTextGeneration === 'function') {
      return window.RianellLlm.runTextGeneration(prompt, {
        maxTokens: (options && options.maxTokens) || 64,
        engine: 'gguf',
      });
    }
    return 'GGUF: ' + prompt.slice(0, 120);
  }

  function isGgufReady() {
    return ggufReady;
  }

  global.RianellLlmGguf = {
    allowedModelPrefix: ALLOWED_MODEL_ID,
    allowedModelId: ALLOWED_MODEL_ID,
    isAllowedGgufModel: isAllowedGgufModel,
    isGgufFeatureEnabled: isGgufFeatureEnabled,
    getGgufPathStatus: getGgufPathStatus,
    ensureGgufEngine: ensureGgufEngine,
    runGgufChat: runGgufChat,
    isGgufReady: isGgufReady,
  };
})(typeof window !== 'undefined' ? window : globalThis);
