#!/usr/bin/env node
/**
 * Cross-platform dev:web launcher (Phase 12).
 * Windows: server/launch-server.ps1; else: python -m server
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const extraArgs = process.argv.slice(2);

if (process.platform === 'win32') {
  const ps1 = path.join(root, 'server', 'launch-server.ps1');
  const shell = process.env.ComSpec || 'powershell.exe';
  const result = spawnSync(
    shell,
    ['-ExecutionPolicy', 'Bypass', '-File', ps1, ...extraArgs],
    { cwd: root, stdio: 'inherit', env: process.env },
  );
  process.exit(result.status ?? (result.error ? 1 : 0));
}

const py = process.platform === 'win32' ? 'python' : 'python3';
const result = spawnSync(py, ['-m', 'server', ...extraArgs], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});
process.exit(result.status ?? (result.error ? 1 : 0));
