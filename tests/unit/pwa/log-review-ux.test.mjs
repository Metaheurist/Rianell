import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appPath = path.join(root, 'apps/pwa-webapp/app.js');
const widgetsPath = path.join(root, 'apps/pwa-webapp/modules/log-metric-widgets.js');
const vitalsPath = path.join(root, 'apps/pwa-webapp/modules/advanced-vitals-widgets.js');
const cssPath = path.join(root, 'apps/pwa-webapp/styles.css');

test('severity metrics use High/Low scale hints and raw readout', () => {
  const src = fs.readFileSync(widgetsPath, 'utf8');
  assert.match(src, /data-metric-scale.*severity/);
  assert.match(src, /wizard\.metric\.severity\.high/);
  assert.match(src, /display\.textContent = String\(severity \? raw : wellness\)/);
});

test('buildLogReviewSummaryHtml shows raw severity bars and urgent vitals rows', () => {
  const src = fs.readFileSync(appPath, 'utf8');
  const css = fs.readFileSync(cssPath, 'utf8');
  assert.match(src, /log-review-metric-bar/);
  assert.match(src, /formatReviewMetric/);
  assert.match(src, /log-review-row--urgent/);
  assert.match(src, /classifyReviewGlucose/);
  assert.match(css, /log-review-metric-bar__fill/);
});

test('advanced vitals mark urgent glucose and SpO2 zones', () => {
  const src = fs.readFileSync(vitalsPath, 'utf8');
  const css = fs.readFileSync(cssPath, 'utf8');
  assert.match(src, /data-vital-urgent/);
  assert.match(src, /criticalHigh/);
  assert.match(src, /vital-zone-badge--urgent/);
  assert.match(css, /vitalUrgentPulse/);
});

test('metric stepper buttons meet 44px touch target', () => {
  const css = fs.readFileSync(cssPath, 'utf8');
  assert.match(css, /\.metric-stepper-btn[\s\S]*min-width: 44px/);
  assert.match(css, /\.metric-stepper-btn[\s\S]*min-height: 44px/);
});
