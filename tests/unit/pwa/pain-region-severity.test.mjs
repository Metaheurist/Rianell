import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const js = readFileSync('apps/pwa-webapp/app.js', 'utf8');

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
