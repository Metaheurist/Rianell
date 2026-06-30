import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const carouselPath = path.join(root, 'apps/pwa-webapp/modules/goals-carousel.js');
const htmlPath = path.join(root, 'apps/pwa-webapp/index.html');

test('goals-carousel.js is plain-script IIFE (not ES module export)', () => {
  const src = fs.readFileSync(carouselPath, 'utf8');
  assert.match(src, /\(function \(global\)/);
  assert.doesNotMatch(src, /^\s*export\s/m);
  assert.match(src, /global\.goalsCarouselGo/);
});

test('index.html loads goals-carousel without type=module', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.match(html, /modules\/goals-carousel\.js\?v=/);
  assert.doesNotMatch(html, /goals-carousel\.js[^"']*" type="module"/);
});

test('goals-carousel.js resolves i18n via RianellI18n.t', () => {
  const src = fs.readFileSync(carouselPath, 'utf8');
  assert.match(src, /RianellI18n\.t/);
  assert.match(src, /refreshGoalsCarouselI18n/);
  assert.match(src, /scheduleGoalsCarouselHeightSync/);
  assert.match(src, /syncGoalsCarouselViewportHeight/);
});

test('goals-carousel dot icons use inline animated SVG markup', () => {
  const src = fs.readFileSync(carouselPath, 'utf8');
  const css = fs.readFileSync(path.join(root, 'apps/pwa-webapp/styles.css'), 'utf8');
  assert.match(src, /ui-svg-icon goals-dot-icon-svg/);
  assert.match(src, /goals-icon-target-ring--mid/);
  assert.match(src, /goals-icon-fill/);
  assert.match(src, /data-goals-dot-icon/);
  assert.match(src, /goals-carousel-dot__icon/);
  assert.match(css, /goalsTargetRingMid/);
  assert.match(css, /\.goals-dot-icon-svg \.goals-icon-fill/);
});

test('cycle-tracking-ui uses unified 45-day timeline and period-start anchor', () => {
  const cyclePath = path.join(root, 'apps/pwa-webapp/modules/cycle-tracking-ui.js');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const src = fs.readFileSync(cyclePath, 'utf8');
  assert.match(html, /logCyclePeriodStartBtn/);
  assert.match(html, /logCyclePeriodStartFlag/);
  assert.match(html, /logCycleTimelineInner/);
  assert.match(src, /PHASE_RANGES/);
  assert.match(src, /buildTimeline/);
  assert.match(src, /markPeriodStartedToday/);
  assert.match(src, /RianellI18n\.t/);
  assert.match(src, /isInteractiveTarget/);
  assert.match(src, /DRAG_THRESHOLD_PX/);
});

test('cycle beacon decoration removes stale selection rings', () => {
  const portfolioPath = path.join(root, 'apps/pwa-webapp/modules/graphics-portfolio.js');
  const src = fs.readFileSync(portfolioPath, 'utf8');
  assert.match(src, /function decorateCycleBeacon/);
  assert.match(src, /cycle-day-beacon[\s\S]*remove\(\)/);
});
