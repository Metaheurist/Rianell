import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const workerUrl = pathToFileURL(path.join(root, 'apps/pwa-webapp/workers/llm-worker.js')).href;
const SHA = 'cc5cc01a65cc3ff17bdb73a7de33d879f62599b0';
const CDN_ORT = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.0/dist/';

const FAKE_RUNTIME = `
export const calls = [];
export const fetched = [];
export const env = {
  fetch: async (url) => { fetched.push(String(url)); return {}; },
  backends: { onnx: { wasm: { wasmPaths: {
    mjs: '${CDN_ORT}ort-wasm-simd-threaded.asyncify.mjs',
    wasm: '${CDN_ORT}ort-wasm-simd-threaded.asyncify.wasm',
  } } } },
};
export async function pipeline(task, model, options) {
  calls.push({ task, model, revision: options.revision, device: options.device, dtype: options.dtype });
  // Mirrors transformers.js 4.3, whose metadata pre-pass ignores options.revision.
  await env.fetch('https://huggingface.co/' + model + '/resolve/main/config.json');
  await env.fetch('https://huggingface.co/other/model/resolve/main/config.json');
  options.progress_callback({ status: 'progress', file: 'onnx/model_q4.onnx', loaded: 5, total: 10, progress: 50, extra: () => {} });
  const generator = async (messages) => [{ generated_text: [...messages, { role: 'assistant', content: 'OK' }] }];
  generator.dispose = async () => { calls.push({ disposed: model, dtype: options.dtype }); };
  return generator;
}
`;

const posted = [];
let listener = null;
let runtimeUrl = '';
let runtime = null;

before(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rianell-llm-worker-'));
  const file = path.join(dir, 'fake-transformers.mjs');
  fs.writeFileSync(file, FAKE_RUNTIME);
  runtimeUrl = pathToFileURL(file).href;
  globalThis.self = {
    location: { origin: 'file://' },
    postMessage(msg) { posted.push(msg); },
    addEventListener(type, fn) { if (type === 'message') listener = fn; },
  };
  await import(workerUrl);
  runtime = await import(runtimeUrl);
});

let nextId = 1;
async function request(msg) {
  const id = nextId++;
  const start = posted.length;
  await listener({ data: Object.assign({ id }, msg) });
  const replies = posted.slice(start).filter((m) => m.id === id);
  return { progress: replies.filter((m) => m.type === 'progress'), result: replies.find((m) => m.type === 'result') };
}

function loadConfig(overrides) {
  return Object.assign({
    modelId: 'onnx-community/Qwen2.5-0.5B-Instruct',
    revision: SHA,
    device: 'wasm',
    dtype: 'q4',
    runtimeUrl,
    wasmBase: 'file:///app/vendor/transformers/',
    remoteHost: 'https://huggingface.co/',
  }, overrides);
}

test('generate before load fails with a sanitized error', async () => {
  const { result } = await request({ type: 'generate', messages: [{ role: 'user', content: 'hi' }] });
  assert.equal(result.ok, false);
  assert.match(result.error.message, /not loaded/);
});

test('load rejects a branch revision', async () => {
  const { result } = await request({ type: 'load', config: loadConfig({ revision: 'main' }) });
  assert.equal(result.ok, false);
  assert.match(result.error.message, /pinned commit SHA/);
});

test('load rejects a non-Hugging Face model host', async () => {
  const { result } = await request({ type: 'load', config: loadConfig({ remoteHost: 'https://evil.example/' }) });
  assert.equal(result.ok, false);
  assert.match(result.error.message, /host is not allowed/);
});

test('load rejects a runtime from another origin', async () => {
  const { result } = await request({ type: 'load', config: loadConfig({ runtimeUrl: 'https://evil.example/t.js' }) });
  assert.equal(result.ok, false);
  assert.match(result.error.message, /runtime URL is not allowed/);
});

test('load configures the runtime, forwards plain progress and pins the revision', async () => {
  const { progress, result } = await request({ type: 'load', config: loadConfig() });
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { modelId: 'onnx-community/Qwen2.5-0.5B-Instruct', device: 'wasm', dtype: 'q4' });
  assert.equal(progress.length, 1);
  assert.deepEqual(progress[0].data, { status: 'progress', file: 'onnx/model_q4.onnx', progress: 50, loaded: 5, total: 10 });
  assert.equal(runtime.calls.at(-1).revision, SHA);
  assert.equal(runtime.env.remoteHost, 'https://huggingface.co/');
  assert.equal(runtime.env.allowLocalModels, false);
  assert.deepEqual(runtime.env.backends.onnx.wasm.wasmPaths, {
    mjs: 'file:///app/vendor/transformers/ort-wasm-simd-threaded.asyncify.mjs',
    wasm: 'file:///app/vendor/transformers/ort-wasm-simd-threaded.asyncify.wasm',
  });
});

test('unpinned requests for the loaded model are rewritten to the pinned SHA', () => {
  assert.deepEqual(runtime.fetched.slice(0, 2), [
    'https://huggingface.co/onnx-community/Qwen2.5-0.5B-Instruct/resolve/' + SHA + '/config.json',
    'https://huggingface.co/other/model/resolve/main/config.json',
  ]);
});

test('generate returns plain generator output', async () => {
  const { result } = await request({ type: 'generate', messages: [{ role: 'user', content: 'hi' }], options: {} });
  assert.equal(result.ok, true);
  assert.deepEqual(result.value[0].generated_text.at(-1), { role: 'assistant', content: 'OK' });
});

test('an identical load reuses the generator; a different dtype disposes it first', async () => {
  const before = runtime.calls.length;
  await request({ type: 'load', config: loadConfig() });
  assert.equal(runtime.calls.length, before);
  const { result } = await request({ type: 'load', config: loadConfig({ device: 'webgpu', dtype: 'q4f16' }) });
  assert.equal(result.ok, true);
  assert.deepEqual(runtime.calls.slice(before).map((c) => c.disposed ? 'dispose:' + c.dtype : 'load:' + c.dtype), ['dispose:q4', 'load:q4f16']);
});

test('dispose releases the generator', async () => {
  const { result } = await request({ type: 'dispose' });
  assert.equal(result.ok, true);
  const after = await request({ type: 'generate', messages: [{ role: 'user', content: 'hi' }] });
  assert.equal(after.result.ok, false);
});
