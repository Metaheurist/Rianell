import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const src = fs.readFileSync('apps/pwa-webapp/modules/llm-worker-client.js', 'utf8');

function loadClient() {
  const workers = [];
  class FakeWorker {
    constructor(url, opts) {
      this.url = url;
      this.opts = opts;
      this.sent = [];
      this.terminated = false;
      workers.push(this);
    }
    postMessage(msg) { this.sent.push(msg); }
    terminate() { this.terminated = true; }
    reply(msg) { this.onmessage({ data: msg }); }
  }
  const context = { window: {}, Promise };
  context.window.Worker = FakeWorker;
  vm.createContext(context);
  vm.runInContext(src, context);
  const client = context.window.RianellLlmWorkerClient.createLlmWorkerClient({ workerUrl: '/workers/llm-worker.js' });
  return { client, workers };
}

test('creates one module worker lazily and routes progress to the caller', async () => {
  const { client, workers } = loadClient();
  assert.equal(workers.length, 0);
  const progress = [];
  const pending = client.load({ modelId: 'm' }, (data) => progress.push(data));
  assert.equal(workers.length, 1);
  assert.equal(workers[0].opts.type, 'module');
  const req = workers[0].sent[0];
  assert.equal(req.type, 'load');
  workers[0].reply({ type: 'progress', id: req.id, data: { status: 'progress', progress: 40 } });
  workers[0].reply({ type: 'result', id: req.id, ok: true, value: { device: 'wasm' } });
  assert.deepEqual(await pending, { device: 'wasm' });
  assert.deepEqual(progress, [{ status: 'progress', progress: 40 }]);
  client.generate([{ role: 'user', content: 'x' }]);
  assert.equal(workers.length, 1);
});

test('a failed result rejects with the worker error message', async () => {
  const { client, workers } = loadClient();
  const pending = client.generate([{ role: 'user', content: 'x' }]);
  const req = workers[0].sent[0];
  workers[0].reply({ type: 'result', id: req.id, ok: false, error: { name: 'Error', message: 'Model is not loaded' } });
  await assert.rejects(pending, /Model is not loaded/);
});

test('terminate kills the worker, rejects pending requests and the next call starts a fresh worker', async () => {
  const { client, workers } = loadClient();
  const pending = client.load({ modelId: 'm' });
  client.terminate('Model engine load stalled');
  assert.equal(workers[0].terminated, true);
  await assert.rejects(pending, /load stalled/);
  assert.equal(client.isRunning(), false);
  client.generate([{ role: 'user', content: 'x' }]);
  assert.equal(workers.length, 2);
});

test('a worker crash rejects every pending request', async () => {
  const { client, workers } = loadClient();
  const a = client.load({ modelId: 'm' });
  const b = client.generate([{ role: 'user', content: 'x' }]);
  workers[0].onerror({ preventDefault() {} });
  await assert.rejects(a, /crashed/);
  await assert.rejects(b, /crashed/);
  assert.equal(workers[0].terminated, true);
});

test('dispose without a running worker resolves without spawning one', async () => {
  const { client, workers } = loadClient();
  assert.equal(await client.dispose(), true);
  assert.equal(workers.length, 0);
});
