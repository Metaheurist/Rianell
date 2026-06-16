#!/usr/bin/env node
/**
 * Phase 19 — release-model verification (subset + manifest checks).
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

function run(label, cmd, args = []) {
  console.error(`\n[migration:release] ${label}`);
  const shell = typeof cmd === 'string' && /\.(cmd|bat)$/i.test(cmd);
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell });
  if (r.status !== 0) {
    console.error(`FAIL: ${label}`);
    process.exit(r.status ?? 1);
  }
}

run('foundation subset', process.execPath, ['scripts/verify/migration-foundation.mjs']);

for (const rel of [
  'artifacts/RNCLI-Android/latest.json',
  'artifacts/iOS/latest.json',
  'artifacts/Server/latest.json',
]) {
  const fp = path.join(root, rel);
  if (!fs.existsSync(fp)) {
    console.error(`WARN: missing ${rel} (may be CI-generated)`);
    continue;
  }
  JSON.parse(fs.readFileSync(fp, 'utf8'));
}

run('RN buildDownloads tests via test:unit filter', process.platform === 'win32' ? 'npm.cmd' : 'npm', [
  'run',
  'test:unit',
]);

console.error('\n[migration:release] ALL PASSED');
process.exit(0);
