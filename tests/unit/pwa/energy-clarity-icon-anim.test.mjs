import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const js = readFileSync('apps/pwa-webapp/app.js', 'utf8');
const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');

test('energy clarity tiles map each option to an icon animation class', () => {
  assert.match(js, /ENERGY_CLARITY_ICON_ANIM/);
  assert.match(js, /'High Energy': 'energy-clarity-icon--zap'/);
  assert.match(js, /'Mental Clarity': 'energy-clarity-icon--glow'/);
  assert.match(js, /'Good Concentration': 'energy-clarity-icon--target'/);
  assert.match(js, /'Focused': 'energy-clarity-icon--lock'/);
  assert.match(js, /'Moderate Energy': 'energy-clarity-icon--breathe'/);
  assert.match(js, /'Low Energy': 'energy-clarity-icon--drain'/);
  assert.match(js, /'Brain Fog': 'energy-clarity-icon--drift'/);
  assert.match(js, /'Poor Concentration': 'energy-clarity-icon--sparkle'/);
  assert.match(js, /'Mental Fatigue': 'energy-clarity-icon--throb'/);
  assert.match(js, /'Distracted': 'energy-clarity-icon--scatter'/);
  assert.match(js, /animClass \? ' ' \+ animClass : ''/);
});

test('energy clarity icon animations respect reduced motion', () => {
  assert.match(css, /@keyframes energyClarityZap/);
  assert.match(css, /@keyframes energyClarityGlow/);
  assert.match(css, /@keyframes energyClarityScatter/);
  assert.match(css, /\.energy-clarity-icon--zap i/);
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*\.energy-clarity-chip-icon i[\s\S]*animation:\s*none/);
});
