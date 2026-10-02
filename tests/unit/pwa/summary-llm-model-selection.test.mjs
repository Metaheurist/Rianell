import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadSummaryLlm, withTimeout } from './helpers/summary-llm-harness.mjs';

const WASM_MODEL = 'onnx-community/Qwen2.5-0.5B-Instruct';
const SHA_RE = /^[0-9a-f]{40}$/;

async function preload(env) {
  await withTimeout(env.window.preloadSummaryLLM({ skipConsent: true }), 5000, 'preloadSummaryLLM');
  return env;
}

test('tiers 1-2 map to the small package and tiers 3-5 to the large one', () => {
  const { window } = loadSummaryLlm();
  const tiers = window.LLM_TIER_MODELS;
  assert.equal(tiers.tier1.id, tiers.tier2.id);
  assert.equal(tiers.tier3.id, tiers.tier5.id);
  assert.notEqual(tiers.tier1.id, tiers.tier5.id);
  assert.ok(tiers.tier1.approxBytes < tiers.tier5.approxBytes);
});

test('no WebGPU: loads the WASM package on wasm', async () => {
  const env = await preload(loadSummaryLlm({ webGpu: false }));
  const [load] = env.loads();
  assert.equal(load.config.modelId, WASM_MODEL);
  assert.equal(load.config.device, 'wasm');
  assert.equal(load.config.dtype, 'q4');
  assert.match(load.config.revision, SHA_RE);
  assert.equal(load.config.useBrowserCache, true, 'WASM devices must not re-download every session');
});

test('desktop with WebGPU: loads the large package on webgpu', async () => {
  const env = await preload(loadSummaryLlm({ webGpu: true }));
  const [load] = env.loads();
  assert.equal(load.config.modelId, env.window.LLM_TIER_MODELS.tier5.id);
  assert.equal(load.config.device, 'webgpu');
  assert.match(load.config.revision, SHA_RE);
});

test('phone / <=4 GB device with WebGPU: loads the small package', async () => {
  const env = await preload(loadSummaryLlm({ webGpu: true, constrained: true }));
  const [load] = env.loads();
  assert.equal(load.config.modelId, env.window.LLM_TIER_MODELS.tier1.id);
  assert.equal(load.config.device, 'webgpu');
  assert.equal(load.config.dtype, 'q4f16');
});

test('an explicit tier setting overrides device detection while WebGPU is available', async () => {
  const small = await preload(loadSummaryLlm({ webGpu: true, settings: { preferredLlmModelSize: 'tier1' } }));
  assert.equal(small.loads()[0].config.modelId, small.window.LLM_TIER_MODELS.tier1.id);
  const large = await preload(loadSummaryLlm({ webGpu: true, constrained: true, settings: { preferredLlmModelSize: 'tier5' } }));
  assert.equal(large.loads()[0].config.modelId, large.window.LLM_TIER_MODELS.tier5.id);
  const noGpu = await preload(loadSummaryLlm({ webGpu: false, settings: { preferredLlmModelSize: 'tier5' } }));
  assert.equal(noGpu.loads()[0].config.modelId, WASM_MODEL, 'WebGPU-only packages never load on CPU');
});

test('Qwen3.5 packages generate with thinking disabled; the WASM package does not get the flag', async () => {
  const gpu = await preload(loadSummaryLlm({ webGpu: true }));
  const gen = gpu.calls.find((c) => c.type === 'generate');
  assert.deepEqual(JSON.parse(JSON.stringify(gen.options.tokenizer_encode_kwargs)), { enable_thinking: false });
  const cpu = await preload(loadSummaryLlm({ webGpu: false }));
  assert.equal(cpu.calls.find((c) => c.type === 'generate').options.tokenizer_encode_kwargs, undefined);
});

