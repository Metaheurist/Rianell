#!/usr/bin/env node
/** Generate prompt-packs/v1/{locale}.json for every SHIPPED_LOCALE from en-GB canonical. */
import fs from 'node:fs';
import path from 'node:path';
import { SHIPPED_LOCALES } from '../packages/shared/src/i18n/locales.mjs';
import { canonicalPromptPacksDir } from '../packages/shared/src/i18n/packPaths.mjs';

const root = process.cwd();
const dir = canonicalPromptPacksDir(root);
const canonicalPath = path.join(dir, 'en-GB.json');
if (!fs.existsSync(canonicalPath)) {
  console.error('generate-prompt-packs-all-locales: missing en-GB.json');
  process.exit(1);
}

const canonical = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));

for (const locale of SHIPPED_LOCALES) {
  const outPath = path.join(dir, `${locale}.json`);
  let pack = { ...canonical, locale };
  if (locale === 'ar' || locale === 'he') {
    pack.llmCapability = 'ui-only';
  }
  if (fs.existsSync(outPath)) {
    const existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    pack = { ...pack, ...existing, locale, strings: { ...(canonical.strings || canonical), ...(existing.strings || {}) } };
    if (locale === 'ar' || locale === 'he') pack.llmCapability = 'ui-only';
  }
  fs.writeFileSync(outPath, `${JSON.stringify(pack, null, 2)}\n`, 'utf8');
}

console.log(`generate-prompt-packs-all-locales: wrote ${SHIPPED_LOCALES.length} prompt pack(s)`);
