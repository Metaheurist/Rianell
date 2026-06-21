/**
 * Quick local preview check: guest boot + shell visibility after onboarding clicks.
 * Usage: PROBE_URL=http://127.0.0.1:8080 node scripts/audit/probe-shell-visible.mjs
 */
import { getChromium } from '@rianell/build-tools/probe-utils';

const url = process.env.PROBE_URL || 'http://127.0.0.1:8080/#home';
const chromium = await getChromium();
const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage', '--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await ctx.addInitScript(() => {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {}
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForTimeout(3000);

async function clickIfVisible(sel) {
  const el = page.locator(sel);
  if (await el.isVisible().catch(() => false)) {
    await el.click();
    await page.waitForTimeout(1200);
    return true;
  }
  return false;
}

async function advanceFirstRunWizard(maxSteps = 12) {
  for (let i = 0; i < maxSteps; i++) {
    const wizardOpen = await page.locator('#firstRunWizardOverlay').isVisible().catch(() => false);
    if (!wizardOpen) break;

    if (await clickIfVisible('.tutorial-ai-enable')) continue;
    if (await clickIfVisible('.tutorial-ai-skip')) continue;
    if (await clickIfVisible('#tutorialFinishBtn')) continue;
    if (await clickIfVisible('#tutorialArrowRight')) continue;
    if (await clickIfVisible('#firstRunWizardContinueBtn')) continue;
    if (await clickIfVisible('#firstRunWizardBackBtn')) continue;
    break;
  }
}

await advanceFirstRunWizard();

// Legacy fallbacks if wizard not shown (returning-user migration paths in tests)
await clickIfVisible('#privacyRegionGateConfirm');
await clickIfVisible('#healthDataConsentAcceptBtn');
await clickIfVisible('#firstRunWizardContinueBtn');
await clickIfVisible('#aiModelDownloadOverlay .modal-cancel-btn');
await clickIfVisible('.cookie-banner-accept');
await clickIfVisible('#perfBenchmarkContinueBtn');
await page.waitForTimeout(2000);

const snap = await page.evaluate(() => {
  const shell = document.getElementById('appShell');
  const nav = document.querySelector('.tab-navigation, .app-bottom-nav');
  const home = document.getElementById('homeTab');
  const style = shell ? getComputedStyle(shell) : null;
  return {
    loaded: document.body.classList.contains('loaded'),
    init: !!window.__rianellAppInitStarted,
    privacyGate: document.body.classList.contains('privacy-gate-active'),
    wizardActive: document.body.classList.contains('first-run-wizard-active'),
    aiBlocking: document.body.classList.contains('ai-model-download-blocking'),
    shellVis: style ? style.visibility : null,
    shellDisplay: style ? style.display : null,
    shellOpacity: style ? style.opacity : null,
    navVisible: nav ? getComputedStyle(nav).visibility : null,
    homeVisible: home ? getComputedStyle(home).visibility : null,
    greeting: document.getElementById('homeGreeting')?.textContent?.trim() || '',
    hash: location.hash,
    bootLog: (window.__rianellBootLog || []).slice(-8),
  };
});

const ok = snap.loaded && snap.init && snap.shellVis === 'visible' && snap.greeting.length > 0 && !snap.wizardActive;
console.log(JSON.stringify({ ok, snap, errors: errors.slice(0, 5) }, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
