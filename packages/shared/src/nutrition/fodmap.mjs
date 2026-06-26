/** Plan 17 NU2 — curated FODMAP status lookup (Monash-inspired public lists). */

/** @type {Record<string, 'high'|'moderate'|'low'>} */
export const FODMAP_CATEGORIES = {
  apple: 'high',
  apricot: 'high',
  avocado: 'low',
  banana: 'low',
  blackberry: 'high',
  blueberry: 'low',
  bread: 'high',
  broccoli: 'low',
  cabbage: 'high',
  carrot: 'low',
  cauliflower: 'high',
  celery: 'low',
  cheese: 'low',
  chickpea: 'high',
  chocolate: 'moderate',
  coconut: 'low',
  corn: 'low',
  couscous: 'high',
  cucumber: 'low',
  garlic: 'high',
  grape: 'low',
  honey: 'high',
  hummus: 'high',
  lactose: 'high',
  lentil: 'high',
  mango: 'high',
  milk: 'high',
  mushroom: 'high',
  oat: 'low',
  onion: 'high',
  orange: 'low',
  pasta: 'high',
  peach: 'high',
  pear: 'high',
  pineapple: 'low',
  potato: 'low',
  rice: 'low',
  rye: 'high',
  spinach: 'low',
  strawberry: 'low',
  tomato: 'low',
  watermelon: 'high',
  wheat: 'high',
  yogurt: 'moderate',
  beans: 'high',
  cashew: 'high',
  almond: 'low',
  pistachio: 'high',
  sausage: 'high',
  soy: 'moderate',
  tofu: 'low',
  beer: 'high',
  coffee: 'low',
  tea: 'low',
};

const KEYWORD_MAP = Object.entries(FODMAP_CATEGORIES).flatMap(([key, status]) => {
  return [{ pattern: key, status }];
});

function normalizeFoodName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {string} foodName
 * @returns {'high'|'moderate'|'low'|'unknown'}
 */
export function getFodmapStatus(foodName) {
  const norm = normalizeFoodName(foodName);
  if (!norm) return 'unknown';
  if (FODMAP_CATEGORIES[norm]) return FODMAP_CATEGORIES[norm];
  for (const { pattern, status } of KEYWORD_MAP) {
    if (norm.includes(pattern)) return status;
  }
  const first = norm.split(' ')[0];
  if (FODMAP_CATEGORIES[first]) return FODMAP_CATEGORIES[first];
  return 'unknown';
}

/** Returns i18n key for FODMAP badge label. */
export function getFodmapWarning(status) {
  switch (status) {
    case 'high':
      return 'wizard.food.fodmap.high';
    case 'moderate':
      return 'wizard.food.fodmap.moderate';
    case 'low':
      return 'wizard.food.fodmap.low';
    default:
      return '';
  }
}

/** Count days in logs with ≥1 high-FODMAP food (for weekly digest correlation). */
export function countHighFodmapDays(logs) {
  if (!Array.isArray(logs)) return 0;
  let days = 0;
  for (const log of logs) {
    const foods = collectFoodNames(log);
    if (foods.some((f) => getFodmapStatus(f) === 'high')) days += 1;
  }
  return days;
}

function collectFoodNames(log) {
  const names = [];
  const food = log?.food;
  if (!food || typeof food !== 'object') return names;
  for (const meal of ['breakfast', 'lunch', 'dinner', 'snack']) {
    const items = food[meal];
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (typeof item === 'string') names.push(item);
      else if (item && typeof item.name === 'string') names.push(item.name);
    }
  }
  return names;
}
