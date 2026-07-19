import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectRoutes, buildSitemap } from '../../../scripts/build/generate-sitemap.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..', '..');
const webRoot = path.join(root, 'apps', 'pwa-webapp');

test('collectRoutes includes the home page and all content section pages', () => {
  const routes = collectRoutes(webRoot);
  for (const expected of [
    '',
    'about.html',
    'privacy.html',
    'tos.html',
    'features/',
    'symptom-tracking/',
    'mental-health-check/',
    'ai-insights/',
    'community/',
    'conditions/',
  ]) {
    assert.ok(routes.includes(expected), `sitemap route missing: "${expected}"`);
  }
});

test('collectRoutes excludes non-content and noindex pages', () => {
  const routes = collectRoutes(webRoot);
  assert.ok(!routes.includes('404.html'), '404.html must not be in sitemap');
  assert.ok(!routes.includes('connector-success.html'), 'connector-success.html must not be in sitemap');
  assert.ok(!routes.some((r) => r.startsWith('design-catalog')), 'design-catalog must not be in sitemap');
  assert.ok(!routes.some((r) => r.startsWith('Icons')), 'asset dirs must not be in sitemap');
});

test('buildSitemap emits valid urlset with absolute rianell.com URLs', () => {
  const xml = buildSitemap(webRoot, '2026-01-01');
  assert.match(xml, /<\?xml version="1\.0" encoding="UTF-8"\?>/);
  // urlset now declares the xhtml namespace for hreflang alternates.
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9" xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml">/);
  assert.match(xml, /<loc>https:\/\/rianell\.com\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/rianell\.com\/features\/<\/loc>/);
  // Home page has top priority
  assert.match(xml, /<loc>https:\/\/rianell\.com\/<\/loc>\s*<lastmod>2026-01-01<\/lastmod>\s*<changefreq>weekly<\/changefreq>\s*<priority>1\.0<\/priority>/);
});

test('buildSitemap includes localized routes with reciprocal hreflang alternates', () => {
  const xml = buildSitemap(webRoot, '2026-01-01');
  // Localized landing + section pages exist.
  assert.match(xml, /<loc>https:\/\/rianell\.com\/de\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/rianell\.com\/pt-br\/features\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/rianell\.com\/ar\/mental-health-check\/<\/loc>/);
  // Every clustered <url> carries the full alternate set incl. x-default.
  assert.match(xml, /<xhtml:link rel="alternate" hreflang="x-default" href="https:\/\/rianell\.com\/features\/" \/>/);
  assert.match(xml, /<xhtml:link rel="alternate" hreflang="de" href="https:\/\/rianell\.com\/de\/features\/" \/>/);
  // The English home url references localized alternates too.
  assert.match(xml, /<loc>https:\/\/rianell\.com\/<\/loc>[\s\S]*?<xhtml:link rel="alternate" hreflang="he" href="https:\/\/rianell\.com\/he\/" \/>/);
});

test('committed sitemap.xml is up to date (ignoring lastmod dates)', () => {
  const committed = fs.readFileSync(path.join(webRoot, 'sitemap.xml'), 'utf8');
  const generated = buildSitemap(webRoot);
  // EOL-agnostic (core.autocrlf makes the working tree CRLF on Windows, LF in CI) and lastmod-agnostic.
  const strip = (s) => s.replace(/\r\n/g, '\n').replace(/<lastmod>[^<]*<\/lastmod>/g, '');
  assert.equal(
    strip(committed),
    strip(generated),
    'apps/pwa-webapp/sitemap.xml is stale - run "npm run seo:sitemap" and commit',
  );
});

test('robots.txt references the sitemap URL', () => {
  const robots = fs.readFileSync(path.join(webRoot, 'robots.txt'), 'utf8');
  assert.match(robots, /Sitemap:\s*https:\/\/rianell\.com\/sitemap\.xml/);
});
