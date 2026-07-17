import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('app.js renders modern lifestyle panels', () => {
  const js = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(js, /function renderAILifestyleStatStrip/);
  assert.match(js, /function renderAINutritionPanel/);
  assert.match(js, /function renderAIExercisePanel/);
  assert.match(js, /function buildAIExerciseChartSeries/);
  assert.match(js, /function renderAIHelpfulPatterns/);
  assert.match(js, /ai-lifestyle-stat-strip/);
  assert.match(js, /ai-helpful-card/);
  assert.match(js, /tUiOr\('ai\.helpful\.helps'/);
  assert.match(js, /tUiOr\('ai\.helpful\.withDays'/);
  assert.match(js, /tUiOr\('ai\.helpful\.intro'/);
  assert.match(js, /ai-exercise-timeline__day/);
  assert.match(js, /ai-exercise-timeline__date/);
  assert.match(js, /ai-exercise-chart__yscale/);
  assert.match(js, /ai-exercise-stats/);
  assert.doesNotMatch(js, /border-left-color:' \+ impactColor/);
});

test('helpful impact strings exist in en-GB catalog', () => {
  const en = readFileSync('i18n-packs/locale-packs/v1/en-GB.json', 'utf8');
  assert.match(en, /"ai\.helpful\.intro":/);
  assert.match(en, /"ai\.helpful\.helps": "Helps"/);
  assert.match(en, /"ai\.helpful\.watch": "Watch"/);
  assert.match(en, /"ai\.helpful\.withDays": "With"/);
  assert.match(en, /"ai\.helpful\.withoutDays": "Without"/);
});

test('AI-generated insight and advice copy does not use presentation emoji', () => {
  const engine = readFileSync('apps/pwa-webapp/AIEngine.js', 'utf8');
  assert.doesNotMatch(
    engine,
    /✅|⚠️|🔴|🟡|🛏️|🔥|🏃|🧘|⚡|😊|💧|📋/,
  );
});

test('styles.css defines lifestyle panel layout', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /\.ai-lifestyle-stat-strip/);
  assert.match(css, /\.ai-lifestyle-panel/);
  assert.match(css, /\.ai-helpful-grid/);
  assert.match(css, /\.ai-exercise-timeline__bar--active/);
  assert.match(css, /\.ai-exercise-timeline__date/);
  assert.match(css, /\.ai-exercise-chart__yscale/);
  assert.match(css, /@keyframes aiExerciseBarIn/);
  assert.match(css, /\.ai-helpful-card__stat[\s\S]*?flex-direction:\s*column/);
  assert.match(css, /\.ai-helpful-card__stat-label[\s\S]*?text-overflow:\s*ellipsis/);
});

test('exercise chart buckets long series and sparsifies labels', () => {
  const js = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(js, /var maxBars = 28/);
  assert.match(js, /Math\.ceil\(n \/ 6\)/);
  assert.match(js, /aiExerciseBarIn|ai-exercise-timeline--animate/);
  assert.match(js, /--bar-delay:/);
});