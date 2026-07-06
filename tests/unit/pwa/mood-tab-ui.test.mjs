import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('mood-tab uses compact history ribbon without duplicating latest', () => {
  const js = readFileSync('apps/pwa-webapp/modules/mood-tab.js', 'utf8');
  assert.match(js, /function renderMoodReadingCard/);
  assert.match(js, /history = ordered\.length > 1 \? ordered\.slice\(0, -1\)/);
  assert.match(js, /mood-reading-card--compact/);
  assert.match(js, /renderMoodUniformStreak/);
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
  assert.match(js, /addEventListener\('click'/);
  assert.doesNotMatch(js, /_checkinDragMoved/);
});

test('mood deck tile icons inherit stroke/fill token rules', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /\.mood-deck-tile-icon-svg \*,[\s\S]*stroke: currentColor/);
  assert.match(css, /\.mood-deck-tile-icon-svg \.icon-fill[\s\S]*fill: currentColor/);
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
