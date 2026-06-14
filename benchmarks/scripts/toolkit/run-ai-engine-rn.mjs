/**
 * RN microbench via Jest harness (summarizeLogsForAi + package parity).
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { getRepoRoot, benchmarkMeta } from '../lib/toolkit-env.mjs';
import { buildAiEnginePayload, writeLatestRunJson } from '../../reporters/write-run-json.mjs';
import { writeAiEngineMd } from '../../reporters/write-ai-engine-md.mjs';

function loadThresholds() {
  const p = path.join(getRepoRoot(), 'benchmarks', 'toolkit', 'ai-thresholds.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function applyThresholds(probes, thresholds) {
  return probes.map((p) => {
    const row = thresholds['ai-engine-rn']?.[p.probe_id];
    if (!row || p.ms == null) return p;
    const cap = row[p.fixture];
    if (cap != null && p.ms > cap) return { ...p, status: 'fail' };
    return p;
  });
}

function main() {
  const repoRoot = getRepoRoot();
  const rnRoot = path.join(repoRoot, 'apps', 'rn-app');
  const tmpPath = path.join(repoRoot, 'benchmarks', 'ai-engine-rn', '.probes.tmp.json');
  fs.mkdirSync(path.dirname(tmpPath), { recursive: true });

  const jestJs = path.join(repoRoot, 'node_modules', 'jest', 'bin', 'jest.js');
  const r = spawnSync(
    process.execPath,
    [jestJs, 'src/ai/ai-engine-benchmark.test.ts', '-t', 'records probe timings', '--runInBand'],
    {
      cwd: rnRoot,
      env: { ...process.env, AI_BENCH_WRITE: tmpPath },
      encoding: 'utf8',
    },
  );

  if (r.status !== 0) {
    console.error(r.stdout || r.stderr || r.error?.message || 'jest failed');
    process.exit(r.status || 1);
  }

  if (!fs.existsSync(tmpPath)) {
    console.error('ai-engine-rn: missing probe output', tmpPath);
    process.exit(1);
  }

  const { probes: rawProbes } = JSON.parse(fs.readFileSync(tmpPath, 'utf8'));
  const thresholds = loadThresholds();
  const probes = applyThresholds(rawProbes, thresholds);
  const slowest = probes.reduce(
    (a, b) => ((a.ms || 0) > (b.ms || 0) ? a : b),
    probes[0] || { ms: 0 },
  );

  const payload = buildAiEnginePayload({
    slug: 'ai-engine-rn',
    kind: 'ai_engine_rn',
    meta: benchmarkMeta({ runtime: 'jest', fixtures: 'logs_30,logs_365' }),
    probes,
    optimization: {
      slowest_probe: slowest?.probe_id,
      slowest_fixture: slowest?.fixture,
      slowest_ms: slowest?.ms,
    },
  });

  writeLatestRunJson(repoRoot, 'ai-engine-rn', payload);
  writeAiEngineMd(repoRoot, payload);
  try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
  console.log('ai-engine-rn:', payload.status, `(${probes.length} probes)`);
  if (payload.status !== 'ok') process.exit(1);
}

main();
