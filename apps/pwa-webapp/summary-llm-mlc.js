/**
 * WebLLM MLC adapter (Path 2) — lazy worker + IndexedDB cache.
 * Pin: @mlc-ai/web-llm@0.2.84
 */
(function (global) {
  'use strict';

  var MLC_VERSION = '0.2.84';
  var MLC_ESM = 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@' + MLC_VERSION + '/+esm';
  var ALLOWED_MODEL = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
  var enginePromise = null;
  var activeModelId = null;

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
    var mid = modelId || ALLOWED_MODEL;
    if (mid !== ALLOWED_MODEL) {
      throw new Error('MLC model not allowlisted');
    }
    if (enginePromise && activeModelId === mid) return enginePromise;
    enginePromise = (async function () {
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
        // Callback must be set on main thread only — never in engineConfig (postMessage clone error).
        var engine = new webllm.WebWorkerMLCEngine(worker, {});
        if (typeof engine.setInitProgressCallback === 'function') {
          engine.setInitProgressCallback(initProgress);
        }
        await engine.reload(mid);
        activeModelId = mid;
        return engine;
      } catch (e) {
        enginePromise = null;
        activeModelId = null;
        throw e;
      }
    })();
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
    allowedModel: ALLOWED_MODEL,
    ensureMlcEngine: ensureMlcEngine,
    runMlcChat: runMlcChat,
    disposeMlcEngine: disposeMlcEngine,
  };
})(typeof window !== 'undefined' ? window : globalThis);
