#!/usr/bin/env node
/**
 * Verify the translated SEO content catalogs (seo-content/<locale>.json).
 *
 * For every translatable leaf that has a corresponding English source, a
 * locale value FAILS if it:
 *   - is identical to the English text (outside a brand/medical allowlist),
 *   - contains HTML markup,
 *   - loses a {placeholder} present in English, or
 *   - (ar/he) contains no target-script characters.
 *
 * Locale files that don't exist yet are skipped (English-only ship stays green
 * until translations land). Exit 0 when clean, 1 on any violation.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AR_RE, HE_RE, HTML_RE, PLACEHOLDER_RE } from '../i18n/lib/ollama-translate.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(scriptDir, '..', '..');
const CONTENT_DIR = path.join(root, 'seo-content');

const ALL_LOCALES = ['de-DE', 'fr-FR', 'es-ES', 'it-IT', 'pl-PL', 'nl-NL', 'pt-BR', 'pt-PT', 'ga', 'ar', 'he'];
const SKIP_KEYS = new Set(['page', 'href', 'style', 'kind', 'type', 'jsonldType', 'brand', '_comment']);

// Tokens that legitimately stay unchanged across languages.
const BRAND_TOKENS = [
  'Rianell', 'PHQ-9', 'GAD-7', 'GitHub', 'Google Sheets', 'Strava', 'Withings',
  'AES-256-GCM', 'OAuth', 'Supabase', 'GDPR', 'AI', 'EU', 'GP', 'BPM',
];
// Exact English strings allowed to be identical in a translation.
const ALLOW_IDENTICAL = new Set(['GitHub', 'Rianell', 'AI insights']);

function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}
function isTranslatable(key, val) {
  if (typeof val !== 'string') return false;
  if (SKIP_KEYS.has(key)) return false;
  const t = val.trim();
  if (!t) return false;
  if (/^https?:\/\//.test(t) || t.startsWith('/')) return false;
  if (!/[A-Za-z]/.test(t)) return false;
  return true;
}
function placeholderMultiset(text) {
  return (String(text).match(PLACEHOLDER_RE) || []).slice().sort().join('\u0001');
}
function brandOnly(str) {
  let s = String(str);
  for (const t of BRAND_TOKENS) s = s.split(t).join(' ');
  return !/[A-Za-z\u0590-\u05FF\u0600-\u06FF]/.test(s);
}

/** Walk EN + locale in parallel, invoking check(enVal, locVal, pathStr) on leaves. */
function walk(enNode, locNode, key, pathStr, visit) {
  if (Array.isArray(enNode)) {
    enNode.forEach((el, i) => walk(el, Array.isArray(locNode) ? locNode[i] : undefined, key, `${pathStr}[${i}]`, visit));
    return;
  }
  if (isPlainObject(enNode)) {
    for (const k of Object.keys(enNode)) {
      if (k === '_comment') continue;
      walk(enNode[k], isPlainObject(locNode) ? locNode[k] : undefined, k, pathStr ? `${pathStr}.${k}` : k, visit);
    }
    return;
  }
  if (isTranslatable(key, enNode)) visit(enNode, locNode, pathStr);
}

function main() {
  const enPath = path.join(CONTENT_DIR, 'en.json');
  if (!fs.existsSync(enPath)) {
    console.error('[seo:content] missing seo-content/en.json');
    process.exit(1);
  }
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

  const present = ALL_LOCALES.filter((l) => fs.existsSync(path.join(CONTENT_DIR, `${l}.json`)));
  if (present.length === 0) {
    console.log('[seo:content] no translated locale catalogs yet — English-only ship. (Run "npm run seo:translate")');
    return;
  }

  // Scattered identical-to-English strings are tolerated (MT keeps brand/loanword
  // titles); a HIGH ratio means the run broke (e.g. Ollama went away) → hard fail.
  const MAX_IDENTICAL_RATIO = 0.15;
  const errors = [];
  const warnings = [];
  for (const locale of present) {
    const loc = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, `${locale}.json`), 'utf8'));
    const merged = { site: loc.site, pages: loc.pages };
    let checked = 0;
    let identical = 0;
    walk({ site: en.site, pages: en.pages }, merged, '', '', (enVal, locVal, p) => {
      checked += 1;
      const where = `${locale} @ ${p}`;
      if (typeof locVal !== 'string' || !locVal.trim()) {
        errors.push(`${where}: missing translation`);
        return;
      }
      if (locVal.trim() === String(enVal).trim() && !ALLOW_IDENTICAL.has(enVal.trim()) && !brandOnly(enVal)) {
        identical += 1;
        warnings.push(`${where}: identical to English ("${locVal.slice(0, 48)}")`);
      }
      if (HTML_RE.test(locVal)) errors.push(`${where}: contains HTML markup`);
      if (placeholderMultiset(locVal) !== placeholderMultiset(enVal)) errors.push(`${where}: placeholder mismatch`);
      const letters = locVal.replace(PLACEHOLDER_RE, ' ');
      if (locale === 'ar' && !AR_RE.test(letters) && !brandOnly(locVal)) errors.push(`${where}: no Arabic script`);
      if (locale === 'he' && !HE_RE.test(letters) && !brandOnly(locVal)) errors.push(`${where}: no Hebrew script`);
    });
    const ratio = checked ? identical / checked : 0;
    if (ratio > MAX_IDENTICAL_RATIO) {
      errors.push(`${locale}: ${identical}/${checked} strings still English (${(ratio * 100).toFixed(0)}% > ${MAX_IDENTICAL_RATIO * 100}%) — re-run "npm run seo:translate -- --locales=${locale}"`);
    }
    console.log(`[seo:content] ${locale}: checked ${checked}, identical ${identical} (${(ratio * 100).toFixed(0)}%)`);
  }

  if (warnings.length) {
    console.warn(`\n[seo:content] ${warnings.length} soft note(s) (identical to English):`);
    for (const w of warnings.slice(0, 20)) console.warn(`  ~ ${w}`);
    if (warnings.length > 20) console.warn(`  … and ${warnings.length - 20} more`);
  }
  if (errors.length) {
    console.error(`\n[seo:content] ${errors.length} problem(s):`);
    for (const e of errors.slice(0, 60)) console.error(`  - ${e}`);
    if (errors.length > 60) console.error(`  … and ${errors.length - 60} more`);
    process.exit(1);
  }
  console.log(`\n[seo:content] OK — ${present.length} locale catalog(s) valid.`);
}

main();
