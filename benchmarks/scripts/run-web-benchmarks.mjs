/**
 * Serves PWA / Capacitor dist folders, runs Lighthouse (median of N) + navigation timings, writes Markdown.
 *
 * Env:
 *   BENCHMARK_PWA_ROOT   — static site root (default: apps/pwa-webapp/.android-dist or apps/pwa-webapp)
 *   BENCHMARK_REPO_ROOT  — repo root (default: ../.. from this file)
 *   BENCHMARK_LH_RUNS    — Lighthouse iterations (default 3; CI should use 2)
 *   BENCHMARK_SKIP_README — set 1 to skip README rewrite
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { writeBenchmarkMd } from '../reporters/write-md.mjs';
import {
  benchmarkMetaBase,
  buildWebRunPayload,
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

function lhRuns() {
  const n = Number(process.env.BENCHMARK_LH_RUNS || 3);
  return Number.isFinite(n) && n >= 1 ? Math.min(Math.floor(n), 5) : 3;
}

/** Prefer the LHCI probe path so boot overlay does not dominate LCP/CLS. */
function probeUrl(base, entry) {
  const url = entry.startsWith('http') ? new URL(entry) : new URL(entry, `${base}/`);
  if (!url.searchParams.has('lhci')) url.searchParams.set('lhci', '1');
  return url.href;
}

function writeProfile({ slug, title, note, lh, nav }) {
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
    {
      title: `Lighthouse performance (median of ${lh.runs?.length || lhRuns()} runs, desktop, no throttling)`,
      rows: lhRows,
    },
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

async function measureOnce(root) {
  if (!fs.existsSync(path.join(root, 'index.html')) && !fs.existsSync(path.join(root, 'legacy', 'index.html'))) {
    throw new Error(`Benchmark root missing index: ${root} (expected index.html or legacy/index.html)`);
  }

  const server = await startStaticServer(root);
  const base = `http://127.0.0.1:${server.port}`;
  const url = probeUrl(base, '/index.html');
  console.log(`[benchmarks] static server ${url}`);

  let lh;
  let nav;
  try {
    lh = await lighthouseMedian(url, lhRuns());
    console.log('[benchmarks] navigation timings…');
    nav = await measureNavigationTimings(url, { useBottomNav: false });
    console.log('[benchmarks] navigation timings done');
  } finally {
    await server.close();
  }
  return { lh, nav };
}

async function main() {
  const pwaRoot = pickPwaRootSync();
  console.log(`[benchmarks] PWA root=${pwaRoot} lhRuns=${lhRuns()}`);

  // web-pwa and github-pages use the same CI minified tree — measure once, write both reports.
  const { lh, nav } = await measureOnce(pwaRoot);

  writeProfile({
    slug: 'web-pwa',
    title: 'Web / PWA (static minified or dev tree)',
    note: 'Uses minified tree from `apps/pwa-webapp/.android-dist` when present (run `npm run build:web:apk`).',
    lh,
    nav,
  });

  writeProfile({
    slug: 'github-pages',
    title: 'GitHub Pages (equivalent static build)',
    note: 'Same artifact as the PWA row; CI deploys this shape to GitHub Pages (`site/` from minified workflow). Metrics are shared (single Lighthouse + nav pass).',
    lh,
    nav,
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
