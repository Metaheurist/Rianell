#!/usr/bin/env node
/**
 * Phase 20 — full migration sign-off orchestrator.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

function run(label, cmd, args = []) {
  console.error(`\n[migration:complete] ${label}`);
  const shell = typeof cmd === 'string' && /\.(cmd|bat)$/i.test(cmd);
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell });
  if (r.status !== 0) {
    console.error(`FAIL: ${label}`);
    process.exit(r.status ?? 1);
  }
}

run('migration:foundation', process.execPath, ['scripts/verify/migration-foundation.mjs']);
run('verify:i18n', process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'verify:i18n']);
run('verify:csp', process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'verify:csp']);
run('verify:privacy-docs', process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'verify:privacy-docs']);
run('parity', process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'parity']);
run('typecheck', process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'typecheck']);
run('verify:root-hygiene', process.execPath, ['scripts/verify/migration-root-hygiene.mjs']);

if (fs.existsSync(path.join(root, 'turbo.json'))) {
  run('turbo dry-run', process.platform === 'win32' ? 'npx.cmd' : 'npx', ['turbo', 'run', 'build', '--dry-run']);
}

if (fs.existsSync(path.join(root, 'packages/build-tools/package.json'))) {
  console.error('[migration:complete] build-tools package present');
}

console.error('\n[migration:complete] ALL PASSED — implementation verified');
process.exit(0);
