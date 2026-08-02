/**
 * Extended agentic mode preferences (concurrency + approval defaults).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
  /** 'auto' or a profile id from hardware-profiles.json */
  hardwareProfile: 'auto',
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
  if (next.hardwareProfile == null || next.hardwareProfile === '') {
    next.hardwareProfile = 'auto';
  }
  const known = new Set([
    'auto', 'cpu_only', 'single_8', 'single_12', 'single_16', 'single_24',
    'dual_12_16', 'dual_balanced', 'workstation_48',
  ]);
  try {
    const catalogPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'hardware-profiles.json');
    if (fs.existsSync(catalogPath)) {
      const cat = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      for (const p of cat.profiles || []) known.add(p.id);
    }
  } catch { /* keep built-in known set */ }
  if (!known.has(String(next.hardwareProfile))) next.hardwareProfile = 'auto';
  fs.writeFileSync(modePrefsPath(), `${JSON.stringify(next, null, 2)}\n`);
  return { ok: true, error: null, data: next };
}
