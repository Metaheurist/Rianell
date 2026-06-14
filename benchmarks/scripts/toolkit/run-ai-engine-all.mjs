/**
 * Local orchestrator mirroring CI four AI engine benchmark jobs.
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = process.env.BENCHMARK_REPO_ROOT || path.resolve(__dirname, '..', '..', '..');

const steps = [
  ['run-ai-engine-package.mjs'],
  ['run-ai-engine-layers.mjs'],
  ['run-ai-engine-algos.mjs'],
  ['run-ai-engine-rn.mjs'],
  ['verify-ai-engine.mjs', '--strict'],
];

for (const args of steps) {
  const script = path.join(__dirname, args[0]);
  console.log('> node', path.basename(script), ...args.slice(1));
  const r = spawnSync('node', [script, ...args.slice(1)], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  });
  if (r.status !== 0) process.exit(r.status || 1);
}

console.log('ai-all: ok');