test('a failed WebGPU load falls back to the WASM package in a fresh worker and stays there', async () => {
  const env = await preload(loadSummaryLlm({ webGpu: true, failDevices: ['webgpu'] }));
  const loads = env.loads();
  assert.equal(loads.length, 2);
  assert.equal(loads[0].config.device, 'webgpu');
  assert.equal(loads[1].config.device, 'wasm');
  assert.equal(loads[1].config.modelId, WASM_MODEL);
  assert.notEqual(loads[1].worker, loads[0].worker, 'WASM retry must not reuse the failed WebGPU worker');
  assert.ok(env.calls.some((c) => c.type === 'terminate' && c.worker === loads[0].worker));
  const status = env.window.getAiModelStatus();
  assert.equal(status.state, 'ready');
  assert.equal(status.activeBackend, 'wasm');
  assert.equal(status.modelId, WASM_MODEL, 'session pin follows the package that loaded');
  // Later inference must reuse the loaded WASM pipeline instead of retrying WebGPU.
  await env.window.generateHealthChatWithLLM('How did I sleep this week?', 'fallback');
  assert.equal(env.loads().length, 2);
});

test('reasoning blocks are stripped from replies', async () => {
  const env = await preload(loadSummaryLlm({
    webGpu: true,
    reply: '<think>\n\n</think>\n\nYour sleep averaged 6.4 hours this week.',
  }));
  const reply = await env.window.generateHealthChatWithLLM('How did I sleep this week?', 'fallback');
  assert.equal(reply, 'Your sleep averaged 6.4 hours this week.');
});

function fakeCacheStorage(entries) {
  const stores = new Map(Object.entries(entries).map(([name, urls]) => [name, new Set(urls)]));
  return {
    stores,
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
    async open(name) {
      const urls = stores.get(name);
      return {
        async keys() { return [...urls].map((url) => ({ url })); },
        async delete(req) { return urls.delete(req.url); },
      };
    },
  };
}

function fakeIndexedDb(names) {
  const deleted = [];
  return {
    deleted,
    async databases() { return names.map((name) => ({ name })); },
    deleteDatabase(name) {
      deleted.push(name);
      const req = {};
      setTimeout(() => req.onsuccess && req.onsuccess());
      return req;
    },
  };
}

test('legacy WebLLM stores and unshipped model files are purged once', async () => {
  const hf = 'https://huggingface.co/';
  const caches = fakeCacheStorage({
    'webllm/model': [hf + 'mlc-ai/Qwen2.5-1.5B-Instruct-q4f16_1-MLC/resolve/main/params_shard_0.bin'],
    'transformers-cache': [
      hf + 'onnx-community/Qwen2.5-1.5B-Instruct/resolve/6287331f475a3e20e8c879be8fd4bf3551ad9d34/onnx/model_q4f16.onnx',
      hf + WASM_MODEL + '/resolve/cc5cc01a65cc3ff17bdb73a7de33d879f62599b0/onnx/model_q4.onnx',
    ],
    'rianell-app-v1': ['http://127.0.0.1:8765/index.html'],
  });
  const indexedDB = fakeIndexedDb(['webllm/model', 'webllm/config', 'rianell-data']);
  const env = loadSummaryLlm({ caches, indexedDB });
  assert.equal(env.idleCallbacks.length, 1, 'purge is deferred to idle time');
  await env.idleCallbacks[0]();
  assert.equal(caches.stores.has('webllm/model'), false);
  assert.deepEqual([...caches.stores.get('transformers-cache')], [
    hf + WASM_MODEL + '/resolve/cc5cc01a65cc3ff17bdb73a7de33d879f62599b0/onnx/model_q4.onnx',
  ]);
  assert.ok(caches.stores.has('rianell-app-v1'), 'app shell cache is untouched');
  assert.deepEqual(indexedDB.deleted, ['webllm/model', 'webllm/config']);

  const again = loadSummaryLlm({ caches, indexedDB });
  again.window.localStorage.setItem('rianell.llm.legacyPurge', env.window.localStorage.getItem('rianell.llm.legacyPurge'));
  await again.idleCallbacks[0]();
  assert.deepEqual(indexedDB.deleted, ['webllm/model', 'webllm/config'], 'second run is a no-op');
});
