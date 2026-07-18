import fs from 'fs';
import path from 'path';

/** @typedef {1} BenchmarkRunSchemaVersion */
export const BENCHMARK_RUN_SCHEMA_VERSION = 1;

/**
 * @returns {Record<string, string>}
 */
export function benchmarkMetaBase() {
  const meta = {
    timestamp_utc: new Date().toISOString(),
    git_sha: process.env.GITHUB_SHA || process.env.GIT_SHA || 'local',
    runner: process.platform,
    node: process.version,
  };
  const runId = process.env.GITHUB_RUN_ID;
  if (runId) meta.github_run_id = runId;
  const attempt = process.env.GITHUB_RUN_ATTEMPT;
  if (attempt) meta.github_run_attempt = attempt;
  return meta;
}

/**
 * @param {object} opts
 * @param {string} opts.slug
 * @param {Record<string, string>} opts.meta
 * @param {Record<string, number|null>} opts.lighthouseMedian - keys FCP_ms, LCP_ms, etc.
 * @param {{ step: string, ms: number }[]} opts.nav
 */
export function buildWebRunPayload({ slug, meta, lighthouseMedian, nav }) {
  return {
    schema_version: BENCHMARK_RUN_SCHEMA_VERSION,
    slug,
    kind: 'web',
    status: 'ok',
    meta,
    lighthouse: {
      FCP_ms: lighthouseMedian.FCP_ms ?? null,
      LCP_ms: lighthouseMedian.LCP_ms ?? null,
      TBT_ms: lighthouseMedian.TBT_ms ?? null,
      CLS: lighthouseMedian.CLS ?? null,
      SpeedIndex_ms: lighthouseMedian.SpeedIndex_ms ?? null,
      TTI_ms: lighthouseMedian.TTI_ms ?? null,
    },
    nav: nav.map((r) => ({ step: r.step, ms: r.ms })),
  };
}

/**
 * @param {object} opts
 * @param {string} opts.slug
 * @param {Record<string, string>} opts.meta
 * @param {string} opts.reason
 */
export function buildWebSkippedPayload({ slug, meta, reason }) {
  return {
    schema_version: BENCHMARK_RUN_SCHEMA_VERSION,
    slug,
    kind: 'web',
    status: 'skipped',
    meta,
    skip_reason: reason,
  };
}

/**
 * @param {string} repoRoot
 * @param {string} slug - benchmarks subfolder
 * @param {object} payload
 */
export function writeLatestRunJson(repoRoot, slug, payload) {
  const dir = path.join(repoRoot, 'benchmarks', slug);
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, 'latest.run.json');
  fs.writeFileSync(out, JSON.stringify(payload, null, 2), 'utf8');
  return out;
}
