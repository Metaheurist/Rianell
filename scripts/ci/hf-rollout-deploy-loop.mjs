#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: false, ...opts });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed`);
}

// 1) Wait for CI
run('gh', ['run', 'watch', '--exit-status']);

// 2) Wait for live HTML fingerprint
run(process.execPath, ['scripts/audit/verify-deploy-html.mjs'], {
  env: { ...process.env, VERIFY_URLS: process.env.VERIFY_URLS || 'https://rianell.com/' },
});

// 3) Live boot probe
run(process.execPath, ['scripts/ci/deploy-probe-loop.mjs'], {
  env: { ...process.env, PROBE_URL: process.env.PROBE_URL || 'https://rianell.com/' },
});

// 4) Live HF LLM download probe
run(process.execPath, ['scripts/ci/probe-llm-download-live.mjs'], {
  env: { ...process.env, PROBE_URL: process.env.PROBE_URL || 'https://rianell.com/' },
});

console.log('ROLLOUT_OK', JSON.stringify({ ok: true, url: process.env.PROBE_URL || 'https://rianell.com/' }));

