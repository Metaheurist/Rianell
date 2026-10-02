import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const SRC = readFileSync('apps/pwa-webapp/sw.js', 'utf8');
const ORIGIN = 'https://rianell.test';

function fakeResponse({ status = 200, type = 'basic', cacheControl = '', body = 'x' } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    type,
    body,
    headers: { get: (name) => (name.toLowerCase() === 'cache-control' ? cacheControl : null) },
    clone() { return fakeResponse({ status, type, cacheControl, body }); },
  };
}

function loadWorker({ fetchImpl, cached = new Map() } = {}) {
  const listeners = {};
  const puts = [];
  const fetchCalls = [];
  const cache = {
    put: (req, res) => { puts.push({ url: typeof req === 'string' ? req : req.url, res }); return Promise.resolve(); },
    match: (req) => Promise.resolve(cached.get(typeof req === 'string' ? req : req.url) || undefined),
  };
  const ctx = {
    self: {
      location: { origin: ORIGIN },
      addEventListener: (type, fn) => { listeners[type] = fn; },
      clients: { claim: () => Promise.resolve() },
      skipWaiting: () => {},
    },
    caches: {
      open: () => Promise.resolve(cache),
      match: (req) => cache.match(req),
      keys: () => Promise.resolve([]),
      delete: () => Promise.resolve(true),
    },
    fetch: (req, init) => { fetchCalls.push({ url: typeof req === 'string' ? req : req.url, init }); return fetchImpl(req, init); },
    Response: class { constructor(body, init) { this.body = body; this.init = init; } },
    URL,
    Promise,
  };
  vm.runInNewContext(SRC, ctx);
  return { listeners, puts, fetchCalls, ctx };
}

function dispatchFetch(listeners, { url, mode = 'no-cors', accept = '' }) {
  let responsePromise = null;
  const waits = [];
  const event = {
    request: { url, method: 'GET', mode, headers: { get: (n) => (n.toLowerCase() === 'accept' ? accept : null) } },
    respondWith: (p) => { responsePromise = Promise.resolve(p); },
    waitUntil: (p) => { waits.push(p); },
  };
  listeners.fetch(event);
  return { responsePromise, waits };
}

test('CACHE_NAME is bumped for the non-blocking cache rewrite', () => {
  assert.match(SRC, /CACHE_NAME = CACHE_PREFIX \+ 'v2026-10-02-llm-worker-v8'/);
});

test('navigation revalidates HTML and returns before the cache write settles', async () => {
  let releaseOpen;
  const { listeners, fetchCalls, ctx } = loadWorker({ fetchImpl: () => Promise.resolve(fakeResponse({ body: 'html' })) });
  ctx.caches.open = () => new Promise((resolve) => { releaseOpen = resolve; });
  const { responsePromise, waits } = dispatchFetch(listeners, { url: `${ORIGIN}/`, mode: 'navigate', accept: 'text/html' });
  const res = await responsePromise;
  assert.equal(res.body, 'html');
  assert.equal(fetchCalls[0].init.cache, 'no-cache');
  assert.equal(waits.length, 1, 'cache write handed to waitUntil');
  assert.equal(typeof releaseOpen, 'function', 'cache write still pending when response resolved');
});

test('hashed bundles are served cache-first without hitting the network', async () => {
  const hashed = `${ORIGIN}/app.0123456789ab.min.js`;
  const cached = new Map([[hashed, fakeResponse({ body: 'cached-bundle' })]]);
  const { listeners, fetchCalls } = loadWorker({ cached, fetchImpl: () => Promise.reject(new Error('should not fetch')) });
  const res = await dispatchFetch(listeners, { url: hashed }).responsePromise;
  assert.equal(res.body, 'cached-bundle');
  assert.equal(fetchCalls.length, 0);
});

test('unhashed assets go network-first and fall back to cache offline', async () => {
  const url = `${ORIGIN}/modules/boot-guard.js`;
  const cached = new Map([[url, fakeResponse({ body: 'stale' })]]);
  const online = loadWorker({ cached, fetchImpl: () => Promise.resolve(fakeResponse({ body: 'fresh' })) });
  assert.equal((await dispatchFetch(online.listeners, { url }).responsePromise).body, 'fresh');
  const offline = loadWorker({ cached, fetchImpl: () => Promise.reject(new Error('offline')) });
  assert.equal((await dispatchFetch(offline.listeners, { url }).responsePromise).body, 'stale');
});

test('opaque, partial and no-store responses are never cached', async () => {
  for (const res of [
    fakeResponse({ type: 'opaque', status: 0 }),
    fakeResponse({ status: 206 }),
    fakeResponse({ cacheControl: 'private, no-store' }),
  ]) {
    const { listeners, puts } = loadWorker({ fetchImpl: () => Promise.resolve(res) });
    const { responsePromise, waits } = dispatchFetch(listeners, { url: `${ORIGIN}/styles.css` });
    await responsePromise;
    await Promise.all(waits);
    assert.equal(puts.length, 0, `not cached: type=${res.type} status=${res.status}`);
  }
});

test('model weights bypass the shell cache entirely', () => {
  const { listeners } = loadWorker({ fetchImpl: () => Promise.reject(new Error('unused')) });
  for (const url of [`${ORIGIN}/models/tier1/model.onnx`, `${ORIGIN}/vendor/ort-wasm-simd.wasm`, `${ORIGIN}/x.onnx_data`]) {
    assert.equal(dispatchFetch(listeners, { url }).responsePromise, null, url);
  }
});
