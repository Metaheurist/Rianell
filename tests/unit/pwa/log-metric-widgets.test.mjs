import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('swelling widget uses morphing balloon SVG tied to slider value', () => {
  const js = readFileSync('apps/pwa-webapp/modules/log-metric-widgets.js', 'utf8');
  assert.match(js, /case 'swelling':[\s\S]*metric-balloon-body/);
  assert.match(js, /metric-balloon-knot/);
  assert.match(js, /metric-balloon-neck/);
  assert.match(js, /metric-balloon-string/);
  assert.match(js, /metric-svg--swelling-balloon/);
  assert.match(js, /BALLOON_BODY_DEFLATED/);
  assert.match(js, /updateSwellingBalloon/);
  assert.doesNotMatch(js, /metric-knee-femur/);
  assert.doesNotMatch(js, /metric-knee-swell-group/);
});

test('swelling visual state morphs balloon body from raw severity', () => {
  const js = readFileSync('apps/pwa-webapp/modules/log-metric-widgets.js', 'utf8');
  assert.match(js, /function applySwellingVisual/);
  assert.match(js, /balloonShapeForValue/);
  assert.match(js, /data-swelling-level/);
  assert.match(js, /ratio\(parseInt\(rawValue, 10\) \|\| 5, 1, 10\)/);
  assert.match(js, /--metric-balloon-pulse-dur/);
});

test('swelling widget keeps balloon art inside bounds in light mode CSS', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /\.metric-widget--swelling \.metric-widget__visual[\s\S]*overflow: visible/);
  assert.match(css, /body\.light-mode \.metric-widget--swelling \.metric-balloon-knot/);
  assert.match(css, /data-swelling-level="mid"/);
  assert.match(css, /data-swelling-level="high"/);
  assert.doesNotMatch(css, /metric-knee-swell-ring/);
});

test('swelling balloon animation styles use opacity pulse on body', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /@keyframes metricBalloonPulse[\s\S]*opacity/);
  assert.match(css, /\.metric-balloon-body/);
  assert.match(css, /--metric-balloon-glow/);
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
  assert.match(js, /metric-mobility-jumper-anchor/);
  assert.match(js, /metric-mobility-jumper/);
  assert.match(js, /function applyMobilityBounce/);
  assert.match(js, /--mobility-bounce-y/);
  assert.doesNotMatch(js, /metric-mobility-walker/);
});

test('mobility trampoline animation styles use phase-aligned bounce and mat squash', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /@keyframes metricMobilityBounce[\s\S]*translateY\(-30px\)/);
  assert.match(css, /metricMobilityMatSquash/);
  assert.match(css, /\.metric-mobility-jumper-anchor/);
  assert.match(css, /\.metric-widget--mobility \.metric-mobility-jumper/);
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
