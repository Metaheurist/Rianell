#!/usr/bin/env node
/**
 * Fail if nested package-lock.json files exist under workspace packages (Phase 13).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

const workspaceRoots = [
  path.join(root, 'apps', 'rn-app'),
  path.join(root, 'apps', 'pwa-webapp'),
  path.join(root, 'benchmarks'),
  ...fs
    .readdirSync(path.join(root, 'packages'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(root, 'packages', d.name)),
];

const nested = [];
for (const ws of workspaceRoots) {
  const lock = path.join(ws, 'package-lock.json');
  if (fs.existsSync(lock)) {
    nested.push(path.relative(root, lock));
  }
}

if (nested.length) {
  console.error('Nested package-lock.json files are forbidden under workspaces:');
  for (const p of nested) console.error(`  - ${p}`);
  console.error('Use the root package-lock.json only.');
  process.exit(1);
}

console.log('nested-lockfile-guard: OK (no workspace lockfiles)');
