/**
 * God mode autotest — tier-parameterized, uses data-god-mode selectors.
 */
import { loadGodModeCatalog } from '../lib/toolkit-env.mjs';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function maxActionMs(tier) {
  if (tier <= 1) return 20000;
  if (tier <= 3) return 15000;
  return 12000;
}

/**
 * @param {import('playwright').Page} page
 * @param {object} opts
 */
export async function runGodModeSubset(page, opts = {}) {
  const tier = opts.tier ?? 3;
  const platformType = opts.platformType ?? 'desktop';
  const maxSteps = opts.maxSteps ?? 33;
  const catalog = loadGodModeCatalog();
  const steps = catalog.steps.slice(0, maxSteps);
  const maxMs = maxActionMs(tier);

  await page.evaluate(() => {
    if (window.__rianellTestHooks && window.__rianellTestHooks.openGodMode) {
      window.__rianellTestHooks.openGodMode();
    } else if (typeof openModalTestOverlay === 'function') {
      openModalTestOverlay();
    }
  });
  await page.waitForSelector('#modalTestOverlay:not(.hidden), #modalTestOverlay.god-mode-open', {
    timeout: 15000,
  }).catch(async () => {
    await page.waitForSelector('#godModeSections', { timeout: 10000 });
  });
  await delay(300);

  let pass = 0;
  const results = [];
  for (const step of steps) {
    if (step.desktopOnly && platformType === 'mobile') {
      results.push({ id: step.id, status: 'skipped' });
      pass++;
      continue;
    }
    const t0 = Date.now();
    let status = 'ok';
    try {
      const btn = page.locator(`[data-god-mode="${step.id}"]`).first();
      if (await btn.count()) {
        await btn.click({ timeout: 5000 });
      } else {
        status = 'missing';
      }
      const ms = Date.now() - t0;
      if (ms > maxMs) status = 'slow';
      if (status === 'ok') pass++;
      results.push({ id: step.id, status, ms });
      await delay(150);
    } catch (e) {
      results.push({ id: step.id, status: 'error', error: String(e.message || e) });
    }
  }

  const total = steps.length;
  return {
    pass,
    total,
    pass_pct: total ? Math.round((pass / total) * 100) : 100,
    results,
  };
}

async function main() {
  const { chromium } = await import('playwright');
  const { startStaticServer } = await import('../lib/static-server.mjs');
  const { installTierInitScript, acceptCookiesIfVisible } = await import('../lib/tier-inject.mjs');
  const {
    getRepoRoot,
    getPwaRoot,
    benchmarkMeta,
    entryUrl,
    VIEWPORTS,
    parseTierFilter,
  } = await import('../lib/toolkit-env.mjs');
  const { buildTierMatrixPayload, writeLatestRunJson } = await import('../../reporters/write-run-json.mjs');
  const { writeTierMatrixMd } = await import('../../reporters/write-tier-matrix-md.mjs');

  const tierArg = process.argv.find((a) => a.startsWith('--tier='));
  const platformArg = process.argv.find((a) => a.startsWith('--platform='));
  const tier = tierArg ? parseInt(tierArg.split('=')[1], 10) : (parseTierFilter()?.[0] || 3);
  const platformType = platformArg ? platformArg.split('=')[1] : 'desktop';

  const repoRoot = getRepoRoot();
  const server = await startStaticServer(getPwaRoot());
  const baseUrl = `http://127.0.0.1:${server.port}`;
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: VIEWPORTS[platformType] || VIEWPORTS.desktop });
  await installTierInitScript(context, { tier, platformType, demoMode: true });
  const page = await context.newPage();
  await page.goto(entryUrl(baseUrl), { waitUntil: 'domcontentloaded', timeout: 120000 });
  await acceptCookiesIfVisible(page);
  await page.waitForSelector('body.loaded', { timeout: 120000 });
  const godMode = await runGodModeSubset(page, { tier, platformType, maxSteps: 33 });
  await browser.close();
  await server.close();

  const payload = buildTierMatrixPayload({
    slug: 'god-mode-suite',
    meta: benchmarkMeta({ tier, platformType }),
    runs: [{
      id: `${platformType}-t${tier}-god`,
      tier,
      platformType,
      aspects: { god_mode_pass_pct: godMode.pass_pct },
      god_mode: godMode,
      status: godMode.pass_pct >= 100 ? 'ok' : 'fail',
    }],
    kind: 'god_mode',
  });
  writeLatestRunJson(repoRoot, 'god-mode-suite', payload);
  writeTierMatrixMd(repoRoot, payload);
  if (payload.status !== 'ok') process.exit(1);
}

const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('run-god-mode-suite.mjs');
if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
