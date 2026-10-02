import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const summaryLlmSrc = readFileSync('apps/pwa-webapp/summary-llm.js', 'utf8');
const enGbPromptPack = JSON.parse(readFileSync('apps/pwa-webapp/i18n-packs/prompt-packs/v1/en-GB.json', 'utf8'));

/**
 * Runs summary-llm.js in jsdom against a fake worker client.
 *
 * @param {object} [opts]
 * @param {object} [opts.settings] merged into window.appSettings (consent is granted)
 * @param {boolean} [opts.webGpu] adapter probe result (cached in sessionStorage)
 * @param {boolean} [opts.constrained] RianellBootGuard.isConstrainedDevice()
 * @param {string[]} [opts.failDevices] devices whose load rejects
 * @param {string} [opts.reply] assistant content returned by generate
 * @param {object} [opts.caches] fake Cache Storage
 * @param {object} [opts.indexedDB] fake IndexedDB
 */
export function loadSummaryLlm(opts = {}) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://127.0.0.1:8765/' });
  const { window } = dom;
  const calls = [];
  const idleCallbacks = [];
  let workerCount = 0;
  window.appSettings = Object.assign({ aiModelDownloadConsent: 'granted' }, opts.settings || {});
  window.__rianellPromptPack = enGbPromptPack;
  if (opts.webGpu != null) {
    window.sessionStorage.setItem('rianell.webgpu.adapterOk', JSON.stringify({ ok: !!opts.webGpu, ts: Date.now() }));
  }
  window.RianellBootGuard = {
    isConstrainedDevice: () => !!opts.constrained,
    isLlmSafeMode: () => false,
    clearLlmSafeMode() {},
    markLlmLoadStart() {},
    markLlmLoadEnd() {},
  };
  window.requestIdleCallback = (cb) => { idleCallbacks.push(cb); return idleCallbacks.length; };
  window.RianellLlmWorkerClient = {
    createLlmWorkerClient() {
      const worker = ++workerCount;
      return {
        async load(config, onProgress) {
          calls.push({ type: 'load', worker, config });
          if ((opts.failDevices || []).includes(config.device)) {
            throw new Error('WebGPU pipeline failed with code 557856688');
          }
          onProgress({ status: 'progress', file: 'model.onnx', loaded: 10, total: 10 });
          return { ok: true };
        },
        async generate(messages, options) {
          calls.push({ type: 'generate', worker, options });
          const content = opts.reply != null ? opts.reply : 'OK';
          return [{ generated_text: [...messages, { role: 'assistant', content }] }];
        },
        async dispose() {},
        terminate() { calls.push({ type: 'terminate', worker }); },
        isRunning: () => true,
      };
    },
  };
  vm.runInNewContext(summaryLlmSrc, {
    window,
    self: window,
    globalThis: window,
    document: window.document,
    navigator: window.navigator,
    location: window.location,
    localStorage: window.localStorage,
    sessionStorage: window.sessionStorage,
    CustomEvent: window.CustomEvent,
    caches: opts.caches,
    indexedDB: opts.indexedDB,
    // Inference timeouts (35-240 s) are never cleared on success; unref so they cannot hold the test process open.
    setTimeout: (fn, ms, ...args) => {
      const t = setTimeout(fn, ms, ...args);
      t.unref();
      return t;
    },
    clearTimeout,
    setInterval,
    clearInterval,
    console: { log() {}, info() {}, warn() {}, error() {}, debug() {} },
  });
  return { window, calls, idleCallbacks, loads: () => calls.filter((c) => c.type === 'load') };
}

export function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(label + ' did not settle within ' + ms + ' ms')), ms);
    }),
  ]);
}
