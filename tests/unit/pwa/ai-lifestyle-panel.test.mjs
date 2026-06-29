import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('app.js renders modern lifestyle panels', () => {
  const js = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(js, /function renderAILifestyleStatStrip/);
  assert.match(js, /function renderAINutritionPanel/);
  assert.match(js, /function renderAIExercisePanel/);
  assert.match(js, /function renderAIHelpfulPatterns/);
  assert.match(js, /ai-lifestyle-stat-strip/);
  assert.match(js, /ai-helpful-card/);
  assert.doesNotMatch(js, /border-left-color:' \+ impactColor/);
});

test('styles.css defines lifestyle panel layout', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /\.ai-lifestyle-stat-strip/);
  assert.match(css, /\.ai-lifestyle-panel/);
  assert.match(css, /\.ai-helpful-grid/);
  assert.match(css, /\.ai-exercise-timeline__bar--active/);
});
