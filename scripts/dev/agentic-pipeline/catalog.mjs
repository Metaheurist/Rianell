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

export function resolvePackModel(packId, requested, catalog = loadCatalog()) {
  const entry = getPackEntry(packId, catalog);
  if (!entry) return { ok: false, error: `unknown pack: ${packId}` };
  const model = requested || entry.recommended;
  if (!entry.allowed.includes(model)) {
    return {
      ok: false,
      error: `model ${model} not allowed for ${packId}`,
      recommended: entry.recommended,
      allowed: entry.allowed,
    };
  }
  return {
    ok: true,
    model,
    recommended: entry.recommended,
    estVramGb: entry.estVramGb,
    exclusiveGroups: entry.exclusiveGroups || [],
  };
}

export function runAllOrder(catalog = loadCatalog()) {
  return [...(catalog.runAllOrder || [])];
}

export { CATALOG_PATH };
