import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('apps/pwa-webapp/app.js', 'utf8');
const llm = readFileSync('apps/pwa-webapp/summary-llm.js', 'utf8');

test('PWA demo mode allows on-device AI download and init', () => {
  assert.match(app, /function ensureDemoModeAiModelInit/);
  assert.match(app, /onDeviceLlmDownload' && appSettings && appSettings\.demoMode === true/);
  assert.match(app, /shouldAllowAiModelDownload/);
  assert.match(app, /if \(appSettings\.aiEnabled === false\) appSettings\.aiEnabled = true/);
  assert.match(app, /ensureDemoModeAiModelInit\(\)/);
  assert.match(llm, /Local-only blocks outbound model fetch; demo mode explicitly allows/);
});
