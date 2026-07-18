#!/usr/bin/env node
/**
 * Phase 18 — foundation migration verification orchestrator.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

function run(label, cmd, args = []) {
  console.error(`\n[migration:foundation] ${label}`);
  const shell = typeof cmd === 'string' && /\.(cmd|bat)$/i.test(cmd);
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell });
  if (r.status !== 0) {
    console.error(`FAIL: ${label}`);
    process.exit(r.status ?? 1);
  }
}

run('test:unit', process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'test:unit']);
run('build:web:min', process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build:web:min']);
run('doc-links', process.execPath, ['scripts/verify/doc-links.mjs', '--strict']);
run('wiki:verify', process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'wiki:verify']);

if (!fs.existsSync(path.join(root, 'artifacts'))) {
  console.error('FAIL: artifacts/ directory missing');
  process.exit(1);
}
if (fs.existsSync(path.join(root, 'App build'))) {
  console.error('FAIL: legacy artifacts predecessor directory still present');
  process.exit(1);
}
if (!fs.existsSync(path.join(root, 'apps/pwa-webapp/package.json'))) {
  console.error('FAIL: PWA workspace package.json missing');
  process.exit(1);
}

console.error('\n[migration:foundation] ALL PASSED');
process.exit(0);
