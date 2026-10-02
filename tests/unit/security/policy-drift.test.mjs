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

function manifestFetch(body) {
  return async () => ({ ok: true, json: async () => body });
}

test('checkPolicyDrift: hosted manifest matches the onboarding ack (no false re-consent prompt)', async () => {
  const { readFileSync } = await import('fs');
  const { checkPolicyDrift } = await import('../../../packages/shared/src/privacy/checkPolicyDrift.mjs');
  const manifest = JSON.parse(readFileSync('apps/pwa-webapp/policy-manifest.json', 'utf8'));
  for (const ack of ['v1.0.0', '1.0.0']) {
    const r = await checkPolicyDrift(ack, manifestFetch(manifest));
    assert.equal(r.drift, false, `ack ${ack} vs hosted manifest`);
  }
});

test('checkPolicyDrift: bare version and pack id formats compare equal', async () => {
  const { checkPolicyDrift } = await import('../../../packages/shared/src/privacy/checkPolicyDrift.mjs');
  assert.equal((await checkPolicyDrift('v1.0.0', manifestFetch({ version: '1.0.0' }))).drift, false);
  assert.equal((await checkPolicyDrift('1.0.0', manifestFetch({ policyPackId: 'v1.0.0' }))).drift, false);
});

test('checkPolicyDrift: a real version bump is still detected', async () => {
  const { checkPolicyDrift } = await import('../../../packages/shared/src/privacy/checkPolicyDrift.mjs');
  const r = await checkPolicyDrift('v1.0.0', manifestFetch({ version: '1.1.0', policyPackId: 'v1.1.0', requiresReconsent: true }));
  assert.equal(r.drift, true);
  assert.equal(r.requiresReconsent, true);
  assert.equal(r.remoteVersion, 'v1.1.0');
});

test('policy-manifest.json exists for PWA hosting', async () => {
  const { readFileSync, existsSync } = await import('fs');
  assert.ok(existsSync('apps/pwa-webapp/policy-manifest.json'));
  const manifest = JSON.parse(readFileSync('apps/pwa-webapp/policy-manifest.json', 'utf8'));
  assert.ok(manifest.version || manifest.policyPackId);
});
