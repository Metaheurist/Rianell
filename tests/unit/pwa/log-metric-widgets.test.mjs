import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('swelling widget uses side-view knee SVG with scalable joint fluid', () => {
  const js = readFileSync('apps/pwa-webapp/modules/log-metric-widgets.js', 'utf8');
  assert.match(js, /case 'swelling':[\s\S]*metric-knee-femur/);
  assert.match(js, /metric-knee-tibia/);
  assert.match(js, /metric-knee-patella/);
  assert.match(js, /metric-knee-swell-group/);
  assert.match(js, /metric-knee-swell-group[\s\S]*metric-knee-bones/);
  assert.doesNotMatch(js, /metric-swell-bone-h/);
  assert.doesNotMatch(js, /metric-knee-swell-ring/);
});

test('swelling visual state scales knee joint fluid from raw severity', () => {
  const js = readFileSync('apps/pwa-webapp/modules/log-metric-widgets.js', 'utf8');
  assert.match(js, /function applySwellingVisual/);
  assert.match(js, /fluidRx = 3\.8 \+ r \* 8\.2/);
  assert.match(js, /data-swelling-level/);
  assert.match(js, /ratio\(parseInt\(rawValue, 10\) \|\| 5, 1, 10\)/);
});

test('swelling widget keeps knee art inside bounds in light mode CSS', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /\.metric-widget--swelling \.metric-widget__visual[\s\S]*overflow: visible/);
  assert.match(css, /body\.light-mode \.metric-widget--swelling \.metric-knee-bones/);
  assert.match(css, /data-swelling-level="low"/);
  assert.doesNotMatch(css, /metric-knee-swell-ring/);
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

test('mobility widget uses trampoline stick-figure bounce tied to score', () => {
  const js = readFileSync('apps/pwa-webapp/modules/log-metric-widgets.js', 'utf8');
  assert.match(js, /case 'mobility':[\s\S]*metric-mobility-trampoline/);
  assert.match(js, /metric-mobility-jumper/);
  assert.match(js, /function applyMobilityBounce/);
  assert.match(js, /--mobility-bounce-y/);
  assert.doesNotMatch(js, /metric-mobility-walker/);
});

test('mobility trampoline animation styles scale height and speed via CSS vars', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /@keyframes metricMobilityBounce[\s\S]*var\(--mobility-bounce-y/);
  assert.match(css, /metricMobilityMatSquash/);
  assert.match(css, /\.metric-mobility-jumper/);
});

test('weather sensitivity widget fades cloud and reveals sun at high wellness', () => {
  const js = readFileSync('apps/pwa-webapp/modules/log-metric-widgets.js', 'utf8');
  assert.match(js, /case 'weather':[\s\S]*metric-weather-sun/);
  assert.match(js, /function applyWeatherVisual/);
  assert.match(js, /sunStrength = clamp\(\(w - 7\) \/ 3/);
  assert.match(js, /cloudOpacity = clamp\(\(9 - w\) \/ 4/);
  assert.match(js, /data-weather-sun/);
});

test('weather sun shine animations use glow and ray keyframes', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /@keyframes metricWeatherSunGlow/);
  assert.match(css, /@keyframes metricWeatherSunRays/);
  assert.match(css, /\[data-weather-sun="on"\] \.metric-weather-sun-rays/);
});
