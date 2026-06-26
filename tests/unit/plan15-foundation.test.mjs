import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildConsentAuditPayload,
  extractLogFieldsFromVoiceTranscript,
  PBKDF2_ITERATIONS,
} from '@rianell/shared';

const root = join(import.meta.dirname, '..', '..');

test('buildConsentAuditPayload includes platform and timestamp', () => {
  const payload = buildConsentAuditPayload('healthDataConsent', true, 'pwa');
  assert.equal(payload.field, 'healthDataConsent');
  assert.equal(payload.value, true);
  assert.equal(payload.platform, 'pwa');
  assert.ok(typeof payload.ts === 'number');
});

test('extractLogFieldsFromVoiceTranscript parses mood and fatigue', () => {
  const fields = extractLogFieldsFromVoiceTranscript('feeling good today, fatigue is 5, slept well');
  assert.equal(fields.mood, 7);
  assert.equal(fields.fatigue, 5);
});

test('cloud-sync defines consent audit helpers', () => {
  const src = readFileSync(join(root, 'apps/pwa-webapp/cloud-sync.js'), 'utf8');
  assert.match(src, /log_consent_event/);
  assert.match(src, /maybeLogConsentChange/);
});

test('Schema.sql includes log_consent_event RPC and wrapped_dek columns', () => {
  const schema = readFileSync(join(root, 'supabase/Schema.sql'), 'utf8');
  assert.match(schema, /log_consent_event/);
  assert.match(schema, /wrapped_dek/);
  assert.match(schema, /data_encrypted/);
});

test('key management meets PBKDF2 minimum', () => {
  assert.ok(PBKDF2_ITERATIONS >= 310_000);
});

test('i18n-pwa sets document lang on locale refresh', () => {
  const src = readFileSync(join(root, 'apps/pwa-webapp/i18n-pwa.js'), 'utf8');
  assert.match(src, /document\.documentElement\.lang/);
});

test('summary-llm-gguf resolves when feature flag enabled', async () => {
  const src = readFileSync(join(root, 'apps/pwa-webapp/summary-llm-gguf.js'), 'utf8');
  assert.match(src, /isGgufFeatureEnabled/);
  assert.doesNotMatch(src, /loader is not wired yet/);
});
