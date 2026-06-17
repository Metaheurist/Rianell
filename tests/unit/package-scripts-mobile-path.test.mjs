import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

test('bundle:mobile:prod uses run-mobile-export orchestrator', () => {
  const script = String(pkg?.scripts?.['bundle:mobile:prod'] || '');
  assert.match(script, /run-mobile-export\.mjs/);
});

test('run-mobile-export stubs native LLM deps for Hermes export gate', () => {
  const script = fs.readFileSync(
    new URL('../../scripts/build/run-mobile-export.mjs', import.meta.url),
    'utf8',
  );
  assert.match(script, /RIANELL_EXPO_EXPORT_STUB_NATIVE_LLM:\s*['"]1['"]/);
});

test('dev script targets RN Expo, not Capacitor', () => {
  const dev = String(pkg?.scripts?.dev || '');
  assert.match(dev, /apps\/rn-app/);
  assert.doesNotMatch(dev, /capacitor-app/);
});

test('build:web uses run-web orchestrator', () => {
  const buildWeb = String(pkg?.scripts?.['build:web'] || '');
  assert.match(buildWeb, /run-web\.mjs/);
});

test('package-lock has no capacitor-app workspace entry', () => {
  const lock = fs.readFileSync(new URL('../../package-lock.json', import.meta.url), 'utf8');
  assert.doesNotMatch(lock, /"apps\/capacitor-app"/);
});

