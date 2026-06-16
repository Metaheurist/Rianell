#!/usr/bin/env node
/** Fail if i18n-packs/locale-packs/v1 string values contain HTML tags (XSS / i18n hygiene). */
import fs from 'node:fs';
import path from 'node:path';
import { canonicalLocalePacksDir } from '../../packages/shared/src/i18n/packPaths.mjs';

const root = process.cwd();
const dir = canonicalLocalePacksDir(root);
let failed = false;

function fail(msg) {
  console.error(`verify-no-html-in-locale-packs: ${msg}`);
  failed = true;
}

if (!fs.existsSync(dir)) {
  fail('missing i18n-packs/locale-packs/v1');
  process.exit(1);
}

const htmlTag = /<\/?[a-z][\s\S]*?>/i;

for (const name of fs.readdirSync(dir)) {
  if (!name.endsWith('.json')) continue;
  const pack = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
  for (const [key, value] of Object.entries(pack.strings || {})) {
    if (typeof value === 'string' && htmlTag.test(value)) {
      fail(`${name} key ${key} contains HTML`);
    }
  }
}

if (failed) process.exit(1);
console.log('verify-no-html-in-locale-packs: no HTML in locale string values');
