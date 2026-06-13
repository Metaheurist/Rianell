import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkPolicyDriftSync } from '../../../packages/shared/src/privacy/checkPolicyDrift.mjs';

test('checkPolicyDriftSync returns no drift when versions match', () => {
  const r = checkPolicyDriftSync('v1.0.0');
  assert.equal(r.drift, false);
});

test('checkPolicyDrift handles fetch failure gracefully', async () => {
  const { checkPolicyDrift } = await import('../../../packages/shared/src/privacy/checkPolicyDrift.mjs');
  const r = await checkPolicyDrift('v1.0.0', async () => {
    throw new Error('offline');
  });
  assert.equal(r.drift, false);
});

test('policy-manifest.json exists for PWA hosting', async () => {
  const { readFileSync, existsSync } = await import('fs');
  assert.ok(existsSync('apps/pwa-webapp/policy-manifest.json'));
  const manifest = JSON.parse(readFileSync('apps/pwa-webapp/policy-manifest.json', 'utf8'));
  assert.ok(manifest.version || manifest.policyPackId);
});
