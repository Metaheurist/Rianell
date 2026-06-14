#!/usr/bin/env node
/**
 * Apply exact en-GB → locale overrides for Tier A packs (LC-16 offline completion).
 * Reads scripts/lib/tier-a-exact-overrides.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { canonicalLocalePacksDir } from '../packages/shared/src/i18n/packPaths.mjs';
import { EXACT_OVERRIDES } from './lib/tier-a-exact-overrides.mjs';
import { shouldKeepEnglish } from './lib/rule-based-mt.mjs';

const root = process.cwd();
const dir = canonicalLocalePacksDir(root);
const TIER_A = ['pt-BR', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'nl-NL', 'pl-PL', 'pt-PT'];

const canonical = JSON.parse(fs.readFileSync(path.join(dir, 'en-GB.json'), 'utf8'));
const en = canonical.strings || {};

for (const locale of TIER_A) {
  const filePath = path.join(dir, `${locale}.json`);
  const pack = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const strings = { ...(pack.strings || {}) };
  const overrides = EXACT_OVERRIDES[locale] || {};
  let changed = 0;
  for (const [key, enVal] of Object.entries(en)) {
    if (key.startsWith('policy.')) continue;
    if (typeof enVal !== 'string') continue;
    if (shouldKeepEnglish(enVal)) continue;
    const exact = overrides[key] ?? overrides[enVal];
    if (!exact || exact.trim() === enVal.trim()) continue;
    if (strings[key] === exact) continue;
    strings[key] = exact;
    changed++;
  }
  if (changed > 0) {
    const out = { ...pack, strings, machineTranslatedUi: true };
    fs.writeFileSync(filePath, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  }
  console.log(`apply-tier-a-exact: ${locale} — ${changed} key(s)`);
}
