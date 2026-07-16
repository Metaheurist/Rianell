import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
const js = readFileSync('apps/pwa-webapp/app.js', 'utf8');
const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
const handlers = readFileSync('apps/pwa-webapp/event-handlers.js', 'utf8');

test('logs filter uses Charts-parity View Range slider', () => {
  assert.match(html, /id="logFilterBar"/);
  assert.match(html, /id="logRangeSlider"/);
  assert.match(html, /id="logRangeSliderGroup"/);
  assert.match(html, /id="logSortToggle"/);
  assert.match(html, /id="logFilterCustom"/);
  assert.match(html, /id="startDate"/);
  assert.match(html, /id="endDate"/);
  assert.match(html, /max="4"/);
  assert.match(html, /data-i18n="common\.view\.range"/);
  assert.match(handlers, /logValues = \[1, 7, 30, 90, 'custom'\]/);
  assert.match(js, /logRangeSlider:\s*\[1, 7, 30, 90, 'custom'\]/);
});

test('log entries have summary line and Physical/Lifestyle/Mental carousel panes', () => {
  assert.match(js, /function buildLogEntrySummaryLine/);
  assert.match(js, /log-detail-carousel/);
  assert.match(js, /log-detail-pane--physical/);
  assert.match(js, /log-detail-pane--lifestyle/);
  assert.match(js, /log-detail-pane--mental/);
  assert.match(js, /data-log-pane="physical"/);
  assert.match(js, /data-log-pane="lifestyle"/);
  assert.match(js, /data-log-pane="mental"/);
  assert.match(js, /function wireLogDetailTabs/);
  assert.match(js, /common\.expand\.details/);
});

test('log filter helpers preserve setLogViewRange and sort order', () => {
  assert.match(js, /function setLogFilterMode/);
  assert.match(js, /function setLogViewRangeAll/);
  assert.match(js, /function bindLogFilterBarOnce/);
  assert.match(js, /setLogViewRange\(7\)/);
  assert.match(js, /updateLogSortToggleUi/);
});

test('Phase 3 logs/mood CSS utilities exist', () => {
  assert.match(css, /\.log-filter-custom/);
  assert.match(css, /\.log-sort-toggle/);
  assert.match(css, /\.log-detail-carousel/);
  assert.match(css, /\.log-detail-pane__bar/);
  assert.match(css, /\.log-detail-dot/);
  assert.match(css, /\.mood-heatmap__grid/);
  assert.match(css, /\.range-slider-group/);
});
