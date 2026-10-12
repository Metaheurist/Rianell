#!/usr/bin/env node
/**
 * Translate policy.* strings into locale packs (LC-20f).
 * Usage:
 *   node scripts/i18n/auto-translate-policy-strings.mjs [--dry-run]
 *   USE_MYMEMORY_MT=1 node scripts/i18n/auto-translate-policy-strings.mjs --translate
 */
import fs from 'node:fs';
import path from 'node:path';
import { SHIPPED_LOCALES } from '../../packages/shared/src/i18n/locales.mjs';
import { canonicalLocalePacksDir } from '../../packages/shared/src/i18n/packPaths.mjs';
import { hasTranslateCredentials, translateText } from '../lib/machine-translate.mjs';
import { applyRuleBasedMt } from '../lib/rule-based-mt.mjs';
import { localeJsonPath, readJsonIfExists, sanitizeTranslation, writeJson } from './lib/safe-pack-io.mjs';

const root = process.cwd();
const dir = canonicalLocalePacksDir(root);
const dryRun = process.argv.includes('--dry-run');
const doTranslate = process.argv.includes('--translate');
const TIER_A = new Set(['pt-BR', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'nl-NL', 'pl-PL', 'pt-PT', 'ga']);
const delayMs = Number(process.env.MT_DELAY_MS || '400');

const canonicalPath = path.join(dir, 'en-GB.json');
const canonical = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));
const policyKeys = Object.keys(canonical.strings || {}).filter((k) => k.startsWith('policy.'));
const noticeKey = 'policy.machineTranslatedNotice';

let totalUpdates = 0;

for (const locale of SHIPPED_LOCALES) {
  if (locale === 'en-GB') continue;
  const filePath = localeJsonPath(dir, locale);
  const pack = readJsonIfExists(filePath);
  if (!pack) continue;
  const strings = { ...(pack.strings || {}) };
  let changed = 0;

  for (const key of policyKeys) {
    const enVal = canonical.strings[key];
    if (typeof enVal !== 'string') continue;
    const cur = strings[key];
    const needsMt = !cur || cur.trim() === enVal.trim();
    if (!needsMt && key !== noticeKey) continue;
    let next = enVal;
    if (doTranslate && hasTranslateCredentials()) {
      try {
        next = sanitizeTranslation(enVal, await translateText(enVal, locale)) ?? next;
        if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
      } catch (e) {
        console.warn(`auto-translate-policy-strings: ${locale} ${key}: ${e.message}`);
      }
    } else if (TIER_A.has(locale)) {
      next = applyRuleBasedMt(enVal, locale);
    }
    if (strings[key] !== next) {
      strings[key] = next;
      changed++;
    }
  }
  if (canonical.strings[noticeKey] && locale !== 'en-US' && locale !== 'en-AU') {
    let notice = canonical.strings[noticeKey];
    if (TIER_A.has(locale)) notice = applyRuleBasedMt(notice, locale);
    if (doTranslate && hasTranslateCredentials()) {
      try {
        notice = sanitizeTranslation(
          canonical.strings[noticeKey],
          await translateText(canonical.strings[noticeKey], locale),
        ) ?? notice;
      } catch (_) {}
    }
    if (strings[noticeKey] !== notice) {
      strings[noticeKey] = notice;
      changed++;
    }
  }
  if (changed === 0) continue;
  totalUpdates += changed;
  if (!dryRun) {
    writeJson(filePath, { ...pack, strings });
  }
  console.log(`auto-translate-policy-strings: ${locale} — ${changed} policy key(s)`);
}

console.log(`auto-translate-policy-strings: ${totalUpdates} key update(s)${dryRun ? ' (dry-run)' : ''}`);
