#!/usr/bin/env node
/**
 * Fail CI when post-deploy boot audit warm path exceeds progressive budget.
 * Usage: node scripts/audit/verify-boot-warm-budget.mjs [audit-json-path]
 */
import fs from 'fs';

const jsonPath = process.argv[2] || 'audit-history/latest-boot-audit.json';
const maxMs = Number(process.env.BOOT_WARM_CI_MAX_MS || 90_000);

let report;
try {
  report = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
} catch (e) {
  console.error('verify-boot-warm-budget: cannot read', jsonPath, e.message);
  process.exit(1);
}

const warmMs = report?.warm?.elapsedMs;
if (typeof warmMs !== 'number') {
  console.error('verify-boot-warm-budget: missing warm.elapsedMs');
  process.exit(1);
}

if (warmMs > maxMs) {
  console.error(`verify-boot-warm-budget: warm boot ${warmMs}ms exceeds ${maxMs}ms budget`);
  process.exit(1);
}

console.log(`verify-boot-warm-budget: warm ${warmMs}ms within ${maxMs}ms`);
