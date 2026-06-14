/**
 * Settings matrix on tier-3 desktop baseline.
 */
import { chromium } from 'playwright';
import { startStaticServer } from '../lib/static-server.mjs';
import { installTierInitScript, acceptCookiesIfVisible } from '../lib/tier-inject.mjs';
import { createObservabilityHarness } from '../lib/observability-harness.mjs';
import {
  getRepoRoot,
  getPwaRoot,
  benchmarkMeta,
  loadThresholds,
  VIEWPORTS,
  entryUrl,
} from '../lib/toolkit-env.mjs';
import { buildTierMatrixPayload, writeLatestRunJson } from '../../reporters/write-run-json.mjs';
import { writeTierMatrixMd } from '../../reporters/write-tier-matrix-md.mjs';

const FLAGS = ['--no-sandbox', '--disable-dev-shm-usage'];

const VARIANTS = [
  { id: 't3-default', settings: {} },
  { id: 't3-anim-off', settings: { animations: false } },
  { id: 't3-lazy-off', settings: { lazy: false } },
  { id: 't3-llm-tier5', settings: { preferredLlmModelSize: 'tier5' } },
  { id: 't3-save-data', settings: { _emulateSaveData: true } },
  { id: 't3-reduced-motion', settings: { _emulateReducedMotion: true } },
];

async function probeVariant(page, variantId) {
  const opts = await page.evaluate(() => {
    const prof = window.PerformanceUtils?.getOptimizationProfile?.() || {};
    const dev = window.PerformanceUtils?.getDeviceOpts?.() || {};
    return {
      chartAnimation: prof.chartAnimation,
      enableChartPreload: prof.enableChartPreload,
      enableAIPreload: prof.enableAIPreload,
      reduceUIAnimations: prof.reduceUIAnimations,
      deferAI: dev.deferAI,
      maxChartPoints: dev.maxChartPoints,
    };
  });
  return {
    id: variantId,
    tier: 3,
    platformType: 'desktop',
    aspects: {
      chart_animation_dom: opts.chartAnimation,
      enableChartPreload: opts.enableChartPreload,
      enableAIPreload: opts.enableAIPreload,
      reduceUIAnimations: opts.reduceUIAnimations,
      deferAI: opts.deferAI,
      maxChartPoints: opts.maxChartPoints,
    },
    status: 'ok',
  };
}

async function main() {
  const repoRoot = getRepoRoot();
  const root = getPwaRoot();
  const server = await startStaticServer(root);
  const baseUrl = `http://127.0.0.1:${server.port}`;
  const thresholds = loadThresholds();

  const browser = await chromium.launch({ headless: true, args: FLAGS });
  const runs = [];

  try {
    for (const variant of VARIANTS) {
      const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
      const initSettings = { ...variant.settings };
      delete initSettings._emulateSaveData;
      delete initSettings._emulateReducedMotion;

      await context.addInitScript(
        ({ settings, emulateSaveData, emulateReducedMotion }) => {
          try {
            localStorage.setItem(
              'rianellPerfBenchmark',
              JSON.stringify({
                platformType: 'desktop',
                tier: 3,
                scoreMs: 0,
                injected: true,
                ts: Date.now(),
                version: 4,
              }),
            );
            const prev = JSON.parse(localStorage.getItem('rianellSettings') || '{}');
            localStorage.setItem('rianellSettings', JSON.stringify({ ...prev, demoMode: true, ...settings }));
            if (emulateSaveData) {
              Object.defineProperty(navigator, 'connection', {
                value: { saveData: true, effectiveType: '2g' },
                configurable: true,
              });
            }
            if (emulateReducedMotion) {
              const mq = { matches: true, media: '(prefers-reduced-motion: reduce)' };
              window.matchMedia = () => mq;
            }
          } catch (e) {
            /* ignore */
          }
        },
        {
          settings: initSettings,
          emulateSaveData: !!variant.settings._emulateSaveData,
          emulateReducedMotion: !!variant.settings._emulateReducedMotion,
        },
      );

      const page = await context.newPage();
      createObservabilityHarness(page, { tier: 3, runId: variant.id });
      await page.goto(entryUrl(baseUrl), { waitUntil: 'domcontentloaded', timeout: 120000 });
      await acceptCookiesIfVisible(page);
      await page.waitForSelector('body.loaded', { timeout: 120000 });

      const run = await probeVariant(page, variant.id);
      const th = thresholds['settings-matrix']?.[variant.id] || {};
      const failures = [];
      for (const [k, expected] of Object.entries(th)) {
        if (run.aspects[k] !== expected) failures.push(`${k}: got ${run.aspects[k]}, want ${expected}`);
      }
      if (failures.length) {
        run.status = 'fail';
        run.failures = failures;
      }
      runs.push(run);
      await context.close();
      console.log('[settings-matrix]', variant.id, run.status);
    }
  } finally {
    await browser.close();
    await server.close();
  }

  const payload = buildTierMatrixPayload({
    slug: 'settings-matrix',
    meta: benchmarkMeta({ baseline: 'desktop-t3' }),
    runs,
    kind: 'settings_matrix',
    llm_blocked_tiers: [],
  });
  writeLatestRunJson(repoRoot, 'settings-matrix', payload);
  writeTierMatrixMd(repoRoot, payload);
  if (payload.status !== 'ok') process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
