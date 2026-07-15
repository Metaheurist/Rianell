import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
const js = readFileSync('apps/pwa-webapp/app.js', 'utf8');
const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');

test('logs Phase 3 filter bar has All/7D/30D/Custom pills', () => {
  assert.match(html, /id="logFilterBar"/);
  assert.match(html, /data-log-range="all"/);
  assert.match(html, /data-log-range="7"/);
  assert.match(html, /data-log-range="30"/);
  assert.match(html, /data-log-range="custom"/);
  assert.match(html, /id="logSortToggle"/);
  assert.match(html, /id="logFilterCustom"/);
  assert.match(html, /id="logRangeSlider"/);
});

test('log entries have summary line and Physical/Lifestyle/Mental tabs', () => {
  assert.match(js, /function buildLogEntrySummaryLine/);
  assert.match(js, /log-detail-tabs/);
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
  assert.match(css, /\.log-filter-bar/);
  assert.match(css, /\.log-filter-pill\.is-active/);
  assert.match(css, /\.log-detail-tab/);
  assert.match(css, /\.mood-heatmap__grid/);
});
