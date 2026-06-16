import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

test('bundle:mobile:prod uses run-mobile-export orchestrator', () => {
  const script = String(pkg?.scripts?.['bundle:mobile:prod'] || '');
  assert.match(script, /run-mobile-export\.mjs/);
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

