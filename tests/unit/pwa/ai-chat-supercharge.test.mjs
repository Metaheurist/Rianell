import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appJs = readFileSync('apps/pwa-webapp/app.js', 'utf8');
const chatJs = readFileSync('apps/pwa-webapp/modules/ai-chat.js', 'utf8');

const SUPERCHARGE_KEYS = [
  'home.chat.supercharge.title',
  'home.chat.supercharge.body',
  'home.chat.supercharge.cta',
];

const LOCALE_FILES = [
  'i18n-packs/locale-packs/v1/en-GB.json',
  'apps/pwa-webapp/i18n-packs/locale-packs/v1/en-GB.json',
];

function loadStrings(file) {
  const pack = JSON.parse(readFileSync(file, 'utf8'));
  return pack && pack.strings ? pack.strings : pack;
}

test('en-GB packs define the supercharge promo strings', () => {
  for (const file of LOCALE_FILES) {
    const strings = loadStrings(file);
    for (const key of SUPERCHARGE_KEYS) {
      assert.equal(typeof strings[key], 'string', `${file} should define "${key}"`);
      assert.ok(strings[key].length > 0, `${file} "${key}" must not be empty`);
    }
  }
});

test('supercharge copy contains no em dash (UI copy rule)', () => {
  for (const file of LOCALE_FILES) {
    const strings = loadStrings(file);
    for (const key of SUPERCHARGE_KEYS) {
      assert.doesNotMatch(strings[key], /\u2014/, `${file} "${key}" must not use an em dash`);
    }
  }
});

test('guided-tips chat only shows the promo when the device can be upgraded', () => {
  // The promo must be scoped to guided mode AND a real upgrade path, otherwise it
  // would mislead users on locale-blocked / WASM-less devices that cannot run the model.
  assert.match(
    chatJs,
    /function canShowSuperchargePromo\(\)\s*\{[\s\S]*?if \(!_forceGeneric\) return false;[\s\S]*?canOfferOnDeviceLlmUpgrade/, 
    'canShowSuperchargePromo must require _forceGeneric and canOfferOnDeviceLlmUpgrade',
  );
  for (const key of SUPERCHARGE_KEYS) {
    assert.ok(chatJs.includes(key), `ai-chat.js should reference "${key}"`);
  }
});

test('explicit opt-in overrides the deferAI perf heuristic', () => {
  // An informed "Supercharge chat" tap must be able to unlock on-device AI even
  // when the perf heuristic would otherwise defer it.
  assert.match(
    appJs,
    /function deviceSupportsOnDeviceLlmChat\(\)\s*\{[\s\S]*?forceOnDeviceAi === true;[\s\S]*?if \(!forced &&[\s\S]*?deferAI\) return false;/, 
    'deviceSupportsOnDeviceLlmChat must bypass deferAI when forceOnDeviceAi is set',
  );
  assert.match(
    appJs,
    /function superchargeOnDeviceChat\([\s\S]*?appSettings\.forceOnDeviceAi = true;/, 
    'superchargeOnDeviceChat must persist the forceOnDeviceAi opt-in',
  );
  assert.match(appJs, /window\.canOfferOnDeviceLlmUpgrade = canOfferOnDeviceLlmUpgrade;/);
  assert.match(appJs, /window\.superchargeOnDeviceChat = superchargeOnDeviceChat;/);
});
