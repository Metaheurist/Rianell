#!/usr/bin/env node
/**
 * Fail when non-en locale strings contain English fragments (Frankenstein MT).
 * Usage: node scripts/verify/verify-mixed-language-strings.mjs [--strict] [--locale=de-DE]
 */
import fs from 'node:fs';
import path from 'node:path';
import { SHIPPED_LOCALES } from '../../packages/shared/src/i18n/locales.mjs';
import { canonicalLocalePacksDir } from '../../packages/shared/src/i18n/packPaths.mjs';
import { GLOSSARY_TERMS } from '@rianell/build-tools/i18n-glossary';

const root = process.cwd();
const dir = canonicalLocalePacksDir(root);
const strict = process.argv.includes('--strict');
const localeArg = process.argv.find((a) => a.startsWith('--locale='));
const onlyLocale = localeArg ? localeArg.split('=')[1] : null;

const EN_VARIANTS = new Set(['en-GB', 'en-US', 'en-AU']);
const TIER_A = new Set(['pt-BR', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'nl-NL', 'pl-PL', 'pt-PT', 'ga']);
const ENG_FRAG = /\b(the|and|Entry|Log|Save|Exercise|Install|optional|return to|with the|your|this|from|for|to|add|notes|data|export|disabled)\b/i;
const SKIP_PREFIX = 'policy.';

const canonical = JSON.parse(fs.readFileSync(path.join(dir, 'en-GB.json'), 'utf8'));
const enStrings = canonical.strings || {};

function isGlossaryOnly(text) {
  if (!text || typeof text !== 'string') return true;
  const t = text.trim();
  if (GLOSSARY_TERMS.some((g) => t === g || t.includes(g))) return true;
  if (/^(OK|No|Yes|Beta|WebGPU|WebGL|GDPR|AI|JSON|PDF|CPU|GPU)$/i.test(t)) return true;
  return false;
}

function isMixed(key, locVal, enVal) {
  if (key.startsWith(SKIP_PREFIX)) return false;
  if (typeof locVal !== 'string' || typeof enVal !== 'string') return false;
  if (locVal.trim() === enVal.trim()) return false;
  if (isGlossaryOnly(locVal)) return false;
  return ENG_FRAG.test(locVal);
}

const locales = onlyLocale ? [onlyLocale] : SHIPPED_LOCALES.filter((l) => !EN_VARIANTS.has(l));
let total = 0;
let failed = false;

for (const locale of locales) {
  if (!TIER_A.has(locale) && locale !== 'ar' && locale !== 'he') continue;
  const filePath = path.join(dir, `${locale}.json`);
  if (!fs.existsSync(filePath)) continue;
  const pack = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const strings = pack.strings || {};
  const hits = [];
  for (const [key, enVal] of Object.entries(enStrings)) {
    const locVal = strings[key];
    if (isMixed(key, locVal, enVal)) hits.push({ key, value: locVal });
  }
  if (hits.length) {
    console.warn(`verify-mixed-language-strings: ${locale} — ${hits.length} mixed-language string(s)`);
    hits.slice(0, 15).forEach((h) => console.warn(`  ${h.key}: ${h.value.slice(0, 90)}`));
    if (hits.length > 15) console.warn(`  … and ${hits.length - 15} more`);
    total += hits.length;
    if (strict && TIER_A.has(locale)) failed = true;
  } else {
    console.log(`verify-mixed-language-strings: ${locale} — OK`);
  }
}

if (strict && failed) {
  console.error(`verify-mixed-language-strings: ${total} mixed hit(s) — --strict failed`);
  process.exit(1);
}
console.log(`verify-mixed-language-strings: done (${total} mixed hit(s)${strict ? ', strict Tier A gate' : ''})`);
