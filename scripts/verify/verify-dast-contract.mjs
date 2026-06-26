#!/usr/bin/env node
/** Plan 21 SEC8 — DAST CI contract (static checks; live scan optional in CI). */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ci = fs.readFileSync(path.join(root, '.github/workflows/ci.yml'), 'utf8');
const errors = [];

if (!/verify:csp|verify-csp/.test(ci)) errors.push('CI must run CSP verify');
if (!/verify:llm-security|llm-security-contract/.test(ci)) errors.push('CI must run LLM security contract');
if (!/verify-no-service-role/.test(ci)) errors.push('CI must run service-role client scan');

if (errors.length) {
  console.error('DAST_CONTRACT_FAIL:', errors.join('; '));
  process.exit(1);
}
console.log('DAST_CONTRACT_OK');
