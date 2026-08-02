/**
 * Extended agentic mode preferences (concurrency + approval defaults).
 */
import fs from 'node:fs';
import path from 'node:path';
import { getAgenticRoot, ensureDir } from './state.mjs';

export function modePrefsPath() {
  return path.join(getAgenticRoot(), 'mode.json');
}

/** @deprecated Prefer modePrefsPath() — live when AGENTIC_ROOT env changes. */
export const MODE_PATH = path.join(getAgenticRoot(), 'mode.json');

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
    const p = modePrefsPath();
    if (!fs.existsSync(p)) return { ...DEFAULT_MODE_PREFS };
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    return { ...DEFAULT_MODE_PREFS, ...j };
  } catch {
    return { ...DEFAULT_MODE_PREFS };
  }
}

export function writeModePrefs(patch = {}) {
  ensureDir(getAgenticRoot());
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
  fs.writeFileSync(modePrefsPath(), `${JSON.stringify(next, null, 2)}\n`);
  return { ok: true, error: null, data: next };
}
