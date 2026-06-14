#!/usr/bin/env node
/**
 * Merge Tier A locale pack strings that differ from en-GB into tier-a-exact-overrides.mjs.
 * Keeps generate-locale-overrides.mjs reproducible without re-running MT APIs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { canonicalLocalePacksDir } from '../packages/shared/src/i18n/packPaths.mjs';
import { EXACT_OVERRIDES } from './lib/tier-a-exact-overrides.mjs';
import { shouldKeepEnglish } from './lib/rule-based-mt.mjs';

const root = process.cwd();
const dir = canonicalLocalePacksDir(root);
const outPath = path.join(root, 'scripts/lib/tier-a-exact-overrides.mjs');
const TIER_A = ['pt-BR', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'nl-NL', 'pl-PL', 'pt-PT'];

const canonical = JSON.parse(fs.readFileSync(path.join(dir, 'en-GB.json'), 'utf8'));
const en = canonical.strings || {};
const merged = structuredClone(EXACT_OVERRIDES);

for (const locale of TIER_A) {
  const pack = JSON.parse(fs.readFileSync(path.join(dir, `${locale}.json`), 'utf8'));
  const strings = pack.strings || {};
  if (!merged[locale]) merged[locale] = {};
  let added = 0;
  for (const [key, enVal] of Object.entries(en)) {
    if (key.startsWith('policy.')) continue;
    if (typeof enVal !== 'string') continue;
    if (shouldKeepEnglish(enVal)) continue;
    const locVal = strings[key];
    if (typeof locVal !== 'string' || locVal.trim() === enVal.trim()) continue;
    if (merged[locale][key] === locVal) continue;
    merged[locale][key] = locVal;
    added++;
  }
  console.log(`merge-tier-a-overrides: ${locale} +${added} (total ${Object.keys(merged[locale]).length})`);
}

function serialize(obj) {
  const lines = ['{'];
  for (const loc of TIER_A) {
    const map = obj[loc] || {};
    lines.push(`  '${loc}': {`);
    for (const [key, val] of Object.entries(map)) {
      lines.push(`    ${JSON.stringify(key)}: ${JSON.stringify(val)},`);
    }
    lines.push('  },');
  }
  lines.push('};');
  return lines.join('\n');
}

const header = `/**
 * Exact en-GB → locale overrides for Tier A packs (LC-16 offline completion).
 * Keys where locale strings still matched en-GB after rule-based MT.
 */
`;

fs.writeFileSync(outPath, `${header}export const EXACT_OVERRIDES = ${serialize(merged)}\n`, 'utf8');
console.log(`merge-tier-a-overrides: wrote ${outPath}`);
