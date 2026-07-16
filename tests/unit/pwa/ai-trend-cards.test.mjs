import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('app.js renders enriched AI trend metric cards', () => {
  const js = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(js, /function buildAITrendSparklineSvg/);
  assert.match(js, /function aiTrendMetricEntityId/);
  assert.match(js, /function renderAITrendCardHtml/);
  assert.match(js, /wrapAIChapter\('trends', 'ai\.chapter\.trends', 'trends-vitals'/);
  assert.match(js, /ai-trend-card--metric/);
  assert.match(js, /ai-trend-chart/);
  assert.match(js, /ai-trend-stats-row/);
  assert.match(js, /function renderAITrendStatValue/);
  assert.match(js, /ai-trend-stat__num/);
  assert.match(js, /data-metric="/);
  assert.doesNotMatch(js, /border-left-color:/);
  assert.doesNotMatch(js, /style="color:' \+ trendColor/);
});

test('styles.css defines trend sparkline and status surfaces', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /\.ai-trend-sparkline/);
  assert.match(css, /\.ai-trend-chart/);
  assert.match(css, /\.ai-trend-card--improving/);
  assert.match(css, /\.ai-trend-card--worsening/);
  assert.match(css, /\.ai-trend-card--stable/);
  assert.match(css, /\.ai-trend-metric-icon/);
  assert.match(css, /body\.light-mode \.ai-trend-metric-icon/);
  assert.match(css, /body\.light-mode \.ai-trend-card--stable/);
  assert.match(css, /icon-trends-vitals|trends-vitals-heart-pulse/);
  assert.match(css, /\.ai-chapter--trends \.ai-chapter-header \.ai-inline-icon/);
  assert.match(css, /\.ai-trend-status-chip/);
  assert.match(css, /white-space:\s*nowrap/);
  assert.doesNotMatch(css, /\.ai-trend-card--metric \.ai-trend-status-chip[\s\S]{0,120}max-width:\s*48%/);
  assert.match(css, /\.ai-trend-stat__unit/);
  assert.doesNotMatch(css, /border-left: 4px solid #e91e63/);
});
