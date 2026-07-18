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
import { GLOSSARY_TERMS, protectGlossary, restoreGlossary } from '@rianell/build-tools/i18n-glossary';

const root = process.cwd();
const dir = canonicalLocalePacksDir(root);

// ---- args -----------------------------------------------------------------
function argVal(name, fallback) {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=').slice(1).join('=') : fallback;
}
const DRY_RUN = process.argv.includes('--dry-run');
const SKIP_CONTENT = process.argv.includes('--skip-content');
const MODEL = argVal('model', 'translategemma:27b');
const LIMIT = Number(argVal('limit', '0')) || 0;
const CHECKPOINT = Number(argVal('checkpoint', '25')) || 25;
const HOST = (argVal('host', process.env.OLLAMA_HOST || 'http://127.0.0.1:11434')).replace(/\/$/, '');
const localeArg = argVal('locale', '');

const EN_VARIANTS = new Set(['en-GB', 'en-US', 'en-AU']);
const TARGET_LOCALES = localeArg
  ? localeArg.split(',').map((s) => s.trim()).filter(Boolean)
  : SHIPPED_LOCALES.filter((l) => !EN_VARIANTS.has(l));

// ---- locale metadata for the TranslateGemma prompt ------------------------
const LOCALE_TO_TG = {
  'pt-BR': { name: 'Portuguese', code: 'pt-BR' },
  'pt-PT': { name: 'Portuguese', code: 'pt-PT' },
  'fr-FR': { name: 'French', code: 'fr' },
  'de-DE': { name: 'German', code: 'de' },
  'es-ES': { name: 'Spanish', code: 'es' },
  'it-IT': { name: 'Italian', code: 'it' },
  'nl-NL': { name: 'Dutch', code: 'nl' },
  'pl-PL': { name: 'Polish', code: 'pl' },
  ga: { name: 'Irish', code: 'ga' },
  ar: { name: 'Arabic', code: 'ar' },
  he: { name: 'Hebrew', code: 'he' },
};

// Locales where a Latin-script English fragment indicates a bad ("Frankenstein") translation.
const FRAGMENT_CHECK = new Set([
  'pt-BR', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'nl-NL', 'pl-PL', 'pt-PT', 'ga', 'ar', 'he',
]);
const ENG_FRAG = /\b(the|and|Entry|Log|Save|Exercise|Install|optional|return to|with the|your|this|from|for|to|add|notes|data|export|disabled)\b/i;
const HTML_RE = /<\/?[a-z][\s\S]*?>/i;
const AR_RE = /[\u0600-\u06FF\u0750-\u077F]/;
const HE_RE = /[\u0590-\u05FF]/;
const PLACEHOLDER_RE = /\{[^}]+\}/g;

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

function placeholderMultiset(text) {
  const list = (text.match(PLACEHOLDER_RE) || []).slice().sort();
  return list.join('\u0001');
}

/** Mask {curly} placeholders so the model cannot translate the token names. */
function protectPlaceholders(text) {
  const map = [];
  const out = text.replace(PLACEHOLDER_RE, (m) => {
    const ph = `__PH${map.length}__`;
    map.push({ ph, val: m });
    return ph;
  });
  return { text: out, map };
}

function restorePlaceholders(text, map) {
  let out = text;
  for (const { ph, val } of map) out = out.split(ph).join(val);
  return out;
}

function stripWrappingQuotes(src, out) {
  const pairs = [['"', '"'], ["'", "'"], ['`', '`'], ['«', '»'], ['“', '”']];
  let s = out.trim();
  for (const [open, close] of pairs) {
    if (s.length >= 2 && s.startsWith(open) && s.endsWith(close) && !(src.startsWith(open) && src.endsWith(close))) {
      s = s.slice(open.length, s.length - close.length).trim();
      break;
    }
  }
  return s;
}

/**
 * TranslateGemma often returns several options for a short/ambiguous UI label
 * (e.g. "Nourriture / Alimentation" or "Remarques ; Notes"). For UI microcopy we
 * keep the first option — but only when the English source has no such separator.
 */
function pickFirstAlternative(src, out) {
  const sep = /\s[/;|]\s/;
  if (sep.test(out) && !sep.test(src)) {
    const first = out.split(sep)[0].trim();
    if (first) return first;
  }
  return out;
}

/** Drop a trailing sentence punctuation the model added when the source had none. */
function stripAddedTrailingPunct(src, out) {
  const s = src.trim();
  const o = out.trim();
  if (!/[.!?…]$/.test(s) && /[.!?]+$/.test(o)) {
    return o.replace(/\s*[.!?]+$/, '').trim();
  }
  return o;
}

