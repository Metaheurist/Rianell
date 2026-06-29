import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('app.js renders Things to watch as ranked metric cards', () => {
  const js = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(js, /function renderAIThingsToWatch/);
  assert.match(js, /ai-watch-grid/);
  assert.match(js, /ai-watch-card__bar-fill/);
  assert.doesNotMatch(js, /ai-list ai-list-warning/);
});

test('AIEngine outliers emit structured watch items', () => {
  const js = readFileSync('apps/pwa-webapp/AIEngine.js', 'utf8');
  assert.match(js, /kind: 'outlier'/);
  assert.match(js, /count: outlierCount/);
  assert.doesNotMatch(js, /unusual values detected \(may indicate flare-ups\)`/);
});

test('normalizeAnomalyWatchItem parses legacy outlier strings', () => {
  const js = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(js, /unusual values detected/i);
  assert.match(js, /function normalizeAnomalyWatchItem/);
  assert.match(js, /function anomalyToPlainText/);
});
