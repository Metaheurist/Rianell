#!/usr/bin/env node
/**
 * Fill untranslated i18n gaps with a local Ollama translation model (TranslateGemma).
 *
 * A "gap" is a locale string still identical to en-GB (excluding policy.* and
 * glossary-protected strings). For each gap the English source is sent to the
 * local Ollama server, glossary terms and {placeholders} are protected, and the
 * output is validated (placeholders preserved, no HTML, target script for ar/he,
 * no English-fragment leakage) before being written back to the pack. Runs are
 * checkpointed per locale and safe to re-run (only remaining gaps are filled).
 *
 * Usage:
 *   node scripts/i18n/ollama-translate-gaps.mjs [--locale=fr-FR[,de-DE]] [--model=translategemma:27b]
 *        [--limit=N] [--skip-content] [--dry-run] [--checkpoint=25] [--host=http://127.0.0.1:11434]
 */
import fs from 'node:fs';
import path from 'node:path';
import { canonicalLocalePacksDir } from '../../packages/shared/src/i18n/packPaths.mjs';
import { SHIPPED_LOCALES } from '../../packages/shared/src/i18n/locales.mjs';
import { GLOSSARY_TERMS } from '@rianell/build-tools/i18n-glossary';
import { LOCALE_TO_TG, FRAGMENT_CHECK, ENG_FRAG, PLACEHOLDER_RE, translateOne } from './lib/ollama-translate.mjs';

const root = process.cwd();
const dir = canonicalLocalePacksDir(root);

// ---- args -----------------------------------------------------------------
function argVal(name, fallback) {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=').slice(1).join('=') : fallback;
}
const DRY_RUN = process.argv.includes('--dry-run');
const SKIP_CONTENT = process.argv.includes('--skip-content');
const FIX_MIXED = process.argv.includes('--fix-mixed');
const MODEL = argVal('model', 'translategemma:27b');
const LIMIT = Number(argVal('limit', '0')) || 0;
const CHECKPOINT = Number(argVal('checkpoint', '25')) || 25;
const HOST = (argVal('host', process.env.OLLAMA_HOST || 'http://127.0.0.1:11434')).replace(/\/$/, '');
const localeArg = argVal('locale', '');

const EN_VARIANTS = new Set(['en-GB', 'en-US', 'en-AU']);
const TARGET_LOCALES = localeArg
  ? localeArg.split(',').map((s) => s.trim()).filter(Boolean)
  : SHIPPED_LOCALES.filter((l) => !EN_VARIANTS.has(l));

// ---- helpers --------------------------------------------------------------
function isGlossaryProtected(key, value) {
  if (key.startsWith('units.')) return true;
  if (typeof value !== 'string') return true;
  const t = value.trim();
  if (/^(OK|No|Yes|Beta)$/i.test(t)) return true;
  if (GLOSSARY_TERMS.some((term) => t.includes(term))) return true;
  return false;
}

/** True when a string has no translatable letters (placeholders/numbers/punct only). */
function isNonTranslatable(value) {
  const stripped = value.replace(PLACEHOLDER_RE, ' ');
  return !/[A-Za-z]/.test(stripped);
}

/** A value that is only a glossary/brand/short token — never a "mixed" translation to fix. */
function isGlossaryOnlyValue(text) {
  if (typeof text !== 'string') return true;
  const t = text.trim();
  if (GLOSSARY_TERMS.some((g) => t === g || t.includes(g))) return true;
  if (/^(OK|No|Yes|Beta|WebGPU|WebGL|GDPR|AI|JSON|PDF|CPU|GPU)$/i.test(t)) return true;
  return false;
}

function loadPack(locale) {
  const filePath = path.join(dir, `${locale}.json`);
  const pack = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  pack.strings = pack.strings || {};
  return { filePath, pack };
}

function writePack(filePath, pack) {
  fs.writeFileSync(filePath, `${JSON.stringify(pack, null, 2)}\n`, 'utf8');
}

