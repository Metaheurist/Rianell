import { execSync } from 'node:child_process';
import { chromium } from 'playwright';
import { isHuggingFaceModelsRequest, isSupabaseLlmModelsRequest } from '../../packages/build-tools/src/probe-llm-assertions.mjs';

const URL = (process.env.PROBE_URL || 'https://rianell.com/').replace(/\/?$/, '/');
const DOWNLOAD_TIMEOUT_MS = Number(process.env.PROBE_DOWNLOAD_TIMEOUT_MS || 900000);
const ATTEMPTS = Number(process.env.PROBE_ATTEMPTS || 3);
const ATTEMPT_DELAY_MS = Number(process.env.PROBE_ATTEMPT_DELAY_MS || 120000);
const TIER = Number(process.env.PROBE_TIER || 1);

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
    '#aiModelDownloadOverlay .modal-save-btn',
  ];
  for (const sel of sels) {
    await page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      el.click();
      return true;
    }, sel).catch(() => false);
  }
}

async function runOnce() {
  killHeadless();
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-gpu'],
  });
  try {
    const ctx = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36',
      viewport: { width: 1280, height: 720 },
    });
    await ctx.addInitScript((tier) => {
      try {
        localStorage.setItem('rianellCookieConsent', 'accepted');
        localStorage.setItem('rianellHealthDataConsent', 'accepted');
        localStorage.setItem('rianellSettings', JSON.stringify({
          privacyRegion: 'eea_uk',
          uiLocale: 'en-GB',
          healthDataConsent: true,
          policyAcknowledgedVersion: 'v1.0.0',
          aiModelDownloadConsent: 'granted',
          preferredLlmModelSize: 'tier' + tier,
        }));
        localStorage.setItem('rianellPerfBenchmark', JSON.stringify({
          version: 5,
          platformType: 'desktop',
          tier,
          ts: Date.now(),
          gpu: { available: false, backend: 'none', good: false, scoreMs: null, scoreSamples: [] },
        }));
      } catch (_) {}
    }, TIER);

    const page = await ctx.newPage();
    const hf = [];
    const supa = [];
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e.message || e).slice(0, 180)));
    page.on('console', (msg) => {
      const text = msg.text ? msg.text() : '';
      if (!/content security policy|csp|connect-src/i.test(text)) return;
      if (/cloudflareinsights|beacon\.min\.js|email-decode\.min\.js|cdn-cgi\/scripts/i.test(text)) return;
      errors.push(text.slice(0, 180));
    });
    page.on('requestfinished', async (req) => {
      const url = req.url();
      if (isSupabaseLlmModelsRequest(url)) supa.push(url);
      if (isHuggingFaceModelsRequest(url)) hf.push(url);
    });
    page.on('requestfailed', (req) => {
      const url = req.url();
      if (isSupabaseLlmModelsRequest(url)) supa.push(url);
      if (isHuggingFaceModelsRequest(url)) hf.push(url);
    });

    const t0 = Date.now();
    await page.goto(URL, { waitUntil: 'load', timeout: 120000 });

    // Boot click-through.
    for (let i = 0; i < 20; i++) {
      await clickThrough(page);
      await page.waitForTimeout(500);
    }

    // Trigger download + inference warmup (summary-llm.js is lazy-loaded after boot).
    await page.evaluate(() => {
      try {
        if (window.appSettings) window.appSettings.aiModelDownloadConsent = 'granted';
        if (typeof window.saveSettings === 'function') window.saveSettings();
      } catch (_) {}
    });

    try {
      await page.waitForFunction(
        () => typeof window.preloadSummaryLLM === 'function',
        { timeout: 180000 }
      );
      await page.evaluate((tier) => {
        try {
          localStorage.setItem('rianellPerfBenchmark', JSON.stringify({
            version: 5,
            platformType: 'desktop',
            tier,
            ts: Date.now(),
            gpu: { available: false, backend: 'none', good: false, scoreMs: null, scoreSamples: [] },
          }));
          if (typeof window.preloadSummaryLLM === 'function') {
            void window.preloadSummaryLLM();
          }
        } catch (_) {}
      }, TIER);
    } catch (err) {
      errors.push('preloadSummaryLLM: ' + String(err.message || err).slice(0, 240));
    }

    let final = null;
    while (Date.now() - t0 < DOWNLOAD_TIMEOUT_MS) {
      await clickThrough(page);
      final = await page.evaluate(() => (typeof window.getAiModelStatus === 'function') ? window.getAiModelStatus() : null);
      if (final && final.state === 'ready') break;
      if (final && final.state === 'failed') break;
      await page.waitForTimeout(2000);
    }

    const elapsedMs = Date.now() - t0;
    const fatalErrors = errors.filter((e) => !/Execution context was destroyed|download deferred/i.test(e));
    const ok = Boolean(
      final && final.state === 'ready' && final.inMemory === true &&
      hf.length > 0 && supa.length === 0 && fatalErrors.length === 0
    );
    return { ok, elapsedMs, finalStatus: final, hfRequests: hf.slice(0, 8), supabaseRequests: supa.slice(0, 3), errors: errors.slice(0, 3) };
  } finally {
    await browser.close();
    killHeadless();
  }
}

let last = null;
for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
  try {
    last = await runOnce();
  } catch (err) {
    last = { ok: false, error: String(err.message || err).slice(0, 240) };
  }
  console.log('LLM_PROBE', JSON.stringify({ attempt, url: URL, ...last }));
  if (last.ok) process.exit(0);
  if (attempt < ATTEMPTS) {
    await new Promise((r) => setTimeout(r, ATTEMPT_DELAY_MS));
  }
}
process.exit(last && last.ok ? 0 : 1);

