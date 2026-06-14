import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHIPPED_LOCALES } from './locales.mjs';
import { canonicalLocalePacksDir } from './packPaths.mjs';

function repoRootFromHere() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.join(here, '..', '..', '..', '..');
}

/** Load all i18n-packs/locale-packs/v1/*.json into { localeId: catalog }. Node/tests only. */
export function loadCatalogsFromDisk(root = repoRootFromHere()) {
  const dir = canonicalLocalePacksDir(root);
  const out = {};
  for (const locale of SHIPPED_LOCALES) {
    const p = path.join(dir, `${locale}.json`);
    if (fs.existsSync(p)) {
      out[locale] = JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  }
  return out;
}

/** Merge fetched/bundled catalogs (browser/RN). */
export function mergeCatalogs(base, patch) {
  return { ...(base || {}), ...(patch || {}) };
}
