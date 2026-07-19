#!/usr/bin/env node
/**
 * Translate the English SEO content catalog (seo-content/en.json) into the 11
 * non-English shipped locales, writing seo-content/<locale>.json.
 *
 * Reuses the shared TranslateGemma/Ollama helpers (prompt, glossary/placeholder
 * protection, output cleaning, validation) from lib/ollama-translate.mjs — the
 * same pipeline the locale-pack gap filler uses.
 *
 * Checkpointed & resumable: existing non-English values are kept (so re-runs only
 * fill missing/failed leaves). Structure (page/href/style/kind/type) is copied
 * from English verbatim, never translated.
 *
 * Usage:
 *   node scripts/i18n/translate-seo-pages.mjs                       # all locales, all pages
 *   node scripts/i18n/translate-seo-pages.mjs --locales=de-DE,fr-FR
 *   node scripts/i18n/translate-seo-pages.mjs --pages=features,about
 *   node scripts/i18n/translate-seo-pages.mjs --force               # re-translate everything
 *   node scripts/i18n/translate-seo-pages.mjs --model=... --host=...
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCALE_TO_TG, translateOne } from './lib/ollama-translate.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(scriptDir, '..', '..');
const CONTENT_DIR = path.join(root, 'seo-content');

const ALL_LOCALES = ['de-DE', 'fr-FR', 'es-ES', 'it-IT', 'pl-PL', 'nl-NL', 'pt-BR', 'pt-PT', 'ga', 'ar', 'he'];

// Keys whose string values are structural/URLs/enums and must never be translated.
const SKIP_KEYS = new Set(['page', 'href', 'style', 'kind', 'type', 'jsonldType', 'brand', '_comment']);

function argVal(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}
function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

const MODEL = argVal('model', 'translategemma:27b');
const HOST = argVal('host', process.env.OLLAMA_HOST || 'http://127.0.0.1:11434').replace(/\/$/, '');
const FORCE = hasFlag('force');
const localesArg = argVal('locales', '');
const pagesArg = argVal('pages', '');
const LOCALES = localesArg ? localesArg.split(',').map((s) => s.trim()).filter(Boolean) : ALL_LOCALES;
const PAGE_FILTER = pagesArg ? new Set(pagesArg.split(',').map((s) => s.trim()).filter(Boolean)) : null;

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

async function ollamaReachable() {
  try {
    const res = await fetch(`${HOST}/api/tags`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function writeJson(p, obj) {
  fs.writeFileSync(p, `${JSON.stringify(obj, null, 2)}\n`, 'utf8');
}

function main() {
  return (async () => {
    const enPath = path.join(CONTENT_DIR, 'en.json');
    const en = readJson(enPath);
    const meta = {};

    if (!(await ollamaReachable())) {
      console.error(`[seo:translate] Ollama not reachable at ${HOST}. Start Ollama (with ${MODEL}) or pass --host=. English pages still ship; localized bodies fill in on a later run.`);
      process.exit(1);
    }

    for (const locale of LOCALES) {
      const tg = LOCALE_TO_TG[locale];
      if (!tg) { console.warn(`[seo:translate] no TranslateGemma metadata for ${locale}, skipping`); continue; }
      meta[locale] = tg;

      const outPath = path.join(CONTENT_DIR, `${locale}.json`);
      const existing = !FORCE && fs.existsSync(outPath) ? readJson(outPath) : null;
      const outCatalog = { _comment: `Machine-translated (${MODEL}) SEO copy for ${locale}. Regenerate with: npm run seo:translate -- --locales=${locale}. Structure mirrors seo-content/en.json.` };

      const stats = { ok: 0, soft: 0, failed: 0, skipped: 0 };

      async function transform(enNode, exNode, keyName) {
        if (Array.isArray(enNode)) {
          const out = [];
          for (let i = 0; i < enNode.length; i++) {
            out.push(await transform(enNode[i], Array.isArray(exNode) ? exNode[i] : undefined, keyName));
          }
          return out;
        }
        if (isPlainObject(enNode)) {
          const out = {};
          for (const k of Object.keys(enNode)) {
            if (k === '_comment') continue;
            out[k] = await transform(enNode[k], isPlainObject(exNode) ? exNode[k] : undefined, k);
          }
          return out;
        }
        if (!isTranslatable(keyName, enNode)) return enNode;
        if (typeof exNode === 'string' && exNode.trim() && exNode.trim() !== String(enNode).trim()) {
          stats.skipped += 1;
          return exNode;
        }
        let result;
        try {
          result = await translateOne(locale, tg, enNode, { host: HOST, model: MODEL });
        } catch (err) {
          console.warn(`    ! ${keyName}: ${err.message}`);
          stats.failed += 1;
          return enNode;
        }
        if (result.status === 'ok') stats.ok += 1;
        else if (result.status === 'kept-soft') { stats.soft += 1; }
        else { stats.failed += 1; }
        return result.value || enNode;
      }

      console.log(`\n[seo:translate] ${locale} (${tg.name})`);
      outCatalog.site = await transform(en.site, existing?.site, 'site');
      writeJson(outPath, outCatalog);

      outCatalog.pages = existing?.pages ? { ...existing.pages } : {};
      for (const pageKey of Object.keys(en.pages)) {
        if (PAGE_FILTER && !PAGE_FILTER.has(pageKey)) {
          outCatalog.pages[pageKey] = existing?.pages?.[pageKey] || en.pages[pageKey];
          continue;
        }
        process.stdout.write(`  - ${pageKey} … `);
        outCatalog.pages[pageKey] = await transform(en.pages[pageKey], existing?.pages?.[pageKey], pageKey);
        writeJson(outPath, outCatalog);
        console.log('done');
      }

      console.log(`  ${locale}: ok=${stats.ok} soft=${stats.soft} failed=${stats.failed} kept=${stats.skipped} -> ${path.relative(root, outPath)}`);
    }
    console.log('\n[seo:translate] complete. Run "npm run seo:content:check" then "npm run seo:pages".');
  })();
}

main().catch((err) => { console.error(err); process.exit(1); });
