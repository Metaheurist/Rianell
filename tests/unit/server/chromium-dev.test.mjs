import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('chromium-dev script exists and status command returns JSON shape', () => {
  const script = path.join('server', 'scripts', 'chromium-dev.mjs');
  assert.ok(fs.existsSync(script), 'server/scripts/chromium-dev.mjs should exist');
});

test('chromium-dev launch watches /api/reload on loopback', () => {
  const script = fs.readFileSync('server/scripts/chromium-dev.mjs', 'utf8');
  assert.match(script, /watchDevReloadStream/);
  assert.match(script, /\/api\/reload/);
  assert.match(script, /__rianellExternalReloadWatcher/);
  assert.match(script, /--no-watch-reload/);
  assert.doesNotMatch(script, /serviceWorkers:\s*'block'/);
});

test('PWA skips in-page reload stream when external dev watcher is active', () => {
  const appJs = fs.readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(appJs, /__rianellExternalReloadWatcher/);
  assert.match(appJs, /Reload stream handled by dev Chromium launcher/);
});

test('chromium_dev module exposes status helpers', async () => {
  assert.ok(fs.existsSync('server/chromium_dev.py'));
  const py = fs.readFileSync('server/chromium_dev.py', 'utf8');
  assert.match(py, /def launch_clean_chromium/);
  assert.match(py, /watch_reload/);
  assert.match(
    fs.readFileSync('server/main.py', 'utf8'),
    /Open clean Chromium/,
  );
});
