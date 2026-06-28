import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('boot flow does not auto-open first-run benchmark modal', () => {
  const appJs = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(appJs, /function revealBootShellAfterBenchmark/);
  assert.doesNotMatch(appJs, /openPerfBenchmarkModal\(\{\s*mode:\s*'firstRun'/);
  assert.match(appJs, /startAppAfterPrivacyGate\(\)/);
});

test('benchmark modal is exposed via god mode developer section', () => {
  const appJs = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(appJs, /godMode\.viewBenchmarkDetails/);
  assert.match(appJs, /action: run\(openBenchmarkDetails\)/);
  assert.doesNotMatch(
    appJs,
    /godMode\.viewBenchmarkDetails[\s\S]*desktopOnly:\s*true/,
  );
});
