import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const summaryLlmSrc = readFileSync('apps/pwa-webapp/summary-llm.js', 'utf8');

/** Runs summary-llm.js against a fake worker client on a no-GPU (mobile WASM) device. */
function loadSummaryLlm() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://127.0.0.1:8765/' });
  const { window } = dom;
  const calls = [];
  window.appSettings = {
    aiModelDownloadConsent: 'granted',
    preferredLlmEngine: 'onnx',
    preferredLlmModelSize: 'tier1',
  };
  window.DeviceBenchmark = { getCachedResult: () => ({ gpu: { available: false } }) };
  window.RianellLlmWorkerClient = {
    createLlmWorkerClient() {
      return {
        async load(config, onProgress) {
          calls.push(['load', config.modelId, config.device]);
          onProgress({ status: 'progress', file: 'model_q4.onnx', loaded: 10, total: 10 });
          return { ok: true };
        },
        async generate(messages) {
          calls.push(['generate', messages.length]);
          return [{ generated_text: [...messages, { role: 'assistant', content: 'OK' }] }];
        },
        async dispose() {},
        terminate() {},
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
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    console: { log() {}, info() {}, warn() {}, error() {}, debug() {} },
  });
  return { window, calls };
}

function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(label + ' did not settle within ' + ms + ' ms')), ms);
    }),
  ]);
}

test('preload on the ONNX worker path settles (warmup must not queue behind its own load)', async () => {
  const { window, calls } = loadSummaryLlm();
  await withTimeout(window.preloadSummaryLLM({ skipConsent: true }), 5000, 'preloadSummaryLLM');
  assert.equal(window.getAiModelStatus().state, 'ready');
  assert.ok(calls.some((c) => c[0] === 'load' && c[2] === 'wasm'), 'loaded through the worker on WASM');
  assert.ok(calls.some((c) => c[0] === 'generate'), 'warmup generated through the worker');
});
