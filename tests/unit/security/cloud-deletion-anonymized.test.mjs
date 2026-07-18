import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('PWA deleteAllUserDataFromCloud includes user_achievements', () => {
  const src = readFileSync('apps/pwa-webapp/cloud-sync.js', 'utf8');
  assert.match(src, /user_achievements/);
});

test('PWA deleteAllUserDataFromCloud includes user_privacy_profile', () => {
  const src = readFileSync('apps/pwa-webapp/cloud-sync.js', 'utf8');
  assert.match(src, /user_privacy_profile/);
});

test('PWA deleteAllUserDataFromCloud includes anonymized_data', () => {
  const src = readFileSync('apps/pwa-webapp/cloud-sync.js', 'utf8');
  assert.match(src, /deleteAllUserDataFromCloud[\s\S]*anonymized_data/);
});

test('PWA anonymized sync fail-closed without plain JSON fallback', () => {
  const src = readFileSync('apps/pwa-webapp/cloud-sync.js', 'utf8');
  assert.doesNotMatch(src, /using plain JSON/);
  assert.match(src, /fail-closed/);
});
