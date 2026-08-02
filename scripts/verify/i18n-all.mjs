#!/usr/bin/env node
/** Orchestrates verify:i18n steps (Phase 11).
 *  --check-only: skip generators/sync that mutate packages/shared + packs (agentic gate).
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CHECK_ONLY = process.argv.includes('--check-only') || process.env.AGENTIC_I18N_CHECK === '1';

const mutateSteps = [
  ['scripts/i18n/build-content-catalog-keys.mjs', []],
  ['scripts/i18n/generate-locale-overrides.mjs', []],
  ['scripts/i18n/auto-translate-ui-strings.mjs', []],
  ['scripts/i18n/auto-translate-policy-strings.mjs', []],
  ['scripts/i18n/translate-motd-packs.mjs', []],
  ['scripts/i18n/sync-i18n-assets.mjs', []],
];

const checkSteps = [
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

const steps = CHECK_ONLY ? checkSteps : [...mutateSteps, ...checkSteps];
if (CHECK_ONLY) {
  console.log('verify:i18n --check-only (no sync / generator writes)');
}

const headless = process.env.AGENTIC_HEADLESS === '1' || process.platform === 'win32';
for (const [rel, args] of steps) {
  const script = path.join(root, rel);
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    // inherit is fine in a real terminal; on Windows always hide console windows
    // so agentic / background runs do not flash a console per step.
    stdio: headless && process.env.AGENTIC_HEADLESS === '1' ? 'pipe' : 'inherit',
    env: process.env,
    windowsHide: true,
    shell: false,
  });
  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(String(result.stdout));
    if (result.stderr) process.stderr.write(String(result.stderr));
    process.exit(result.status ?? 1);
  }
}
