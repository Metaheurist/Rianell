#!/usr/bin/env node
/**
 * Generate Rianell's crawlable multilingual SEO pages.
 *
 * Reads the English source catalog (seo-content/en.json) and, when present,
 * per-locale translated catalogs (seo-content/<locale>.json). Renders:
 *   - English marketing + about pages at their canonical paths, and
 *   - one localized tree per non-English shipped locale under /<slug>/…,
 * each carrying the full reciprocal hreflang cluster. Also injects the same
 * cluster (for the home page) into the app shell index.html.
 *
 * Usage:
 *   node scripts/build/generate-localized-pages.mjs                 # write into apps/pwa-webapp
 *   node scripts/build/generate-localized-pages.mjs --site <dir>    # write into a built site dir
 *   node scripts/build/generate-localized-pages.mjs --english-only  # only English pages + index cluster
 *   node scripts/build/generate-localized-pages.mjs --check         # verify tree is up to date (exit 1 if stale)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  LOCALES, PAGE_ORDER, PAGE_META, HREFLANG_START, HREFLANG_END,
  renderPage, clusterLinksHtml, outPath,
} from './seo-page-template.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(scriptDir, '..', '..');
const WEB_ROOT = path.join(root, 'apps', 'pwa-webapp');
const CONTENT_DIR = path.join(root, 'seo-content');

function parseArgs(argv) {
  let siteDir = '';
  let check = false;
  let englishOnly = false;
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--site' && args[i + 1]) { siteDir = args[i + 1]; i++; }
    else if (args[i] === '--check') check = true;
    else if (args[i] === '--english-only') englishOnly = true;
  }
  return { siteDir: siteDir ? path.resolve(siteDir) : '', check, englishOnly };
}

function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

/** Deep-merge translated `override` over English `base`, preserving structure. */
function merge(base, override) {
  if (override === undefined) return base;
  if (Array.isArray(base) && Array.isArray(override)) {
    return base.map((el, i) => merge(el, override[i]));
  }
  if (isPlainObject(base) && isPlainObject(override)) {
    const out = {};
    for (const k of Object.keys(base)) out[k] = merge(base[k], override[k]);
    for (const k of Object.keys(override)) if (!(k in out)) out[k] = override[k];
    return out;
  }
  return override === null || override === undefined ? base : override;
}

function loadEnglish() {
  const p = path.join(CONTENT_DIR, 'en.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadLocale(locale, en) {
  const p = path.join(CONTENT_DIR, `${locale}.json`);
  if (!fs.existsSync(p)) return en;
  const loc = JSON.parse(fs.readFileSync(p, 'utf8'));
  return { site: merge(en.site, loc.site), pages: merge(en.pages, loc.pages) };
}

/** Build the map of { relativePath: htmlString } this generator owns. */
function buildOutputs({ englishOnly }) {
  const en = loadEnglish();
  const outputs = new Map();
  const locales = englishOnly ? ['en'] : ['en', ...LOCALES];

  for (const locale of locales) {
    const catalog = locale === 'en' ? en : loadLocale(locale, en);
    for (const pageKey of PAGE_ORDER) {
      if (locale === 'en' && !PAGE_META[pageKey].generateEnglish) continue;
      const content = catalog.pages[pageKey];
      const html = renderPage({ pageKey, locale, content, site: catalog.site });
      outputs.set(outPath(pageKey, locale), html);
    }
  }
  return outputs;
}

function injectCluster(html) {
  const eol = html.includes('\r\n') ? '\r\n' : '\n';
  const block = clusterLinksHtml('home', '  ').split('\n').join(eol);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (html.includes(HREFLANG_START) && html.includes(HREFLANG_END)) {
    const re = new RegExp(`${esc(HREFLANG_START)}[\\s\\S]*?${esc(HREFLANG_END)}`);
    return html.replace(re, block);
  }
  const runRe = /(?:[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*"\s*\/?>[ \t]*\r?\n)+/;
  if (runRe.test(html)) return html.replace(runRe, `${block}${eol}`);
  const canRe = /([ \t]*<link rel="canonical"[^>]*>[ \t]*\r?\n)/;
  return html.replace(canRe, `$1${block}${eol}`);
}

const stripEol = (s) => s.replace(/\r\n/g, '\n');

function main() {
  const { siteDir, check, englishOnly } = parseArgs(process.argv);
  const webRoot = siteDir || WEB_ROOT;
  const outputs = buildOutputs({ englishOnly });

  // Index.html cluster injection (home page cluster).
  const indexPath = path.join(webRoot, 'index.html');
  let indexBefore = null;
  let indexAfter = null;
  if (fs.existsSync(indexPath)) {
    indexBefore = fs.readFileSync(indexPath, 'utf8');
    indexAfter = injectCluster(indexBefore);
  }

  if (check) {
    const stale = [];
    for (const [rel, html] of outputs) {
      const abs = path.join(webRoot, rel);
      const current = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
      if (stripEol(current) !== stripEol(html)) stale.push(rel);
    }
    if (indexBefore !== null && stripEol(indexBefore) !== stripEol(indexAfter)) stale.push('index.html (hreflang cluster)');
    if (stale.length) {
      console.error('[seo:pages] stale — run "npm run seo:pages" and commit:\n  ' + stale.join('\n  '));
      process.exit(1);
    }
    console.log(`[seo:pages] up to date: ${outputs.size} generated pages${englishOnly ? ' (english-only)' : ''}`);
    return;
  }

  let written = 0;
  for (const [rel, html] of outputs) {
    const abs = path.join(webRoot, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, html, 'utf8');
    written++;
  }
  if (indexBefore !== null && indexBefore !== indexAfter) {
    fs.writeFileSync(indexPath, indexAfter, 'utf8');
    console.log('[seo:pages] injected hreflang cluster into index.html');
  }
  console.log(`[seo:pages] wrote ${written} page(s) into ${path.relative(root, webRoot) || '.'}${englishOnly ? ' (english-only)' : ''}`);
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) main();

export { buildOutputs, injectCluster };
