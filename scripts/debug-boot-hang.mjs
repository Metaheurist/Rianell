/**
 * Boot hang debugger — polls window boot flags and console [Benchmark] lines.
 * Usage: node scripts/debug-boot-hang.mjs [url]
 */
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://127.0.0.1:8080/';
const browser = await chromium.launch({
  headless: true,
  args: ['--disable-dev-shm-usage', '--js-flags=--max-old-space-size=768'],
});
const context = await browser.newContext();
await context.addInitScript(() => {
  window.__bootTrace = [];
  const push = (msg) => {
    try { window.__bootTrace.push({ t: Math.round(performance.now()), msg }); } catch (e) {}
  };
  push('init-script');
  document.addEventListener('DOMContentLoaded', () => push('DOMContentLoaded'), { once: true });
  window.addEventListener('load', () => push('window.load'), { once: true });
});
const page = await context.newPage();
const consoleLines = [];
page.on('console', (m) => {
  const t = m.text();
  if (/Benchmark|rianell|error|failed|Privacy|motd/i.test(t)) consoleLines.push(t.slice(0, 220));
});
page.on('pageerror', (e) => consoleLines.push('PAGEERROR:' + e.message));

const t0 = Date.now();
let gotoErr = null;
try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
} catch (e) {
  gotoErr = e.message;
}

console.log('URL', url);
if (gotoErr) console.log('goto', gotoErr);

let lastKey = '';
for (let i = 0; i < 30; i++) {
  const snap = await Promise.race([
    page.evaluate(() => ({
      trace: (window.__bootTrace || []).slice(-8),
      loaded: document.body?.classList.contains('loaded'),
      loading: document.body?.classList.contains('loading'),
      boot: !!window.__rianellBootAfterDomStarted,
      init: !!window.__rianellAppInitStarted,
      pendingInit: !!window.__rianellPendingAppInit,
      ready: document.readyState,
      benchmark: document.body?.getAttribute('data-benchmark'),
      loadingText: document.querySelector('.loading-text')?.textContent?.slice(0, 100) || '',
      hasDeviceBenchmark: !!window.DeviceBenchmark,
      benchmarkReady: !!(window.DeviceBenchmark && window.DeviceBenchmark.isBenchmarkReady && window.DeviceBenchmark.isBenchmarkReady()),
      script: document.querySelector('script[src*="app"]')?.getAttribute('src') || document.querySelector('script[src*="app.js"]')?.getAttribute('src'),
      heuristicFn: !!(window.DeviceBenchmark && /shouldUseHeuristicBoot/.test(String(window.DeviceBenchmark.runBenchmarkIfNeeded))),
    })),
    new Promise((_, rej) => setTimeout(() => rej(new Error('evaluate-timeout')), 4000)),
  ]).catch((e) => ({ evalErr: e.message }));

  const key = JSON.stringify({ loaded: snap.loaded, boot: snap.boot, init: snap.init, text: snap.loadingText, err: snap.evalErr });
  if (key !== lastKey) {
    console.log(`+${Date.now() - t0}ms`, JSON.stringify(snap, null, 0));
    lastKey = key;
  }
  if (snap.loaded && snap.init) {
    console.log('BOOT_OK', Date.now() - t0, 'ms');
    break;
  }
  if (snap.evalErr && i > 2) {
    console.log('MAIN_THREAD_BLOCKED', snap.evalErr, 'at', Date.now() - t0, 'ms');
    break;
  }
  await page.waitForTimeout(1000);
}

if (consoleLines.length) {
  console.log('--- console (filtered) ---');
  consoleLines.slice(0, 20).forEach((l) => console.log(l));
}

await context.close();
await browser.close();
