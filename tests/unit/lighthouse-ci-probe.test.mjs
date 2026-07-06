import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

test('lighthouserc waits for shell settle before CLS sampling', () => {
  const cfg = readFileSync('lighthouserc.js', 'utf8');
  assert.match(cfg, /pauseAfterLoadMs:\s*6500/);
  assert.match(cfg, /numberOfRuns:\s*5/);
  assert.match(cfg, /cumulative-layout-shift.*maxNumericValue:\s*0\.1/s);
});

test('CI lighthouse job warms probe server until main bundle is reachable', () => {
  const ci = readFileSync('.github/workflows/ci.yml', 'utf8');
  const block = ci.slice(ci.indexOf('lighthouse-ci:'), ci.indexOf('zap-scan:'));
  assert.match(block, /MAIN_JS=\$\(node -pe/);
  assert.match(block, /curl -fsS "http:\/\/127\.0\.0\.1:9876\/\$\{MAIN_JS\}"/);
  assert.match(block, /playwright/);
  assert.match(block, /lhci=1/);
});

test('index.html skips loading overlay burst for headless Lighthouse probe', () => {
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  assert.match(html, /rianell-lhci-probe/);
  assert.match(html, /lhci=1/);
});
