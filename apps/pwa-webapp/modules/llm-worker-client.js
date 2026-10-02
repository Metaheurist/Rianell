/**
 * Main-thread RPC client for workers/llm-worker.js (transformers.js in a module worker).
 * Each request gets an id; progress messages are routed to the caller's callback and
 * the matching result settles its promise. terminate() kills the worker (freeing model
 * memory and any hung session compile) and rejects every pending request.
 *
 * Namespace: window.RianellLlmWorkerClient
 */
(function (global) {
  'use strict';

  function toError(payload) {
    var err = new Error(payload && payload.message ? String(payload.message) : 'LLM worker request failed');
    if (payload && payload.name) err.name = String(payload.name);
    return err;
  }

  function createLlmWorkerClient(options) {
    options = options || {};
    var WorkerCtor = options.WorkerCtor || global.Worker;
    var workerUrl = options.workerUrl;
    var worker = null;
    var nextId = 1;
    var pending = {};

    function rejectAll(err) {
      var ids = Object.keys(pending);
      var entries = ids.map(function (id) { return pending[id]; });
      pending = {};
      entries.forEach(function (entry) { entry.reject(err); });
    }

    function terminate(reason) {
      var current = worker;
      worker = null;
      if (current) {
        try { current.terminate(); } catch (e) { /* already gone */ }
      }
      rejectAll(new Error(reason || 'LLM worker terminated'));
    }

    function onMessage(event) {
      var msg = event && event.data;
      if (!msg || typeof msg.id !== 'number') return;
      var entry = pending[msg.id];
      if (!entry) return;
      if (msg.type === 'progress') {
        if (typeof entry.onProgress === 'function') entry.onProgress(msg.data || {});
        return;
      }
      if (msg.type !== 'result') return;
      delete pending[msg.id];
      if (msg.ok) entry.resolve(msg.value);
      else entry.reject(toError(msg.error));
    }

    function ensureWorker() {
      if (worker) return worker;
      if (typeof WorkerCtor !== 'function') throw new Error('Web Workers are not supported');
      worker = new WorkerCtor(workerUrl, { type: 'module' });
      worker.onmessage = onMessage;
      worker.onerror = function (event) {
        if (event && typeof event.preventDefault === 'function') event.preventDefault();
        terminate('LLM worker crashed');
      };
      return worker;
    }

    function request(type, payload, onProgress) {
      var target;
      try {
        target = ensureWorker();
      } catch (e) {
        return Promise.reject(e);
      }
      var id = nextId++;
      return new Promise(function (resolve, reject) {
        pending[id] = { resolve: resolve, reject: reject, onProgress: onProgress };
        try {
          target.postMessage(Object.assign({ id: id, type: type }, payload || {}));
        } catch (e) {
          delete pending[id];
          reject(e);
        }
      });
    }

    return {
      load: function (config, onProgress) {
        return request('load', { config: config }, onProgress);
      },
      generate: function (messages, genOptions) {
        return request('generate', { messages: messages, options: genOptions || {} });
      },
      dispose: function () {
        if (!worker) return Promise.resolve(true);
        return request('dispose', {});
      },
      terminate: terminate,
      isRunning: function () { return !!worker; },
    };
  }

  global.RianellLlmWorkerClient = { createLlmWorkerClient: createLlmWorkerClient };
})(typeof window !== 'undefined' ? window : globalThis);
