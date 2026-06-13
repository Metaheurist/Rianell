#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const src = path.join(root, 'locale-packs', 'v1');
const destinations = [
  path.join(root, 'apps', 'pwa-webapp', 'locale-packs', 'v1'),
  path.join(root, 'apps', 'rn-app', 'locale-packs', 'v1'),
];

for (const dest of destinations) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (name.endsWith('.json')) {
      fs.copyFileSync(path.join(src, name), path.join(dest, name));
    }
  }
}

console.log('sync-locale-packs-to-pwa: copied to apps/pwa-webapp/locale-packs/v1/ and apps/rn-app/locale-packs/v1/');
