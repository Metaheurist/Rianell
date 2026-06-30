import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('graphics-portfolio module exports RianellGraphicsPortfolio namespace', () => {
  const js = readFileSync('apps/pwa-webapp/modules/graphics-portfolio.js', 'utf8');
  assert.match(js, /global\.RianellGraphicsPortfolio\s*=/);
  assert.match(js, /injectSpriteSymbols/);
  assert.match(js, /removeLegacyVibeUi/);
  assert.match(js, /renderAchievementIconHTML/);
  assert.match(js, /avatarSymbolPathsForId/);
  assert.match(js, /avatar-carousel-shell/);
  assert.doesNotMatch(js, /renderVibePickerHTML/);
});

test('index.html omits ambient vibe settings section', () => {
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  assert.doesNotMatch(html, /settingsVibePickerMount/);
  assert.doesNotMatch(html, /settings\.vibe\.title/);
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

test('injectMetricEntityCompanion skips widgets with dedicated visuals and anchors inside host', () => {
  const js = readFileSync('apps/pwa-webapp/modules/graphics-portfolio.js', 'utf8');
  assert.match(js, /function widgetHasDedicatedVisual/);
  assert.match(js, /widgetHasDedicatedVisual\(widgetEl\)\) return null/);
  assert.match(js, /widgetEl\.appendChild\(stage\)/);
  assert.match(js, /removeMisplacedMetricEntityStages/);
  assert.doesNotMatch(js, /parent\.insertBefore\(stage, widgetEl\.nextSibling\)/);
});

test('decorateConnectors reuses existing connector-icon instead of injecting duplicate art', () => {
  const js = readFileSync('apps/pwa-webapp/modules/graphics-portfolio.js', 'utf8');
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  assert.match(html, /class="ui-svg-icon connector-icon"/);
  assert.match(js, /var existingIcon = row\.querySelector\('\.connector-icon'\)/);
  assert.match(js, /if \(legacyArt\) legacyArt\.remove\(\)/);
  assert.doesNotMatch(js, /if \(row\.querySelector\('\.connector-art'\)\) return;/);
});

test('graphics-portfolio resolves avatar names via lazy shared() after script load', () => {
  const js = readFileSync('apps/pwa-webapp/modules/graphics-portfolio.js', 'utf8');
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  assert.match(js, /function shared\(\)/);
  assert.match(js, /global\.RianellShared/);
  assert.doesNotMatch(js, /var S = global\.RianellShared \|\| \{\}/);
  assert.match(js, /generateAvatarNameFromSeed\(seed\)/);
  const sharedIdx = html.indexOf('vendor/rianell-shared.js');
  const portfolioIdx = html.indexOf('modules/graphics-portfolio.js');
  assert.ok(sharedIdx >= 0 && portfolioIdx > sharedIdx, 'graphics-portfolio must load after rianell-shared.js');
  assert.match(html, /graphics-portfolio\.js\?v=5/);
});

test('security lock symbols use stroke outlines not solid fill blobs', () => {
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  const lockBlock = html.match(/id="icon-lock"[\s\S]*?<\/symbol>/);
  assert.ok(lockBlock, 'icon-lock symbol missing');
  assert.match(lockBlock[0], /fill="none"/);
  assert.match(lockBlock[0], /stroke="currentColor"/);
  const css = readFileSync('apps/pwa-webapp/css/graphics-portfolio.css', 'utf8');
  assert.match(css, /\.security-lock-illustration__svg/);
});
