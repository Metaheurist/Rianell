#!/usr/bin/env node
/**
 * Open the PWA design catalog (Plan 01 T2). Requires dev server: npm run dev:web
 */
import { spawnSync } from 'node:child_process';

const DEFAULT_URL = 'http://127.0.0.1:8765/design-catalog/';

function resolveCatalogUrl(raw) {
  try {
    const u = new URL(String(raw || DEFAULT_URL).trim());
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.href;
  } catch { /* fall through */ }
  console.warn(`  Ignoring invalid RIANELL_DESIGN_CATALOG_URL; using ${DEFAULT_URL}`);
  return DEFAULT_URL;
}

const url = resolveCatalogUrl(process.env.RIANELL_DESIGN_CATALOG_URL);

console.log('Rianell design catalog (dev-only)');
console.log('  URL:', url);
console.log('  Start server first: npm run dev:web');
console.log('  Static files: apps/pwa-webapp/design-catalog/');

if (process.platform === 'win32') {
  spawnSync('explorer.exe', [url], { stdio: 'ignore', shell: false });
} else if (process.platform === 'darwin') {
  spawnSync('open', [url], { stdio: 'ignore', shell: false });
} else {
  spawnSync('xdg-open', [url], { stdio: 'ignore', shell: false });
}
