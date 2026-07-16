import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('mood uniform streak uses i18n keys', () => {
  const js = readFileSync('apps/pwa-webapp/modules/mood-tab.js', 'utf8');
  assert.match(js, /mood\.recent\.uniformStreak/);
  const enGb = readFileSync('i18n-packs/locale-packs/v1/en-GB.json', 'utf8');
  assert.match(enGb, /"mood\.recent\.uniformStreak": "\{count\} readings in a row at \{score\}\/10\{qual\}"/);
  assert.match(enGb, /"mood\.recent\.history": "Mood reading history"/);
});

test('mood history cards open day detail modal', () => {
  const js = readFileSync('apps/pwa-webapp/modules/mood-tab.js', 'utf8');
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  assert.match(js, /openMoodDayDetailModal/);
  assert.match(js, /buildMoodDayDetailHtml/);
  assert.match(js, /openMoodDayDetailModal\(readings\[i\]\.date\)/);
  assert.match(html, /id="moodDayModalOverlay"/);
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /\.mood-day-modal-body/);
});

test('mood-tab uses compact history ribbon without duplicating latest', () => {
  const js = readFileSync('apps/pwa-webapp/modules/mood-tab.js', 'utf8');
  assert.match(js, /function renderMoodReadingCard/);
  assert.match(js, /function renderMoodHeatmap/);
  assert.match(js, /mood-heatmap__grid/);
  assert.match(js, /renderMoodControlDeck\(todayStr, simpleMode\)/);
});

test('mood heatmap tiles show a date label (day + month on boundaries)', () => {
  const js = readFileSync('apps/pwa-webapp/modules/mood-tab.js', 'utf8');
  assert.match(js, /mood-heatmap__cell-day/);
  assert.match(js, /mood-heatmap__cell-month/);
  assert.match(js, /dayNum === 1 \|\| i === n - 1/);
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  // Parent button zeroes font-size/colour, so the label must size and colour itself.
  assert.match(css, /\.mood-heatmap__cell-day[\s\S]*?font-size: 0\.62rem/);
  assert.match(css, /\.mood-heatmap__cell-month[\s\S]*?font-size: 0\.5rem/);
  assert.match(css, /\.mood-heatmap__cell--good \.mood-heatmap__cell-day/);
});

test('mood heatmap cells beat light-mode button chrome', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /body\.light-mode button\.mood-heatmap__cell/);
  assert.match(css, /body\.light-mode button\.mood-heatmap__cell--good/);
  assert.match(css, /body\.light-mode button\.mood-heatmap__cell--empty/);
  assert.match(css, /\.mood-heatmap__cell::before/);
});

test('mood tab places check-in deck before metrics (Phase 3)', () => {
  const js = readFileSync('apps/pwa-webapp/modules/mood-tab.js', 'utf8');
  const deckIdx = js.indexOf('html = renderMoodControlDeck');
  const metricsIdx = js.indexOf('mood-metrics-grid');
  assert.ok(deckIdx > 0 && metricsIdx > deckIdx);
});

test('mood sparkline includes goal target line', () => {
  const js = readFileSync('apps/pwa-webapp/modules/mood-tab.js', 'utf8');
  assert.match(js, /mood-sparkline-target/);
  assert.match(js, /mood-sparkline-area/);
});

test('mood tab styles add metric card depth', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /\.mood-metric-card::before/);
  assert.match(css, /\.mood-reading-streak/);
  assert.match(css, /\.mood-reading-card__badge/);
});

