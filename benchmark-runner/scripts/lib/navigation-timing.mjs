import { chromium } from 'playwright';

const FLAGS = ['--no-sandbox', '--disable-dev-shm-usage'];

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {string} startUrl - full URL to app entry
 * @param {object} [opts]
 * @param {boolean} [opts.useBottomNav] - use narrow viewport to show bottom nav
 */
export async function measureNavigationTimings(startUrl, opts = {}) {
  const useBottomNav = opts.useBottomNav ?? false;
  const browser = await chromium.launch({
    headless: true,
    args: FLAGS,
  });
  try {
    const context = await browser.newContext(
      useBottomNav
        ? { viewport: { width: 390, height: 844 } }
        : { viewport: { width: 1280, height: 720 } }
    );
    const page = await context.newPage();

    const coldStart = Date.now();
    await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
    const cookieAccept = page.locator('.cookie-banner-accept');
    if (await cookieAccept.isVisible().catch(() => false)) {
      await cookieAccept.click();
    }
    await page.waitForSelector('body.loaded', { timeout: 120000 });
    const coldMs = Date.now() - coldStart;

    /** @type { { step: string, ms: number }[] } */
    const steps = [{ step: 'cold_dom_ready_to_main', ms: coldMs }];

    const nav = [
      ['nav-logs', 'nav-logs'],
      ['nav-charts', 'nav-charts'],
      ['nav-home', 'nav-home'],
    ];

    async function clickBench(name) {
      await page.evaluate((n) => {
        const els = Array.from(document.querySelectorAll(`[data-benchmark="${n}"]`));
        const el = els.find((e) => e.offsetParent !== null);
        if (el) el.click();
      }, name);
    }

    for (const [sel, label] of nav) {
      const t0 = Date.now();
      await clickBench(sel);
      await delay(150);
      steps.push({ step: `click_${label}`, ms: Date.now() - t0 });
    }

    const tSettings = Date.now();
    await page.evaluate(() => {
      if (typeof toggleSettings === 'function') {
        const o = document.getElementById('settingsOverlay');
        const open =
          o &&
          (o.classList.contains('settings-overlay--open') ||
            o.style.display === 'block' ||
            o.style.display === 'flex');
        if (!open) toggleSettings();
      }
    });
    await page.waitForFunction(
      () => {
        const o = document.getElementById('settingsOverlay');
        return (
          o &&
          (o.classList.contains('settings-overlay--open') ||
            o.style.display === 'block' ||
            o.style.display === 'flex')
        );
      },
      { timeout: 20000 }
    );
    steps.push({ step: 'open_settings', ms: Date.now() - tSettings });

    await page.keyboard.press('Escape');
    await delay(200);

    const warmStart = Date.now();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body.loaded', { timeout: 120000 });
    steps.push({ step: 'warm_reload_to_main', ms: Date.now() - warmStart });

    await context.close();
    return steps;
  } finally {
    await browser.close();
  }
}
