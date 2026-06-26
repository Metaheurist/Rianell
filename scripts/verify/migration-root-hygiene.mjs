#!/usr/bin/env node
/**
 * Phase 23 — root directory hygiene verifier.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const errors = [];

const ROOT_JSON_ALLOW = new Set([
  'package.json',
  'package-lock.json',
  'turbo.json',
  'tsconfig.json',
  '.commitlintrc.json',
]);

const FORBIDDEN_ROOT_FILES = [
  'audit-report.json',
  'audit-report-baseline.json',
  'audit-report-previous.json',
  'residency-config.json',
];

const REQUIRED_DIRS = [
  'apps',
  'packages',
  'scripts',
  'i18n-packs',
  'artifacts',
  'audit-history',
];

for (const name of fs.readdirSync(root)) {
  if (!name.endsWith('.json')) continue;
  const fp = path.join(root, name);
  if (!fs.statSync(fp).isFile()) continue;
  if (!ROOT_JSON_ALLOW.has(name)) {
    errors.push(`unexpected root JSON file: ${name}`);
  }
}

for (const name of FORBIDDEN_ROOT_FILES) {
  if (fs.existsSync(path.join(root, name))) {
    errors.push(`forbidden root file still present: ${name}`);
  }
}

for (const dir of ['tools', 'backup']) {
  if (fs.existsSync(path.join(root, dir))) {
    errors.push(`forbidden directory still present: ${dir}/`);
  }
}

for (const dir of REQUIRED_DIRS) {
  if (!fs.existsSync(path.join(root, dir))) {
    errors.push(`required directory missing: ${dir}/`);
  }
}

const baseline = path.join(root, 'audit-history/baseline.json');
if (!fs.existsSync(baseline)) {
  errors.push('missing audit-history/baseline.json');
}

if (errors.length) {
  console.error('verify:root-hygiene failures:');
  for (const e of errors) console.error(' -', e);
  process.exit(1);
}

console.log('verify:root-hygiene: OK');
process.exit(0);
