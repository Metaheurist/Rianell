/**
 * Node microbench for @rianell/ai-engine package exports.
 */
import {
  analyzeHealthMetrics,
  predictFutureValues,
  suggestLogNote,
  generateAnalysisNote,
  filterLogsByRange,
} from '@rianell/ai-engine';
import { FIXTURE_IDS, getFixture, moodSeries, metricValues } from '../lib/ai-fixtures.mjs';
import { getRepoRoot, benchmarkMeta } from '../lib/toolkit-env.mjs';
import { buildAiEnginePayload, writeLatestRunJson } from '../../reporters/write-run-json.mjs';
import { writeAiEngineMd } from '../../reporters/write-ai-engine-md.mjs';
import fs from 'fs';
import path from 'path';

const EXPORT_FN = {
  analyzeHealthMetrics,
  predictFutureValues,
  suggestLogNote,
  generateAnalysisNote,
  filterLogsByRange,
};

function timeMs(fn) {
  const t0 = performance.now();
  const result = fn();
  return { ms: Math.round(performance.now() - t0), result };
}

function loadThresholds() {
  const p = path.join(getRepoRoot(), 'benchmarks', 'toolkit', 'ai-thresholds.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function main() {
  const filter = process.env.AI_BENCH_FIXTURE_FILTER
    ? process.env.AI_BENCH_FIXTURE_FILTER.split(',').map((s) => s.trim())
    : FIXTURE_IDS;
  const thresholds = loadThresholds()['ai-engine-package'] || {};
  /** @type {object[]} */
  const probes = [];

  for (const fixtureId of filter) {
    const logs = getFixture(fixtureId);
    if (!logs) continue;

    let r = timeMs(() => analyzeHealthMetrics(logs, 30));
    probes.push({
      fixture: fixtureId,
      probe_id: 'analyzeHealthMetrics',
      probe_type: 'package_export',
      ms: r.ms,
      status: checkThreshold(thresholds.analyzeHealthMetrics, fixtureId, r.ms),
      totalLogs: r.result?.totalLogs,
    });

    r = timeMs(() => predictFutureValues(moodSeries(logs).map((p) => p.y), 7));
    probes.push({
      fixture: fixtureId,
      probe_id: 'predictFutureValues',
      probe_type: 'package_export',
      ms: r.ms,
      status: checkThreshold(thresholds.predictFutureValues, fixtureId, r.ms),
    });

    r = timeMs(() => filterLogsByRange(logs, 30));
    probes.push({
      fixture: fixtureId,
      probe_id: 'filterLogsByRange',
      probe_type: 'package_export',
      ms: r.ms,
      status: checkThreshold(thresholds.filterLogsByRange, fixtureId, r.ms),
      filtered: r.result?.length,
    });

    if (fixtureId === 'logs_30') {
      const summary = analyzeHealthMetrics(logs, 30);
      r = timeMs(() => suggestLogNote(logs[logs.length - 1]));
      probes.push({
        fixture: fixtureId,
        probe_id: 'suggestLogNote',
        probe_type: 'package_export',
        ms: r.ms,
        status: 'ok',
      });
      r = timeMs(() => generateAnalysisNote(summary));
      probes.push({
        fixture: fixtureId,
        probe_id: 'generateAnalysisNote',
        probe_type: 'package_export',
        ms: r.ms,
        status: 'ok',
      });
    }
  }

  const slowest = probes.reduce((a, b) => ((a.ms || 0) > (b.ms || 0) ? a : b), probes[0]);
  const payload = buildAiEnginePayload({
    slug: 'ai-engine-package',
    kind: 'ai_engine_package',
    meta: benchmarkMeta({ runtime: 'node', fixtures: filter.join(',') }),
    probes,
    optimization: {
      slowest_probe: slowest?.probe_id,
      slowest_fixture: slowest?.fixture,
      slowest_ms: slowest?.ms,
    },
  });

  const repoRoot = getRepoRoot();
  writeLatestRunJson(repoRoot, 'ai-engine-package', payload);
  writeAiEngineMd(repoRoot, payload);
  console.log('ai-engine-package:', payload.status, `(${probes.length} probes)`);
  if (payload.status !== 'ok') process.exit(1);
}

function checkThreshold(row, fixtureId, ms) {
  if (!row) return 'ok';
  const cap = row[fixtureId] ?? row['logs_30'];
  if (cap != null && ms > cap) return 'fail';
  return 'ok';
}

main();
