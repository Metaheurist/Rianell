import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldAllowNetworkOperation,
  isLocalOnlyModeEnabled,
  LOCAL_ONLY_NETWORK_FEATURES,
  appendProcessingActivity,
  readProcessingActivity,
  formatActivityTypeLabel,
  encryptExportWithPassphrase,
  decryptExportWithPassphrase,
  ENCRYPTED_EXPORT_FORMAT,
  ANON_POOL_INCLUDED_FIELDS,
  ANON_POOL_EXCLUDED_FIELDS,
} from '@rianell/shared';

test('local-only mode blocks all network features', () => {
  const prefs = { localOnlyMode: true };
  assert.equal(isLocalOnlyModeEnabled(prefs), true);
  for (const f of LOCAL_ONLY_NETWORK_FEATURES) {
    assert.equal(shouldAllowNetworkOperation(prefs, f.id), false, f.id);
  }
  assert.equal(shouldAllowNetworkOperation({ localOnlyMode: false }, 'cloudSync'), true);
});

test('processing activity log appends and caps entries', () => {
  let log = [];
  log = appendProcessingActivity(log, { type: 'export', day: 'ignore' });
  assert.equal(log.length, 1);
  assert.equal(log[0].type, 'export');
  assert.ok(typeof log[0].at === 'string');
  const big = Array.from({ length: 510 }, (_, i) => ({ type: 'export', at: `2026-01-01T00:00:0${i % 10}.000Z` }));
  const capped = readProcessingActivity(big);
  assert.ok(capped.length <= 500);
});

test('formatActivityTypeLabel maps known types', () => {
  assert.equal(formatActivityTypeLabel('cloud_sync'), 'settings.privacy.activity.cloudSync');
  assert.equal(formatActivityTypeLabel('encrypted_export'), 'settings.privacy.activity.encryptedExport');
});

test('encrypted export round-trip', async () => {
  const payload = { logs: [{ date: '2026-06-18', mood: 3 }] };
  const envelope = await encryptExportWithPassphrase(payload, 'test-passphrase-123');
  assert.equal(envelope.format, ENCRYPTED_EXPORT_FORMAT);
  const out = await decryptExportWithPassphrase(envelope, 'test-passphrase-123');
  assert.deepEqual(out, payload);
});

test('anon pool manifest lists included and excluded fields', () => {
  assert.ok(ANON_POOL_INCLUDED_FIELDS.length >= 5);
  assert.ok(ANON_POOL_EXCLUDED_FIELDS.some((f) => f.id === 'notes'));
  assert.ok(ANON_POOL_EXCLUDED_FIELDS.every((f) => f.labelKey.startsWith('settings.privacy.anonPool.field.')));
});