// ---- main -----------------------------------------------------------------
async function main() {
  const canonical = JSON.parse(fs.readFileSync(path.join(dir, 'en-GB.json'), 'utf8'));
  const en = canonical.strings || {};

  console.log(`ollama-translate-gaps: model=${MODEL} host=${HOST} locales=${TARGET_LOCALES.join(',')}` +
    `${DRY_RUN ? ' [dry-run]' : ''}${SKIP_CONTENT ? ' [skip-content]' : ''}${LIMIT ? ` [limit=${LIMIT}]` : ''}`);

  const summary = [];
  for (const locale of TARGET_LOCALES) {
    const meta = LOCALE_TO_TG[locale];
    if (!meta) {
      console.warn(`ollama-translate-gaps: no language mapping for ${locale} — skipping`);
      continue;
    }
    const { filePath, pack } = loadPack(locale);
    const strings = pack.strings;

    const gaps = [];
    for (const [key, enVal] of Object.entries(en)) {
      if (key.startsWith('policy.')) continue;
      if (SKIP_CONTENT && key.startsWith('content.')) continue;
      if (typeof enVal !== 'string') continue;
      if (isGlossaryProtected(key, enVal)) continue;
      if (isNonTranslatable(enVal)) continue;
      const locVal = strings[key];
      const isIdenticalGap = typeof locVal !== 'string' || locVal.trim() === enVal.trim();
      // Frankenstein string: differs from en-GB but still leaks English fragments.
      const isMixedGap = FIX_MIXED
        && typeof locVal === 'string'
        && locVal.trim() !== enVal.trim()
        && FRAGMENT_CHECK.has(locale)
        && !isGlossaryOnlyValue(locVal)
        && ENG_FRAG.test(locVal);
      if (isIdenticalGap || isMixedGap) gaps.push([key, enVal]);
    }

    const todo = LIMIT ? gaps.slice(0, LIMIT) : gaps;
    console.log(`\n=== ${locale} (${meta.name}) — ${gaps.length} gap(s)${LIMIT ? `, processing ${todo.length}` : ''} ===`);

    let done = 0;
    let failed = 0;
    let soft = 0;
    let sinceCheckpoint = 0;
    const t0 = Date.now();
    for (const [key, enVal] of todo) {
      let result;
      try {
        result = await translateOne(locale, meta, enVal, { host: HOST, model: MODEL });
      } catch (err) {
        console.warn(`  ! ${key}: ${err.message}`);
        failed += 1;
        continue;
      }
      if (result.status === 'failed' || !result.value) {
        failed += 1;
        console.warn(`  x ${key} [${result.reason}] en: ${enVal.slice(0, 70)}`);
        continue;
      }
      if (result.status === 'kept-soft') soft += 1;
      done += 1;
      if (DRY_RUN) {
        console.log(`  ${key}\n    en: ${enVal}\n    ${locale}: ${result.value}${result.status === 'kept-soft' ? '  [soft]' : ''}`);
      } else {
        strings[key] = result.value;
        sinceCheckpoint += 1;
        if (sinceCheckpoint >= CHECKPOINT) {
          writePack(filePath, pack);
          sinceCheckpoint = 0;
          const rate = (done / ((Date.now() - t0) / 1000)).toFixed(2);
          console.log(`  … checkpoint ${done}/${todo.length} (${rate}/s, ${failed} failed, ${soft} soft)`);
        }
      }
    }
    if (!DRY_RUN && sinceCheckpoint > 0) writePack(filePath, pack);
    const secs = ((Date.now() - t0) / 1000).toFixed(0);
    console.log(`--- ${locale}: filled ${done}, soft ${soft}, failed ${failed} in ${secs}s ---`);
    summary.push({ locale, gaps: gaps.length, filled: done, soft, failed });
  }

  console.log('\nollama-translate-gaps: summary');
  for (const s of summary) {
    console.log(`  ${s.locale}: ${s.filled}/${s.gaps} filled (soft ${s.soft}, failed ${s.failed})`);
  }
}

main().catch((err) => {
  console.error('ollama-translate-gaps: fatal', err);
  process.exit(1);
});
