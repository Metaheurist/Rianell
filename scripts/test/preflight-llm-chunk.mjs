#!/usr/bin/env node
/**
 * Per-chunk LLM gate: sync artifacts fresh, no webgl loads, unit subset, security contract.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const chunk = process.argv.find((a) => a.startsWith('--chunk='))?.split('=')[1]
  || (process.argv.indexOf('--chunk') >= 0 ? process.argv[process.argv.indexOf('--chunk') + 1] : null);

execSync('npm run sync:llm-pwa', { cwd: root, stdio: 'inherit' });

const summary = readFileSync(join(root, 'apps/pwa-webapp/summary-llm.js'), 'utf8');
if (/device:\s*['"]webgl['"]/.test(summary)) {
  console.error('preflight: webgl still in summary-llm.js');
  process.exit(1);
}

const tests = [
  'tests/unit/pwa/summary-llm-model-selection.test.mjs',
  'tests/unit/pwa/summary-llm-warmup-deadlock.test.mjs',
  'tests/unit/pwa/llm-worker.test.mjs',
  'tests/unit/pwa-llm-download-ui.test.mjs',
];
execSync(`node --test ${tests.join(' ')}`, { cwd: root, stdio: 'inherit' });
execSync('node scripts/verify/llm-security-contract.mjs', { cwd: root, stdio: 'inherit' });

console.log('preflight-llm-chunk OK' + (chunk ? ` (chunk ${chunk})` : ''));
