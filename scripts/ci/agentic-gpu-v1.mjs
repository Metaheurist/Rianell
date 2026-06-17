#!/usr/bin/env node
/**
 * GPU LLM V1 master gate — fail fast on first failure.
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const trackArg = process.argv.find((a) => a.startsWith('--track='))
  || (process.argv.includes('--track') ? `--track=${process.argv[process.argv.indexOf('--track') + 1]}` : '--track=pwa');
const track = trackArg.split('=')[1] || 'pwa';

function run(name, cmd) {
  console.log('\n=== agentic-gpu-v1:', name, '===');
  try {
    execSync(cmd, { cwd: root, stdio: 'inherit', env: process.env });
  } catch {
    console.error('agentic-gpu-v1 FAILED at', name);
    process.exit(1);
  }
}

const pwaSteps = [
  ['sync:llm-pwa', 'npm run sync:llm-pwa'],
  ['vendor:transformers', 'npm run vendor:transformers'],
  ['test:unit', 'npm run test:unit'],
  ['verify:csp', 'npm run verify:csp'],
  ['verify:llm-security', 'npm run verify:llm-security'],
  ['parity:web', 'npm run parity:web'],
  ['preflight-llm-chunk', 'node scripts/test/preflight-llm-chunk.mjs'],
];

const gpuParityContract = join(root, 'scripts/verify/gpu-parity-contract.mjs');
if (existsSync(gpuParityContract)) {
  pwaSteps.push(['gpu-parity-contract', 'node scripts/verify/gpu-parity-contract.mjs']);
}

if (track === 'pwa' || track === 'pwa-gpu') {
  for (const [name, cmd] of pwaSteps) run(name, cmd);
  if (process.env.PROBE_URL && process.env.AGENTIC_PROBE_LLM === '1') {
    run('probe-llm-download-live', 'node scripts/ci/probe-llm-download-live.mjs');
  }
  if (track === 'pwa-gpu' || process.env.GPU_MATRIX === '1') {
    run('gpu-llama-matrix', 'node scripts/test/gpu-llama-matrix.mjs');
  }
} else if (track === 'rn-static') {
  run('sync:llm-pwa', 'npm run sync:llm-pwa');
  run('test:unit', 'npm run test:unit');
  run('parity:android', 'npm run parity:android');
  run('parity:ios', 'npm run parity:ios');
  if (existsSync(gpuParityContract)) {
    run('gpu-parity-contract', 'node scripts/verify/gpu-parity-contract.mjs');
  }
} else if (track === 'rn-device') {
  if (process.env.RN_DEVICE !== '1') {
    console.error('RN_DEVICE=1 required for --track rn-device');
    process.exit(1);
  }
  run('gpu-rn-matrix', 'node scripts/test/gpu-rn-matrix.mjs');
} else {
  console.error('Unknown track:', track);
  process.exit(1);
}

console.log('\nagentic-gpu-v1 OK (track=' + track + ')');
