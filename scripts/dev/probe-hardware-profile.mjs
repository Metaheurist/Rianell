#!/usr/bin/env node
/**
 * Probe nvidia-smi + Ollama → hardware profile for agentic scheduler.
 * Supports catalog presets + Settings override (mode.json hardwareProfile).
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readModePrefs } from './agentic-pipeline/mode-prefs.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROFILES_PATH = path.join(HERE, 'agentic-pipeline', 'hardware-profiles.json');
const HOST = (process.env.OLLAMA_HOST || 'http://localhost:11434').replace(/\/$/, '');

export function loadHardwareProfiles() {
  return JSON.parse(fs.readFileSync(PROFILES_PATH, 'utf8'));
}

export function listSelectableProfiles(catalog = loadHardwareProfiles()) {
  return (catalog.profiles || []).filter((p) => p.selectable !== false);
}

export function getProfileDef(id, catalog = loadHardwareProfiles()) {
  return (catalog.profiles || []).find((p) => p.id === id) || null;
}

function parseNvidiaSmi() {
  const res = spawnSync(
    'nvidia-smi',
    ['--query-gpu=name,memory.total', '--format=csv,noheader,nounits'],
    { encoding: 'utf8', shell: process.platform === 'win32' },
  );
  if (res.error || res.status !== 0) return [];
  return String(res.stdout || '')
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(',').map((s) => s.trim());
      const name = parts[0] || 'GPU';
      const memMiB = Number(parts[1]) || 0;
      return { name, memMiB, memGb: Math.round((memMiB / 1024) * 10) / 10 };
    });
}

async function ollamaOk() {
  try {
    const res = await fetch(`${HOST}/api/tags`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Auto-classify from probed GPUs (no Settings override).
 * @param {{ name: string, memGb: number }[]} gpus
 */
export function classifyProfile(gpus) {
  if (!gpus.length) {
    return {
      profile: 'cpu_only',
      gpus,
      maxConcurrentLarge: 0,
      maxModelVramGb: 4,
      detectedReason: 'no-nvidia-smi-gpus',
    };
  }
  const sorted = [...gpus].sort((a, b) => b.memGb - a.memGb);
  const top = sorted[0].memGb;
  const sum = sorted.reduce((s, g) => s + g.memGb, 0);

  if (gpus.length >= 2) {
    const a = sorted[0].memGb;
    const b = sorted[1].memGb;
    if (a >= 14 && a <= 20 && b >= 10 && b <= 14) {
      return {
        profile: 'dual_12_16',
        gpus: sorted,
        maxConcurrentLarge: 2,
        maxModelVramGb: 19,
        detectedReason: 'classic-12-16-split',
      };
    }
    if (sum >= 40 || top >= 36) {
      return {
        profile: 'workstation_48',
        gpus: sorted,
        maxConcurrentLarge: 3,
        maxModelVramGb: 48,
        detectedReason: 'multi-gpu-high-vram',
      };
    }
    return {
      profile: 'dual_balanced',
      gpus: sorted,
      maxConcurrentLarge: 2,
      maxModelVramGb: Math.max(12, Math.min(24, Math.floor(top))),
      detectedReason: 'multi-gpu',
    };
  }

  if (top >= 36) {
    return {
      profile: 'workstation_48',
      gpus: sorted,
      maxConcurrentLarge: 3,
      maxModelVramGb: 48,
      detectedReason: 'single-high-vram',
    };
  }
  if (top >= 20) {
    return {
      profile: 'single_24',
      gpus: sorted,
      maxConcurrentLarge: 1,
      maxModelVramGb: 24,
      detectedReason: 'single-24-class',
    };
  }
  if (top >= 14) {
    return {
      profile: 'single_16',
      gpus: sorted,
      maxConcurrentLarge: 1,
      maxModelVramGb: 19,
      detectedReason: 'single-16-class',
    };
  }
  if (top >= 10) {
    return {
      profile: 'single_12',
      gpus: sorted,
      maxConcurrentLarge: 1,
      maxModelVramGb: 12,
      detectedReason: 'single-12-class',
    };
  }
  return {
    profile: 'single_8',
    gpus: sorted,
    maxConcurrentLarge: 1,
    maxModelVramGb: 8,
    detectedReason: 'single-8-class',
  };
}

/**
 * Apply a manual profile id on top of classified probe data.
 */
export function applyProfileOverride(classified, overrideId) {
  const catalog = loadHardwareProfiles();
  const id = overrideId && overrideId !== 'auto' ? overrideId : null;
  if (!id) {
    const def = getProfileDef(classified.profile, catalog);
    return {
      ...classified,
      override: 'auto',
      effectiveProfile: classified.profile,
      label: def?.label || classified.profile,
      description: def?.description || '',
      maxConcurrentLarge: classified.maxConcurrentLarge ?? def?.maxConcurrentLarge ?? 1,
      maxModelVramGb: classified.maxModelVramGb ?? def?.maxModelVramGb ?? 19,
    };
  }
  const def = getProfileDef(id, catalog);
  if (!def || id === 'auto') {
    return applyProfileOverride(classified, 'auto');
  }
  let maxModelVramGb = def.maxModelVramGb;
  let maxConcurrentLarge = def.maxConcurrentLarge;
  // dual_balanced override: budget from largest probed GPU when available
  if (id === 'dual_balanced' && classified.gpus?.length) {
    const top = Math.max(...classified.gpus.map((g) => g.memGb));
    maxModelVramGb = Math.max(12, Math.min(24, Math.floor(top)));
    maxConcurrentLarge = Math.min(3, classified.gpus.length);
  }
  return {
    ...classified,
    override: id,
    profile: id,
    effectiveProfile: id,
    label: def.label,
    description: def.description,
    maxConcurrentLarge: maxConcurrentLarge ?? 1,
    maxModelVramGb: maxModelVramGb ?? 19,
    detectedReason: classified.detectedReason,
    autoWouldBe: classified.profile,
  };
}

export async function probeHardwareProfile(opts = {}) {
  const gpus = parseNvidiaSmi();
  const classified = classifyProfile(gpus);
  const prefs = opts.prefs || readModePrefs();
  const override = opts.hardwareProfile || prefs.hardwareProfile || 'auto';
  const applied = applyProfileOverride(classified, override);
  const ollama = await ollamaOk();
  const catalog = loadHardwareProfiles();
  return {
    ...applied,
    ollamaHost: HOST,
    ollamaReachable: ollama,
    probedAt: new Date().toISOString(),
    profiles: listSelectableProfiles(catalog).map((p) => ({
      id: p.id,
      label: p.label,
      description: p.description,
      maxModelVramGb: p.maxModelVramGb,
      maxConcurrentLarge: p.maxConcurrentLarge,
    })),
  };
}

const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('probe-hardware-profile.mjs');
if (isMain) {
  const result = await probeHardwareProfile();
  console.log(JSON.stringify(result, null, 2));
}
