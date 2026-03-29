import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const node = process.execPath;

function run(script) {
  const r = spawnSync(node, [path.join(__dirname, script)], {
    stdio: 'inherit',
    env: process.env,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function runWithEnv(script, extraEnv = {}) {
  const r = spawnSync(node, [path.join(__dirname, script)], {
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

runWithEnv('run-web-benchmarks.mjs', { BENCHMARK_SKIP_README: '1' });
runWithEnv('expo-bundle-stats.mjs', { BENCHMARK_SKIP_README: '1' });
run('update-benchmarks-readme.mjs');