function cleanOutput(src, raw) {
  let s = String(raw || '').trim();
  // Keep only the first line if the model added commentary on later lines
  // (but preserve intentional multi-line source such as settings.benchmark.result).
  if (!/\n/.test(src) && /\n/.test(s)) {
    s = s.split('\n').map((l) => l.trim()).filter(Boolean)[0] || s;
  }
  // Drop a leading "Translation:" / language-label prefix if the model added one.
  s = s.replace(/^(translation|traducción|traduction|übersetzung|tradução|traduzione|vertaling|tłumaczenie|aistriúchán)\s*[:：]\s*/i, '');
  s = stripWrappingQuotes(src, s);
  s = pickFirstAlternative(src, s);
  s = stripAddedTrailingPunct(src, s);
  return s.trim();
}

function buildPrompt(src, meta) {
  const { name, code } = meta;
  return (
    `You are a professional English (en) to ${name} (${code}) translator. ` +
    `Your goal is to accurately convey the meaning and nuances of the original English text ` +
    `while adhering to ${name} grammar, vocabulary, and cultural sensitivities.\n` +
    `Produce only the ${name} translation, without any additional explanations or commentary. ` +
    `Please translate the following English text into ${name}:\n\n\n` +
    `${src}\n`
  );
}

async function ollamaGenerate(prompt) {
  const res = await fetch(`${HOST}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      keep_alive: '30m',
      options: { temperature: 0, num_predict: 512 },
    }),
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}: ${await res.text().catch(() => '')}`);
  const data = await res.json();
  if (typeof data?.response !== 'string') throw new Error('Ollama: no response field');
  return data.response;
}

/** Validate a candidate translation. Returns {ok, reason}. */
function validate(locale, src, candidate) {
  if (!candidate || !candidate.trim()) return { ok: false, reason: 'empty' };
  if (candidate.trim() === src.trim()) return { ok: false, reason: 'identical-to-en' };
  if (placeholderMultiset(candidate) !== placeholderMultiset(src)) return { ok: false, reason: 'placeholder-mismatch' };
  if (HTML_RE.test(candidate)) return { ok: false, reason: 'html' };
  // ar/he must contain target script (unless the string is only glossary/placeholders).
  const letters = candidate.replace(PLACEHOLDER_RE, ' ');
  if (locale === 'ar' && !AR_RE.test(letters)) return { ok: false, reason: 'not-arabic-script' };
  if (locale === 'he' && !HE_RE.test(letters)) return { ok: false, reason: 'not-hebrew-script' };
  return { ok: true, reason: '' };
}

/** Soft mixed-language signal (retry once, but do not hard-reject). */
function hasEnglishFragment(locale, candidate) {
  if (!FRAGMENT_CHECK.has(locale)) return false;
  return ENG_FRAG.test(candidate);
}

async function translateOne(locale, meta, src) {
  const { text: gText, placeholders: gloss } = protectGlossary(src);
  const { text: maskedSrc, map: phMap } = protectPlaceholders(gText);
  let best = null;
  let lastReason = 'unknown';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let raw;
    try {
      raw = await ollamaGenerate(buildPrompt(maskedSrc, meta));
    } catch (err) {
      if (attempt === 1) throw err;
      await new Promise((r) => setTimeout(r, 500));
      continue;
    }
    let candidate = cleanOutput(src, raw);
    const lostGloss = gloss.some((p) => !candidate.includes(p.ph));
    const lostPh = phMap.some((p) => !candidate.includes(p.ph));
    candidate = restorePlaceholders(candidate, phMap);
    candidate = restoreGlossary(candidate, gloss);
    const check = validate(locale, src, candidate);
    if (check.ok && !hasEnglishFragment(locale, candidate) && !lostGloss && !lostPh) {
      return { value: candidate, status: 'ok', reason: '' };
    }
    lastReason = lostPh
      ? 'placeholder-lost'
      : lostGloss
        ? 'glossary-lost'
        : !check.ok
          ? check.reason
          : 'english-fragment';
    if (check.ok && !lostPh && !lostGloss && !best) best = candidate; // keep first structurally-valid candidate
  }
  if (best) return { value: best, status: 'kept-soft', reason: lastReason };
  return { value: null, status: 'failed', reason: lastReason };
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
      if (typeof locVal === 'string' && locVal.trim() !== enVal.trim()) continue; // already translated
      gaps.push([key, enVal]);
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
        result = await translateOne(locale, meta, enVal);
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
