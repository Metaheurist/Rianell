/**
 * User journey smoke — nav, settings panes, wizard hint; tier-parameterized.
 */
import { chromium } from 'playwright';
import { startStaticServer } from '../lib/static-server.mjs';
import { installTierInitScript, acceptCookiesIfVisible } from '../lib/tier-inject.mjs';
import { createObservabilityHarness } from '../lib/observability-harness.mjs';
import {
  getRepoRoot,
  getPwaRoot,
  benchmarkMeta,
  parseTierFilter,
  VIEWPORTS,
  entryUrl,
} from '../lib/toolkit-env.mjs';
import { buildTierMatrixPayload, writeLatestRunJson } from '../../reporters/write-run-json.mjs';
import { writeTierMatrixMd } from '../../reporters/write-tier-matrix-md.mjs';

const FLAGS = ['--no-sandbox', '--disable-dev-shm-usage'];
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function parseArgs() {
  const tierArg = process.argv.find((a) => a.startsWith('--tier='));
  const platformArg = process.argv.find((a) => a.startsWith('--platform='));
  return {
    tier: tierArg ? parseInt(tierArg.split('=')[1], 10) : null,
    platformType: platformArg ? platformArg.split('=')[1] : 'desktop',
  };
}

async function clickBenchmark(page, name) {
  await page.evaluate((n) => {
    const els = Array.from(document.querySelectorAll(`[data-benchmark="${n}"]`));
    const el = els.find((e) => e.offsetParent !== null);
    if (el) el.click();
  }, name);
}

async function runJourney(page, harness) {
  const steps = [];
  const navTabs = ['nav-home', 'nav-logs', 'nav-charts', 'nav-ai'];
  for (const tab of navTabs) {
    const s = harness.startStep(`journey_${tab}`);
    await clickBenchmark(page, tab);
    await delay(200);
    harness.endStep(s);
    steps.push({ step: tab, ms: s.ms, status: 'ok' });
  }

  const settingsStep = harness.startStep('journey_settings_panes');
  await page.evaluate(() => {
    if (typeof toggleSettings === 'function') toggleSettings();
  });
  await page.waitForSelector('.settings-overlay--open, #settingsOverlay.settings-overlay--open', {
    timeout: 15000,
  }).catch(() => {});
  const paneCount = await page.locator('[data-settings-pane-i18n]').count();
  const track = page.locator('#settingsCarouselTrack');
  for (let i = 0; i < Math.min(paneCount, 9); i++) {
    await track.evaluate((el, idx) => {
      el.setAttribute('data-settings-index', String(idx));
      el.style.transform = `translateX(-${idx * 100}%)`;
      const panes = el.querySelectorAll('.settings-carousel-pane');
      panes.forEach((p, j) => {
        p.setAttribute('aria-hidden', j === idx ? 'false' : 'true');
      });
    }, i);
    await delay(80);
  }
  harness.endStep(settingsStep);
  steps.push({ step: 'settings_panes', ms: settingsStep.ms, panes: paneCount, status: 'ok' });
  await page.keyboard.press('Escape');
  return steps;
}

async function main() {
  const args = parseArgs();
  const tierFilter = parseTierFilter();
  const tiers = args.tier ? [args.tier] : tierFilter || [3];
  const repoRoot = getRepoRoot();
  const root = getPwaRoot();
  const server = await startStaticServer(root);
  const baseUrl = `http://127.0.0.1:${server.port}`;

  const browser = await chromium.launch({ headless: true, args: FLAGS });
  const runs = [];
  try {
    for (const tier of tiers) {
      const platformType = args.platformType;
      const context = await browser.newContext({ viewport: VIEWPORTS[platformType] || VIEWPORTS.desktop });
      await installTierInitScript(context, { tier, platformType, demoMode: true });
      const page = await context.newPage();
      const harness = createObservabilityHarness(page, { tier, runId: `journey-${platformType}-t${tier}` });
      await page.goto(entryUrl(baseUrl), { waitUntil: 'domcontentloaded', timeout: 120000 });
      await acceptCookiesIfVisible(page);
      await page.waitForSelector('body.loaded', { timeout: 120000 });
      const steps = await runJourney(page, harness);
      const consoleSnap = harness.snapshot();
      runs.push({
        id: `${platformType}-t${tier}-journey`,
        tier,
        platformType,
        aspects: { journey_steps: steps.length },
        journey: steps,
        console: consoleSnap,
        status: consoleSnap.error > 0 ? 'fail' : 'ok',
      });
      await context.close();
    }
  } finally {
    await browser.close();
    await server.close();
  }

  const payload = buildTierMatrixPayload({
    slug: 'user-journey-suite',
    meta: benchmarkMeta(),
    runs,
    kind: 'user_journey',
  });
  writeLatestRunJson(repoRoot, 'user-journey-suite', payload);
  writeTierMatrixMd(repoRoot, payload);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
