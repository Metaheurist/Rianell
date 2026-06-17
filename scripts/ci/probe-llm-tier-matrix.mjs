#!/usr/bin/env node
/**
 * Smoke: tier 1–5 × desktop/mobile UA against PROBE_URL (optional; skips if unreachable).
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const url = (process.env.PROBE_URL || '').replace(/\/?$/, '/');
const tiers = [1, 2, 3, 4, 5];
const profiles = [
  { name: 'desktop', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/123' },
  { name: 'mobile', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148' },
];

if (!url || url === '/') {
  console.log('PROBE_TIER_MATRIX skip: set PROBE_URL');
  process.exit(0);
}

let failed = 0;
for (const profile of profiles) {
  for (const tier of tiers) {
    if (tier >= 3 && !process.env.HF_TOKEN) {
      console.log(`skip tier${tier} ${profile.name} (no HF_TOKEN for Llama)`);
      continue;
    }
    const r = spawnSync(
      process.execPath,
      ['scripts/ci/probe-llm-download-live.mjs'],
      {
        cwd: root,
        env: {
          ...process.env,
          PROBE_URL: url,
          PROBE_TIER: String(tier),
          PROBE_ATTEMPTS: '1',
          PROBE_ATTEMPT_DELAY_MS: '0',
          PROBE_DOWNLOAD_TIMEOUT_MS: process.env.PROBE_DOWNLOAD_TIMEOUT_MS || '600000',
        },
        stdio: 'inherit',
      }
    );
    if (r.status !== 0) {
      console.error(`FAIL tier${tier} ${profile.name}`);
      failed += 1;
      if (process.env.PROBE_MATRIX_FAIL_FAST === '1') process.exit(1);
    } else {
      console.log(`OK tier${tier} ${profile.name}`);
    }
  }
}

process.exit(failed > 0 ? 1 : 0);
