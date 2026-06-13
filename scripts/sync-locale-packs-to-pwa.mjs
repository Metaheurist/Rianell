#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const src = path.join(root, 'locale-packs', 'v1');
const dest = path.join(root, 'apps', 'pwa-webapp', 'locale-packs', 'v1');
fs.mkdirSync(dest, { recursive: true });
for (const name of fs.readdirSync(src)) {
  if (name.endsWith('.json')) {
    fs.copyFileSync(path.join(src, name), path.join(dest, name));
  }
}
console.log('sync-locale-packs-to-pwa: copied to apps/pwa-webapp/locale-packs/v1/');
