/** Plan 04 L2 — one-tap favorite meals, exercises, med combos. */

const MAX_FAVORITES = 24;

function normalizeFavoriteItem(value, maxLen = 120) {
  if (typeof value !== 'string') return null;
  const s = value.trim().slice(0, maxLen);
  return s || null;
}

function normalizeFavoriteList(raw, maxLen) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const item of raw) {
    const s = normalizeFavoriteItem(item, maxLen);
    if (!s || seen.has(s.toLowerCase())) continue;
    seen.add(s.toLowerCase());
    out.push(s);
    if (out.length >= MAX_FAVORITES) break;
  }
  return out;
}

export function normalizeLogFavorites(value) {
  const v = value && typeof value === 'object' ? value : {};
  return {
    meals: normalizeFavoriteList(v.meals, 200),
    exercises: normalizeFavoriteList(v.exercises, 120),
    medCombos: normalizeFavoriteList(v.medCombos, 200),
  };
}

export function addLogFavorite(favorites, kind, label) {
  const base = normalizeLogFavorites(favorites);
  const key = kind === 'meals' || kind === 'exercises' || kind === 'medCombos' ? kind : null;
  if (!key) return base;
  const s = normalizeFavoriteItem(label);
  if (!s) return base;
  const next = [s, ...base[key].filter((x) => x.toLowerCase() !== s.toLowerCase())].slice(0, MAX_FAVORITES);
  return { ...base, [key]: next };
}