test('mood tab renders unified Mood Control Deck with 3D panel hooks', () => {
  const js = readFileSync('apps/pwa-webapp/modules/mood-tab.js', 'utf8');
  assert.match(js, /function renderMoodControlDeck/);
  assert.match(js, /function wireMoodDeckParallax/);
  assert.match(js, /class="mood-control-deck"/);
  assert.match(js, /checkin-slider-stop mood-deck-orb/);
  assert.match(js, /checkin-cta-btn mood-deck-cta/);
  assert.match(js, /renderMoodDeckActionTile\('moodViewChartsBtn'/);
  assert.match(js, /renderMoodDeckActionTile\('moodPhq2Btn'/);
  assert.match(js, /renderMoodDeckActionTile\('moodGad2Btn'/);
  assert.match(js, /renderMoodControlDeck\(todayStr, simpleMode\)/);
  assert.doesNotMatch(js, /function renderMoodCheckinSection/);
  assert.doesNotMatch(js, /class="mood-actions"/);
});

test('check-in slider wires click handlers for period selection (RN parity)', () => {
  const js = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(js, /function wireCheckinSliderEvents/);
  assert.match(js, /closest\('\.checkin-slider-stop'\)/);
  assert.match(js, /aria-pressed/);
  assert.doesNotMatch(js, /_checkinDragMoved/);
  assert.doesNotMatch(
    js,
    /checkin-slider-stop:not\(\.is-done\)/,
  );
});

test('mood deck period orbs stay clickable without 3D translateZ hit-test traps', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  const js = readFileSync('apps/pwa-webapp/modules/mood-tab.js', 'utf8');
  assert.match(css, /\.mood-control-deck \.mood-deck-orb[\s\S]*?transform:\s*scale\(0\.98\)/);
  assert.doesNotMatch(css, /\.mood-control-deck \.mood-deck-orb[\s\S]*?transform:\s*translateZ\(6px\)/);
  assert.match(css, /\.checkin-slider-stop\.is-done[\s\S]*pointer-events:\s*auto/);
  assert.doesNotMatch(js, /isDone \? ' disabled'/);
  assert.match(js, /data-checkin-done/);
});

test('mood deck tile icons inherit stroke/fill token rules', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /\.mood-deck-tile-icon-svg \*,[\s\S]*stroke: currentColor/);
  assert.match(css, /\.mood-deck-tile-icon-svg \.icon-fill[\s\S]*fill: currentColor/);
  assert.match(css, /\.mood-deck-tile-icon-svg[\s\S]*width: 1\.7rem/);
});

test('check-in slider icons scale up for button footprint', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /--checkin-stop-icon-size: 1\.65rem/);
  assert.match(css, /--checkin-stop-icon-size-selected: 2\.25rem/);
  assert.match(css, /\.mood-control-deck[\s\S]*--checkin-stop-icon-size-selected: 2\.4rem/);
});

test('mood deck quick-check tiles use clipboard and anxious-face icons', () => {
  const js = readFileSync('apps/pwa-webapp/modules/mood-tab.js', 'utf8');
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  const app = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(js, /renderMoodDeckActionTile\('moodPhq2Btn'[\s\S]*?'mood-clipboard'/);
  assert.match(js, /renderMoodDeckActionTile\('moodGad2Btn'[\s\S]*?'anxious-face'/);
  assert.match(html, /id="icon-mood-clipboard"/);
  assert.match(html, /id="icon-anxious-face"/);
  assert.match(app, /'anxious-face'/);
  assert.match(app, /'mood-clipboard'/);
  const clipboard = html.match(/id="icon-mood-clipboard"[^>]*>([\s\S]*?)<\/symbol>/);
  const anxious = html.match(/id="icon-anxious-face"[^>]*>([\s\S]*?)<\/symbol>/);
  assert.ok(clipboard, 'mood-clipboard symbol');
  assert.ok(anxious, 'anxious-face symbol');
  assert.match(clipboard[1], /stroke="currentColor"/);
  assert.match(anxious[1], /stroke="currentColor"/);
  assert.match(anxious[1], /rotate\(-18/);
  assert.match(anxious[1], /M10\.45 7\.85/);
});

test('chart-bars and brain-wave sprites use currentColor (not invisible/black fills)', () => {
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  const chartBars = html.match(/id="icon-chart-bars"[^>]*>([\s\S]*?)<\/symbol>/);
  const brainWave = html.match(/id="icon-brain-wave"[^>]*>([\s\S]*?)<\/symbol>/);
  assert.ok(chartBars, 'icon-chart-bars symbol');
  assert.ok(brainWave, 'icon-brain-wave symbol');
  assert.match(chartBars[1], /class="icon-fill"/);
  assert.match(chartBars[1], /stroke="currentColor"/);
  assert.doesNotMatch(chartBars[1], /fill="none" x="7"/);
  assert.match(brainWave[1], /class="icon-fill" d="M9 4\.2/);
  assert.match(brainWave[1], /class="icon-fill" d="M15 4\.2/);
});

test('mood control deck CSS uses token-scoped 3D depth and reduced-motion guard', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /\.mood-control-deck[\s\S]*perspective:/);
  assert.match(css, /\.mood-deck-tilt[\s\S]*rotateX\(var\(--deck-rx\)\)/);
  assert.match(css, /@keyframes moodDeckAuroraDriftA/);
  assert.match(css, /\.mood-control-deck \.mood-deck-orb\[data-selected="true"\]/);
  assert.match(css, /@keyframes moodDeckCtaPulse/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.mood-deck-aurora--a/);
});
