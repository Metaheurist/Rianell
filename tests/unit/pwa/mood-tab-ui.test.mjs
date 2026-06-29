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
