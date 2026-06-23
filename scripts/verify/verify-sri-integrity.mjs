#!/usr/bin/env node
/**
 * CI guard: CDN script/link tags in index.html and dynamic loaders must have SRI.
 * Reads apps/pwa-webapp/cdn-manifest.json for pinned integrity values.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '../..');
const indexPath = path.join(root, 'apps/pwa-webapp/index.html');
const manifestPath = path.join(root, 'apps/pwa-webapp/cdn-manifest.json');
const perfUtilsPath = path.join(root, 'apps/pwa-webapp/performance-utils.js');

const CDN_HOST = 'cdn.jsdelivr.net';
const INTEGRITY_RE = /integrity\s*=\s*["'](sha(?:256|384|512)-[^"']+)["']/i;

function read(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (e) {
    console.error(`verify-sri-integrity: missing file ${file}`);
    process.exit(1);
  }
}

let failed = false;

function fail(msg) {
  console.error(`verify-sri-integrity: ${msg}`);
  failed = true;
}

const html = read(indexPath);
const perf = read(perfUtilsPath);

// Static <script src="https://cdn.jsdelivr.net/..."> in index.html
const scriptTagRe = /<script\b[^>]*\bsrc\s*=\s*["']https:\/\/cdn\.jsdelivr\.net\/[^"']+["'][^>]*>/gi;
for (const tag of html.match(scriptTagRe) || []) {
  const m = tag.match(INTEGRITY_RE);
  if (!m || !m[1] || m[1].includes('PLACEHOLDER')) {
    fail(`missing or placeholder integrity on script tag: ${tag.slice(0, 120)}…`);
  }
}

// Static <link href="https://cdn.jsdelivr.net/..."> in index.html (not dynamically injected)
const linkTagRe = /<link\b[^>]*\bhref\s*=\s*["']https:\/\/cdn\.jsdelivr\.net\/[^"']+["'][^>]*>/gi;
for (const tag of html.match(linkTagRe) || []) {
  const m = tag.match(INTEGRITY_RE);
  if (!m || !m[1] || m[1].includes('PLACEHOLDER')) {
    fail(`missing or placeholder integrity on link tag: ${tag.slice(0, 120)}…`);
  }
}

// Font Awesome deferred loader must set integrity when creating <link>
const faUrl = 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.7.2/css/all.min.css';
if (!html.includes(faUrl)) {
  fail('Font Awesome CDN URL not found in index.html loader');
} else if (!html.includes("l.integrity = 'sha384-") && !html.includes('l.integrity = "sha384-')) {
  fail('Font Awesome deferred loader must set l.integrity before appendChild');
}

// Supabase UMD dynamic loader in performance-utils.js
if (!perf.includes('SUPABASE_UMD_INTEGRITY')) {
  fail('performance-utils.js missing SUPABASE_UMD_INTEGRITY constant');
} else if (!/SUPABASE_UMD_INTEGRITY\s*=\s*['"]sha(256|384|512)-[^'"]+['"]/.test(perf)) {
  fail('SUPABASE_UMD_INTEGRITY must be a non-empty sha* digest');
}
if (!perf.includes('script.integrity = SUPABASE_UMD_INTEGRITY')) {
  fail('ensureSupabaseLoaded must assign script.integrity');
}

// cdn-manifest.json — no placeholders
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(read(manifestPath));
  for (const pkg of manifest.packages || []) {
    if (pkg.integrity && String(pkg.integrity).includes('PLACEHOLDER')) {
      fail(`cdn-manifest.json placeholder integrity for ${pkg.name}`);
    }
    if (pkg.url && pkg.url.includes(CDN_HOST) && pkg.integrity) {
      const urlEsc = pkg.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!new RegExp(urlEsc).test(html) && !html.includes(pkg.url.split('@')[0])) {
        // ua-parser is in HTML; supabase is dynamic — only warn if manifest requires HTML presence
        if (pkg.name === 'ua-parser-js' && !html.includes(pkg.url)) {
          fail(`cdn-manifest url ${pkg.name} not found in index.html`);
        }
      }
    }
  }
}

// security.txt must exist for responsible disclosure
const securityTxt = path.join(root, 'apps/pwa-webapp/.well-known/security.txt');
if (!fs.existsSync(securityTxt)) {
  fail('missing apps/pwa-webapp/.well-known/security.txt');
}

if (failed) process.exit(1);
console.log('verify-sri-integrity: CDN SRI baseline OK');
