#!/usr/bin/env node
/**
 * Phase 4 helper — derive fancy team variants from plain glyphs.
 * Does not LLM-polish fancy:* rows. After plain C is applied to index.html,
 * run generate:theme-icons (deterministic wrap + optional overrides).
 *
 * Usage: npm run visual:derive-variants
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

console.log('[derive-variants] Team fancy variants are derived, not LLM-polished.');
console.log('[derive-variants] Running generate:theme-icons (fancyWrapRemaining / fancyHeroInner / overrides)…');
const res = spawnSync('npm', ['run', 'generate:theme-icons'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(res.status ?? 1);
