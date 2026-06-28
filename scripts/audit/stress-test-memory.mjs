#!/usr/bin/env node
/**
 * Automated memory stress test — reproduces the high-end PC freeze scenario.
 *
 * Forces tier-5 desktop benchmark + 365-day demo health logs, runs 10 tab-switch
 * cycles via Playwright, and measures heap growth. Passes if growth < LEAK_THRESHOLD_MB.
 *
 * Usage:
 *   PROBE_URL=http://127.0.0.1:9876/ node scripts/audit/stress-test-memory.mjs
 *   npm run stress:memory   (starts local server automatically via PROBE_URL env)
 */
import { getChromium, killHeadless, HEARTBEAT_INIT, clickThrough } from '@rianell/build-tools/probe-utils';
import fs from 'node:fs';
import path from 'node:path';

const PROBE_URL = process.env.PROBE_URL || 'http://127.0.0.1:9876/';
const CYCLES = parseInt(process.env.STRESS_CYCLES || '10', 10);
const LEAK_THRESHOLD_MB = parseFloat(process.env.STRESS_LEAK_THRESHOLD || '80');
const OUT_PATH = path.resolve('benchmarks/memory/stress-latest.json');

function generateDemoLogs(days = 365) {
  const logs = [];
  const now = Date.now();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    logs.push({
      id: `stress-${i}`,
      date: `${yyyy}-${mm}-${dd}`,
      weight: (70 + Math.sin(i / 30) * 3).toFixed(1),
      steps: String(Math.floor(5000 + (i % 5000))),
      mood: String(3 + (i % 3)),
      hydration: (1.5 + (i % 10) / 10).toFixed(1),
    });
  }
  return logs;
}

const TIER5_SEED = JSON.stringify({
  version: 5, platformType: 'desktop', tier: 5, heuristic: false,
  ts: Date.now(), gpu: { good: true, backend: 'webgl' },
});

const SETTINGS_SEED = JSON.stringify({
  privacyRegion: 'eea_uk', uiLocale: 'en-GB',
  healthDataConsent: true, policyAcknowledgedVersion: 'v1.0.0',
  aiEnabled: false,
  showCharts: true,
  cookieConsent: 'accepted',
});

async function run() {
  killHeadless();
  const chromium = await getChromium();
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-precise-memory-info', '--disable-dev-shm-usage', '--no-sandbox'],
  });

  const logsJson = JSON.stringify(generateDemoLogs(365));

  const ctx = await browser.newContext();
  await ctx.addInitScript(({ heartbeat, tier5, settings, logsJson: lj }) => {
    // eslint-disable-next-line no-eval
    eval(heartbeat);
    try {
      localStorage.setItem('rianellCookieConsent', 'accepted');
      localStorage.setItem('rianellHealthDataConsent', 'accepted');
      localStorage.setItem('rianellPerfBenchmark', tier5);
      localStorage.setItem('rianellSettings', settings);
      localStorage.setItem('healthLogs', lj);
      localStorage.setItem('rianellPerfLongTasks', '1');
    } catch (_) {}
  }, { heartbeat: HEARTBEAT_INIT, tier5: TIER5_SEED, settings: SETTINGS_SEED, logsJson });

  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message.slice(0, 200)));

  await page.goto(PROBE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait for boot + click through any consent/benchmark modals
  for (let i = 0; i < 40; i++) {
    await clickThrough(page, 2000).catch(() => {});
    const loaded = await page.evaluate(() => document.body?.classList.contains('loaded')).catch(() => false);
    if (loaded) break;
    await new Promise(r => setTimeout(r, 400));
  }

  // Check if boot succeeded
  const booted = await page.evaluate(() => document.body?.classList.contains('loaded')).catch(() => false);
  if (!booted) {
    console.warn('[stress] Warning: app may not have fully booted — proceeding anyway');
  }

  const TABS = ['homeTab', 'chartTab', 'logTab', 'moodTab'];
  const heapSamples = [];

  // Take baseline reading
  const baselineHeap = await page.evaluate(() =>
    performance.memory ? performance.memory.usedJSHeapSize / 1048576 : -1
  ).catch(() => -1);
  console.log(`[stress] baseline heapMB=${baselineHeap.toFixed(1)}`);

  for (let cycle = 0; cycle < CYCLES; cycle++) {
    for (const tab of TABS) {
      await page.evaluate((id) => {
        try {
          // Try nav button first
          const btn = document.querySelector(
            `[data-tab="${id}"], #${id}Btn, button[onclick*="${id}"], .tab-nav-item[data-tab="${id}"]`
          );
          if (btn) { btn.click(); return; }
          // Direct tab activation fallback
          document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
          const el = document.getElementById(id);
          if (el) el.classList.add('active');
        } catch (_) {}
      }, tab).catch(() => {});
      await new Promise(r => setTimeout(r, 500));
    }

    // Force GC hint via large allocation sweep (helps surface real leaks)
    await page.evaluate(() => {
      try { let x = new Array(100000).fill(0); x = null; } catch (_) {}
    }).catch(() => {});
    await new Promise(r => setTimeout(r, 200));

    const heap = await page.evaluate(() =>
      performance.memory ? performance.memory.usedJSHeapSize / 1048576 : -1
    ).catch(() => -1);
    const longTasks = await page.evaluate(() => (window.__rianellLongTasks || []).length).catch(() => 0);
    const bootLogSize = await page.evaluate(() => (window.__rianellBootLog || []).length).catch(() => -1);

    heapSamples.push({
      cycle: cycle + 1,
      heapMB: Math.round(heap * 10) / 10,
      longTaskCount: longTasks,
      bootLogSize,
    });
    console.log(`[stress] cycle ${cycle + 1}/${CYCLES} heapMB=${heap.toFixed(1)} longTasks=${longTasks} bootLogSize=${bootLogSize}`);
  }

  await browser.close();

  const first = heapSamples[0]?.heapMB ?? 0;
  const last = heapSamples[heapSamples.length - 1]?.heapMB ?? 0;
  const growth = last - first;
  const pass = growth < LEAK_THRESHOLD_MB;
  const totalLongTasks = heapSamples[heapSamples.length - 1]?.longTaskCount ?? 0;
  const finalBootLogSize = heapSamples[heapSamples.length - 1]?.bootLogSize ?? -1;

  const report = {
    pass,
    growth: Math.round(growth * 10) / 10,
    baselineHeapMB: Math.round(baselineHeap * 10) / 10,
    firstCycleHeapMB: first,
    lastCycleHeapMB: last,
    leakThresholdMB: LEAK_THRESHOLD_MB,
    totalLongTasks,
    finalBootLogSize,
    cycles: CYCLES,
    pageErrors: pageErrors.slice(0, 5),
    samples: heapSamples,
    timestamp: new Date().toISOString(),
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2));

  const status = pass ? 'PASS' : 'FAIL';
  console.log(`[stress] ${status} growth=${growth.toFixed(1)}MB (threshold=${LEAK_THRESHOLD_MB}MB) longTasks=${totalLongTasks} bootLogSize=${finalBootLogSize}`);
  if (!pass) {
    console.error(`[stress] Heap grew ${growth.toFixed(1)}MB over ${CYCLES} cycles — memory leak suspected`);
    console.error('[stress] Check benchmarks/memory/stress-latest.json for per-cycle breakdown');
  }

  process.exit(pass ? 0 : 1);
}

run().catch(e => {
  console.error('[stress] Fatal error:', e.message || e);
  process.exit(1);
});
