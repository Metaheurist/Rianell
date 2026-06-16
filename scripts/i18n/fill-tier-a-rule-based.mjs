#!/usr/bin/env node
/**
 * Fill Tier A locale packs where strings still match en-GB using rule-based offline MT.
 * Run after batch-mt-tier-a.mjs or when API credentials are unavailable.
 */
import fs from 'node:fs';
import path from 'node:path';
import { canonicalLocalePacksDir } from '../../packages/shared/src/i18n/packPaths.mjs';
import { applyRuleBasedMt, shouldKeepEnglish } from '../lib/rule-based-mt.mjs';

const root = process.cwd();
const dir = canonicalLocalePacksDir(root);
const TIER_A = ['pt-BR', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'nl-NL', 'pl-PL', 'pt-PT'];
const dryRun = process.argv.includes('--dry-run');

const canonical = JSON.parse(fs.readFileSync(path.join(dir, 'en-GB.json'), 'utf8'));
const canonicalStrings = canonical.strings || {};

for (const locale of TIER_A) {
  const filePath = path.join(dir, `${locale}.json`);
  const pack = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const strings = { ...(pack.strings || {}) };
  let changed = 0;
  for (const [key, enVal] of Object.entries(canonicalStrings)) {
    if (key.startsWith('policy.')) continue;
    if (typeof enVal !== 'string') continue;
    const cur = strings[key];
    if (typeof cur === 'string' && cur.trim() !== enVal.trim()) continue;
    if (shouldKeepEnglish(enVal)) continue;
    const next = applyRuleBasedMt(enVal, locale);
    if (next.trim() === enVal.trim()) continue;
    strings[key] = next;
    changed++;
  }
  if (changed === 0) {
    console.log(`fill-tier-a-rule-based: ${locale} — no changes`);
    continue;
  }
  if (!dryRun) {
    const out = { ...pack, strings, machineTranslatedUi: true };
    fs.writeFileSync(filePath, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  }
  console.log(`fill-tier-a-rule-based: ${locale} — ${changed} key(s) updated`);
}

console.log('fill-tier-a-rule-based: run node scripts/i18n/sync-i18n-assets.mjs');
