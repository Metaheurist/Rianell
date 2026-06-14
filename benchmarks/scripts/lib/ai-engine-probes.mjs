/**
 * Shared Playwright setup for AI engine layer/algo benchmarks.
 */
import fs from 'fs';
import path from 'path';
import { installTierInitScript, acceptCookiesIfVisible } from './tier-inject.mjs';
import { installLlmRouteBlock } from './llm-route-block.mjs';
import { createObservabilityHarness } from './observability-harness.mjs';
import { FIXTURES } from './ai-fixtures.mjs';
import {
  getRepoRoot,
  entryUrl,
  VIEWPORTS,
} from './toolkit-env.mjs';

const FLAGS = [
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--disable-extensions',
  '--disable-background-networking',
  '--disable-default-apps',
  '--disable-sync',
  '--mute-audio',
];

/** Always close Playwright + static server handles (avoids orphaned chrome-headless-shell). */
export async function disposeAiBenchmarkSession({ context, browser, server } = {}) {
  if (context) {
    try {
      await context.close();
    } catch (_) { /* ignore */ }
  }
  if (browser) {
    try {
      await browser.close();
    } catch (_) { /* ignore */ }
  }
  if (server) {
    try {
      await server.close();
    } catch (_) { /* ignore */ }
  }
}

/** @type {{ context?: import('playwright').BrowserContext, browser?: import('playwright').Browser, server?: { close(): Promise<void> } } | null} */
let activeBenchmarkSession = null;

/** Track handles so SIGINT/SIGTERM can close Chromium when a run is interrupted. */
export function trackAiBenchmarkSession(session) {
  activeBenchmarkSession = session;
}

export function registerAiBenchmarkShutdown() {
  if (registerAiBenchmarkShutdown.registered) return;
  registerAiBenchmarkShutdown.registered = true;
  const shutdown = async (code) => {
    if (!activeBenchmarkSession) return;
    await disposeAiBenchmarkSession(activeBenchmarkSession);
    activeBenchmarkSession = null;
    process.exit(code);
  };
  process.once('SIGINT', () => { void shutdown(130); });
  process.once('SIGTERM', () => { void shutdown(143); });
}
registerAiBenchmarkShutdown.registered = false;

