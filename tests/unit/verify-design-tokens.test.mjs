import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

test('verify-design-tokens.mjs passes on current tree', () => {
  const r = spawnSync(process.execPath, ['scripts/verify/verify-design-tokens.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, (r.stderr || r.stdout || 'verify-design-tokens failed').trim());
});

test('styles.css progress fills use transform scaleX not width transition', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /\.log-wizard-progress-fill[\s\S]*transform:\s*scaleX\(var\(--progress/);
  assert.match(css, /\.achievement-progress-fill[\s\S]*transform:\s*scaleX\(var\(--progress/);
  assert.match(css, /\.goals-bar-fill[\s\S]*transform:\s*scaleX\(var\(--progress/);
  assert.doesNotMatch(css, /\.log-wizard-progress-fill[^}]*transition:\s*width/);
});

test('app.js exposes setProgressScale helper', () => {
  const js = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(js, /function setProgressScale\(el, pct\)/);
  assert.match(js, /setProperty\('--progress'/);
});

test('design token contract doc exists and references @rianell/tokens', () => {
  const doc = readFileSync('docs/design-token-contract.md', 'utf8');
  assert.match(doc, /@rianell\/tokens/);
  assert.match(doc, /SPACING_TOKENS/);
});
