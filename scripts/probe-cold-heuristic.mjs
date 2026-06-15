import { chromium } from 'playwright';

const URL = process.env.PROBE_URL || 'https://rianell.com/';
const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage', '--no-sandbox'] });
const ctx = await browser.newContext();
await ctx.addInitScript(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (_) {} });
const page = await ctx.newPage();
const t0 = Date.now();
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

await page.waitForFunction(
  () => document.getElementById('privacyRegionGateOverlay')?.style.display === 'flex',
  { timeout: 30000 },
);
console.error('gate visible at', Date.now() - t0);

await page.locator('#privacyRegionGateConfirm').click({ force: true, timeout: 5000 });
console.error('playwright privacy click at', Date.now() - t0);

await page.waitForFunction(
  () => document.getElementById('privacyRegionGateOverlay')?.style.display === 'none',
  { timeout: 10000 },
).catch(() => console.error('gate still open at', Date.now() - t0));

const health = page.locator('#healthDataConsentOverlay button.modal-save-btn').first();
if (await health.isVisible().catch(() => false)) {
  await health.click({ force: true });
  console.error('health click at', Date.now() - t0);
}

await page.waitForFunction(() => !!window.__rianellAppInitStarted, { timeout: 30000 });
console.log(JSON.stringify({ ok: true, elapsedMs: Date.now() - t0 }));
process.exit(0);
