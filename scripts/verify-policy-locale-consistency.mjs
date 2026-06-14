#!/usr/bin/env node
/** Ensure policy pack defaultLocale values exist in SHIPPED_LOCALES or ar/he. */
import fs from 'node:fs';
import path from 'node:path';
import { SHIPPED_LOCALES } from '../packages/shared/src/i18n/locales.mjs';
import { canonicalPolicyPackPath } from '../packages/shared/src/i18n/packPaths.mjs';

const root = process.cwd();
const packPath = canonicalPolicyPackPath(root);
let failed = false;

function fail(msg) {
  console.error(`verify-policy-locale-consistency: ${msg}`);
  failed = true;
}

if (!fs.existsSync(packPath)) {
  fail('missing i18n-packs/policy-packs/v1.json');
  process.exit(1);
}

const pack = JSON.parse(fs.readFileSync(packPath, 'utf8'));
const allowed = new Set([...SHIPPED_LOCALES, 'ar', 'he']);

for (const [regionId, region] of Object.entries(pack.regions || {})) {
  const dl = region.defaultLocale;
  if (!dl) fail(`${regionId} missing defaultLocale`);
  else if (!allowed.has(dl)) fail(`${regionId} defaultLocale ${dl} not in shipped locales`);
  for (const loc of region.supportedLocales || []) {
    if (!allowed.has(loc)) fail(`${regionId} supportedLocale ${loc} not in shipped locales`);
  }
}

if (failed) process.exit(1);
console.log('verify-policy-locale-consistency: policy locales consistent');
