import { chromium } from 'playwright';

const URL = process.env.PROBE_URL || 'https://rianell.com/';
const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage', '--no-sandbox'] });
const ctx = await browser.newContext();
await ctx.addInitScript(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (_) {} });
const page = await ctx.newPage();
page.on('console', (m) => {
  const t = m.text();
  if (/Benchmark|Privacy|gate|init|heuristic/i.test(t)) console.error('LOG', t.slice(0, 120));
});

const t0 = Date.now();
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

for (let i = 0; i < 45; i++) {
  const s = await page.evaluate(() => {
    const gate = document.getElementById('privacyRegionGateOverlay');
    const btn = document.getElementById('privacyRegionGateConfirm');
    return {
      loaded: document.body?.classList.contains('loaded'),
      init: !!window.__rianellAppInitStarted,
      boot: !!window.__rianellBootAfterDomStarted,
      hasRunInit: typeof window.__rianellRunAppInit === 'function',
      pending: !!window.__rianellPendingAppInit,
      gateDisplay: gate ? gate.style.display : null,
      gateVisible: gate ? (gate.style.display !== 'none' && gate.offsetParent !== null) : false,
      btnExists: !!btn,
      privacyActive: document.body.classList.contains('privacy-gate-active'),
      text: document.querySelector('.loading-text')?.textContent?.slice(0, 70) || '',
      configured: window.RianellPrivacy?.isConfigured?.(),
    };
  }).catch((e) => ({ evalErr: e.message }));

  if (s.gateVisible && s.btnExists) {
    await page.evaluate(() => document.getElementById('privacyRegionGateConfirm')?.click());
    console.error('clicked privacy at', Date.now() - t0);
  }
  const health = page.locator('#healthDataConsentOverlay button[type="button"]');
  if (await health.isVisible().catch(() => false)) {
    await health.click({ timeout: 2000 }).catch(() => {});
    console.error('clicked health at', Date.now() - t0);
  }

  if (s.init) {
    console.log(JSON.stringify({ ok: true, elapsedMs: Date.now() - t0, ...s }));
    process.exit(0);
  }
  if (i % 3 === 0) console.error(`+${Math.round((Date.now() - t0) / 1000)}s`, JSON.stringify(s));
  await page.waitForTimeout(1000);
}

console.log(JSON.stringify({ ok: false, elapsedMs: Date.now() - t0 }));
process.exit(1);
