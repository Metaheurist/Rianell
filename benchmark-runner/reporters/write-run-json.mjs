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
 * Sum gzip and raw bytes per platform for Hermes .hbc files (stable aggregates for trends).
 * @param {{ platform: string, gzip_bytes: number, bytes: number }[]} rows
 */
export function aggregateHermesByPlatform(rows) {
  const agg = { android: { gzip: 0, raw: 0 }, ios: { gzip: 0, raw: 0 }, unknown: { gzip: 0, raw: 0 } };
  for (const r of rows) {
    const k = r.platform === 'android' || r.platform === 'ios' ? r.platform : 'unknown';
    agg[k].gzip += r.gzip_bytes;
    agg[k].raw += r.bytes;
  }
  return agg;
}

/**
 * @param {object} opts
 * @param {Record<string, string>} opts.meta
 * @param {object[]} opts.hbcRows - platform, file, bytes, gzip_bytes
 * @param {{ total_files: number, total_bytes: number }} opts.assetSummary
 */
export function buildExpoRunPayload({ meta, hbcRows, assetSummary }) {
  const agg = aggregateHermesByPlatform(hbcRows);
  return {
    schema_version: BENCHMARK_RUN_SCHEMA_VERSION,
    slug: 'expo-rn',
    kind: 'expo',
    status: 'ok',
    meta,
    hermes: {
      hbc_file_count: hbcRows.length,
      android_gzip_bytes: agg.android.gzip,
      ios_gzip_bytes: agg.ios.gzip,
      android_raw_bytes: agg.android.raw,
      ios_raw_bytes: agg.ios.raw,
      /** Full rows for debugging; compare charts use aggregates above */
      bundles: hbcRows.map((r) => ({
        platform: r.platform,
        file: r.file,
        bytes: r.bytes,
        gzip_bytes: r.gzip_bytes,
      })),
    },
    assets: {
      total_non_hbc_files: assetSummary.total_files,
      total_non_hbc_bytes: assetSummary.total_bytes,
    },
  };
}

/**
 * @param {Record<string, string>} opts.meta
 * @param {string} opts.reason
 */
export function buildExpoSkippedPayload({ meta, reason }) {
  return {
    schema_version: BENCHMARK_RUN_SCHEMA_VERSION,
    slug: 'expo-rn',
    kind: 'expo',
    status: 'skipped',
    meta,
    skip_reason: reason,
  };
}

/**
 * @param {string} repoRoot
 * @param {string} slug - Benchmarks subfolder
 * @param {object} payload
 */
export function writeLatestRunJson(repoRoot, slug, payload) {
  const dir = path.join(repoRoot, 'Benchmarks', slug);
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, 'latest.run.json');
  fs.writeFileSync(out, JSON.stringify(payload, null, 2), 'utf8');
  return out;
}
