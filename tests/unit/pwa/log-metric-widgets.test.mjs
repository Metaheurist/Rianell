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

test('mobility widget uses side-view running legs tied to score cadence', () => {
  const js = readFileSync('apps/pwa-webapp/modules/log-metric-widgets.js', 'utf8');
  assert.match(js, /case 'mobility':[\s\S]*metric-mobility-runner/);
  assert.match(js, /metric-mobility-leg--near/);
  assert.match(js, /metric-mobility-leg--far/);
  assert.match(js, /metric-mobility-thigh/);
  assert.match(js, /metric-mobility-shin/);
  assert.match(js, /function applyMobilityRun/);
  assert.match(js, /--mobility-run-dur/);
  assert.match(js, /data-mobility-level/);
  assert.doesNotMatch(js, /metric-mobility-trampoline/);
  assert.doesNotMatch(js, /metric-mobility-jumper/);
  assert.doesNotMatch(js, /applyMobilityBounce/);
});

test('mobility run animation uses continuous cadence CSS variable', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /@keyframes metricMobilityThighNear/);
  assert.match(css, /@keyframes metricMobilityThighFar/);
  assert.match(css, /@keyframes metricMobilityShinNear/);
  assert.match(css, /@keyframes metricMobilityBob/);
  assert.match(css, /--mobility-run-dur/);
  assert.match(css, /\.metric-mobility-runner/);
  assert.match(css, /data-mobility-level="low"/);
  assert.doesNotMatch(css, /metricMobilityBounce/);
  assert.doesNotMatch(css, /metric-mobility-trampoline/);
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
