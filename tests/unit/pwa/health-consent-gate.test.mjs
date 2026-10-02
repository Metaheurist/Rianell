import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const appJs = readFileSync('apps/pwa-webapp/app.js', 'utf8');

function loadHasHealthDataConsent(store) {
  const src = appJs.match(/function hasHealthDataConsent\(\) \{[\s\S]*?\n\}/);
  assert.ok(src, 'hasHealthDataConsent() not found in app.js');
  const localStorage = { getItem: (k) => (k in store ? store[k] : null) };
  return new Function('localStorage', 'HEALTH_DATA_CONSENT_KEY', `${src[0]}; return hasHealthDataConsent;`)(
    localStorage,
    'rianellHealthDataConsent'
  );
}

test('guided-onboarding consent (rianellSettings.healthDataConsent) suppresses the consent overlay', () => {
  const has = loadHasHealthDataConsent({ rianellSettings: JSON.stringify({ healthDataConsent: true }) });
  assert.equal(has(), true);
});

test('legacy overlay consent key still counts', () => {
  assert.equal(loadHasHealthDataConsent({ rianellHealthDataConsent: 'accepted' })(), true);
});

test('no consent recorded, or corrupt settings, shows the overlay', () => {
  assert.equal(loadHasHealthDataConsent({})(), false);
  assert.equal(loadHasHealthDataConsent({ rianellSettings: JSON.stringify({ healthDataConsent: false }) })(), false);
  assert.equal(loadHasHealthDataConsent({ rianellSettings: '{not json' })(), false);
});

test('showHealthDataConsentIfNeeded() gates on hasHealthDataConsent()', () => {
  const fn = appJs.match(/function showHealthDataConsentIfNeeded\(\) \{[\s\S]*?\n\}/);
  assert.ok(fn);
  assert.match(fn[0], /if \(hasHealthDataConsent\(\)\) return;/);
});
