import { execSync } from 'child_process';
import { chromium } from 'playwright';

const URL = process.env.PROBE_URL || 'https://rianell.com/';
const PASS_MS = Number(process.env.PROBE_PASS_MS || 60000);
const GOTO_TIMEOUT_MS = Number(process.env.PROBE_GOTO_TIMEOUT_MS || 180000);
const GOTO_WAIT_UNTIL = process.env.PROBE_GOTO_WAIT || 'domcontentloaded';
const GOTO_ATTEMPTS = Number(process.env.PROBE_GOTO_ATTEMPTS || 3);

function killHeadless() {
  try {
    if (process.platform === 'win32') {
      execSync('taskkill /F /IM chrome-headless-shell.exe /T 2>nul', { stdio: 'ignore' });
    } else {
      execSync('pkill -f chrome-headless-shell || true', { stdio: 'ignore' });
    }
  } catch (_) {}
}

async function clickThrough(page) {
  const sels = [
    '#perfBenchmarkContinueBtn',
    '#privacyRegionGateConfirm',
    '#healthDataConsentOverlay button.modal-save-btn:not(.modal-cancel-btn)',
    '.cookie-banner-accept',
  ];
  for (const sel of sels) {
    const ok = await page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      el.click();
      return true;
    }, sel).catch(() => false);
    if (ok) console.error('clicked', sel);
  }
}

async function probe(cold) {
  killHeadless();
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });
  try {
    const ctx = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36',
      viewport: { width: 1280, height: 720 },
    });
    await ctx.addInitScript((isCold) => {
      if (!isCold) {
        try {
          localStorage.setItem('rianellCookieConsent', 'accepted');
          localStorage.setItem('rianellHealthDataConsent', 'accepted');
          const settings = {
            privacyRegion: 'eea_uk',
            uiLocale: 'en-GB',
            healthDataConsent: true,
            policyAcknowledgedVersion: 'v1.0.0',
          };
          localStorage.setItem('rianellSettings', JSON.stringify(settings));
          localStorage.setItem('rianellPerfBenchmark', JSON.stringify({
            version: 4,
            platformType: 'desktop',
            tier: 4,
            ts: Date.now(),
          }));
        } catch (_) {}
        return;
      }
      try { localStorage.clear(); sessionStorage.clear(); } catch (_) {}
    }, cold);

    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message.slice(0, 120)));

    const t0 = Date.now();
    let gotoErr;
    for (let attempt = 1; attempt <= GOTO_ATTEMPTS; attempt++) {
      try {
        await page.goto(URL, { waitUntil: GOTO_WAIT_UNTIL, timeout: GOTO_TIMEOUT_MS });
        gotoErr = null;
        break;
      } catch (e) {
        gotoErr = e;
        console.error(`goto attempt ${attempt}/${GOTO_ATTEMPTS} failed (${GOTO_WAIT_UNTIL}):`, e.message);
        if (attempt < GOTO_ATTEMPTS) await page.waitForTimeout(5000);
      }
    }
    if (gotoErr) throw gotoErr;

    let last = null;
    for (let i = 0; i < 90; i++) {
      await clickThrough(page);
      last = await page.evaluate(() => ({
        loaded: document.body?.classList.contains('loaded'),
        init: !!window.__rianellAppInitStarted,
        boot: !!window.__rianellBootAfterDomStarted,
        script: document.querySelector('script[src*="app."]')?.getAttribute('src') || '',
        bench: document.querySelector('script[src*="device-benchmark"]')?.getAttribute('src') || '',
        benchModal: document.getElementById('perfBenchmarkOverlay')?.style.display !== 'none',
        gate: document.getElementById('privacyRegionGateOverlay')?.style.display,
        overlayHidden: document.getElementById('loadingOverlay')?.classList.contains('hidden'),
        text: document.querySelector('.loading-text')?.textContent?.slice(0, 50) || '',
      }));

      const elapsed = Date.now() - t0;
      if (last.init && last.loaded) {
        const ok = elapsed <= PASS_MS;
        return { ok, cold, elapsedMs: elapsed, ...last, errors: errors.slice(0, 3) };
      }
      if (i % 10 === 0) console.error(`+${Math.round(elapsed / 1000)}s`, JSON.stringify(last));
      await page.waitForTimeout(1000);
    }
    return { ok: false, cold, elapsedMs: Date.now() - t0, ...last, errors };
  } finally {
    await browser.close();
    killHeadless();
  }
}

console.error('Probing', URL);
const warm = await probe(false);
console.log('WARM', JSON.stringify(warm));
if (!warm.ok) process.exit(1);

const cold = await probe(true);
console.log('COLD', JSON.stringify(cold));
process.exit(cold.ok ? 0 : 1);
