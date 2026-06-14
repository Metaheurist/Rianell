/**
 * 10-cell tier matrix (tier 1–5 × desktop/mobile) with aspect probes.
 */
import { chromium } from 'playwright';
import { startStaticServer } from '../lib/static-server.mjs';
import { runAspectProbes, evaluateAspectGates } from '../lib/aspect-probes.mjs';
import { createObservabilityHarness } from '../lib/observability-harness.mjs';
import { installLlmRouteBlock, shouldBlockLlmForTier } from '../lib/llm-route-block.mjs';
import { installTierInitScript, acceptCookiesIfVisible } from '../lib/tier-inject.mjs';
import {
  getRepoRoot,
  getPwaRoot,
  benchmarkMeta,
  loadTierProfiles,
  loadThresholds,
  parseTierFilter,
  parsePlatformFilter,
  VIEWPORTS,
  entryUrl,
} from '../lib/toolkit-env.mjs';
import { buildTierMatrixPayload, writeLatestRunJson } from '../../reporters/write-run-json.mjs';
import { writeTierMatrixMd } from '../../reporters/write-tier-matrix-md.mjs';
import { runGodModeSubset } from './run-god-mode-suite.mjs';

const FLAGS = ['--no-sandbox', '--disable-dev-shm-usage'];

function buildMatrixCells() {
  const tierFilter = parseTierFilter();
  const platformFilter = parsePlatformFilter();
  const tiers = tierFilter || [1, 2, 3, 4, 5];
  const platforms = platformFilter ? [platformFilter] : ['desktop', 'mobile'];
  const cells = [];
  for (const platformType of platforms) {
    for (const tier of tiers) {
      cells.push({
        id: `${platformType}-t${tier}`,
        tier,
        platformType,
        viewport: VIEWPORTS[platformType],
      });
    }
  }
  return cells;
}

async function runOneCell({ baseUrl, cell, profiles, thresholds, browser }) {
  const profileTable = profiles[cell.platformType] || profiles.desktop;
  const profile = profileTable[cell.tier] || profileTable[3];
  const blockLlm = shouldBlockLlmForTier(cell.tier);

  const context = await browser.newContext({ viewport: cell.viewport });
  await installTierInitScript(context, {
    tier: cell.tier,
    platformType: cell.platformType,
    demoMode: true,
  });

  const page = await context.newPage();
  const harness = createObservabilityHarness(page, {
    tier: cell.tier,
    runId: cell.id,
    llm_smoke_allowed: cell.tier >= 3 && !blockLlm,
  });

  if (blockLlm) await installLlmRouteBlock(page, { enabled: true });

  const loadStart = Date.now();
  await page.goto(entryUrl(baseUrl), { waitUntil: 'domcontentloaded', timeout: 120000 });
  await acceptCookiesIfVisible(page);

  const aspects = await runAspectProbes(page, {
    tier: cell.tier,
    platformType: cell.platformType,
    profile,
    harness,
    blockLlm,
  });
  if (!aspects.cold_load_ms) aspects.cold_load_ms = Date.now() - loadStart;

  let godMode = { pass: 0, total: 0, pass_pct: 100 };
  if (process.env.TIER_MATRIX_SKIP_GOD_MODE !== '1') {
    godMode = await runGodModeSubset(page, {
      tier: cell.tier,
      platformType: cell.platformType,
      maxSteps: cell.tier <= 2 ? 12 : 20,
    });
    aspects.god_mode_pass_pct = godMode.pass_pct;
  }

  const consoleSnap = harness.snapshot();
  const gateFailures = evaluateAspectGates(aspects, thresholds, cell.id);
  const th = thresholds['tier-matrix']?.[cell.id] || {};
  if (th.max_errors != null && consoleSnap.error > th.max_errors) {
    gateFailures.push(`console errors ${consoleSnap.error}`);
  }
  if (th.god_mode_pass_pct != null && godMode.pass_pct < th.god_mode_pass_pct) {
    gateFailures.push(`god_mode_pass_pct ${godMode.pass_pct}`);
  }
  if (th.charts_max_points_observed_min != null && aspects.charts_max_points_observed < th.charts_max_points_observed_min) {
    gateFailures.push(`charts_max_points ${aspects.charts_max_points_observed}`);
  }

  await context.close();

  return {
    id: cell.id,
    tier: cell.tier,
    platformType: cell.platformType,
    profile: {
      chartMaxPoints: profile.chartMaxPoints,
      maxChartPoints: profile.maxChartPoints,
      deferAI: profile.deferAI,
      useWorkers: profile.useWorkers,
      chartAnimation: profile.chartAnimation,
    },
    aspects,
    console: consoleSnap,
    god_mode: godMode,
    llm_network_blocked: blockLlm,
    status: gateFailures.length ? 'fail' : 'ok',
    failures: gateFailures,
  };
}

async function main() {
  const repoRoot = getRepoRoot();
  const root = getPwaRoot();
  const server = await startStaticServer(root);
  const baseUrl = `http://127.0.0.1:${server.port}`;
  const profiles = loadTierProfiles();
  const thresholds = loadThresholds();
  const cells = buildMatrixCells();

  const browser = await chromium.launch({ headless: true, args: FLAGS });
  const runs = [];
  try {
    for (const cell of cells) {
      console.log('[tier-matrix]', cell.id);
      const run = await runOneCell({ baseUrl, cell, profiles, thresholds, browser });
      runs.push(run);
      if (run.failures?.length) console.warn('[tier-matrix] failures', cell.id, run.failures);
    }
  } finally {
    await browser.close();
    await server.close();
  }

  let slowest = runs[0];
  for (const r of runs) {
    if ((r.aspects?.cold_load_ms || 0) > (slowest.aspects?.cold_load_ms || 0)) slowest = r;
  }

  const meta = benchmarkMeta({ pwa_root: root, cells: cells.length });
  const payload = buildTierMatrixPayload({
    slug: 'tier-matrix',
    meta,
    runs,
    optimization: {
      slowest_run: slowest?.id,
      slowest_aspect: 'cold_load',
      failures: runs.filter((r) => r.status !== 'ok').map((r) => r.id),
    },
  });

  writeLatestRunJson(repoRoot, 'tier-matrix', payload);
  writeTierMatrixMd(repoRoot, payload);
  console.log('tier-matrix:', payload.status, `(${runs.length} runs)`);
  if (payload.status !== 'ok') process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
