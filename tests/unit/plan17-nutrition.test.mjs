import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  searchFood,
  lookupBarcode,
  getFodmapStatus,
  getFodmapWarning,
  countHighFodmapDays,
  calculateMacrosForServing,
  macroPercentages,
  aggregateDailyMacros,
  buildMealPhotoMetadata,
  MEAL_PHOTO_CATEGORY,
} from '@rianell/shared';
import { detectFoodSensitivities } from '@rianell/ai-engine';

const root = join(import.meta.dirname, '..', '..');

test('searchFood returns mapped nutrients from Open Food Facts', async () => {
  const mockFetch = async () => ({
    ok: true,
    async json() {
      return {
        products: [
          {
            code: '4011',
            product_name: 'Banana',
            brands: 'Fresh',
            nutriments: {
              'energy-kcal_100g': 89,
              proteins_100g: 1.1,
              carbohydrates_100g: 23,
              fat_100g: 0.3,
              fiber_100g: 2.6,
            },
          },
        ],
      };
    },
  });
  const results = await searchFood('banana', 1, mockFetch);
  assert.equal(results.length, 1);
  assert.equal(results[0].name, 'Banana');
  assert.equal(results[0].barcode, '4011');
  assert.equal(results[0].nutrients.energy_kcal, 89);
  assert.equal(results[0].nutrients.proteins_g, 1.1);
});

test('lookupBarcode is alias for fetchOpenFoodFactsProduct', () => {
  assert.equal(typeof lookupBarcode, 'function');
});

test('getFodmapStatus classifies banana as low', () => {
  assert.equal(getFodmapStatus('banana'), 'low');
  assert.equal(getFodmapWarning('high'), 'wizard.food.fodmap.high');
});

test('calculateMacrosForServing scales per 100g nutrients', () => {
  const macros = calculateMacrosForServing(
    { nutrients: { proteins_g: 10, carbohydrates_g: 20, fat_g: 5, fiber_g: 2, energy_kcal: 200 } },
    50,
  );
  assert.equal(macros.protein_g, 5);
  assert.equal(macros.carbs_g, 10);
  const pct = macroPercentages(macros);
  assert.ok(pct.protein + pct.carbs + pct.fat <= 100);
});

test('detectFoodSensitivities returns array for sufficient logs', () => {
  const logs = Array.from({ length: 10 }, (_, i) => ({
    date: `2026-06-${String(i + 1).padStart(2, '0')}`,
    mood: 3,
    fatigue: 8,
    pain: 7,
    food: { breakfast: [{ name: 'onion' }], lunch: [], dinner: [], snack: [] },
  }));
  const suspects = detectFoodSensitivities(logs);
  assert.ok(Array.isArray(suspects));
});

test('PWA food search UI is wired', () => {
  const html = readFileSync(join(root, 'apps/pwa-webapp/index.html'), 'utf8');
  const js = readFileSync(join(root, 'apps/pwa-webapp/app.js'), 'utf8');
  assert.match(html, /foodSearchInput/);
  assert.match(js, /bindFoodSearchUi/);
  assert.match(js, /bindMealPhotoUi/);
});

test('meal photo metadata uses food category', () => {
  assert.equal(buildMealPhotoMetadata().category, MEAL_PHOTO_CATEGORY);
});

test('countHighFodmapDays detects high-FODMAP meals', () => {
  const days = countHighFodmapDays([
    { food: { breakfast: [{ name: 'garlic bread' }], lunch: [], dinner: [], snack: [] } },
  ]);
  assert.equal(days, 1);
});

test('aggregateDailyMacros sums log food macros', () => {
  const total = aggregateDailyMacros({
    food: {
      breakfast: [{ macros: { kcal: 100, protein_g: 5, carbs_g: 10, fat_g: 3, fiber_g: 1 } }],
      lunch: [],
      dinner: [],
      snack: [],
    },
  });
  assert.equal(total.kcal, 100);
});
