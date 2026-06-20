/**
 * Visual + DOM diagnostic for black-screen boot failures.
 * Usage: PROBE_URL=http://127.0.0.1:8080/#home node scripts/audit/probe-shell-screenshot.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getChromium } from '@rianell/build-tools/probe-utils';

const url = process.env.PROBE_URL || 'http://127.0.0.1:8080/#home';
const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../audit-history');
fs.mkdirSync(outDir, { recursive: true });

const chromium = await getChromium();
const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage', '--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('rianellTutorialSeen', '1');
    localStorage.setItem('rianellHealthDataConsent', 'accepted');
    localStorage.setItem('rianellSettings', JSON.stringify({
      privacyRegion: 'eea_uk',
      uiLocale: 'en-GB',
      healthDataConsent: true,
      policyAcknowledgedVersion: 'v1.0.0',
      aiModelDownloadConsent: 'deferred',
    }));
    localStorage.setItem('rianellPerfBenchmark', JSON.stringify({
      version: 5,
      platformType: 'desktop',
      tier: 5,
      heuristic: true,
      ts: Date.now(),
      gpu: { good: false, backend: 'none' },
    }));
  } catch (e) {}
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });

async function clickIfVisible(sel) {
  const el = page.locator(sel);
  if (await el.isVisible().catch(() => false)) {
    await el.click({ force: true });
    await page.waitForTimeout(1200);
    return true;
  }
  return false;
}

await page.waitForTimeout(5000);
await clickIfVisible('#privacyRegionGateConfirm');
await clickIfVisible('#healthDataConsentAcceptBtn');
await clickIfVisible('#aiModelDownloadOverlay .modal-cancel-btn');
await clickIfVisible('.cookie-banner-accept');
await page.waitForTimeout(2000);

const diag = await page.evaluate(() => {
  function snapEl(id) {
    const el = document.getElementById(id);
    if (!el) return { missing: true };
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      classes: el.className,
      display: cs.display,
      visibility: cs.visibility,
      opacity: cs.opacity,
      zIndex: cs.zIndex,
      pointerEvents: cs.pointerEvents,
      w: Math.round(r.width),
      h: Math.round(r.height),
      top: Math.round(r.top),
    };
  }
  const bodyCs = getComputedStyle(document.body);
  return {
    bodyClasses: document.body.className,
    bodyOpacity: bodyCs.opacity,
    bodyBg: bodyCs.backgroundColor,
    loaded: document.body.classList.contains('loaded'),
    init: !!window.__rianellAppInitStarted,
    greeting: document.getElementById('homeGreeting')?.textContent?.trim() || '',
    loadingOverlay: snapEl('loadingOverlay'),
    appShell: snapEl('appShell'),
    mainContent: snapEl('main-content'),
    homeTab: snapEl('homeTab'),
    bootLog: (window.__rianellBootLog || []).slice(-6),
  };
});

const shotPath = path.join(outDir, 'probe-shell-screenshot.png');
await page.screenshot({ path: shotPath, fullPage: false });
console.log(JSON.stringify({ diag, screenshot: shotPath }, null, 2));
await browser.close();

const ok = diag.loaded && diag.init
  && diag.mainContent?.visibility === 'visible'
  && (diag.mainContent?.h || 0) > 100
  && diag.greeting.length > 0
  && !String(diag.bodyClasses || '').includes('modal-active');
process.exit(ok ? 0 : 1);
