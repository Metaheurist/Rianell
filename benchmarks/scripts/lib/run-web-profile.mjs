/**
 * Shared web profile runner (Lighthouse + navigation timings).
 */
import fs from 'fs';
import path from 'path';
import { writeBenchmarkMd } from '../../reporters/write-md.mjs';
import {
  benchmarkMetaBase,
  buildWebRunPayload,
  writeLatestRunJson,
} from '../../reporters/write-run-json.mjs';
import { startStaticServer } from '../lib/static-server.mjs';
import { lighthouseMedian } from '../lib/lighthouse-run.mjs';
import { measureNavigationTimings } from '../lib/navigation-timing.mjs';
import { getRepoRoot, getPwaRoot } from '../lib/toolkit-env.mjs';

/**
 * @param {object} opts
 * @param {string} opts.slug
 * @param {string} opts.title
 * @param {string} [opts.entry]
 * @param {string} [opts.note]
 * @param {string} [opts.root]
 */
export async function runWebProfile(opts) {
  const repoRoot = getRepoRoot();
  const root = opts.root || getPwaRoot();
  const entry = opts.entry || '/index.html';
  if (!fs.existsSync(path.join(root, 'index.html'))) {
    throw new Error(`Benchmark root missing index: ${root}`);
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

  writeBenchmarkMd({
    platformTitle: opts.title,
    slug: opts.slug,
    repoRoot,
    meta: runMeta,
    sections: [
      { title: 'Lighthouse performance (median of 3 runs, desktop, no throttling)', rows: lhRows },
      { title: 'Navigation / interaction (Playwright, ms)', rows: navRows },
      ...(opts.note ? [{ title: 'Notes', rows: [{ detail: opts.note }] }] : []),
    ],
  });

  writeLatestRunJson(
    repoRoot,
    opts.slug,
    buildWebRunPayload({ slug: opts.slug, meta: runMeta, lighthouseMedian: lh.median, nav }),
  );
  return { lh: lh.median, nav };
}
