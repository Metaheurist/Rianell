#!/usr/bin/env node
/** Generate prompt-packs/v1/{locale}.json for every SHIPPED_LOCALE from en-GB canonical. */
import path from 'node:path';
import { SHIPPED_LOCALES } from '../../packages/shared/src/i18n/locales.mjs';
import { canonicalPromptPacksDir } from '../../packages/shared/src/i18n/packPaths.mjs';
import { localeJsonPath, readJsonIfExists, writeJson } from './lib/safe-pack-io.mjs';

const root = process.cwd();
const dir = canonicalPromptPacksDir(root);
const canonicalPath = path.join(dir, 'en-GB.json');
const canonical = readJsonIfExists(canonicalPath);
if (!canonical) {
  console.error('generate-prompt-packs-all-locales: missing en-GB.json');
  process.exit(1);
}

for (const locale of SHIPPED_LOCALES) {
  const outPath = localeJsonPath(dir, locale);
  let pack = { ...canonical, locale };
  if (locale === 'ar' || locale === 'he') {
    pack.llmCapability = 'ui-only';
  }
  const existing = readJsonIfExists(outPath);
  if (existing) {
    pack = { ...pack, ...existing, locale, strings: { ...(canonical.strings || canonical), ...(existing.strings || {}) } };
    if (locale === 'ar' || locale === 'he') pack.llmCapability = 'ui-only';
  }
  writeJson(outPath, pack);
}

console.log(`generate-prompt-packs-all-locales: wrote ${SHIPPED_LOCALES.length} prompt pack(s)`);
