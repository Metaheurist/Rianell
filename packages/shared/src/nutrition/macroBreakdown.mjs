/** Plan 17 NU4 — per-serving macro calculation from per-100g nutrients. */

/**
 * @param {{ nutrients?: { energy_kcal?: number, proteins_g?: number, carbohydrates_g?: number, fat_g?: number, fiber_g?: number } }} food
 * @param {number} servingGrams — grams consumed (default 100)
 */
export function calculateMacrosForServing(food, servingGrams = 100) {
  const g = Math.max(0, Number(servingGrams) || 100);
  const factor = g / 100;
  const n = food?.nutrients && typeof food.nutrients === 'object' ? food.nutrients : {};
  const protein_g = round1((n.proteins_g ?? 0) * factor);
  const carbs_g = round1((n.carbohydrates_g ?? 0) * factor);
  const fat_g = round1((n.fat_g ?? 0) * factor);
  const fiber_g = round1((n.fiber_g ?? 0) * factor);
  const kcalFromNutrients = (n.energy_kcal ?? 0) * factor;
  const kcalFromMacros = protein_g * 4 + carbs_g * 4 + fat_g * 9;
  const kcal = round1(kcalFromNutrients > 0 ? kcalFromNutrients : kcalFromMacros);
  return { kcal, protein_g, carbs_g, fat_g, fiber_g };
}

/** Macro calories as % of total (for bar chart UI). */
export function macroPercentages(macros) {
  const p = (macros?.protein_g ?? 0) * 4;
  const c = (macros?.carbs_g ?? 0) * 4;
  const f = (macros?.fat_g ?? 0) * 9;
  const total = p + c + f;
  if (total <= 0) return { protein: 0, carbs: 0, fat: 0 };
  return {
    protein: Math.round((p / total) * 100),
    carbs: Math.round((c / total) * 100),
    fat: Math.round((f / total) * 100),
  };
}

/** Aggregate daily macros from log food entries. */
export function aggregateDailyMacros(log) {
  const totals = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
  const food = log?.food;
  if (!food || typeof food !== 'object') return totals;
  for (const meal of ['breakfast', 'lunch', 'dinner', 'snack']) {
    const items = food[meal];
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (!item || typeof item !== 'object' || !item.macros) continue;
      const m = item.macros;
      totals.kcal += Number(m.kcal) || 0;
      totals.protein_g += Number(m.protein_g) || 0;
      totals.carbs_g += Number(m.carbs_g) || 0;
      totals.fat_g += Number(m.fat_g) || 0;
      totals.fiber_g += Number(m.fiber_g) || 0;
    }
  }
  return {
    kcal: round1(totals.kcal),
    protein_g: round1(totals.protein_g),
    carbs_g: round1(totals.carbs_g),
    fat_g: round1(totals.fat_g),
    fiber_g: round1(totals.fiber_g),
  };
}

function round1(n) {
  return Math.round(n * 10) / 10;
}
