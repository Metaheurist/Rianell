#!/usr/bin/env node
/**
 * Generate apps/pwa-webapp/sitemap.xml for https://rianell.com/.
 *
 * Scans the PWA web root for public, indexable HTML:
 *   - top-level *.html (e.g. index.html, about.html, privacy.html, tos.html)
 *   - one level of <section>/index.html folder pages (e.g. features/, community/)
 * Excludes non-content / noindex pages (404, connector-success, design-catalog,
 * and anything carrying <meta name="robots" content="noindex">).
 *
 * Usage:
 *   node scripts/build/generate-sitemap.mjs                # write apps/pwa-webapp/sitemap.xml
 *   node scripts/build/generate-sitemap.mjs --site <dir>   # write <dir>/sitemap.xml (built site)
 *   node scripts/build/generate-sitemap.mjs --check        # verify committed sitemap is up to date (exit 1 if stale)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(scriptDir, '..', '..');
const WEB_ROOT = path.join(root, 'apps', 'pwa-webapp');
const BASE_URL = 'https://rianell.com/';

// Files/dirs that must never appear in the sitemap.
const EXCLUDE_FILES = new Set(['404.html', 'connector-success.html']);
const EXCLUDE_DIRS = new Set(['node_modules', '.trace-build', '.android-dist', 'design-catalog', 'Icons', 'models', 'i18n-packs', 'partials']);

function parseArgs(argv) {
  let siteDir = '';
  let check = false;
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--site' && args[i + 1]) { siteDir = args[i + 1]; i++; }
    else if (args[i] === '--check') { check = true; }
  }
  return { siteDir: siteDir ? path.resolve(siteDir) : '', check };
}

function isNoindex(html) {
  return /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
}

/** Return sorted list of site-relative URL paths (e.g. "", "about.html", "features/"). */
export function collectRoutes(webRoot) {
  const routes = [];

  // Top-level *.html
  for (const name of fs.readdirSync(webRoot)) {
    if (!name.endsWith('.html')) continue;
    if (EXCLUDE_FILES.has(name)) continue;
    const html = fs.readFileSync(path.join(webRoot, name), 'utf8');
    if (isNoindex(html)) continue;
    routes.push(name === 'index.html' ? '' : name);
  }

  // One level of <dir>/index.html
  for (const name of fs.readdirSync(webRoot)) {
    if (EXCLUDE_DIRS.has(name)) continue;
    const dir = path.join(webRoot, name);
    if (!fs.statSync(dir).isDirectory()) continue;
    const indexPath = path.join(dir, 'index.html');
    if (!fs.existsSync(indexPath)) continue;
    const html = fs.readFileSync(indexPath, 'utf8');
    if (isNoindex(html)) continue;
    routes.push(`${name}/`);
  }

  return [...new Set(routes)].sort((a, b) => a.localeCompare(b));
}

export function buildSitemap(webRoot, lastmod) {
  const date = lastmod || new Date().toISOString().slice(0, 10);
  const routes = collectRoutes(webRoot);
  const urls = routes
    .map((r) => {
      // Home page gets top priority; folder section pages next; legal pages lower.
      let priority = '0.6';
      if (r === '') priority = '1.0';
      else if (r.endsWith('/')) priority = '0.8';
      else if (r === 'about.html') priority = '0.7';
      else if (r === 'privacy.html' || r === 'tos.html') priority = '0.3';
      const changefreq = r === '' ? 'weekly' : 'monthly';
      return `  <url>\n    <loc>${BASE_URL}${r}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function main() {
  const { siteDir, check } = parseArgs(process.argv);
  const webRoot = siteDir || WEB_ROOT;
  const outPath = path.join(webRoot, 'sitemap.xml');
  const xml = buildSitemap(webRoot);

  if (check) {
    const current = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
    // Compare ignoring volatile <lastmod> dates and platform line endings (core.autocrlf).
    const strip = (s) => s.replace(/\r\n/g, '\n').replace(/<lastmod>[^<]*<\/lastmod>/g, '');
    if (strip(current) !== strip(xml)) {
      console.error('[sitemap] stale: run "npm run seo:sitemap" and commit apps/pwa-webapp/sitemap.xml');
      process.exit(1);
    }
    console.log('[sitemap] up to date:', collectRoutes(webRoot).length, 'urls');
    return;
  }

  fs.writeFileSync(outPath, xml, 'utf8');
  console.log('[sitemap] wrote', path.relative(root, outPath), '-', collectRoutes(webRoot).length, 'urls');
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main();
}
