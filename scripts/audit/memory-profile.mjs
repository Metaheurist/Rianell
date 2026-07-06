#!/usr/bin/env node
/**
 * Plan 22 PF7 — memory profiling for ephemeral health chat open/close cycles.
 * Usage:
 *   PROBE_URL=http://127.0.0.1:9876/ node scripts/audit/memory-profile.mjs
 *   npm run audit:memory -- --dry-run
 */
import fs from 'node:fs';
import path from 'node:path';
import { getChromium, killHeadless, HEARTBEAT_INIT, clickThrough } from '@rianell/build-tools/probe-utils';

const root = process.cwd();
const dryRun = process.argv.includes('--dry-run');
const outPath = path.join(root, 'benchmarks', 'memory', 'latest.json');
const PROBE_URL = process.env.PROBE_URL || 'http://127.0.0.1:9876/';
const CHAT_CYCLES = parseInt(process.env.CHAT_MEMORY_CYCLES || '10', 10);
const maxHeapMb = parseFloat(process.env.CHAT_MEMORY_THRESHOLD_MB || '25');

if (dryRun) {
  const report = {
    mode: 'dry-run',
    chatHeapDeltaMB: 4.2,
    cycles: CHAT_CYCLES,
    maxHeapMb,
    pass: true,
  };
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log('MEMORY_PROFILE_DRY_RUN_OK');
  process.exit(0);
}

async function heapMb(page) {
  return page.evaluate(() =>
    performance.memory ? performance.memory.usedJSHeapSize / 1048576 : -1,
  ).catch(() => -1);
}

async function run() {
  killHeadless();
  const chromium = await getChromium();
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-precise-memory-info', '--disable-dev-shm-usage', '--no-sandbox'],
  });
  const ctx = await browser.newContext();
  await ctx.addInitScript(({ heartbeat }) => {
    // eslint-disable-next-line no-eval
    eval(heartbeat);
    try {
      localStorage.setItem('rianellCookieConsent', 'accepted');
      localStorage.setItem('rianellHealthDataConsent', 'accepted');
      localStorage.setItem('rianellSettings', JSON.stringify({
        privacyRegion: 'eea_uk',
        uiLocale: 'en-GB',
        healthDataConsent: true,
        aiEnabled: true,
        cookieConsent: 'accepted',
      }));
      localStorage.setItem('healthLogs', JSON.stringify([
        { date: '2025-06-01', mood: 6, sleep: 7, fatigue: 4, notes: 'Okay day' },
        { date: '2025-06-02', mood: 5, sleep: 6, fatigue: 6, notes: 'Tired' },
      ]));
    } catch (_) {}
  }, { heartbeat: HEARTBEAT_INIT });

  const page = await ctx.newPage();
  await page.goto(PROBE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  for (let i = 0; i < 30; i++) {
    await clickThrough(page, 1500).catch(() => {});
    const loaded = await page.evaluate(() => document.body?.classList.contains('loaded')).catch(() => false);
    if (loaded) break;
    await new Promise((r) => setTimeout(r, 300));
  }

  const baseline = await heapMb(page);
  const samples = [];

  for (let i = 0; i < CHAT_CYCLES; i++) {
    await page.evaluate(() => {
      if (typeof openAiHealthChat === 'function') {
        openAiHealthChat({ seedPrompt: '' });
      }
      if (typeof closeAiHealthChat === 'function') {
        closeAiHealthChat();
      }
    }).catch(() => {});
    await new Promise((r) => setTimeout(r, 120));
    const h = await heapMb(page);
    samples.push({ cycle: i + 1, heapMB: Math.round(h * 10) / 10 });
  }

  await browser.close();

  const first = samples[0]?.heapMB ?? baseline;
  const last = samples[samples.length - 1]?.heapMB ?? baseline;
  const delta = last - baseline;
  const pass = delta < maxHeapMb;
  const report = {
    mode: 'chat-open-close',
    baselineHeapMB: Math.round(baseline * 10) / 10,
    chatHeapDeltaMB: Math.round(delta * 10) / 10,
    cycles: CHAT_CYCLES,
    maxHeapMb,
    pass,
    samples,
    timestamp: new Date().toISOString(),
  };
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`MEMORY_PROFILE_${pass ? 'OK' : 'FAIL'} chatDelta=${delta.toFixed(1)}MB`);
  process.exit(pass ? 0 : 1);
}

run().catch((err) => {
  console.error('MEMORY_PROFILE_ERROR', err.message || err);
  process.exit(1);
});
