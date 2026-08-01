#!/usr/bin/env node
/**
 * Probe nvidia-smi + Ollama → hardware profile id for agentic scheduler.
 */
import { spawnSync } from 'node:child_process';

const HOST = (process.env.OLLAMA_HOST || 'http://localhost:11434').replace(/\/$/, '');

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
 * @param {{ name: string, memGb: number }[]} gpus
 */
export function classifyProfile(gpus) {
  if (!gpus.length) return { profile: 'cpu_only', gpus, maxConcurrentLarge: 0 };
  const sorted = [...gpus].sort((a, b) => b.memGb - a.memGb);
  if (gpus.length >= 2) {
    const a = sorted[0].memGb;
    const b = sorted[1].memGb;
    if (a >= 14 && a <= 18 && b >= 10 && b <= 14) {
      return { profile: 'dual_12_16', gpus: sorted, maxConcurrentLarge: 2 };
    }
    if (a + b >= 40) {
      return { profile: 'workstation_48', gpus: sorted, maxConcurrentLarge: 3 };
    }
    return { profile: 'dual_12_16', gpus: sorted, maxConcurrentLarge: 2 };
  }
  const g = sorted[0].memGb;
  if (g >= 40) return { profile: 'workstation_48', gpus: sorted, maxConcurrentLarge: 3 };
  if (g >= 15) return { profile: 'single_16', gpus: sorted, maxConcurrentLarge: 1 };
  return { profile: 'single_12', gpus: sorted, maxConcurrentLarge: 1 };
}

export async function probeHardwareProfile() {
  const gpus = parseNvidiaSmi();
  const classified = classifyProfile(gpus);
  const ollama = await ollamaOk();
  return { ...classified, ollamaHost: HOST, ollamaReachable: ollama, probedAt: new Date().toISOString() };
}

const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('probe-hardware-profile.mjs');
if (isMain) {
  const result = await probeHardwareProfile();
  console.log(JSON.stringify(result, null, 2));
}
