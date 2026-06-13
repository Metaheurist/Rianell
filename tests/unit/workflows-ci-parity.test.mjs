import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const ciYml = fs.readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');

test('ci.yml runs platform parity checks in unit-tests', () => {
  assert.match(ciYml, /npm run parity:web/);
  assert.match(ciYml, /npm run parity:android/);
  assert.match(ciYml, /npm run parity:ios/);
  assert.match(ciYml, /parity:inventory:check/);
});

test('ci.yml does not build Capacitor react-dist', () => {
  assert.doesNotMatch(ciYml, /build:react/);
  assert.doesNotMatch(ciYml, /capacitor-app\/dist/);
  assert.doesNotMatch(ciYml, /legacy-capacitor/);
});

test('publish-release excludes Legacy assets', () => {
  assert.doesNotMatch(ciYml, /release-assets\/Legacy/);
});
