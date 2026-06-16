import { chromium } from 'playwright';

const URL = process.env.PROBE_URL || 'https://rianell.com/';
const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage', '--no-sandbox'] });
try {
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (_) {} });
  const page = await ctx.newPage();
  const t0 = Date.now();
  await page.goto(URL, { waitUntil: 'load', timeout: 90000 });

  for (let i = 0; i < 20; i++) {
    const snap = await page.evaluate(() => ({
      gate: document.getElementById('privacyRegionGateOverlay')?.style.display,
      init: !!window.__rianellAppInitStarted,
      boot: !!window.__rianellBootAfterDomStarted,
      loaded: document.body?.classList.contains('loaded'),
      bench: document.querySelector('script[src*="device-benchmark"]')?.getAttribute('src') || '',
      text: document.querySelector('.loading-text')?.textContent?.slice(0, 40) || '',
    }));
    console.error(`+${Math.round((Date.now() - t0) / 1000)}s`, JSON.stringify(snap));
    if (snap.gate === 'flex') {
      await page.evaluate(() => document.getElementById('privacyRegionGateConfirm')?.click());
      console.error('confirm clicked at', Date.now() - t0);
      break;
    }
    if (snap.init) break;
    await page.waitForTimeout(3000);
  }

  for (let i = 0; i < 15; i++) {
    const snap = await page.evaluate(() => ({
      gate: document.getElementById('privacyRegionGateOverlay')?.style.display,
      init: !!window.__rianellAppInitStarted,
      loaded: document.body?.classList.contains('loaded'),
    }));
    console.error('post', JSON.stringify(snap), Date.now() - t0);
    if (snap.init) {
      console.log(JSON.stringify({ ok: true, elapsedMs: Date.now() - t0 }));
      break;
    }
    await page.waitForTimeout(2000);
  }
} finally {
  await browser.close();
}