export function loadAiCatalog() {
  const p = path.join(getRepoRoot(), 'benchmarks', 'toolkit', 'ai-engine-catalog.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function loadAiThresholds() {
  const p = path.join(getRepoRoot(), 'benchmarks', 'toolkit', 'ai-thresholds.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function loadAiAllowlistedErrors() {
  const p = path.join(getRepoRoot(), 'benchmarks', 'toolkit', 'allowlisted-ai-errors.json');
  if (!fs.existsSync(p)) return { patterns: [] };
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function parseFixtureFilter(defaultIds) {
  const raw = process.env.AI_BENCH_FIXTURE_FILTER || '';
  if (!raw.trim()) return defaultIds;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

/** Node-side poll — waitForFunction can stall when the minified app blocks the main thread. */
async function pollPageUntil(page, predicate, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastErr;
  while (Date.now() < deadline) {
    try {
      if (await page.evaluate(predicate)) return;
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw lastErr || new Error(`pollPageUntil timeout after ${timeoutMs}ms`);
}

/**
 * @param {import('playwright').BrowserContext} context
 */
export async function installAiBenchmarkInit(context) {
  const catalog = loadAiCatalog();
  const medianRuns = parseInt(process.env.AI_BENCH_MEDIAN || '1', 10) || 1;
  const forceCpu = process.env.AI_BENCH_FORCE_CPU === '1';
  await context.addInitScript(
    ({ fixtures, catalog, medianRuns, forceCpu }) => {
      window.__rianellAiFixtures = fixtures;
      window.__rianellAiCatalog = catalog;
      window.__rianellAiBenchOpts = { medianRuns, forceCpu };

      function emptyAnalysis() {
        return {
          trends: {}, correlations: [], anomalies: [], advice: [], patterns: [],
          riskFactors: [], prioritisedInsights: [], summary: '',
        };
      }

      const hooks = window.__rianellTestHooks || {};
      hooks.getAiBenchMeta = function () {
        let gpu = 'unknown';
        try {
          if (window.tf && typeof window.tf.getBackend === 'function') gpu = window.tf.getBackend();
        } catch (e) { /* ignore */ }
        return {
          hasAIEngine: !!window.AIEngine,
          tier: window.DeviceBenchmark && window.DeviceBenchmark.getPerformanceTier
            ? window.DeviceBenchmark.getPerformanceTier() : null,
          platform: window.DeviceBenchmark && window.DeviceBenchmark.getPlatformTypeCached
            ? window.DeviceBenchmark.getPlatformTypeCached()
            : (window.DeviceBenchmark && window.DeviceBenchmark.getPlatformType
              ? window.DeviceBenchmark.getPlatformType() : null),
          gpu_backend: gpu,
          deferAI: window.PerformanceUtils && window.PerformanceUtils.getDeviceOpts
            ? !!window.PerformanceUtils.getDeviceOpts().deferAI : null,
          llm_blocked: true,
        };
      };

      async function ensureEngineForBench() {
        if (window.AIEngine && window.AIEngine.NeuralAnalysisNetwork) return;
        for (let i = 0; i < 30; i++) {
          if (window.AIEngine && window.AIEngine.NeuralAnalysisNetwork) return;
          if (window.PerformanceUtils && window.PerformanceUtils.ensureAIEngineLoaded) {
            try { await window.PerformanceUtils.ensureAIEngineLoaded(); } catch (e) { /* retry */ }
            if (window.AIEngine && window.AIEngine.NeuralAnalysisNetwork) return;
          }
          await new Promise((r) => setTimeout(r, 1000));
        }
        if (window.AIEngine && window.AIEngine.NeuralAnalysisNetwork) return;
        function load(src) {
          return new Promise((resolve, reject) => {
            const el = document.createElement('script');
            el.src = src;
            el.onload = () => resolve();
            el.onerror = () => reject(new Error('load failed: ' + src));
            document.head.appendChild(el);
          });
        }
        try {
          await load('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');
          await load('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@4.22.0/dist/tf-backend-webgl.min.js');
        } catch (e) { /* CPU fallback */ }
        try {
          if (!window.AIEngine) await load('AIEngine.js');
        } catch (e) {
          if (!(window.AIEngine && window.AIEngine.NeuralAnalysisNetwork)) throw e;
        }
      }

      hooks.runAiLayerBenchmark = async function (fixtureId, opts) {
        opts = opts || {};
        const raw = (window.__rianellAiFixtures || {})[fixtureId];
        if (!raw || !raw.length) return { error: 'missing_fixture', fixtureId };
        const logs = JSON.parse(JSON.stringify(raw));
        await ensureEngineForBench();
        if (opts.warmGpu && window.AIEngine && window.AIEngine.warmGPUBackend) {
          await window.AIEngine.warmGPUBackend();
        }
        const AI = window.AIEngine;
        if (!AI || !AI.NeuralAnalysisNetwork) return { error: 'no_ai_engine' };
        const layerDefs = (window.__rianellAiCatalog && window.__rianellAiCatalog.layers) || [];
        const med = opts.medianRuns || (window.__rianellAiBenchOpts && window.__rianellAiBenchOpts.medianRuns) || 1;
        async function timeProbe(asyncFn, runs) {
          const samples = [];
          for (let i = 0; i < runs; i++) {
            if (AI.resetBenchmarkLayerInputCache) AI.resetBenchmarkLayerInputCache();
            const t0 = performance.now();
            await asyncFn();
            samples.push(performance.now() - t0);
          }
          samples.sort((a, b) => a - b);
          return {
            ms: Math.round(samples[samples.length - 1]),
            ms_median: Math.round(samples[Math.floor(samples.length / 2)]),
          };
        }
        const trainingLogs = logs;
        const recentLogs = logs;
        const layers = {};
        for (const def of layerDefs) {
          if (def.id === 'forward_full') continue;
          const runs = def.id === 'layerInput' ? (parseInt(String(med), 10) || 1) : 1;
          if (def.id === 'layerInput') {
            layers[def.id] = await timeProbe(async () => {
              const net = new AI.NeuralAnalysisNetwork(AI);
              await net.layerInput({
                trainingLogs, recentLogs, analysis: emptyAnalysis(),
                predictionState: { lastPredictions: {}, blendWeights: {} },
              });
            }, runs);
          } else {
            const net = new AI.NeuralAnalysisNetwork(AI);
            if (AI.resetBenchmarkLayerInputCache) AI.resetBenchmarkLayerInputCache();
            const context = {
              trainingLogs, recentLogs, analysis: emptyAnalysis(),
              predictionState: { lastPredictions: {}, blendWeights: {} },
            };
            await net.layerInput(context);
            const t0 = performance.now();
            if (def.async) await net[def.method](context);
            else net[def.method](context);
            layers[def.id] = { ms: Math.round(performance.now() - t0), ms_median: Math.round(performance.now() - t0) };
          }
        }
        layers.forward_full = await timeProbe(async () => {
          await new AI.NeuralAnalysisNetwork(AI).forward(logs, logs, {});
        }, parseInt(String(med), 10) || 1);
        return { fixtureId, layers, meta: hooks.getAiBenchMeta() };
      };

      hooks.runAiAlgoBenchmark = async function (algoId, fixtureId) {
        const raw = (window.__rianellAiFixtures || {})[fixtureId];
        if (!raw || !raw.length) return { error: 'missing_fixture', fixtureId };
        const logs = JSON.parse(JSON.stringify(raw));
        await ensureEngineForBench();
        const AI = window.AIEngine;
        if (!AI) return { error: 'no_ai_engine' };
        const algos = (window.__rianellAiCatalog && window.__rianellAiCatalog.algos) || [];
        const algo = algos.find((a) => a.id === algoId);
        if (!algo) return { error: 'unknown_algo', algoId };
        const dataPoints = logs.map((l, idx) => ({ x: idx, y: parseInt(l.mood, 10) || 0 }));
        const values = logs.map((l) => parseInt(l.mood, 10) || 0);
        const points2d = logs.map((l, idx) => ({ x: idx, y: parseInt(l.fatigue, 10) || 0 }));
        const xs = logs.map((l) => parseInt(l.mood, 10) || 0);
        const ys = logs.map((l) => parseInt(l.sleep, 10) || 0);
        const analysis = emptyAnalysis();
        const fn = AI[algo.call];
        if (typeof fn !== 'function') return { error: 'missing_method', call: algo.call };
        const t0 = performance.now();
        switch (algo.input) {
          case 'dataPoints':
            if (algo.call === 'performPolynomialRegression') fn.call(AI, dataPoints, 2);
            else fn.call(AI, dataPoints);
            break;
          case 'xyArrays': fn.call(AI, xs, ys); break;
          case 'points2d': fn.call(AI, points2d, 3); break;
          case 'values':
            if (algo.call === 'performARIMAForecast') fn.call(AI, values, 1, 0, 0);
            else if (algo.call === 'calculateMovingAverage') fn.call(AI, values, 7);
            else if (algo.call === 'performExponentialSmoothing') fn.call(AI, values, 0.3);
            else fn.call(AI, values);
            break;
          case 'logsAnalysis': fn.call(AI, logs, analysis); break;
          default: return { error: 'unknown_input', input: algo.input };
        }
        return { algoId, fixtureId, ms: Math.round(performance.now() - t0) };
      };

      window.__rianellTestHooks = hooks;
    },
    { fixtures: FIXTURES, catalog, medianRuns, forceCpu },
  );
}

/**
 * @param {import('playwright').Browser} browser
 * @param {string} baseUrl
 */
export async function createAiBenchmarkPage(browser, baseUrl) {
  const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
  try {
    await installTierInitScript(context, { tier: 3, platformType: 'desktop', demoMode: false });
    await installAiBenchmarkInit(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    const blockLlm = process.env.BENCHMARK_BLOCK_LLM !== '0';
    if (blockLlm) await installLlmRouteBlock(page, { enabled: true });
    const harness = createObservabilityHarness(page, {
      tier: 3,
      runId: 'ai-engine',
      llm_smoke_allowed: false,
    });
    // domcontentloaded: avoid hanging on deferred Google Fonts / Font Awesome (load can exceed 180s in CI).
    await page.goto(entryUrl(baseUrl), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await pollPageUntil(
      page,
      () => typeof window.PerformanceUtils !== 'undefined' && typeof window.PerformanceUtils.ensureAIEngineLoaded === 'function',
      45000,
    );
    await acceptCookiesIfVisible(page);
    await pollPageUntil(
      page,
      () => window.__rianellTestHooks && typeof window.__rianellTestHooks.runAiLayerBenchmark === 'function',
      15000,
    );
    return { context, page, harness, blockLlm };
  } catch (err) {
    await context.close().catch(() => {});
    throw err;
  }
}

export function checkProbeThreshold(thresholds, slug, probeId, fixtureId, ms) {
  const row = thresholds[slug]?.[probeId];
  if (!row) return 'ok';
  const cap = row[fixtureId];
  if (cap != null && ms > cap) return 'fail';
  return 'ok';
}

export function resolveLayerFixtures() {
  const catalog = loadAiCatalog();
  const all = [...new Set([...(catalog.primary_fixtures || []), 'sparse_no_food', 'dense_symptoms'])];
  return parseFixtureFilter(all);
}

export function resolveAlgoFixtures() {
  const catalog = loadAiCatalog();
  return parseFixtureFilter(catalog.algo_fixtures || catalog.primary_fixtures || ['logs_30']);
}

export { FLAGS };
