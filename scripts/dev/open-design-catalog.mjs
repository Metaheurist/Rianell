#!/usr/bin/env node
/**
 * Open the PWA design catalog (Plan 01 T2). Requires dev server: npm run dev:web
 */
import { spawnSync } from 'node:child_process';

const url = process.env.RIANELL_DESIGN_CATALOG_URL || 'http://127.0.0.1:8765/design-catalog/';

console.log('Rianell design catalog (dev-only)');
console.log('  URL:', url);
console.log('  Start server first: npm run dev:web');
console.log('  Static files: apps/pwa-webapp/design-catalog/');

if (process.platform === 'win32') {
  spawnSync('cmd', ['/c', 'start', '', url], { stdio: 'ignore' });
} else if (process.platform === 'darwin') {
  spawnSync('open', [url], { stdio: 'ignore' });
} else {
  spawnSync('xdg-open', [url], { stdio: 'ignore' });
}
