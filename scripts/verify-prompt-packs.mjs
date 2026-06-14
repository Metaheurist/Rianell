#!/usr/bin/env node
/** Validate i18n-packs/prompt-packs/v1/*.json key parity with en-GB canonical. */
import fs from 'node:fs';
import path from 'node:path';
import { canonicalPromptPacksDir } from '../packages/shared/src/i18n/packPaths.mjs';

const root = process.cwd();
const dir = canonicalPromptPacksDir(root);
let failed = false;

function fail(msg) {
  console.error(`verify-prompt-packs: ${msg}`);
  failed = true;
}

const canonicalPath = path.join(dir, 'en-GB.json');
if (!fs.existsSync(canonicalPath)) fail('missing i18n-packs/prompt-packs/v1/en-GB.json');
const canonical = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));
const canonicalKeys = Object.keys(canonical).sort();

for (const name of fs.readdirSync(dir)) {
  if (!name.endsWith('.json')) continue;
  const p = path.join(dir, name);
  const pack = JSON.parse(fs.readFileSync(p, 'utf8'));
  const keys = Object.keys(pack).sort();
  for (const k of canonicalKeys) {
    if (!keys.includes(k)) fail(`${name} missing key ${k}`);
  }
  for (const k of keys) {
    if (!canonicalKeys.includes(k)) fail(`${name} has extra key ${k}`);
  }
}

if (failed) process.exit(1);
console.log('verify-prompt-packs: prompt packs valid');
