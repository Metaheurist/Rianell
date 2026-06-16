#!/usr/bin/env node
/** Orchestrates verify:i18n steps (Phase 11). */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

const steps = [
  ['scripts/i18n/build-content-catalog-keys.mjs', []],
  ['scripts/i18n/generate-locale-overrides.mjs', []],
  ['scripts/i18n/auto-translate-ui-strings.mjs', []],
  ['scripts/i18n/auto-translate-policy-strings.mjs', []],
  ['scripts/i18n/translate-motd-packs.mjs', []],
  ['scripts/i18n/sync-i18n-assets.mjs', []],
  ['scripts/verify/verify-locale-packs.mjs', []],
  ['scripts/verify/verify-prompt-packs.mjs', []],
  ['scripts/verify/verify-motd-packs.mjs', []],
  ['scripts/verify/verify-motd-translation-coverage.mjs', []],
  ['scripts/verify/verify-no-html-in-locale-packs.mjs', []],
  ['scripts/verify/audit-hardcoded-strings.mjs', ['--check']],
  ['scripts/verify/audit-hardcoded-strings.mjs', ['--require-wiring']],
  ['scripts/verify/verify-no-hardcoded-ui.mjs', ['--strict']],
  ['scripts/verify/verify-no-hardcoded-ui.mjs', ['--baseline']],
  ['scripts/verify/verify-translation-coverage.mjs', ['--strict', '--max-pct=13']],
  ['scripts/verify/verify-mixed-language-strings.mjs', []],
];

for (const [rel, args] of steps) {
  const script = path.join(root, rel);
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
