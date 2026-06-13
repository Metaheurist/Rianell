#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const src = path.join(root, 'policy-packs', 'v1.json');
const destDir = path.join(root, 'packages', 'shared', 'policy-packs');
const dest = path.join(destDir, 'v1.json');

if (!fs.existsSync(src)) {
  console.error('sync-policy-pack: missing policy-packs/v1.json');
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log('sync-policy-pack: copied to packages/shared/policy-packs/v1.json');
