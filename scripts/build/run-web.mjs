#!/usr/bin/env node
/**
 * Web build orchestrator (Phase 8).
 * Usage: node scripts/build/run-web.mjs [--skip-trace]
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const extraArgs = process.argv.slice(2);

function run(relScript, args = []) {
  const script = path.join(root, relScript);
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('scripts/build/sync-tokens-to-pwa.mjs');
run('scripts/i18n/generate-locale-overrides.mjs');
run('scripts/i18n/sync-i18n-assets.mjs');
run('scripts/build/build-pwa-vendor.mjs');
run('apps/pwa-webapp/build-site.mjs', extraArgs);
