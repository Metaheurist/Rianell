/** Plan 13 — numeric-only facets for k-anonymous pool aggregation (no PII). */

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function flareToBit(flare) {
  if (flare === 'Yes' || flare === true || flare === 1) return 1;
  if (flare === 'No' || flare === false || flare === 0) return 0;
  return null;
}

export function buildResearchFacetsFromLog(log) {
  if (!log?.date || !/^\d{4}-\d{2}-\d{2}$/.test(String(log.date))) return null;
  const out = { date: String(log.date) };
  const sleep = num(log.sleep);
  const fatigue = num(log.fatigue);
  const mood = num(log.mood);
  const flare = flareToBit(log.flare);
  if (sleep != null) out.sleep = sleep;
  if (fatigue != null) out.fatigue = fatigue;
  if (mood != null) out.mood = mood;
  if (flare != null) out.flare = flare;
  if (Object.keys(out).length <= 1) return null;
  return out;
}

export function validateResearchFacets(facets) {
  if (!facets || typeof facets !== 'object') return false;
  if (!facets.date || !/^\d{4}-\d{2}-\d{2}$/.test(String(facets.date))) return false;
  for (const key of Object.keys(facets)) {
    if (key === 'date') continue;
    if (key === 'flare') {
      if (facets.flare !== 0 && facets.flare !== 1) return false;
      continue;
    }
    const n = num(facets[key]);
    if (n == null || n < 0 || n > 10) return false;
  }
  return true;
}
