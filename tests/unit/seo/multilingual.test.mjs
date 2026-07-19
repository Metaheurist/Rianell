import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import {
  hreflangCluster, renderPage, pageUrl, LOCALES, PAGE_ORDER, PAGE_META,
} from '../../../scripts/build/seo-page-template.mjs';
import { buildOutputs } from '../../../scripts/build/generate-localized-pages.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..', '..');
const webRoot = path.join(root, 'apps', 'pwa-webapp');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'seo-content', 'en.json'), 'utf8'));

// ---- reciprocal hreflang cluster -----------------------------------------
test('hreflang cluster is reciprocal, complete, and has x-default', () => {
  const pairs = hreflangCluster('features');
  const map = new Map(pairs);
  // 4 English variants + 11 locales + x-default.
  assert.equal(pairs.length, 4 + LOCALES.length + 1);
  assert.equal(map.get('en'), 'https://rianell.com/features/');
  assert.equal(map.get('x-default'), 'https://rianell.com/features/');
  assert.equal(map.get('de'), 'https://rianell.com/de/features/');
  assert.equal(map.get('pt-BR'), 'https://rianell.com/pt-br/features/');
  assert.equal(map.get('ar'), 'https://rianell.com/ar/features/');
  // Home cluster maps English to the app root and locales to /<slug>/.
  const home = new Map(hreflangCluster('home'));
  assert.equal(home.get('en'), 'https://rianell.com/');
  assert.equal(home.get('de'), 'https://rianell.com/de/');
});

// ---- rendering per locale -------------------------------------------------
test('renders an LTR locale page with localized head + self-referencing cluster', () => {
  const html = renderPage({
    pageKey: 'features', locale: 'de-DE', content: catalog.pages.features, site: catalog.site,
  });
  assert.match(html, /<html lang="de">/);
  assert.ok(!/dir="rtl"/.test(html), 'de-DE must not be RTL');
  assert.match(html, /<meta property="og:locale" content="de_DE"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/rianell\.com\/de\/features\/"/);
  assert.match(html, /<!-- hreflang:start -->[\s\S]*<!-- hreflang:end -->/);
  assert.match(html, /<link rel="alternate" hreflang="de" href="https:\/\/rianell\.com\/de\/features\/" \/>/);
  assert.match(html, /<link rel="alternate" hreflang="x-default" href="https:\/\/rianell\.com\/features\/" \/>/);
  assert.match(html, /<script defer src="\/lang-suggest\.js"><\/script>/);
});

test('renders an RTL locale page with dir="rtl" and RTL CSS', () => {
  const html = renderPage({
    pageKey: 'features', locale: 'ar', content: catalog.pages.features, site: catalog.site,
  });
  assert.match(html, /<html lang="ar" dir="rtl">/);
  assert.match(html, /<meta property="og:locale" content="ar_AR"/);
  assert.match(html, /\[dir=rtl\]/, 'RTL pages should include logical-property CSS overrides');
});

test('localized JSON-LD sets inLanguage and localized canonical @id', () => {
  const html = renderPage({
    pageKey: 'mental-health-check', locale: 'fr-FR', content: catalog.pages['mental-health-check'], site: catalog.site,
  });
  const block = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(block, 'expected a JSON-LD block');
  const data = JSON.parse(block[1]);
  const page = data['@graph'].find((n) => String(n['@id'] || '').endsWith('#page'));
  assert.equal(page.inLanguage, 'fr');
  assert.equal(page['@id'], 'https://rianell.com/fr/mental-health-check/#page');
  assert.ok(data['@graph'].some((n) => n['@type'] === 'FAQPage'), 'mental-health FAQPage carried into locale');
});

// ---- generator determinism + coverage -------------------------------------
test('generator is deterministic and covers English + all locale trees', () => {
  const a = buildOutputs({ englishOnly: false });
  // 7 English pages (home excluded) + 8 pages x 11 locales.
  assert.equal(a.size, 7 + PAGE_ORDER.length * LOCALES.length);
  // A page renders identically across two independent calls.
  const one = renderPage({ pageKey: 'about', locale: 'es-ES', content: catalog.pages.about, site: catalog.site });
  const two = renderPage({ pageKey: 'about', locale: 'es-ES', content: catalog.pages.about, site: catalog.site });
  assert.equal(one, two);
  // Expected output paths exist in the map.
  assert.ok(a.has(path.join('de', 'features', 'index.html').split(path.sep).join('/')) || a.has('de/features/index.html'));
});

// ---- generated files on disk ----------------------------------------------
test('generated localized pages exist with correct canonical + hreflang', () => {
  for (const rel of ['de/features/index.html', 'pt-br/features/index.html', 'ar/mental-health-check/index.html', 'he/index.html']) {
    const abs = path.join(webRoot, rel);
    assert.ok(fs.existsSync(abs), `missing generated page: ${rel}`);
    const html = fs.readFileSync(abs, 'utf8');
    assert.match(html, /hreflang="x-default"/, `${rel} missing x-default`);
    assert.match(html, /<link rel="canonical" href="https:\/\/rianell\.com\//, `${rel} missing canonical`);
  }
  const ar = fs.readFileSync(path.join(webRoot, 'ar/mental-health-check/index.html'), 'utf8');
  assert.match(ar, /<html lang="ar" dir="rtl">/, 'Arabic page must be RTL');
});

// ---- language-suggestion banner (evaluated in a Node vm sandbox) ----------
function loadBanner() {
  const src = fs.readFileSync(path.join(webRoot, 'lang-suggest.js'), 'utf8');
  const sandbox = { module: { exports: {} } };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox.module.exports;
}

test('lang-suggest maps browser languages to shipped locales', () => {
  const b = loadBanner();
  assert.equal(b.pickLocale(['de']), 'de');
  assert.equal(b.pickLocale(['de-AT']), 'de');
  assert.equal(b.pickLocale(['fr-CA']), 'fr');
  assert.equal(b.pickLocale(['pt-BR']), 'ptbr');
  assert.equal(b.pickLocale(['pt-PT']), 'ptpt');
  assert.equal(b.pickLocale(['pt']), 'ptpt');
  assert.equal(b.pickLocale(['he']), 'he');
  assert.equal(b.pickLocale(['iw']), 'he');
  assert.equal(b.pickLocale(['en-US']), null, 'English visitors get no banner');
  assert.equal(b.pickLocale(['xx', 'ar']), 'ar', 'falls through to the first supported language');
});

test('lang-suggest builds the correct localized target path (no redirect logic)', () => {
  const b = loadBanner();
  assert.equal(b.targetFor(b.L.de, '/features/'), '/de/features/');
  assert.equal(b.targetFor(b.L.de, '/'), '/de/');
  assert.equal(b.targetFor(b.L.ptbr, '/about.html'), '/pt-br/about.html');
  // Only known base paths are eligible.
  assert.ok(b.BASE_PATHS.includes('/features/'));
  assert.ok(!b.BASE_PATHS.includes('/privacy.html'), 'legal pages are not offered for machine translation');
});
