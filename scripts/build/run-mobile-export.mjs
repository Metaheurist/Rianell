#!/usr/bin/env node
/**
 * Mobile production export orchestrator (Phase 8).
 * Single sync-i18n pass after locale overrides.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const rnApp = path.join(root, 'apps/rn-app');

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

run('scripts/i18n/generate-locale-overrides.mjs');
run('scripts/i18n/sync-i18n-assets.mjs');

const expoArgs = [
  'expo',
  'export',
  '--platform',
  'android',
  '--platform',
  'ios',
  '--output-dir',
  'dist-expo-prod',
];
const exportResult = spawnSync('npx', expoArgs, {
  cwd: rnApp,
  stdio: 'inherit',
  env: {
    ...process.env,
    // CI export gate bundles Hermes output; native ORT deps are stubbed in metro.config.js.
    RIANELL_EXPO_EXPORT_STUB_NATIVE_LLM: '1',
  },
  shell: process.platform === 'win32',
});
if (exportResult.status !== 0) {
  process.exit(exportResult.status ?? 1);
}
