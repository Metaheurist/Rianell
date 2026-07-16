import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const js = readFileSync('apps/pwa-webapp/modules/segmented-scale-input.js', 'utf8');
const widgets = readFileSync('apps/pwa-webapp/modules/log-metric-widgets.js', 'utf8');
const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');

test('RianellSegmentedScale mounts radiogroup pills and syncs range input', () => {
  assert.match(js, /global\.RianellSegmentedScale/);
  assert.match(js, /role',\s*'radiogroup'|role",\s*"radiogroup"/);
  assert.match(js, /segmented-scale__btn/);
  assert.match(js, /function mount\(/);
  assert.match(js, /dispatchEvent\(new Event\('input'/);
});

test('log-metric-widgets mounts compact drums instead of segmented pills', () => {
  assert.match(widgets, /metric-drum-shell|vital-drum-shell--compact/);
  assert.match(widgets, /bindMetricDrum|RianellDrumPicker/);
  assert.doesNotMatch(widgets, /RianellSegmentedScale\.mount/);
});

test('segmented scale CSS enforces 44px touch targets and hides native range', () => {
  assert.match(css, /\.segmented-scale__btn[\s\S]*min-width:\s*44px/);
  assert.match(css, /\.segmented-scale__btn[\s\S]*min-height:\s*44px/);
  assert.match(css, /\.segmented-scale__native/);
  assert.match(css, /\.ui-card/);
  assert.match(css, /\.ui-accordion/);
});

test('index.html loads segmented-scale-input before log-metric-widgets', () => {
  const seg = html.indexOf('modules/segmented-scale-input.js');
  const met = html.indexOf('modules/log-metric-widgets.js');
  assert.ok(seg > 0 && met > seg);
});
