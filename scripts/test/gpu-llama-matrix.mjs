#!/usr/bin/env node
/**
 * PWA Llama GPU acceptance matrix — extends llm-hardware-matrix profiles.
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const url = (process.env.PROBE_URL || 'http://127.0.0.1:8080/').replace(/\/?$/, '/');
const profileFilter = process.env.LLM_HW_PROFILE || process.argv.find((a) => a.startsWith('--profile='))?.split('=')[1]
  || (process.argv.includes('--profile') ? process.argv[process.argv.indexOf('--profile') + 1] : '');
const expectPass = process.argv.includes('--expect-pass');
const expectFailDocument = process.argv.includes('--expect-fail-document');
const results = [];

const WIN_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36';
const MAC_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/123 Safari/537.36';

const profiles = [
  {
    name: 'win11_chrome_tier5_webgpu',
    tier: 5,
    gpu: { available: true, backend: 'webgpu' },
    ua: WIN_UA,
    requiresHfToken: true,
    documentOnly: true,
  },
  {
    name: 'macos_chrome_tier5_webgpu',
    tier: 5,
    gpu: { available: true, backend: 'webgpu' },
    ua: MAC_UA,
    requiresHfToken: true,
    documentOnly: true,
  },
  {
    name: 'wasm_fallback',
    tier: 5,
    gpu: { available: false, backend: 'none' },
    ua: WIN_UA,
    skipWithoutServer: false,
  },
  {
    name: 'edge_webnn_tier5',
    tier: 5,
    gpu: { available: true, backend: 'webnn' },
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Edg/123 Safari/537.36',
    requiresHfToken: true,
    documentOnly: true,
  },
];

function probeProfile(profile) {
  if (profile.requiresHfToken && !process.env.HF_TOKEN) {
    console.log(`skip ${profile.name} (no HF_TOKEN)`);
    results.push({ profile: profile.name, skipped: true, reason: 'no HF_TOKEN' });
    return 'skip';
  }
  if (profile.documentOnly && expectFailDocument) {
    console.log(`document ${profile.name} (expect-fail-document mode — run with PROBE_URL + HF_TOKEN for live probe)`);
    results.push({ profile: profile.name, documented: true, expectFailDocument: true });
    return 'ok';
  }
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
        LLM_ENGINE: process.env.LLM_ENGINE || '',
      },
      stdio: 'inherit',
    }
  );
  const ok = r.status === 0;
  results.push({ profile: profile.name, ok, status: r.status });
  return ok ? 'ok' : 'fail';
}

let failed = 0;
for (const profile of profiles) {
  if (profileFilter && profile.name !== profileFilter) continue;
  const outcome = probeProfile(profile);
  if (outcome === 'fail') {
    console.error(`FAIL ${profile.name}`);
    failed += 1;
    if (expectPass) process.exit(1);
    if (process.env.PROBE_MATRIX_FAIL_FAST === '1') process.exit(1);
  } else if (outcome === 'ok') {
    console.log(`OK ${profile.name}`);
  }
}

const outDir = join(root, 'audit-history');
mkdirSync(outDir, { recursive: true });
const artifact = join(outDir, 'gpu-llama-matrix.json');
writeFileSync(artifact, JSON.stringify({ url, results, ts: Date.now() }, null, 2));
console.log('Wrote', artifact);

if (expectPass && failed > 0) process.exit(1);
process.exit(failed > 0 && !expectFailDocument ? 1 : 0);
