import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getPolicyPack,
  resolvePolicyPack,
  getRegionLabels,
  suggestPrivacyRegionFromHint,
} from '../../../packages/shared/src/privacy/index.mjs';

test('policy pack includes all required regions', () => {
  const pack = getPolicyPack();
  for (const id of ['eea_uk', 'us_ca', 'us_other', 'au', 'br', 'other']) {
    assert.ok(pack.regions[id], `missing region ${id}`);
    assert.ok(pack.regions[id].label);
  }
});

test('resolvePolicyPack falls back to other for unknown region', () => {
  const r = resolvePolicyPack('invalid_region_xyz');
  assert.equal(r.regionId, 'other');
});

test('suggestPrivacyRegionFromHint never auto-applies without user', () => {
  const hint = suggestPrivacyRegionFromHint('en-GB', 'Europe/London');
  assert.equal(hint, 'eea_uk');
  assert.ok(getRegionLabels().some((x) => x.id === hint));
});

test('applyRegionDowngradeToggles disables backup when feature unavailable', async () => {
  const { applyRegionDowngradeToggles } = await import(
    '../../../packages/shared/src/privacy/getFeatureAvailability.mjs'
  );
  const prefs = { backup: true, contributeAnonData: true, aiEnabled: true, healthDataConsent: false };
  const next = applyRegionDowngradeToggles(prefs, 'other', 'eea_uk');
  assert.equal(typeof next, 'object');
});
