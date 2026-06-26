#!/usr/bin/env node
/** Plan 26 A11Y12 — axe CI contract (dry-run or live). */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const audit = path.join(root, 'scripts/audit/run-axe-audit.mjs');
if (!fs.existsSync(audit)) {
  console.error('verify-axe-ci: missing run-axe-audit.mjs');
  process.exit(1);
}
const { spawnSync } = await import('node:child_process');
const r = spawnSync('node', [audit, '--dry-run'], { cwd: root, stdio: 'inherit', shell: false });
process.exit(r.status ?? 1);
