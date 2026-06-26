#!/usr/bin/env node
/** Plan 22 PF1 — verify bundle split / lazy-load markers in PWA build. */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const buildSite = fs.readFileSync(path.join(root, 'apps/pwa-webapp/build-site.mjs'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'apps/pwa-webapp/app.js'), 'utf8');

const checks = [
  { name: 'lazyCharts pref', ok: /lazyCharts/.test(appJs) },
  { name: 'lazy import marker', ok: /import\s*\(\s*['"]\.\/lazy-/.test(appJs) || /lazyLoadCharts/.test(appJs) },
  { name: 'build-site esbuild', ok: /esbuild/.test(buildSite) },
];

const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  console.error('Bundle split verify failed:', failed.map((f) => f.name).join(', '));
  process.exit(1);
}
console.log('BUNDLE_SPLIT_VERIFY_OK');
