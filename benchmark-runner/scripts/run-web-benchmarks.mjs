/**
 * Serves PWA / Capacitor dist folders, runs Lighthouse (median of 3) + navigation timings, writes Markdown.
 *
 * Env:
 *   BENCHMARK_PWA_ROOT   — static site root (default: apps/pwa-webapp/.android-dist or apps/pwa-webapp)
 *   BENCHMARK_CAP_ROOT   — Capacitor dist (default: apps/capacitor-app/dist)
 *   BENCHMARK_REPO_ROOT  — repo root (default: ../.. from this file)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { writeBenchmarkMd } from '../reporters/write-md.mjs';
import {
  benchmarkMetaBase,
  buildWebRunPayload,
  buildWebSkippedPayload,
  writeLatestRunJson,
} from '../reporters/write-run-json.mjs';
import { startStaticServer } from './lib/static-server.mjs';
import { lighthouseMedian } from './lib/lighthouse-run.mjs';
import { measureNavigationTimings } from './lib/navigation-timing.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = process.env.BENCHMARK_REPO_ROOT || path.resolve(__dirname, '..', '..');

function pickPwaRootSync() {
  const env = process.env.BENCHMARK_PWA_ROOT;
  if (env) return path.resolve(env);
  const min = path.join(REPO_ROOT, 'apps', 'pwa-webapp', '.android-dist');
  if (fs.existsSync(path.join(min, 'index.html'))) return min;
  return path.join(REPO_ROOT, 'apps', 'pwa-webapp');
}

function capRootSync() {
  const env = process.env.BENCHMARK_CAP_ROOT;
  if (env) return path.resolve(env);
  return path.join(REPO_ROOT, 'apps', 'capacitor-app', 'dist');
}

function meta() {
  return {
    timestamp_utc: new Date().toISOString(),
    git_sha: process.env.GITHUB_SHA || process.env.GIT_SHA || 'local',
    runner: process.platform,
    node: process.version,
  };
}

async function runOneProfile({ slug, title, startPath, note }) {
  const root = startPath.root;
  const entry = startPath.entry;
  if (!fs.existsSync(path.join(root, 'index.html')) && !fs.existsSync(path.join(root, 'legacy', 'index.html'))) {
    throw new Error(`Benchmark root missing index: ${root} (expected index.html or legacy/index.html)`);
  }

  const server = await startStaticServer(root);
  const base = `http://127.0.0.1:${server.port}`;
  const url = entry.startsWith('http') ? entry : new URL(entry, `${base}/`).href;

  let lh;
  let nav;
  try {
    lh = await lighthouseMedian(url, 3);
    nav = await measureNavigationTimings(url, { useBottomNav: false });
  } finally {
    await server.close();
  }

  const lhRows = [
    { metric: 'FCP', median_ms: lh.median.FCP_ms, unit: 'ms' },
    { metric: 'LCP', median_ms: lh.median.LCP_ms, unit: 'ms' },
    { metric: 'TBT', median_ms: lh.median.TBT_ms, unit: 'ms' },
    { metric: 'CLS', median_value: lh.median.CLS, unit: 'score' },
    { metric: 'SpeedIndex', median_ms: lh.median.SpeedIndex_ms, unit: 'ms' },
    { metric: 'TTI', median_ms: lh.median.TTI_ms, unit: 'ms' },
  ];

  const navRows = nav.map((r) => ({ step: r.step, ms: r.ms }));
  const runMeta = benchmarkMetaBase();

  const sections = [
    { title: 'Lighthouse performance (median of 3 runs, desktop, no throttling)', rows: lhRows },
    { title: 'Navigation / interaction (Playwright, ms)', rows: navRows },
  ];
  if (note) {
    sections.push({ title: 'Notes', rows: [{ detail: note }] });
  }

  writeBenchmarkMd({
    platformTitle: title,
    slug,
    repoRoot: REPO_ROOT,
    meta: runMeta,
    sections,
  });

  writeLatestRunJson(
    REPO_ROOT,
    slug,
    buildWebRunPayload({
      slug,
      meta: runMeta,
      lighthouseMedian: lh.median,
      nav,
    }),
  );
}

async function main() {
  const pwaRoot = pickPwaRootSync();
  const capRoot = capRootSync();

  await runOneProfile({
    slug: 'web-pwa',
    title: 'Web / PWA (static minified or dev tree)',
    startPath: { root: pwaRoot, entry: '/index.html' },
    note: 'Uses minified tree from `apps/pwa-webapp/.android-dist` when present (run `npm run build:web:apk`).',
  });

  await runOneProfile({
    slug: 'github-pages',
    title: 'GitHub Pages (equivalent static build)',
    startPath: { root: pwaRoot, entry: '/index.html' },
    note: 'Same artifact as the PWA row; CI deploys this shape to GitHub Pages (`site/` from minified workflow).',
  });

  if (fs.existsSync(path.join(capRoot, 'legacy', 'index.html'))) {
    await runOneProfile({
      slug: 'capacitor-web',
      title: 'Capacitor WebView payload (legacy bundle)',
      startPath: { root: capRoot, entry: '/legacy/index.html' },
      note: 'Matches native `legacy/index.html` entry (see `apps/capacitor-app/src/main.tsx`). Run `npm run build:web:apk && npm run build:react`.',
    });
  } else {
    const skipDetail = `Skipped: ${capRoot}/legacy/index.html not found. Run: npm run build:web:apk && npm run build:react`;
    const capMeta = benchmarkMetaBase();
    writeBenchmarkMd({
      platformTitle: 'Capacitor WebView payload (legacy bundle)',
      slug: 'capacitor-web',
      repoRoot: REPO_ROOT,
      meta: capMeta,
      sections: [
        {
          title: 'Status',
          rows: [
            {
              detail: skipDetail,
            },
          ],
        },
      ],
    });
    writeLatestRunJson(
      REPO_ROOT,
      'capacitor-web',
      buildWebSkippedPayload({
        slug: 'capacitor-web',
        meta: capMeta,
        reason: skipDetail,
      }),
    );
  }

  if (process.env.BENCHMARK_SKIP_README !== '1') {
    const { updateBenchmarksReadme } = await import('./update-benchmarks-readme.mjs');
    updateBenchmarksReadme();
  }
  console.log('Web benchmarks written under Benchmarks/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
