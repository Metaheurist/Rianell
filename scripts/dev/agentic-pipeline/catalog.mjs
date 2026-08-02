import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = path.join(HERE, 'model-catalog.json');

export function loadCatalog() {
  return JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
}

export function getPackEntry(packId, catalog = loadCatalog()) {
  return catalog.packs?.[packId] || null;
}

function modelEstVram(model, packEntry, catalog) {
  const fromModels = catalog.models?.[model]?.estVramGb;
  if (typeof fromModels === 'number') return fromModels;
  return packEntry?.estVramGb ?? 19;
}

/**
 * Resolve pack model. Pass `profileHint` ({ maxModelVramGb, profile }) to downshift
 * recommended models for smaller machines. Explicit `requested` always wins when allowed.
 */
export function resolvePackModel(packId, requested, catalog = loadCatalog(), profileHint = null) {
  const entry = getPackEntry(packId, catalog);
  if (!entry) return { ok: false, error: `unknown pack: ${packId}` };

  if (requested) {
    if (!entry.allowed.includes(requested)) {
      return {
        ok: false,
        error: `model ${requested} not allowed for ${packId}`,
        recommended: entry.recommended,
        allowed: entry.allowed,
      };
    }
    return {
      ok: true,
      model: requested,
      recommended: entry.recommended,
      estVramGb: modelEstVram(requested, entry, catalog),
      exclusiveGroups: entry.exclusiveGroups || [],
      profileRemapped: false,
    };
  }

  const budget = (profileHint && typeof profileHint.maxModelVramGb === 'number')
    ? profileHint.maxModelVramGb
    : Infinity;
  const profileId = profileHint?.effectiveProfile || profileHint?.profile || null;

  const rec = entry.recommended;
  const recV = modelEstVram(rec, entry, catalog);
  if (recV <= budget) {
    return {
      ok: true,
      model: rec,
      recommended: rec,
      estVramGb: recV,
      exclusiveGroups: entry.exclusiveGroups || [],
      profileRemapped: false,
      profileId,
      vramBudgetGb: Number.isFinite(budget) ? budget : null,
    };
  }

  const fits = entry.allowed
    .map((m) => ({ model: m, estVramGb: modelEstVram(m, entry, catalog) }))
    .filter((x) => x.estVramGb <= budget)
    .sort((a, b) => b.estVramGb - a.estVramGb);

  if (fits.length) {
    const pick = fits[0];
    return {
      ok: true,
      model: pick.model,
      recommended: rec,
      estVramGb: pick.estVramGb,
      exclusiveGroups: entry.exclusiveGroups || [],
      profileRemapped: pick.model !== rec,
      profileId,
      vramBudgetGb: budget,
    };
  }

  return {
    ok: true,
    model: rec,
    recommended: rec,
    estVramGb: recV,
    exclusiveGroups: entry.exclusiveGroups || [],
    profileRemapped: false,
    profileTight: true,
    profileId,
    vramBudgetGb: Number.isFinite(budget) ? budget : null,
  };
}

export function runAllOrder(catalog = loadCatalog()) {
  return [...(catalog.runAllOrder || [])];
}

export { CATALOG_PATH };
