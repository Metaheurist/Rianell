/**
 * Serves PWA / Capacitor dist folders, runs Lighthouse (median of 3) + navigation timings, writes Markdown.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runWebProfile } from './lib/run-web-profile.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = process.env.BENCHMARK_REPO_ROOT || path.resolve(__dirname, '..', '..');

function pickPwaRootSync() {
  const env = process.env.BENCHMARK_PWA_ROOT;
  if (env) return path.resolve(env);
  const min = path.join(REPO_ROOT, 'apps', 'pwa-webapp', '.android-dist');
  if (fs.existsSync(path.join(min, 'index.html'))) return min;
  return path.join(REPO_ROOT, 'apps', 'pwa-webapp');
}

async function main() {
  const pwaRoot = pickPwaRootSync();

  await runWebProfile({
    slug: 'web-pwa',
    title: 'Web / PWA (static minified or dev tree)',
    root: pwaRoot,
    entry: '/index.html',
    note: 'Uses minified tree from `apps/pwa-webapp/.android-dist` when present (run `npm run build:web:apk`).',
  });

  await runWebProfile({
    slug: 'github-pages',
    title: 'GitHub Pages (equivalent static build)',
    root: pwaRoot,
    entry: '/index.html',
    note: 'Same artifact as the PWA row; CI deploys this shape to GitHub Pages (`site/` from minified workflow).',
  });

  if (process.env.BENCHMARK_SKIP_README !== '1') {
    const { updateBenchmarksReadme } = await import('./update-benchmarks-readme.mjs');
    updateBenchmarksReadme();
  }
  console.log('Web benchmarks written under benchmarks/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
