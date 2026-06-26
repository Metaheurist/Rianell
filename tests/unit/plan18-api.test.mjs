import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  generateRawApiKey,
  hashApiKey,
  isValidWebhookUrl,
  buildWebhookInvokePayload,
  WEBHOOK_EVENTS,
} from '@rianell/shared';

const root = join(import.meta.dirname, '..', '..');

test('generateRawApiKey uses rn_live prefix', () => {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < bytes.length; i++) bytes[i] = i;
  const key = generateRawApiKey(bytes);
  assert.match(key, /^rn_live_[a-f0-9]+$/);
});

test('hashApiKey produces sha256 hex', async () => {
  const hash = await hashApiKey('rn_live_test');
  assert.equal(hash.length, 64);
});

test('isValidWebhookUrl requires https', () => {
  assert.equal(isValidWebhookUrl('https://example.com/hook'), true);
  assert.equal(isValidWebhookUrl('http://example.com/hook'), false);
});

test('buildWebhookInvokePayload includes event and user', () => {
  const p = buildWebhookInvokePayload({ event: 'log.created', logDate: '2026-06-01', userId: 'u1' });
  assert.equal(p.event, 'log.created');
  assert.equal(p.user_id, 'u1');
});

test('WEBHOOK_EVENTS includes log.created', () => {
  assert.ok(WEBHOOK_EVENTS.includes('log.created'));
});

test('Schema.sql defines api_keys and user_webhooks', () => {
  const schema = readFileSync(join(root, 'supabase/Schema.sql'), 'utf8');
  assert.match(schema, /CREATE TABLE IF NOT EXISTS public\.api_keys/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS public\.user_webhooks/);
  assert.match(schema, /webhook_deliveries/);
});

test('OpenAPI spec exists with /logs path', () => {
  const spec = readFileSync(join(root, 'docs/api/openapi.yaml'), 'utf8');
  assert.match(spec, /openapi: 3\.1\.0/);
  assert.match(spec, /\/logs:/);
});

test('Edge functions api-v1 and deliver-webhook exist', () => {
  assert.ok(existsSync(join(root, 'supabase/functions/api-v1/index.ts')));
  assert.ok(existsSync(join(root, 'supabase/functions/deliver-webhook/index.ts')));
  assert.ok(existsSync(join(root, 'supabase/functions/generate-api-key/index.ts')));
});

test('cloud-sync invokes deliver-webhook after upsert', () => {
  const src = readFileSync(join(root, 'apps/pwa-webapp/cloud-sync.js'), 'utf8');
  assert.match(src, /deliver-webhook/);
});

test('RN sync invokes deliver-webhook', () => {
  const src = readFileSync(join(root, 'apps/rn-app/src/cloud/sync.ts'), 'utf8');
  assert.match(src, /deliver-webhook/);
});
