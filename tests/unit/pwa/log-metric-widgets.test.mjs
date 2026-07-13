import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('swelling widget uses pin-anchored balloon SVG tied to slider value', () => {
  const js = readFileSync('apps/pwa-webapp/modules/log-metric-widgets.js', 'utf8');
  assert.match(js, /case 'swelling':[\s\S]*metric-balloon-body/);
  assert.match(js, /metric-balloon-pin/);
  assert.match(js, /metric-balloon-face/);
  assert.match(js, /metric-balloon-glow/);
  assert.match(js, /metric-svg--swelling-balloon/);
  assert.match(js, /BALLOON_SCALE_LOW/);
  assert.match(js, /updateSwellingBalloon/);
  assert.doesNotMatch(js, /metric-knee-femur/);
  assert.doesNotMatch(js, /metric-balloon-knot/);
});

test('swelling visual state scales balloon from pin anchor by raw severity', () => {
  const js = readFileSync('apps/pwa-webapp/modules/log-metric-widgets.js', 'utf8');
  assert.match(js, /function applySwellingVisual/);
  assert.match(js, /balloonScaleForValue/);
  assert.match(js, /updateBalloonFace/);
  assert.match(js, /data-swelling-level/);
  assert.match(js, /ratio\(parseInt\(rawValue, 10\) \|\| 5, 1, 10\)/);
  assert.match(js, /--metric-balloon-pulse-dur/);
  assert.match(js, /--balloon-sx/);
});

test('swelling widget keeps balloon art inside bounds in light mode CSS', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /\.metric-widget--swelling \.metric-widget__visual[\s\S]*overflow: visible/);
  assert.match(css, /body\.light-mode \.metric-widget--swelling \.metric-balloon-pin/);
  assert.match(css, /data-swelling-level="low"/);
  assert.match(css, /data-swelling-level="mid"/);
  assert.match(css, /data-swelling-level="high"/);
  assert.doesNotMatch(css, /metric-knee-swell-ring/);
});

test('swelling balloon animation uses float and breathe keyframes', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /@keyframes metricBalloonBreathe[\s\S]*scale/);
  assert.match(css, /@keyframes metricBalloonFloat/);
  assert.match(css, /\.metric-balloon-body-group/);
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
  assert.match(js, /metric-mobility-air-shadow/);
  assert.match(js, /function applyMobilityBounce/);
  assert.match(js, /--mobility-bounce-peak/);
  assert.match(js, /data-mobility-level/);
  assert.doesNotMatch(js, /metric-mobility-rim/);
  assert.match(js, /metric-mobility-mat-wrap/);
  assert.match(js, /metric-mobility-mat/);
  assert.doesNotMatch(js, /--mobility-bounce-dur/);
  assert.doesNotMatch(js, /metric-mobility-mat.*setAttribute/);
  assert.doesNotMatch(js, /metric-mobility-walker/);
});

test('mobility trampoline animation uses reference-frame bounce cycle', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /@keyframes metricMobilityBounce[\s\S]*--mobility-bounce-peak/);
  assert.match(css, /metricMobilityMatSquash/);
  assert.match(css, /metricMobilityAirShadow/);
  assert.match(css, /\.metric-mobility-jumper-anchor/);
  assert.match(css, /\.metric-widget--mobility \.metric-mobility-jumper/);
  assert.match(css, /data-mobility-level="low"/);
  assert.match(css, /--mobility-mat-compress/);
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
