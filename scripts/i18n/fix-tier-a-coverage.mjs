#!/usr/bin/env node
/** Bring Tier A locales under --max-pct identical-to-en-GB threshold (verify parity). */
import fs from 'node:fs';
import path from 'node:path';
import { GLOSSARY_TERMS } from '@rianell/build-tools/i18n-glossary';
import { canonicalLocalePacksDir } from '../../packages/shared/src/i18n/packPaths.mjs';
import { applyRuleBasedMt, shouldKeepEnglish } from '../lib/rule-based-mt.mjs';
import { hasTranslateCredentials, translateText } from '../lib/machine-translate.mjs';

const root = process.cwd();
const dir = canonicalLocalePacksDir(root);
const canonical = JSON.parse(fs.readFileSync(path.join(dir, 'en-GB.json'), 'utf8'));
const canonicalStrings = canonical.strings || {};
const locales = (process.argv.find((a) => a.startsWith('--locale='))?.split('=')[1] || 'pl-PL,pt-PT').split(',');
const maxPct = Number(process.argv.find((a) => a.startsWith('--max-pct='))?.split('=')[1] || '13');
const delayMs = Number(process.env.MT_DELAY_MS || '200');
const useApi = hasTranslateCredentials();

function isGlossaryProtected(key, value) {
  if (key.startsWith('units.')) return true;
  if (typeof value !== 'string') return true;
  const t = value.trim();
  if (/^(OK|No|Yes|Beta)$/i.test(t)) return true;
  if (GLOSSARY_TERMS.some((term) => t.includes(term))) return true;
  return false;
}

function countIdentical(strings) {
  let comparable = 0;
  let identical = 0;
  for (const [key, enVal] of Object.entries(canonicalStrings)) {
    if (key.startsWith('policy.')) continue;
    if (key.startsWith('content.')) continue;
    if (typeof enVal !== 'string') continue;
    const locVal = strings[key];
    if (typeof locVal !== 'string') continue;
    if (isGlossaryProtected(key, enVal)) continue;
    comparable++;
    if (locVal.trim() === enVal.trim()) identical++;
  }
  return { comparable, identical };
}

for (const locale of locales) {
  const filePath = path.join(dir, `${locale}.json`);
  const pack = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const strings = { ...(pack.strings || {}) };
  let { comparable, identical } = countIdentical(strings);
  const maxIdentical = Math.floor((comparable * maxPct) / 100);
  if (identical <= maxIdentical) {
    console.log(
      `fix-tier-a-coverage: ${locale} already ${identical}/${comparable} (${((identical / comparable) * 100).toFixed(1)}%)`,
    );
    continue;
  }

  const keys = Object.keys(canonicalStrings).filter((k) => !k.startsWith('policy.') && !k.startsWith('content.'));
  let changed = 0;
  for (const key of keys) {
    if (identical <= maxIdentical) break;
    const enVal = canonicalStrings[key];
    if (typeof enVal !== 'string' || !enVal.trim()) continue;
    if (isGlossaryProtected(key, enVal)) continue;
    if (shouldKeepEnglish(enVal)) continue;
    if ((strings[key] || '').trim() !== enVal.trim()) continue;

    let next = applyRuleBasedMt(enVal, locale);
    if (next.trim() === enVal.trim() && useApi) {
      try {
        next = await translateText(enVal, locale);
      } catch (e) {
        console.warn(`fix-tier-a-coverage: ${locale} ${key}: ${e.message}`);
        continue;
      }
      if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    }
    if (next.trim() === enVal.trim()) continue;
    strings[key] = next;
    identical--;
    changed++;
  }

  fs.writeFileSync(filePath, `${JSON.stringify({ ...pack, strings, machineTranslatedUi: true }, null, 2)}\n`, 'utf8');
  const after = countIdentical(strings);
  console.log(
    `fix-tier-a-coverage: ${locale} — ${changed} key(s); now ${after.identical}/${after.comparable} (${((after.identical / after.comparable) * 100).toFixed(1)}%)`,
  );
}
