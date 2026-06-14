#!/usr/bin/env node
/**
 * Fail when MOTD messages still match en-GB (LC-20e).
 * Usage: node scripts/verify-motd-translation-coverage.mjs [--strict] [--min-translated=30]
 */
import fs from 'node:fs';
import path from 'node:path';
import { SHIPPED_LOCALES } from '../packages/shared/src/i18n/locales.mjs';
import { canonicalMotdPacksDir } from '../packages/shared/src/i18n/packPaths.mjs';

const root = process.cwd();
const dir = canonicalMotdPacksDir(root);
const strict = process.argv.includes('--strict');
const minArg = process.argv.find((a) => a.startsWith('--min-translated='));
const minTranslated = minArg ? Number(minArg.split('=')[1]) : null;

const en = JSON.parse(fs.readFileSync(path.join(dir, 'en-GB.json'), 'utf8'));
const enMsgs = en.messages || [];
const TIER_A = new Set(['pt-BR', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'nl-NL', 'pl-PL', 'pt-PT']);
const TIER_C_MIN = 30;

let failed = false;

for (const locale of SHIPPED_LOCALES) {
  if (locale === 'en-GB') continue;
  const filePath = path.join(dir, `${locale}.json`);
  if (!fs.existsSync(filePath)) continue;
  const pack = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const msgs = pack.messages || [];
  let identical = 0;
  const len = Math.min(enMsgs.length, msgs.length);
  for (let i = 0; i < len; i++) {
    if (msgs[i] === enMsgs[i]) identical++;
  }
  const translated = len - identical;
  const requireAll = strict && (TIER_A.has(locale) || locale === 'ga');
  const requireMin = locale === 'ar' || locale === 'he' ? TIER_C_MIN : null;
  const min = minTranslated != null ? minTranslated : requireMin;
  console.log(
    `verify-motd-translation-coverage: ${locale} ${identical}/${len} identical (${translated} translated)`,
  );
  if (requireAll && identical > 0) {
    console.error(`verify-motd-translation-coverage: ${locale} must have 0 identical messages (--strict)`);
    failed = true;
  } else if (min != null && translated < min) {
    console.error(`verify-motd-translation-coverage: ${locale} needs >= ${min} translated (has ${translated})`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('verify-motd-translation-coverage: passed');
