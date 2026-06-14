/**
 * Prepare minified PWA site for benchmarks (unless BENCHMARK_SKIP_BUILD=1).
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { getRepoRoot, getPwaRoot } from '../lib/toolkit-env.mjs';

export function prepareSite() {
  const root = getPwaRoot();
  if (process.env.BENCHMARK_SKIP_BUILD === '1') {
    if (!fs.existsSync(path.join(root, 'index.html'))) {
      throw new Error(`BENCHMARK_SKIP_BUILD=1 but no index at ${root}`);
    }
    console.log('[prepare-site] skip build, using', root);
    return root;
  }
  const repo = getRepoRoot();
  console.log('[prepare-site] npm run build:web:apk');
  const r = spawnSync('npm', ['run', 'build:web:apk'], {
    cwd: repo,
    stdio: 'inherit',
    shell: true,
  });
  if (r.status !== 0) throw new Error('build:web:apk failed');
  return getPwaRoot();
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('prepare-site.mjs')) {
  prepareSite();
}
