import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');

test('food and exercise tiles use staggered entrance motion', () => {
  assert.match(css, /@keyframes pickerTileIn/);
  assert.match(css, /button\.food-chip,\s*button\.exercise-chip\s*\{[\s\S]*?animation:\s*pickerTileIn/);
  assert.match(css, /\.food-chips > \.food-chip:nth-child\(1\)/);
  assert.match(css, /\.exercise-chips > \.exercise-chip:nth-child\(n\+13\)/);
  assert.match(css, /@keyframes pickerChipSelectIn/);
  assert.match(css, /\.picker-chip--selected \.picker-chip-check:not\(:empty\)[\s\S]*?pickerChipSelectIn/);
});

test('food and exercise tile motion respects reduced motion', () => {
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?button\.food-chip,[\s\S]*?button\.exercise-chip[\s\S]*?animation:\s*none\s*!important/,
  );
  assert.match(css, /body\.reduce-motion button\.food-chip/);
  assert.match(css, /body\.reduce-motion button\.exercise-chip/);
});
