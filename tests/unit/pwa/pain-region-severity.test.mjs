import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const js = readFileSync('apps/pwa-webapp/app.js', 'utf8');
const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');

test('pain body region helpers keep painLocation text contract', () => {
  assert.match(js, /function getPainLocationTextFromState/);
  assert.match(js, /function setPainBodyRegionLevel/);
  assert.match(js, /function renderSymptomsRegionSeverity/);
  assert.match(js, /hidden\.value = getPainLocationTextFromState\(state\)/);
  assert.match(js, /Math\.max\(0, Math\.min\(2,/);
});

test('resetPainBodyDiagram clears state used by region severity UI', () => {
  assert.match(js, /function resetPainBodyDiagram/);
  assert.match(js, /renderSymptomsRegionSeverity\(containerId\)/);
  assert.match(js, /painBodyStates\[containerId\]\[r\.id\] = 0/);
});

test('region severity buttons expose data-level for CSS colour coding', () => {
  assert.match(js, /btn\.setAttribute\('data-level', String\(lvl\)\)/);
});

test('region severity scale is a fixed 3-up segmented control, not a scroller', () => {
  // Scoped selector must beat the generic .segmented-scale so it never scrolls.
  assert.match(
    css,
    /\.symptoms-region-severity \.symptoms-region-severity__scale[\s\S]*grid-template-columns: repeat\(3, 1fr\)/,
  );
  assert.match(
    css,
    /\.symptoms-region-severity \.symptoms-region-severity__scale[\s\S]*overflow: visible/,
  );
});

test('region severity active pills are colour-coded by level', () => {
  assert.match(
    css,
    /\.segmented-scale__btn\[data-level="1"\]\.is-active[\s\S]*--color-warning/,
  );
  assert.match(
    css,
    /\.segmented-scale__btn\[data-level="2"\]\.is-active[\s\S]*--color-danger/,
  );
});
