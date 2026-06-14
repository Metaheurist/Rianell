import { chromium } from 'playwright';

const URL = process.env.PROBE_URL || 'https://rianell.com/';
const COLD = process.env.PROBE_COLD === '1';
const MAX_WAIT_S = Number(process.env.PROBE_MAX_S || 40);
const PASS_MS = Number(process.env.PROBE_PASS_MS || 20000);

const browser = await chromium.launch({
  headless: true,
  args: ['--disable-dev-shm-usage', '--no-sandbox'],
});

try {
  const context = await browser.newContext();
  await context.addInitScript((isCold) => {
    function seedReturningUser() {
      try {
        localStorage.setItem('rianellCookieConsent', 'accepted');
        localStorage.setItem('rianellHealthDataConsent', 'accepted');
        var settings = {};
        try { settings = JSON.parse(localStorage.getItem('rianellSettings') || '{}'); } catch (_) {}
        settings.privacyRegion = settings.privacyRegion || 'eea_uk';
        settings.uiLocale = settings.uiLocale || 'en-GB';
        settings.healthDataConsent = true;
        settings.policyAcknowledgedVersion = settings.policyAcknowledgedVersion || 'v1.0.0';
        localStorage.setItem('rianellSettings', JSON.stringify(settings));
        if (!localStorage.getItem('rianellPerfBenchmark')) {
          localStorage.setItem('rianellPerfBenchmark', JSON.stringify({
            version: 4,
            platformType: 'desktop',
            tier: 4,
            score: 100,
            ts: Date.now(),
            cpu: { msPer200k: 10 },
            gpu: { backend: 'webgl', good: true, available: true },
          }));
        }
      } catch (_) {}
    }
    if (isCold) {
      try { localStorage.clear(); sessionStorage.clear(); } catch (_) {}
      return;
    }
    seedReturningUser();
  }, COLD);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('ERR:' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('CON:' + m.text().slice(0, 160));
  });

  const t0 = Date.now();
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  let last = null;
  for (let i = 0; i < MAX_WAIT_S; i++) {
    const clickIfVisible = async (sel) => {
      const loc = page.locator(sel);
      if (await loc.isVisible().catch(() => false)) {
        await loc.click({ timeout: 1500 }).catch(() => {});
      }
    };
    await clickIfVisible('.cookie-banner-accept');
    const benchOverlay = page.locator('#perfBenchmarkOverlay');
    if (await benchOverlay.isVisible().catch(() => false)) {
      await page.evaluate(() => document.getElementById('perfBenchmarkContinueBtn')?.click());
    }
    await clickIfVisible('#privacyRegionGateConfirm');
    await clickIfVisible('#healthDataConsentOverlay button[type="button"]');

    last = await page.evaluate(() => {
      const overlay = document.getElementById('perfBenchmarkOverlay');
      return {
        loaded: document.body?.classList.contains('loaded'),
        boot: !!window.__rianellBootAfterDomStarted,
        init: !!window.__rianellAppInitStarted,
        pending: !!window.__rianellPendingAppInit,
        hasRunInit: typeof window.__rianellRunAppInit === 'function',
        script: document.querySelector('script[src*="app."]')?.getAttribute('src') || '',
        benchScript: document.querySelector('script[src*="device-benchmark"]')?.getAttribute('src') || '',
        text: document.querySelector('.loading-text')?.textContent?.slice(0, 60) || '',
        benchModalVisible: !!(overlay && overlay.style.display !== 'none' && overlay.style.visibility !== 'hidden'),
        overlayHidden: document.getElementById('loadingOverlay')?.classList.contains('hidden'),
        hasBenchCache: (() => { try { return !!localStorage.getItem('rianellPerfBenchmark'); } catch (e) { return false; } })(),
      };
    }).catch((e) => ({ evalErr: e.message }));

    const elapsed = Date.now() - t0;
    if (last.loaded && last.init) {
      const ok = elapsed <= PASS_MS;
      console.log(JSON.stringify({ ok, cold: COLD, elapsedMs: elapsed, passMs: PASS_MS, ...last, errors: errors.slice(0, 4) }));
      process.exit(ok ? 0 : 2);
    }

    if (i % 5 === 0) console.error(`+${Math.round(elapsed / 1000)}s`, JSON.stringify(last));
    await page.waitForTimeout(1000);
  }

  console.log(JSON.stringify({ ok: false, cold: COLD, elapsedMs: Date.now() - t0, passMs: PASS_MS, ...last, errors: errors.slice(0, 6) }));
  process.exit(1);
} finally {
  await browser.close();
}
