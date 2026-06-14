#!/usr/bin/env node
/**
 * Fill non–en-GB locale packs with en-GB strings where missing (P6 baseline).
 * Human overrides in generate-locale-overrides.mjs win on next run.
 * Usage:
 *   node scripts/auto-translate-ui-strings.mjs [--dry-run]
 *   node scripts/auto-translate-ui-strings.mjs --translate   # MT when DEEPL_AUTH_KEY / GOOGLE_TRANSLATE_API_KEY set
 */
import fs from 'node:fs';
import path from 'node:path';
import { SHIPPED_LOCALES } from '../packages/shared/src/i18n/locales.mjs';
import { canonicalLocalePacksDir } from '../packages/shared/src/i18n/packPaths.mjs';
import { hasTranslateCredentials, translateText } from './lib/machine-translate.mjs';

const root = process.cwd();
const dir = canonicalLocalePacksDir(root);
const dryRun = process.argv.includes('--dry-run');
const doTranslate = process.argv.includes('--translate');
const TIER_A = new Set(['pt-BR', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'nl-NL', 'pl-PL', 'pt-PT']);

const canonical = JSON.parse(fs.readFileSync(path.join(dir, 'en-GB.json'), 'utf8'));
const canonicalStrings = canonical.strings || {};
const policyKeys = Object.keys(canonicalStrings).filter((k) => k.startsWith('policy.'));

if (doTranslate && !hasTranslateCredentials()) {
  console.warn('auto-translate-ui-strings: --translate requested but no API credentials; copying en-GB');
}

let total = 0;
for (const locale of SHIPPED_LOCALES) {
  if (locale === 'en-GB') continue;
  const filePath = path.join(dir, `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`auto-translate-ui-strings: skip missing ${locale}.json`);
    continue;
  }
  const pack = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const strings = { ...(pack.strings || {}) };
  let changed = 0;
  for (const [key, value] of Object.entries(canonicalStrings)) {
    if (policyKeys.includes(key)) continue;
    const existing = strings[key];
    const needsFill = existing === undefined || existing === '';
    const needsMt =
      doTranslate &&
      TIER_A.has(locale) &&
      typeof existing === 'string' &&
      existing.trim() === String(value).trim();
    if (!needsFill && !needsMt) continue;

    let next = value;
    if (doTranslate && hasTranslateCredentials() && TIER_A.has(locale)) {
      try {
        next = await translateText(value, locale);
      } catch (e) {
        console.warn(`auto-translate-ui-strings: MT failed ${locale} ${key}: ${e.message}`);
        next = value;
      }
    }
    if (strings[key] === next) continue;
    strings[key] = next;
    changed++;
  }
  if (changed === 0) continue;
  total += changed;
  if (dryRun) {
    console.log(`[dry-run] ${locale}.json: would update ${changed} key(s)`);
    continue;
  }
  const out = { ...pack, strings, machineTranslatedUi: true };
  fs.writeFileSync(filePath, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  console.log(`auto-translate-ui-strings: updated ${changed} key(s) in ${locale}.json`);
}

if (dryRun) {
  console.log(`auto-translate-ui-strings: dry-run — ${total} key update(s) across locales`);
} else if (total === 0) {
  console.log('auto-translate-ui-strings: all locales already have UI keys');
} else {
  console.log(`auto-translate-ui-strings: ${total} key(s) updated`);
}
