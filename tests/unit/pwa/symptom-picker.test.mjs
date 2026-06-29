import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appPath = path.join(root, 'apps/pwa-webapp/app.js');
const portfolioJs = path.join(root, 'apps/pwa-webapp/modules/graphics-portfolio.js');
const portfolioCss = path.join(root, 'apps/pwa-webapp/css/graphics-portfolio.css');
const i18nPath = path.join(root, 'apps/pwa-webapp/i18n-pwa.js');

test('symptom picker search stores i18n keys with fallbacks', () => {
  const src = fs.readFileSync(appPath, 'utf8');
  assert.match(src, /data-i18n-placeholder-fallback/);
  assert.match(src, /placeholderKey: 'logs\.picker\.filterSymptoms'/);
  assert.match(src, /function refreshTilePickerSearchI18n/);
});

test('symptom chips map icons to motion classes', () => {
  const src = fs.readFileSync(appPath, 'utf8');
  const css = fs.readFileSync(portfolioCss, 'utf8');
  assert.match(src, /SYMPTOM_ICON_ANIM/);
  assert.match(src, /symptom-chip-icon--breathe/);
  assert.match(src, /symptom-chip-icon--spin/);
  assert.match(css, /symptomIconBreathe/);
  assert.match(css, /symptom-chip-icon--heartbeat/);
});

test('graphics portfolio decorates symptom chips with ripple', () => {
  const src = fs.readFileSync(portfolioJs, 'utf8');
  assert.match(src, /function decorateSymptomChips/);
  assert.match(src, /symptom-chip--ripple/);
  assert.match(src, /decorateSymptomChips: decorateSymptomChips/);
});

test('i18n runtime falls back when placeholder key is missing', () => {
  const src = fs.readFileSync(i18nPath, 'utf8');
  assert.match(src, /data-i18n-placeholder-fallback/);
  assert.match(src, /val && val !== key \? val : \(fb \|\| val\)/);
});
