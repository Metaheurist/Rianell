/**
 * Extended agentic mode preferences (concurrency + approval defaults).
 */
import fs from 'node:fs';
import path from 'node:path';
import { AGENTIC_ROOT, ensureDir } from './state.mjs';

export const MODE_PATH = path.join(AGENTIC_ROOT, 'mode.json');

export const DEFAULT_MODE_PREFS = {
  mode: 'serial',
  autoApprove: false,
  autoApproveMode: 'ack',
  confirmProductWrite: false,
  allowDependencyBump: false,
  gitCommitOnApprove: false,
  i18nFillScope: 'full',
};

export function readModePrefs() {
  try {
    if (!fs.existsSync(MODE_PATH)) return { ...DEFAULT_MODE_PREFS };
    const j = JSON.parse(fs.readFileSync(MODE_PATH, 'utf8'));
    return { ...DEFAULT_MODE_PREFS, ...j };
  } catch {
    return { ...DEFAULT_MODE_PREFS };
  }
}

export function writeModePrefs(patch = {}) {
  ensureDir(AGENTIC_ROOT);
  const next = { ...readModePrefs(), ...patch };
  if (!['serial', 'parallel', 'dry-run'].includes(next.mode)) {
    return { ok: false, error: { code: 'bad_mode', message: String(next.mode) }, data: null };
  }
  if (!['ack', 'product-write'].includes(next.autoApproveMode)) {
    next.autoApproveMode = 'ack';
  }
  if (!['full', 'tier-c'].includes(next.i18nFillScope)) {
    next.i18nFillScope = 'full';
  }
  fs.writeFileSync(MODE_PATH, `${JSON.stringify(next, null, 2)}\n`);
  return { ok: true, error: null, data: next };
}
