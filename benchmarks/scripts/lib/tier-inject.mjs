/**
 * Inject performance tier before page load via Playwright init script.
 */

const BENCHMARK_VERSION = 4;

/**
 * @param {import('playwright').BrowserContext} context
 * @param {{ tier: number, platformType: string, demoMode?: boolean, settings?: object }} opts
 */
export async function installTierInitScript(context, opts) {
  const { tier, platformType, demoMode = true, settings = {} } = opts;
  await context.addInitScript(
    ({ tier, platformType, demoMode, settings, version }) => {
      try {
        localStorage.setItem(
          'rianellPerfBenchmark',
          JSON.stringify({
            platformType,
            tier,
            scoreMs: 0,
            injected: true,
            ts: Date.now(),
            version,
          }),
        );
        if (demoMode) {
          const prev = JSON.parse(localStorage.getItem('rianellSettings') || '{}');
          localStorage.setItem(
            'rianellSettings',
            JSON.stringify({ ...prev, demoMode: true, ...settings }),
          );
        } else if (Object.keys(settings).length) {
          const prev = JSON.parse(localStorage.getItem('rianellSettings') || '{}');
          localStorage.setItem('rianellSettings', JSON.stringify({ ...prev, ...settings }));
        }
      } catch (e) {
        /* ignore */
      }
    },
    { tier, platformType, demoMode, settings, version: BENCHMARK_VERSION },
  );
}

/**
 * @param {import('playwright').Page} page
 */
export async function acceptCookiesIfVisible(page) {
  const btn = page.locator('.cookie-banner-accept');
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
  }
}
