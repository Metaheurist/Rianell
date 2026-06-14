#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { canonicalLocalePacksDir, I18N_PACKS_DIR } from '../packages/shared/src/i18n/packPaths.mjs';

const root = process.cwd();
const src = canonicalLocalePacksDir(root);
const destinations = [
  path.join(root, 'apps', 'pwa-webapp', I18N_PACKS_DIR, 'locale-packs', 'v1'),
  path.join(root, 'apps', 'rn-app', I18N_PACKS_DIR, 'locale-packs', 'v1'),
];

for (const dest of destinations) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (name.endsWith('.json')) {
      fs.copyFileSync(path.join(src, name), path.join(dest, name));
    }
  }
}

console.log(
  `sync-locale-packs-to-pwa: copied to apps/pwa-webapp/${I18N_PACKS_DIR}/locale-packs/v1/ and apps/rn-app/${I18N_PACKS_DIR}/locale-packs/v1/`,
);
