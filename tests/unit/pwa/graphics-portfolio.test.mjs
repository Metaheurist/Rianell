import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('graphics-portfolio module exports RianellGraphicsPortfolio namespace', () => {
  const js = readFileSync('apps/pwa-webapp/modules/graphics-portfolio.js', 'utf8');
  assert.match(js, /global\.RianellGraphicsPortfolio\s*=/);
  assert.match(js, /injectSpriteSymbols/);
  assert.match(js, /playAchievementUnlockSequence/);
  assert.match(js, /decorateLifestyleVitals/);
});

test('graphics-portfolio.js defines twenty avatar IDs', () => {
  const js = readFileSync('apps/pwa-webapp/modules/graphics-portfolio.js', 'utf8');
  const match = js.match(/var AVATAR_IDS = \[([\s\S]*?)\];/);
  assert.ok(match, 'AVATAR_IDS array missing');
  const ids = match[1].match(/'[a-z]+'/g) || [];
  assert.equal(ids.length, 20);
  assert.ok(ids.includes("'voidorb'"));
  assert.ok(ids.includes("'driftmoss'"));
});

test('index.html wires graphics-portfolio assets and header avatar mount', () => {
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  assert.match(html, /graphics-portfolio\.css/);
  assert.match(html, /graphics-portfolio\.js/);
  assert.match(html, /id="profileAvatarHeader"/);
  assert.match(html, /pain-body-svg--set-d/);
  assert.match(html, /pain-body-outline--abstract/);
});

test('graphics-portfolio.css guards motion-heavy keyframes', () => {
  const css = readFileSync('apps/pwa-webapp/css/graphics-portfolio.css', 'utf8');
  assert.ok(css.includes('.pain-region-ripple'), 'pain ripple styles missing');
  assert.ok(css.includes('.graphics-badge-composite--unlock-sweep'), 'badge unlock sweep missing');
  assert.match(css, /@media \(not \(prefers-reduced-motion: reduce\)\)/);
});

test('tokens.css sync includes vibe body classes', () => {
  const css = readFileSync('apps/pwa-webapp/css/tokens.css', 'utf8');
  assert.match(css, /body\.vibe-calm/);
  assert.match(css, /body\.vibe-energy/);
  assert.match(css, /--avatar-primary/);
});

test('sync-tokens-to-pwa emits vibe and avatar CSS variables', () => {
  const script = readFileSync('scripts/build/sync-tokens-to-pwa.mjs', 'utf8');
  assert.match(script, /VIBE_TOKENS/);
  assert.match(script, /avatar-primary/);
});
