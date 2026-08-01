import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertLoopbackBaseUrl,
  createAgenticClient,
} from '@rianell/build-tools/agentic-api-client';

test('assertLoopbackBaseUrl accepts localhost', () => {
  assert.equal(assertLoopbackBaseUrl('http://127.0.0.1:8080'), 'http://127.0.0.1:8080');
  assert.equal(assertLoopbackBaseUrl('http://localhost:8080'), 'http://localhost:8080');
});

test('assertLoopbackBaseUrl rejects LAN hosts', () => {
  assert.throws(() => assertLoopbackBaseUrl('http://192.168.1.10:8080'), /non-loopback/);
});

test('createAgenticClient parses envelope via mock fetch', async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({ ok: true, schemaVersion: 1, data: { service: 'agentic' }, error: null }),
  });
  const client = createAgenticClient({ baseUrl: 'http://127.0.0.1:8080', fetchImpl });
  const health = await client.getHealth();
  assert.equal(health.service, 'agentic');
});

test('createAgenticClient surfaces error envelope', async () => {
  const fetchImpl = async () => ({
    ok: false,
    status: 403,
    json: async () => ({
      ok: false,
      schemaVersion: 1,
      data: null,
      error: { code: 403, message: 'loopback only' },
    }),
  });
  const client = createAgenticClient({ baseUrl: 'http://127.0.0.1:8080', fetchImpl });
  await assert.rejects(() => client.getStatus(), /loopback only/);
});
