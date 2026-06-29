import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('swelling widget uses side-view knee SVG with scalable joint fluid', () => {
  const js = readFileSync('apps/pwa-webapp/modules/log-metric-widgets.js', 'utf8');
  assert.match(js, /case 'swelling':[\s\S]*metric-knee-femur/);
  assert.match(js, /metric-knee-tibia/);
  assert.match(js, /metric-knee-patella/);
  assert.match(js, /metric-knee-swell-group/);
  assert.doesNotMatch(js, /metric-swell-bone-h/);
});

test('swelling visual state scales knee joint group from slider severity', () => {
  const js = readFileSync('apps/pwa-webapp/modules/log-metric-widgets.js', 'utf8');
  assert.match(js, /kind === 'swelling'[\s\S]*metric-knee-swell-group/);
  assert.match(js, /swellScale = 1 \+ r \* 0\.95/);
  assert.match(js, /metric-knee-patella/);
});

test('swelling knee animation styles use transform-only pulse', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /@keyframes metricKneeSwellPulse[\s\S]*transform: scale/);
  assert.match(css, /\.metric-knee-swell-fluid/);
  assert.doesNotMatch(css, /metric-swell-fluid/);
});

test('irritability widget uses chill face and escaping thought cloud SVG', () => {
  const js = readFileSync('apps/pwa-webapp/modules/log-metric-widgets.js', 'utf8');
  assert.match(js, /case 'irritability':[\s\S]*metric-svg--irritability/);
  assert.match(js, /metric-irrit-shades/);
  assert.match(js, /metric-irrit-thought/);
  assert.match(js, /metric-irrit-escape-burst/);
  assert.match(js, /function updateIrritabilityVisual/);
  assert.doesNotMatch(js, /metric-svg--ocean/);
});
