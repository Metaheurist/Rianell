/**
 * Tier-parameterized aspect probes for PWA benchmark matrix.
 */
import { countLlmNetwork } from './llm-route-block.mjs';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickBenchmark(page, name) {
  await page.evaluate((n) => {
    const els = Array.from(document.querySelectorAll(`[data-benchmark="${n}"]`));
    const el = els.find((e) => e.offsetParent !== null);
    if (el) el.click();
  }, name);
}

/**
 * @param {import('playwright').Page} page
 * @param {object} opts
 * @param {number} opts.tier
 * @param {string} opts.platformType
 * @param {object} opts.profile - from tier-profiles.json
 * @param {import('./observability-harness.mjs').createObservabilityHarness} opts.harness
 * @param {boolean} opts.blockLlm
 */
export async function runAspectProbes(page, opts) {
  const { tier, platformType, profile, harness, blockLlm } = opts;
  /** @type {Record<string, unknown>} */
  const aspects = {};

  const coldStep = harness.startStep('cold_load', { aspect: 'cold_load' });
  await page.waitForSelector('body.loaded', { timeout: (profile.loadTimeoutMs || 10000) + 5000 });
  aspects.cold_load_ms = coldStep.ended_at ? coldStep.ms : Date.now() - coldStep.started_at;
  harness.endStep(coldStep);

  const profileCheck = await page.evaluate(() => {
    const hooks = window.__rianellTestHooks;
    const opts = hooks && hooks.getDeviceOpts ? hooks.getDeviceOpts() : null;
    const active = hooks && hooks.getActiveProfile ? hooks.getActiveProfile() : null;
    const tierN = window.DeviceBenchmark && window.DeviceBenchmark.getPerformanceTier
      ? window.DeviceBenchmark.getPerformanceTier() : null;
    const pt = window.DeviceBenchmark && window.DeviceBenchmark.getPlatformTypeCached
      ? window.DeviceBenchmark.getPlatformTypeCached() : null;
    return { opts, active, tier: tierN, platformType: pt };
  });
  aspects.tier_observed = profileCheck.tier;
  aspects.platform_observed = profileCheck.platformType;
  aspects.deferAI_observed = profileCheck.opts?.deferAI;
  aspects.maxChartPoints_observed = profileCheck.opts?.maxChartPoints;

  const chartsStep = harness.startStep('charts', { aspect: 'charts' });
  await clickBenchmark(page, 'nav-charts');
  await delay(400);
  const chartInfo = await page.evaluate(() => {
    const opts = window.PerformanceUtils?.getDeviceOpts?.() || {};
    const series = document.querySelectorAll('.apexcharts-series');
    return {
      chart_sections: document.querySelectorAll('[id*="chart"], .chart-container, #chartSection').length,
      apex_series: series.length,
      maxChartPoints: opts.maxChartPoints,
    };
  });
  aspects.charts_ms = Date.now() - chartsStep.started_at;
  aspects.charts_max_points_observed = chartInfo.maxChartPoints;
  harness.endStep(chartsStep);

  const logsStep = harness.startStep('logs', { aspect: 'logs' });
  await clickBenchmark(page, 'nav-logs');
  await delay(300);
  aspects.logs_ms = Date.now() - logsStep.started_at;
  harness.endStep(logsStep);

  const aiStep = harness.startStep('ai_engine', { aspect: 'ai' });
  await clickBenchmark(page, 'nav-ai');
  await delay(blockLlm ? 600 : 1200);
  const aiResult = await page.evaluate(async () => {
    if (window.PerformanceUtils && typeof window.PerformanceUtils.ensureAIEngineLoaded === 'function') {
      try { await window.PerformanceUtils.ensureAIEngineLoaded(); } catch (e) { /* ignore */ }
    }
    const hasAIEngine = !!(window.AIEngine && typeof window.AIEngine.analyzeHealthMetrics === 'function');
    const deferAI = window.PerformanceUtils?.getDeviceOpts?.()?.deferAI;
    let engineMs = null;
    let engineOk = false;
    if (hasAIEngine) {
      const t0 = performance.now();
      try {
        const logs = typeof window.logs !== 'undefined' && window.logs?.length
          ? window.logs.slice(0, 5)
          : [{ date: new Date().toISOString().slice(0, 10), weight: 70, mood: 5 }];
        const out = window.AIEngine.analyzeHealthMetrics(logs, { locale: 'en-GB' });
        engineOk = !!(out && (out.insights || out.summary || out.metrics));
      } catch (e) {
        engineOk = false;
      }
      engineMs = Math.round(performance.now() - t0);
    }
    return { hasAIEngine, deferAI, engineMs, engineOk };
  });
  const llmNet = await countLlmNetwork(page);
  aspects.ai_engine_ms = aiResult.engineMs;
  aspects.ai_engine_ok = aiResult.engineOk;
  aspects.ai_llm_network_requests = llmNet.ai_llm_network_requests;
  aspects.ai_llm_script_loaded = llmNet.ai_llm_script_loaded;
  harness.endStep(aiStep, aiResult.engineOk ? 'ok' : 'warn');

  const motdStep = harness.startStep('motd', { aspect: 'motd' });
  await clickBenchmark(page, 'nav-home');
  await delay(400);
  const motdInfo = await page.evaluate(() => {
    const deferAI = window.PerformanceUtils?.getDeviceOpts?.()?.deferAI;
    const title = document.getElementById('dashboardTitle');
    return {
      motd_llm_skipped: !!deferAI,
      title_present: !!(title && title.textContent && title.textContent.trim()),
    };
  });
  aspects.motd_llm_skipped = motdInfo.motd_llm_skipped;
  aspects.motd_title_present = motdInfo.title_present;
  harness.endStep(motdStep);

  const settingsStep = harness.startStep('settings', { aspect: 'settings' });
  await page.evaluate(() => {
    if (typeof toggleSettings === 'function') {
      const o = document.getElementById('settingsOverlay');
      const open = o && o.classList.contains('settings-overlay--open');
      if (!open) toggleSettings();
    }
  });
  await page.waitForFunction(
    () => {
      const o = document.getElementById('settingsOverlay');
      return o && o.classList.contains('settings-overlay--open');
    },
    { timeout: 15000 },
  ).catch(() => {});
  const paneCount = await page.locator('[data-settings-pane-i18n]').count();
  aspects.settings_panes = paneCount;
  aspects.settings_ms = Date.now() - settingsStep.started_at;
  await page.keyboard.press('Escape');
  await delay(200);
  harness.endStep(settingsStep);

  aspects.profile_expected = {
    tier,
    platformType,
    deferAI: profile.deferAI,
    maxChartPoints: profile.maxChartPoints,
    useWorkers: profile.useWorkers,
    chartAnimation: profile.chartAnimation,
  };

  return aspects;
}

export function evaluateAspectGates(aspects, thresholds, runId) {
  const row = thresholds?.['tier-matrix']?.[runId] || {};
  const failures = [];
  if (row.cold_load_ms != null && aspects.cold_load_ms > row.cold_load_ms) {
    failures.push(`cold_load_ms ${aspects.cold_load_ms} > ${row.cold_load_ms}`);
  }
  if (row.ai_engine_ms != null && aspects.ai_engine_ms != null && aspects.ai_engine_ms > row.ai_engine_ms) {
    failures.push(`ai_engine_ms ${aspects.ai_engine_ms} > ${row.ai_engine_ms}`);
  }
  if (row.ai_llm_network_requests != null && aspects.ai_llm_network_requests > row.ai_llm_network_requests) {
    failures.push(`ai_llm_network_requests ${aspects.ai_llm_network_requests}`);
  }
  if (row.ai_llm_script_loaded === false && aspects.ai_llm_script_loaded) {
    failures.push('ai_llm_script_loaded true');
  }
  if (row.motd_llm_skipped === true && !aspects.motd_llm_skipped) {
    failures.push('motd_llm_skipped false');
  }
  return failures;
}
