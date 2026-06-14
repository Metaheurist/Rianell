#!/usr/bin/env node
/**
 * Machine-translate content.* catalog keys still identical to en-GB (LC-20d).
 * Usage: USE_MYMEMORY_MT=1 node scripts/batch-mt-content-keys.mjs [--locale=de-DE] [--dry-run]
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
  console.error('batch-mt-content-keys: set DEEPL_AUTH_KEY, GOOGLE_TRANSLATE_API_KEY, or USE_MYMEMORY_MT=1');
  process.exit(1);
}

const canonical = JSON.parse(fs.readFileSync(path.join(dir, 'en-GB.json'), 'utf8'));
const contentKeys = Object.keys(canonical.strings || {}).filter((k) => k.startsWith('content.'));
const locales = onlyLocale ? [onlyLocale] : TIER_A;

for (const locale of locales) {
  const filePath = path.join(dir, `${locale}.json`);
  const pack = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const strings = { ...(pack.strings || {}) };
  let updated = 0;
  for (let i = 0; i < contentKeys.length; i++) {
    const key = contentKeys[i];
    const enVal = canonical.strings[key];
    if (typeof enVal !== 'string' || !enVal.trim()) continue;
    const cur = strings[key];
    if (typeof cur === 'string' && cur.trim() !== enVal.trim()) continue;
    try {
      const translated = await translateText(enVal, locale);
      if (translated && translated.trim() !== enVal.trim()) {
        if (!dryRun) strings[key] = translated;
        updated++;
      }
    } catch (e) {
      console.warn(`batch-mt-content-keys: ${locale} ${key}: ${e.message}`);
    }
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    if ((i + 1) % 40 === 0) console.log(`batch-mt-content-keys: ${locale} ${i + 1}/${contentKeys.length}`);
  }
  if (!dryRun && updated > 0) {
    fs.writeFileSync(filePath, `${JSON.stringify({ ...pack, strings, machineTranslatedUi: true }, null, 2)}\n`, 'utf8');
  }
  console.log(`batch-mt-content-keys: ${locale} — ${updated} content key(s) translated`);
}
