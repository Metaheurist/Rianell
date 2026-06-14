#!/usr/bin/env node
/** Ensure every shipped locale has the same string keys as en-GB canonical. */
import fs from 'node:fs';
import path from 'node:path';
import { SHIPPED_LOCALES } from '../packages/shared/src/i18n/locales.mjs';
import { canonicalLocalePacksDir } from '../packages/shared/src/i18n/packPaths.mjs';

const root = process.cwd();
const dir = canonicalLocalePacksDir(root);
let failed = false;

function fail(msg) {
  console.error(`verify-locale-packs: ${msg}`);
  failed = true;
}

const canonicalPath = path.join(dir, 'en-GB.json');
if (!fs.existsSync(canonicalPath)) fail('missing i18n-packs/locale-packs/v1/en-GB.json');
const canonical = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));
const canonicalKeys = Object.keys(canonical.strings || {}).sort();

for (const locale of SHIPPED_LOCALES) {
  const p = path.join(dir, `${locale}.json`);
  if (!fs.existsSync(p)) {
    fail(`missing ${locale}.json`);
    continue;
  }
  const pack = JSON.parse(fs.readFileSync(p, 'utf8'));
  const keys = Object.keys(pack.strings || {}).sort();
  for (const k of canonicalKeys) {
    if (!keys.includes(k)) fail(`${locale}.json missing key ${k}`);
  }
  for (const k of keys) {
    if (!canonicalKeys.includes(k)) fail(`${locale}.json has extra key ${k}`);
  }
}

if (failed) process.exit(1);
console.log('verify-locale-packs: all locale packs valid');
