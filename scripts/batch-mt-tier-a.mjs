#!/usr/bin/env node
/**
 * Batch machine-translate Tier A locale packs from en-GB (LC-16).
 * Uses DEEPL / Google when set; otherwise USE_MYMEMORY_MT=1 (free tier, rate-limited).
 *
 * Usage:
 *   USE_MYMEMORY_MT=1 node scripts/batch-mt-tier-a.mjs [--locale=pt-BR] [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';
import { canonicalLocalePacksDir } from '../packages/shared/src/i18n/packPaths.mjs';
import { hasTranslateCredentials, translateText } from './lib/machine-translate.mjs';

const root = process.cwd();
const dir = canonicalLocalePacksDir(root);
const TIER_A = ['pt-BR', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'nl-NL', 'pl-PL', 'pt-PT', 'ga'];
const dryRun = process.argv.includes('--dry-run');
const localeArg = process.argv.find((a) => a.startsWith('--locale='));
const onlyLocale = localeArg ? localeArg.split('=')[1] : null;
const delayMs = Number(process.env.MT_DELAY_MS || '350');

if (!hasTranslateCredentials()) {
  console.error('batch-mt-tier-a: set DEEPL_AUTH_KEY, GOOGLE_TRANSLATE_API_KEY, or USE_MYMEMORY_MT=1');
  process.exit(1);
}

const canonical = JSON.parse(fs.readFileSync(path.join(dir, 'en-GB.json'), 'utf8'));
const canonicalStrings = canonical.strings || {};
const policyKeys = new Set(Object.keys(canonicalStrings).filter((k) => k.startsWith('policy.')));

const locales = onlyLocale ? [onlyLocale] : TIER_A;
for (const loc of locales) {
  if (!TIER_A.includes(loc)) {
    console.error(`batch-mt-tier-a: ${loc} is not Tier A`);
    process.exit(1);
  }
}

for (const locale of locales) {
  const filePath = path.join(dir, `${locale}.json`);
  const pack = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const strings = { ...(pack.strings || {}) };
  let updated = 0;
  let skipped = 0;
  const keys = Object.keys(canonicalStrings).filter((k) => !policyKeys.has(k));

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const enVal = canonicalStrings[key];
    if (typeof enVal !== 'string' || !enVal.trim()) continue;
    const cur = strings[key];
    if (typeof cur === 'string' && cur.trim() !== enVal.trim()) {
      skipped++;
      continue;
    }
    try {
      const translated = await translateText(enVal, locale);
      if (translated && translated.trim() !== enVal.trim()) {
        if (!dryRun) strings[key] = translated;
        updated++;
      }
    } catch (e) {
      console.warn(`batch-mt-tier-a: ${locale} ${key}: ${e.message}`);
    }
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    if ((i + 1) % 50 === 0) {
      console.log(`batch-mt-tier-a: ${locale} ${i + 1}/${keys.length} (${updated} translated)`);
    }
  }

  if (!dryRun && updated > 0) {
    const out = { ...pack, strings, machineTranslatedUi: true };
    fs.writeFileSync(filePath, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  }
  console.log(`batch-mt-tier-a: ${locale} done — ${updated} translated, ${skipped} already differ`);
}

console.log('batch-mt-tier-a: run node scripts/generate-locale-overrides.mjs && node scripts/sync-i18n-assets.mjs');
