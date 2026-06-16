#!/usr/bin/env node
/**
 * Report how many UI strings in Tier A locales are still identical to en-GB.
 * --strict: fail when any Tier A locale exceeds maxIdenticalPct (default 5%).
 */
import fs from 'node:fs';
import path from 'node:path';
import { SHIPPED_LOCALES } from '../../packages/shared/src/i18n/locales.mjs';
import { canonicalLocalePacksDir } from '../../packages/shared/src/i18n/packPaths.mjs';
import { GLOSSARY_TERMS } from '@rianell/build-tools/i18n-glossary';

const root = process.cwd();
const dir = canonicalLocalePacksDir(root);
const strict = process.argv.includes('--strict');
const maxPctArg = process.argv.find((a) => a.startsWith('--max-pct='));
const maxIdenticalPct = maxPctArg ? Number(maxPctArg.split('=')[1]) : 5;

const TIER_A = ['pt-BR', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'nl-NL', 'pl-PL', 'pt-PT'];
const EN_VARIANTS = ['en-US', 'en-AU'];
const POLICY_PREFIX = 'policy.';

const canonical = JSON.parse(fs.readFileSync(path.join(dir, 'en-GB.json'), 'utf8'));
const canonicalStrings = canonical.strings || {};

function isGlossaryProtected(key, value) {
  if (key.startsWith('units.')) return true;
  if (typeof value !== 'string') return true;
  const t = value.trim();
  if (/^(OK|No|Yes|Beta)$/i.test(t)) return true;
  if (GLOSSARY_TERMS.some((term) => t.includes(term))) return true;
  return false;
}

let failed = false;

for (const locale of SHIPPED_LOCALES) {
  if (locale === 'en-GB') continue;
  const filePath = path.join(dir, `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`verify-translation-coverage: missing ${locale}.json`);
    continue;
  }
  const pack = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const strings = pack.strings || {};
  let comparable = 0;
  let identical = 0;
  for (const [key, enVal] of Object.entries(canonicalStrings)) {
    if (key.startsWith(POLICY_PREFIX)) continue;
    if (key.startsWith('content.')) continue;
    if (typeof enVal !== 'string') continue;
    const locVal = strings[key];
    if (typeof locVal !== 'string') continue;
    if (isGlossaryProtected(key, enVal)) continue;
    comparable++;
    if (locVal.trim() === enVal.trim()) identical++;
  }
  const pct = comparable ? ((identical / comparable) * 100).toFixed(1) : '0.0';
  const tier = TIER_A.includes(locale) ? 'A' : EN_VARIANTS.includes(locale) ? 'B' : locale === 'ar' || locale === 'he' || locale === 'ga' ? 'C' : '?';
  console.log(
    `verify-translation-coverage: ${locale} [tier ${tier}] ${identical}/${comparable} identical (${pct}%)`,
  );
  if (strict && TIER_A.includes(locale) && comparable > 0) {
    const pctNum = (identical / comparable) * 100;
    if (pctNum > maxIdenticalPct) {
      console.error(
        `verify-translation-coverage: ${locale} exceeds ${maxIdenticalPct}% identical (${pctNum.toFixed(1)}%)`,
      );
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log(
  strict
    ? 'verify-translation-coverage: --strict passed for Tier A locales'
    : 'verify-translation-coverage: warn mode (pass); use --strict after LC-16 MT',
);
