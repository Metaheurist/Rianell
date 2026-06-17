#!/usr/bin/env node
/**
 * Playwright hardware profiles for local LLM smoke (WASM-only tier1, optional WebGPU tier5).
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const url = (process.env.PROBE_URL || 'http://127.0.0.1:8080/').replace(/\/?$/, '/');
const profileFilter = process.env.LLM_HW_PROFILE || '';

const profiles = [
  {
    name: 'desktop_wasm_only_tier1',
    tier: 1,
    gpu: { available: false, backend: 'none' },
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36',
  },
  {
    name: 'desktop_wasm_only_tier5',
    tier: 5,
    gpu: { available: false, backend: 'none' },
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36',
    skipWithoutOverride: true,
  },
  {
    name: 'desktop_webgpu_tier5',
    tier: 5,
    gpu: { available: true, backend: 'webgpu' },
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36',
    requiresHfToken: true,
  },
];

let failed = 0;
for (const profile of profiles) {
  if (profileFilter && profile.name !== profileFilter) continue;
  if (profile.requiresHfToken && !process.env.HF_TOKEN) {
    console.log(`skip ${profile.name} (no HF_TOKEN)`);
    continue;
  }
  if (profile.skipWithoutOverride && process.env.LLM_FORCE_LARGE_WASM !== '1') {
    console.log(`skip ${profile.name} (WASM tier5 capped to SmolLM — set LLM_FORCE_LARGE_WASM=1 to test Llama fetch)`);
    continue;
  }
  const initExtra = profile.skipWithoutOverride && process.env.LLM_FORCE_LARGE_WASM === '1'
    ? { preferredLlmForceLargeOnWasm: true }
    : {};
  const r = spawnSync(
    process.execPath,
    ['scripts/ci/probe-llm-download-live.mjs'],
    {
      cwd: root,
      env: {
        ...process.env,
        PROBE_URL: url,
        PROBE_TIER: String(profile.tier),
        PROBE_ATTEMPTS: '1',
        PROBE_ATTEMPT_DELAY_MS: '0',
        PROBE_GPU_AVAILABLE: profile.gpu.available ? '1' : '0',
        PROBE_GPU_BACKEND: profile.gpu.backend,
        PROBE_USER_AGENT: profile.ua,
        PROBE_SETTINGS_JSON: JSON.stringify(initExtra),
      },
      stdio: 'inherit',
    }
  );
  if (r.status !== 0) {
    console.error(`FAIL ${profile.name}`);
    failed += 1;
    if (process.env.PROBE_MATRIX_FAIL_FAST === '1') process.exit(1);
  } else {
    console.log(`OK ${profile.name}`);
  }
}

process.exit(failed > 0 ? 1 : 0);
