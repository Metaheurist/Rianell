#!/usr/bin/env node
/**
 * Copy en-GB policy.* strings into other locale packs (placeholder = en-GB text).
 * No external API — identity merge for machine-translate pipeline follow-up.
 * Usage: node scripts/auto-translate-policy-strings.mjs [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';
import { SHIPPED_LOCALES } from '../packages/shared/src/i18n/locales.mjs';
import { canonicalLocalePacksDir } from '../packages/shared/src/i18n/packPaths.mjs';

const root = process.cwd();
const dir = canonicalLocalePacksDir(root);
const dryRun = process.argv.includes('--dry-run');

const canonicalPath = path.join(dir, 'en-GB.json');
if (!fs.existsSync(canonicalPath)) {
  console.error('auto-translate-policy-strings: missing i18n-packs/locale-packs/v1/en-GB.json');
  process.exit(1);
}

const canonical = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));
const policyKeys = Object.keys(canonical.strings || {}).filter((k) => k.startsWith('policy.'));
if (!policyKeys.length) {
  console.error('auto-translate-policy-strings: no policy.* keys in en-GB');
  process.exit(1);
}

const policyStrings = {};
for (const k of policyKeys) policyStrings[k] = canonical.strings[k];

let totalUpdates = 0;
let localesTouched = 0;

for (const locale of SHIPPED_LOCALES) {
  if (locale === 'en-GB') continue;
  const filePath = path.join(dir, `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`auto-translate-policy-strings: skip missing ${locale}.json`);
    continue;
  }

  const pack = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const strings = { ...(pack.strings || {}) };
  let changed = 0;

  for (const [key, value] of Object.entries(policyStrings)) {
    if (strings[key] !== value) {
      strings[key] = value;
      changed++;
    }
  }

  if (changed === 0) continue;
  localesTouched++;
  totalUpdates += changed;

  if (dryRun) {
    console.log(`[dry-run] ${locale}.json: would update ${changed} policy.* key(s)`);
    continue;
  }

  const out = { ...pack, strings };
  fs.writeFileSync(filePath, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  console.log(`auto-translate-policy-strings: wrote ${changed} policy.* key(s) to ${locale}.json`);
}

if (dryRun) {
  console.log(
    `auto-translate-policy-strings: dry-run complete — ${localesTouched} locale(s), ${totalUpdates} key update(s)`,
  );
} else if (totalUpdates === 0) {
  console.log('auto-translate-policy-strings: all locales already have en-GB policy strings');
} else {
  console.log(
    `auto-translate-policy-strings: updated ${localesTouched} locale(s), ${totalUpdates} key(s) total`,
  );
}
