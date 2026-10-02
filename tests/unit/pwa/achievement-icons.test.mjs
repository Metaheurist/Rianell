import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readAppSource } from '../../../scripts/lib/app-source.mjs';

test('app.js uses dedicated achievement icon renderer', () => {
  const js = readAppSource();
  assert.match(js, /GP\.renderAchievementIconHTML\(s\.id/);
});

test('achievement icons cover all badge IDs', () => {
  const js = readFileSync('apps/pwa-webapp/modules/graphics-portfolio.js', 'utf8');
  const ids = [
    'food_logging', 'exercise_logging', 'medication_logging',
    'milestone_3', 'milestone_30', 'milestone_60', 'milestone_90', 'milestone_180',
    'sleep_pioneer', 'cycle_tracker', 'full_logger',
  ];
  ids.forEach((id) => {
    assert.match(js, new RegExp("case '" + id + "':"), 'missing icon case: ' + id);
    assert.match(js, new RegExp('ach-icon--' + id));
  });
  assert.match(js, /ach-pill-spin/);
  assert.match(readFileSync('apps/pwa-webapp/css/graphics-portfolio.css', 'utf8'), /achPillSpin/);
  const css = readFileSync('apps/pwa-webapp/css/graphics-portfolio.css', 'utf8');
  assert.match(css, /\.ach-icon--milestone_3 \.ach-book-cover--left[\s\S]*achBookOpenSelfLeft/);
  assert.match(css, /\.ach-icon--milestone_3 \.ach-book-cover--right[\s\S]*achBookOpenSelfRight/);
  assert.match(css, /achBookPageTurn/);
  assert.match(css, /achBookShadowBreathe/);
});
