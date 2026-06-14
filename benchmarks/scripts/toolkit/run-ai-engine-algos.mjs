/**
 * Playwright microbench for AIEngine.js atomic algorithms.
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
  resolveAlgoFixtures,
} from '../lib/ai-engine-probes.mjs';

async function main() {
  const repoRoot = getRepoRoot();
  const pwaRoot = getPwaRoot();
  const catalog = loadAiCatalog();
  const thresholds = loadAiThresholds();
  const fixtures = resolveAlgoFixtures();
  const server = await startStaticServer(pwaRoot);
  const baseUrl = `http://127.0.0.1:${server.port}`;
  const browser = await chromium.launch({ headless: true, args: FLAGS });

  /** @type {object[]} */
  const probes = [];
  let benchMeta = {};

  try {
    const { context, page, harness, blockLlm } = await createAiBenchmarkPage(browser, baseUrl);

    for (const fixtureId of fixtures) {
      for (const algo of catalog.algos) {
        const result = await page.evaluate(
          async ({ algoId, fixtureId }) => {
            const hooks = window.__rianellTestHooks;
            if (!hooks || !hooks.runAiAlgoBenchmark) return { error: 'no_hooks' };
            return hooks.runAiAlgoBenchmark(algoId, fixtureId);
          },
          { algoId: algo.id, fixtureId },
        );

        if (result.error) {
          probes.push({
            fixture: fixtureId,
            probe_id: algo.id,
            probe_type: 'algo',
            ms: null,
            status: 'fail',
            error: result.error,
          });
          continue;
        }

        if (!benchMeta.gpu_backend) {
          const meta = await page.evaluate(() =>
            window.__rianellTestHooks?.getAiBenchMeta?.() || {},
          );
          benchMeta = { ...meta, llm_blocked: blockLlm };
        }

        probes.push({
          fixture: fixtureId,
          probe_id: algo.id,
          probe_type: 'algo',
          ms: result.ms,
          status: checkProbeThreshold(thresholds, 'ai-engine-algos', algo.id, fixtureId, result.ms),
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

  const payload = buildAiEnginePayload({
    slug: 'ai-engine-algos',
    kind: 'ai_engine_algos',
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
    },
  });

  writeLatestRunJson(repoRoot, 'ai-engine-algos', payload);
  writeAiEngineMd(repoRoot, payload);
  console.log('ai-engine-algos:', payload.status, `(${probes.length} probes)`);
  if (payload.status !== 'ok') process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
