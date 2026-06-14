#!/usr/bin/env node
/**
 * Build scripts/lib/tier-a-exact-overrides.mjs via Google Translate (maintainer-only).
 * Protects ICU placeholders and glossary terms.
 */
import fs from 'node:fs';
import path from 'node:path';
import { canonicalLocalePacksDir } from '../packages/shared/src/i18n/packPaths.mjs';
import { GLOSSARY_TERMS, protectGlossary, restoreGlossary } from './lib/i18n-glossary.mjs';
import { shouldKeepEnglish } from './lib/rule-based-mt.mjs';
import { EXACT_OVERRIDES as EXISTING_OVERRIDES } from './lib/tier-a-exact-overrides.mjs';

const root = process.cwd();
const dir = canonicalLocalePacksDir(root);
const outPath = path.join(root, 'scripts/lib/tier-a-exact-overrides.mjs');
const TIER_A = ['pt-BR', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'nl-NL', 'pl-PL', 'pt-PT'];
const localeArg = process.argv.find((a) => a.startsWith('--locale='));
const onlyLocale = localeArg ? localeArg.split('=')[1] : null;
const locales = onlyLocale ? TIER_A.filter((l) => l === onlyLocale) : TIER_A;
if (onlyLocale && !locales.length) {
  console.error(`build-tier-a-exact-overrides: unknown locale ${onlyLocale}`);
  process.exit(1);
}
const GOOGLE_TL = {
  'pt-BR': 'pt',
  'pt-PT': 'pt',
  'fr-FR': 'fr',
  'de-DE': 'de',
  'es-ES': 'es',
  'it-IT': 'it',
  'nl-NL': 'nl',
  'pl-PL': 'pl',
};
const delayMs = Number(process.env.MT_DELAY_MS || '80');

const canonical = JSON.parse(fs.readFileSync(path.join(dir, 'en-GB.json'), 'utf8'));
const en = canonical.strings || {};

function protectPlaceholders(text) {
  const placeholders = [];
  let i = 0;
  const out = text.replace(/\{[^}]+\}/g, (m) => {
    const ph = `__PH${i++}__`;
    placeholders.push({ ph, m });
    return ph;
  });
  return { text: out, placeholders };
}

function restorePlaceholders(text, placeholders) {
  let out = text;
  for (const { ph, m } of placeholders) {
    out = out.split(ph).join(m);
  }
  return out;
}

async function googleTranslate(text, targetLocale) {
  const tl = GOOGLE_TL[targetLocale];
  if (!tl) return text;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${tl}&dt=t&q=${encodeURIComponent(text.slice(0, 4500))}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Translate HTTP ${res.status}`);
  const data = await res.json();
  const parts = data?.[0];
  if (!Array.isArray(parts) || !parts.length) throw new Error('empty response');
  return parts.map((p) => p[0]).join('');
}

async function translateForLocale(text, locale) {
  const { text: withPh, placeholders: phs } = protectPlaceholders(text);
  const { text: protectedText, placeholders: gloss } = protectGlossary(withPh);
  let translated = await googleTranslate(protectedText, locale);
  translated = restoreGlossary(translated, gloss);
  translated = restorePlaceholders(translated, phs);
  return translated.trim();
}

function serializeOverrides(obj) {
  const lines = ['{'];
  for (const loc of TIER_A) {
    const map = obj[loc] || {};
    lines.push(`  '${loc}': {`);
    for (const [key, val] of Object.entries(map)) {
      lines.push(`    ${JSON.stringify(key)}: ${JSON.stringify(val)},`);
    }
    lines.push('  },');
  }
  lines.push('};');
  return lines.join('\n');
}

const EXACT_OVERRIDES = Object.fromEntries(
  TIER_A.map((l) => [l, { ...(EXISTING_OVERRIDES[l] || {}) }]),
);

for (const locale of locales) {  const pack = JSON.parse(fs.readFileSync(path.join(dir, `${locale}.json`), 'utf8'));
  const strings = pack.strings || {};
  const keys = Object.keys(en).filter((k) => !k.startsWith('policy.'));
  let count = 0;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const enVal = en[key];
    if (typeof enVal !== 'string' || !enVal.trim()) continue;
    if (shouldKeepEnglish(enVal)) continue;
    const cur = strings[key];
    if (typeof cur !== 'string' || cur.trim() !== enVal.trim()) continue;

    try {
      const translated = await translateForLocale(enVal, locale);
      if (translated && translated.trim() !== enVal.trim()) {
        EXACT_OVERRIDES[locale][key] = translated;
        count++;
      }
    } catch (e) {
      console.warn(`build: ${locale} ${key}: ${e.message}`);
    }

    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    if ((i + 1) % 50 === 0) {
      console.log(`build: ${locale} ${i + 1}/${keys.length} (${count} overrides)`);
    }
  }
  console.log(`build: ${locale} done — ${count} override(s)`);
}

const header = `/**
 * Exact en-GB → locale overrides for Tier A packs (LC-16 offline completion).
 * Keys where locale strings still matched en-GB after rule-based MT.
 */
`;

fs.writeFileSync(outPath, `${header}export const EXACT_OVERRIDES = ${serializeOverrides(EXACT_OVERRIDES)}\n`, 'utf8');
console.log(`build: wrote ${outPath}`);
