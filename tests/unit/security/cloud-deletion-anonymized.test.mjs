import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('RN sync uses anonymized_data table not anonymized_logs', () => {
  const src = readFileSync('apps/rn-app/src/cloud/sync.ts', 'utf8');
  assert.match(src, /from\('anonymized_data'\)/);
  assert.doesNotMatch(src, /anonymized_logs/);
});

test('deleteAllUserDataFromCloud deletes user_keys and anonymized_data', () => {
  const src = readFileSync('apps/rn-app/src/cloud/sync.ts', 'utf8');
  assert.match(src, /user_keys/);
  assert.match(src, /anonymized_data/);
  assert.match(src, /bug_reports/);
  assert.match(src, /user_privacy_profile/);
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
