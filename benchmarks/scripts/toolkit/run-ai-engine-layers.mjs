/**
 * Playwright microbench for AIEngine.js NeuralAnalysisNetwork layers.
 */
import { chromium } from 'playwright';
import { startStaticServer } from '../lib/static-server.mjs';
import { getRepoRoot, getPwaRoot, benchmarkMeta } from '../lib/toolkit-env.mjs';
import { buildAiEnginePayload, writeLatestRunJson } from '../../reporters/write-run-json.mjs';
import { writeAiEngineMd } from '../../reporters/write-ai-engine-md.mjs';
import {
  FLAGS,
  createAiBenchmarkPage,
  loadAiCatalog,
  loadAiThresholds,
  checkProbeThreshold,
  resolveLayerFixtures,
} from '../lib/ai-engine-probes.mjs';

async function main() {
  const repoRoot = getRepoRoot();
  const pwaRoot = getPwaRoot();
  const catalog = loadAiCatalog();
  const thresholds = loadAiThresholds();
  const fixtures = resolveLayerFixtures();
  const medianRuns = parseInt(process.env.AI_BENCH_MEDIAN || '1', 10) || 1;
  const server = await startStaticServer(pwaRoot);
  const baseUrl = `http://127.0.0.1:${server.port}`;
  const browser = await chromium.launch({ headless: true, args: FLAGS });

  /** @type {object[]} */
  const probes = [];
  let benchMeta = {};

  try {
    const { context, page, harness, blockLlm } = await createAiBenchmarkPage(browser, baseUrl);

    for (const fixtureId of fixtures) {
      const result = await page.evaluate(
        async ({ fixtureId, medianRuns }) => {
          const hooks = window.__rianellTestHooks;
          if (!hooks || !hooks.runAiLayerBenchmark) return { error: 'no_hooks' };
          return hooks.runAiLayerBenchmark(fixtureId, { warmGpu: true, medianRuns });
        },
        { fixtureId, medianRuns },
      );

      if (result.error) {
        probes.push({
          fixture: fixtureId,
          probe_id: 'runAiLayerBenchmark',
          probe_type: 'layer',
          ms: null,
          status: 'fail',
          error: result.error,
        });
        continue;
      }

      if (!benchMeta.gpu_backend && result.meta) {
        benchMeta = { ...result.meta, llm_blocked: blockLlm };
      }

      for (const layer of catalog.layers) {
        const timed = result.layers?.[layer.id];
        if (!timed) continue;
        const ms = timed.ms_median ?? timed.ms;
        probes.push({
          fixture: fixtureId,
          probe_id: layer.id,
          probe_type: 'layer',
          ms,
          ms_median: timed.ms_median,
          status: checkProbeThreshold(thresholds, 'ai-engine-layers', layer.id, fixtureId, ms),
        });
      }
    }

    const consoleSnap = harness.snapshot();
    const maxErrors = thresholds.max_errors ?? 0;
    if (consoleSnap.error > maxErrors) {
      probes.push({
        fixture: '—',
        probe_id: 'console_errors',
        probe_type: 'gate',
        ms: null,
        status: 'fail',
        count: consoleSnap.error,
      });
    }

    await context.close();
  } finally {
    await browser.close();
    await server.close();
  }

  const slowest = probes.reduce(
    (a, b) => ((a.ms || 0) > (b.ms || 0) ? a : b),
    probes[0] || { ms: 0 },
  );
  const forwardProbe = probes.find((p) => p.probe_id === 'forward_full' && p.fixture === 'logs_30');

  const payload = buildAiEnginePayload({
    slug: 'ai-engine-layers',
    kind: 'ai_engine_layers',
    meta: benchmarkMeta({
      runtime: 'playwright',
      tier: 3,
      platform: 'desktop',
      fixture_count: fixtures.length,
      ...benchMeta,
    }),
    probes,
    optimization: {
      slowest_probe: slowest?.probe_id,
      slowest_fixture: slowest?.fixture,
      slowest_ms: slowest?.ms,
      forward_full_ms: forwardProbe?.ms ?? null,
    },
  });

  writeLatestRunJson(repoRoot, 'ai-engine-layers', payload);
  writeAiEngineMd(repoRoot, payload);
  console.log('ai-engine-layers:', payload.status, `(${probes.length} probes)`);
  if (payload.status !== 'ok') process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
