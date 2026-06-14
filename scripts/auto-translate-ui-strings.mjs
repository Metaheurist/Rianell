#!/usr/bin/env node
/**
 * Fill non–en-GB locale packs with en-GB strings where missing (P6 baseline).
 * Human overrides in generate-locale-overrides.mjs win on next run.
 * Usage: node scripts/auto-translate-ui-strings.mjs [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';
import { SHIPPED_LOCALES } from '../packages/shared/src/i18n/locales.mjs';
import { canonicalLocalePacksDir } from '../packages/shared/src/i18n/packPaths.mjs';

const root = process.cwd();
const dir = canonicalLocalePacksDir(root);
const dryRun = process.argv.includes('--dry-run');

const canonical = JSON.parse(fs.readFileSync(path.join(dir, 'en-GB.json'), 'utf8'));
const canonicalStrings = canonical.strings || {};
const policyKeys = Object.keys(canonicalStrings).filter((k) => k.startsWith('policy.'));

let total = 0;
for (const locale of SHIPPED_LOCALES) {
  if (locale === 'en-GB') continue;
  const filePath = path.join(dir, `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`auto-translate-ui-strings: skip missing ${locale}.json`);
    continue;
  }
  const pack = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const strings = { ...(pack.strings || {}) };
  let changed = 0;
  for (const [key, value] of Object.entries(canonicalStrings)) {
    if (policyKeys.includes(key)) continue;
    if (strings[key] === undefined || strings[key] === '') {
      strings[key] = value;
      changed++;
    }
  }
  if (changed === 0) continue;
  total += changed;
  if (dryRun) {
    console.log(`[dry-run] ${locale}.json: would fill ${changed} key(s)`);
    continue;
  }
  const out = { ...pack, strings, machineTranslatedUi: true };
  fs.writeFileSync(filePath, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  console.log(`auto-translate-ui-strings: filled ${changed} key(s) in ${locale}.json`);
}

if (dryRun) {
  console.log(`auto-translate-ui-strings: dry-run — ${total} key update(s) across locales`);
} else if (total === 0) {
  console.log('auto-translate-ui-strings: all locales already have UI keys');
} else {
  console.log(`auto-translate-ui-strings: ${total} key(s) filled (en-GB placeholders; review Tier A locales)`);
}
