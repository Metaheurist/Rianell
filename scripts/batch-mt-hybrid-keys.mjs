#!/usr/bin/env node
/**
 * Re-translate only mixed-language (Frankenstein) keys from en-GB full sentences.
 * Usage: USE_MYMEMORY_MT=1 node scripts/batch-mt-hybrid-keys.mjs [--locale=de-DE] [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';
import { canonicalLocalePacksDir } from '../packages/shared/src/i18n/packPaths.mjs';
import { hasTranslateCredentials, translateText } from './lib/machine-translate.mjs';
import { GLOSSARY_TERMS } from './lib/i18n-glossary.mjs';

const root = process.cwd();
const dir = canonicalLocalePacksDir(root);
const TIER_A = ['pt-BR', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'nl-NL', 'pl-PL', 'pt-PT', 'ga'];
const dryRun = process.argv.includes('--dry-run');
const localeArg = process.argv.find((a) => a.startsWith('--locale='));
const onlyLocale = localeArg ? localeArg.split('=')[1] : null;
const delayMs = Number(process.env.MT_DELAY_MS || '400');
const ENG_FRAG = /\b(the|and|Entry|Log|Save|Exercise|Install|optional|return to|with the|your|this|from|for|to|add|notes|data|export|disabled)\b/i;

if (!hasTranslateCredentials()) {
  console.error('batch-mt-hybrid-keys: set DEEPL_AUTH_KEY, GOOGLE_TRANSLATE_API_KEY, or USE_MYMEMORY_MT=1');
  process.exit(1);
}

const canonical = JSON.parse(fs.readFileSync(path.join(dir, 'en-GB.json'), 'utf8'));
const enStrings = canonical.strings || {};
const policyKeys = new Set(Object.keys(enStrings).filter((k) => k.startsWith('policy.')));

function isHybrid(key, locVal, enVal) {
  if (policyKeys.has(key)) return false;
  if (typeof locVal !== 'string' || typeof enVal !== 'string') return false;
  if (locVal.trim() === enVal.trim()) return false;
  if (GLOSSARY_TERMS.some((g) => locVal.includes(g))) return false;
  return ENG_FRAG.test(locVal);
}

const locales = onlyLocale ? [onlyLocale] : TIER_A;
for (const locale of locales) {
  const filePath = path.join(dir, `${locale}.json`);
  const pack = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const strings = { ...(pack.strings || {}) };
  let updated = 0;
  const keys = Object.keys(enStrings).filter((k) => isHybrid(k, strings[k], enStrings[k]));
  console.log(`batch-mt-hybrid-keys: ${locale} — ${keys.length} hybrid key(s)`);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const enVal = enStrings[key];
    try {
      const translated = await translateText(enVal, locale);
      if (translated && translated.trim() !== strings[key].trim()) {
        if (!dryRun) strings[key] = translated;
        updated++;
      }
    } catch (e) {
      console.warn(`batch-mt-hybrid-keys: ${locale} ${key}: ${e.message}`);
    }
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }
  if (!dryRun && updated > 0) {
    fs.writeFileSync(filePath, `${JSON.stringify({ ...pack, strings, machineTranslatedUi: true }, null, 2)}\n`, 'utf8');
  }
  console.log(`batch-mt-hybrid-keys: ${locale} — ${updated} updated`);
}
