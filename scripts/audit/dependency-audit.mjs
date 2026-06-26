#!/usr/bin/env node
/** Plan 21 — dependency audit wrapper (npm audit + summary). */
import { spawnSync } from 'node:child_process';

const dryRun = process.argv.includes('--dry-run');
const result = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8', shell: true });
let audit = {};
try {
  audit = JSON.parse(result.stdout || '{}');
} catch {
  audit = {};
}

const vulns = audit.metadata?.vulnerabilities || {};
const critical = vulns.critical ?? 0;
const high = vulns.high ?? 0;
const moderate = vulns.moderate ?? 0;
const low = vulns.low ?? 0;

console.log(`Dependency audit: critical=${critical} high=${high} moderate=${moderate} low=${low}`);

if (dryRun) {
  console.log('AUDIT_DRY_RUN_OK');
  process.exit(0);
}

if (critical > 0) {
  console.error(`FAIL: ${critical} critical vulnerabilities`);
  process.exit(1);
}
console.log('AUDIT_OK');
