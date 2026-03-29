/**
 * Hermes bundle + asset stats for Expo export output.
 * Env: BUNDLE_ROOT (default apps/rn-app/dist-expo-prod), BENCHMARK_REPO_ROOT
 */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { writeBenchmarkMd } from '../reporters/write-md.mjs';
import {
  benchmarkMetaBase,
  buildExpoRunPayload,
  buildExpoSkippedPayload,
  writeLatestRunJson,
} from '../reporters/write-run-json.mjs';
import { updateBenchmarksReadme } from './update-benchmarks-readme.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = process.env.BENCHMARK_REPO_ROOT || path.resolve(__dirname, '..', '..');

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

function meta() {
  return {
    timestamp_utc: new Date().toISOString(),
    git_sha: process.env.GITHUB_SHA || process.env.GIT_SHA || 'local',
    runner: process.platform,
    node: process.version,
  };
}

export function runExpoBundleStats() {
  const root = process.env.BUNDLE_ROOT
    ? path.resolve(process.env.BUNDLE_ROOT)
    : path.join(REPO_ROOT, 'apps', 'rn-app', 'dist-expo-prod');

  if (!fs.existsSync(root)) {
    const skipReason = `No bundle at ${root}. Run: npm run bundle:mobile:prod or cd apps/rn-app && npx expo export --platform android --platform ios --output-dir dist-expo-prod`;
    const m = benchmarkMetaBase();
    writeBenchmarkMd({
      platformTitle: 'Expo / React Native (Hermes bundles)',
      slug: 'expo-rn',
      repoRoot: REPO_ROOT,
      meta: m,
      sections: [
        {
          title: 'Status',
          rows: [
            {
              detail: skipReason,
            },
          ],
        },
      ],
    });
    writeLatestRunJson(REPO_ROOT, 'expo-rn', buildExpoSkippedPayload({ meta: m, reason: skipReason }));
    return;
  }

  const files = walk(root);
  const hbc = files.filter((f) => f.endsWith('.hbc'));
  const rows = [];

  for (const f of hbc) {
    const buf = fs.readFileSync(f);
    const rel = path.relative(root, f).replace(/\\/g, '/');
    const gz = zlib.gzipSync(buf, { level: 9 });
    const platform = rel.includes('/android/') ? 'android' : rel.includes('/ios/') ? 'ios' : 'unknown';
    rows.push({
      platform,
      file: rel,
      bytes: buf.length,
      gzip_bytes: gz.length,
    });
  }

  const other = files.filter((f) => !f.endsWith('.hbc'));
  const assetSummary = {
    total_files: other.length,
    total_bytes: other.reduce((s, f) => s + fs.statSync(f).size, 0),
  };

  const runMeta = benchmarkMetaBase();

  writeBenchmarkMd({
    platformTitle: 'Expo / React Native (Hermes bundles)',
    slug: 'expo-rn',
    repoRoot: REPO_ROOT,
    meta: runMeta,
    sections: [
      { title: 'Hermes bytecode bundles (.hbc)', rows },
      {
        title: 'Other static assets (counts)',
        rows: [
          {
            total_non_hbc_files: assetSummary.total_files,
            total_non_hbc_bytes: assetSummary.total_bytes,
          },
        ],
      },
    ],
  });

  writeLatestRunJson(
    REPO_ROOT,
    'expo-rn',
    buildExpoRunPayload({
      meta: runMeta,
      hbcRows: rows,
      assetSummary,
    }),
  );
}

function main() {
  runExpoBundleStats();
  if (process.env.BENCHMARK_SKIP_README !== '1') {
    updateBenchmarksReadme();
  }
}

main();
