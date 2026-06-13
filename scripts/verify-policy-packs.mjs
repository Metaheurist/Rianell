#!/usr/bin/env node
/**
 * Validates policy-packs/v1.json schema and sync with embedded policyPackData.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const packPath = path.join(root, 'policy-packs', 'v1.json');
let failed = false;

function fail(msg) {
  console.error(`verify-policy-packs: ${msg}`);
  failed = true;
}

if (!fs.existsSync(packPath)) {
  fail('missing policy-packs/v1.json');
  process.exit(1);
}

const pack = JSON.parse(fs.readFileSync(packPath, 'utf8'));
const requiredRegions = ['eea_uk', 'us_ca', 'us_other', 'au', 'br', 'other'];

if (!pack.version && !pack.policyPackId) fail('missing version or policyPackId');
if (!pack.regions || typeof pack.regions !== 'object') fail('missing regions object');

for (const id of requiredRegions) {
  const r = pack.regions[id];
  if (!r) fail(`missing region ${id}`);
  else {
    if (!r.label) fail(`${id} missing label`);
    if (!Array.isArray(r.policyDocuments) || r.policyDocuments.length === 0) fail(`${id} missing policyDocuments`);
    if (!r.features || typeof r.features !== 'object') fail(`${id} missing features`);
    if (!r.requiredDataResidency) fail(`${id} missing requiredDataResidency`);
    if (!r.defaultLocale) fail(`${id} missing defaultLocale`);
  }
}

const embeddedPath = path.join(root, 'packages', 'shared', 'src', 'privacy', 'policyPackData.mjs');
if (fs.existsSync(embeddedPath)) {
  const src = fs.readFileSync(embeddedPath, 'utf8');
  if (!src.includes('policy-packs/v1.json')) {
    fail('policyPackData.mjs should import policy-packs/v1.json');
  }
}

if (failed) process.exit(1);
console.log('verify-policy-packs: policy-packs/v1.json valid');
