import { getChromium } from '@rianell/build-tools/probe-utils';

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
const log = [];
page.on('pageerror', (e) => log.push('err:' + e.message));
await page.goto(process.env.PROBE_URL || 'http://127.0.0.1:8765/#home', { waitUntil: 'domcontentloaded', timeout: 120000 });

async function snap(label) {
  const s = await page.evaluate(() => ({
    loaded: document.body.classList.contains('loaded'),
    privacyGate: document.body.classList.contains('privacy-gate-active'),
    modalActive: document.body.classList.contains('modal-active'),
    aiBlocking: document.body.classList.contains('ai-model-download-blocking'),
    guidedDisplay: document.getElementById('guidedOnboardingOverlay')?.style.display,
    guidedActive: document.body.classList.contains('guided-onboarding-active'),
    healthDisplay: document.getElementById('healthDataConsentOverlay')?.style.display,
    aiDisplay: document.getElementById('aiModelDownloadOverlay')?.style.display,
    cookieHidden: document.getElementById('cookieBanner')?.classList.contains('hidden'),
    appShellVis: document.getElementById('appShell')
      ? getComputedStyle(document.getElementById('appShell')).visibility
      : null,
    appShellOp: document.getElementById('appShell')
      ? getComputedStyle(document.getElementById('appShell')).opacity
      : null,
    homeGreeting: document.getElementById('homeGreeting')?.textContent?.slice(0, 40) || '',
    init: !!window.__rianellAppInitStarted,
  }));
  console.log(label, JSON.stringify(s));
}

await snap('0-start');
await page.waitForTimeout(2500);
await snap('1-after-wait');

const gateBtn = page.locator('#privacyRegionGateConfirm');
if (await gateBtn.isVisible().catch(() => false)) {
  await gateBtn.click();
  await page.waitForTimeout(1500);
  await snap('2-after-gate');
}

for (let i = 0; i < 16; i++) {
  const guidedOpen = await page.locator('#guidedOnboardingOverlay').isVisible().catch(() => false);
  if (!guidedOpen) break;

  if (await page.locator('#guidedOnboardingContinueBtn').isVisible().catch(() => false)) {
    await page.locator('#guidedOnboardingContinueBtn').click();
    await page.waitForTimeout(800);
    continue;
  }

  const clicked = await page.evaluate(() => {
    const preferred = ['confirm', 'accept', 'yes', 'skip', 'start', 'notNow', 'later'];
    for (const id of preferred) {
      const btn = document.querySelector('.guided-onboarding-choice[data-choice-id="' + id + '"]');
      if (btn) {
        btn.click();
        return true;
      }
    }
    const first = document.querySelector('.guided-onboarding-choice');
    if (first) {
      first.click();
      return true;
    }
    return false;
  }).catch(() => false);

  if (clicked) {
    await page.waitForTimeout(800);
    continue;
  }
  break;
}
await snap('2b-after-guided-onboarding');

const healthBtn = page.locator('#healthDataConsentAcceptBtn');
if (await healthBtn.isVisible().catch(() => false)) {
  await healthBtn.click();
  await page.waitForTimeout(1500);
  await snap('3-after-health');
}

const aiDefer = page.locator('#aiModelDownloadOverlay .modal-cancel-btn');
if (await aiDefer.isVisible().catch(() => false)) {
  await aiDefer.click();
  await page.waitForTimeout(1500);
  await snap('4-after-ai');
}

const cookieBtn = page.locator('.cookie-banner-accept');
if (await cookieBtn.isVisible().catch(() => false)) {
  await cookieBtn.click();
  await page.waitForTimeout(1500);
  await snap('5-after-cookie');
}

await page.waitForTimeout(3000);
await snap('6-final');
console.log('errors', log);
await browser.close();
