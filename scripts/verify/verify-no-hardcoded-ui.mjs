#!/usr/bin/env node
/**
 * Scan PWA/RN sources for likely user-visible English strings not using t().
 * Default: warn only (exit 0). Pass --strict to fail on findings.
 * --baseline: fail if candidate count exceeds scripts/.audit/hardcoded-ui-baseline.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { scanAll } from '../i18n/i18n-audit-shared.mjs';

const root = process.cwd();
const strict = process.argv.includes('--strict');
const baselineMode = process.argv.includes('--baseline');
const baselineFile = path.join(root, 'scripts', '.audit', 'hardcoded-ui-baseline.json');

const results = scanAll(root);

if (results.length === 0) {
  console.log('verify-no-hardcoded-ui: no hardcoded UI candidates found');
  process.exit(0);
}

console.warn(`verify-no-hardcoded-ui: ${results.length} hardcoded UI candidate(s)`);
results.slice(0, 30).forEach((r) => {
  console.warn(`  ${r.file}:${r.line} "${r.text}"`);
});
if (results.length > 30) {
  console.warn(`  … and ${results.length - 30} more`);
}

if (baselineMode && fs.existsSync(baselineFile)) {
  const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
  const max = typeof baseline.maxCandidates === 'number' ? baseline.maxCandidates : baseline.count;
  if (results.length > max) {
    console.error(
      `verify-no-hardcoded-ui: ${results.length} candidates exceeds baseline ${max} (--baseline)`,
    );
    process.exit(1);
  }
  console.log(`verify-no-hardcoded-ui: within baseline (${results.length} <= ${max})`);
}

if (strict) {
  console.error('verify-no-hardcoded-ui: --strict failed');
  process.exit(1);
}

console.log('verify-no-hardcoded-ui: warn mode (pass); use --strict to fail CI');
