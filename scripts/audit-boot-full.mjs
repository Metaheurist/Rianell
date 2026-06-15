import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runSecurityAudit } from './audit-benchmark-security.mjs';
import {
  getAuditProfile,
  PROBE_URL,
  HEARTBEAT_INIT,
  clickThrough,
  evalTimeout,
  fetchDeployMeta,
  getChromium,
  killHeadless,
  profileConfig,
  readSnap,
} from './lib/probe-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cfg = profileConfig();
const failureCodes = [];

function fail(code) {
  if (!failureCodes.includes(code)) failureCodes.push(code);
}

async function bootProbe(cold) {
  killHeadless();
  const chromium = await getChromium();
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });
  let clickedBenchmark = false;
  let maxLong50 = 0;
  let maxLong2000 = 0;
  const t0 = Date.now();

  try {
    const ctx = await browser.newContext();
    await ctx.addInitScript(({ script, isCold }) => {
      // eslint-disable-next-line no-eval
      eval(script);
      if (!isCold) {
        try {
          localStorage.setItem('rianellCookieConsent', 'accepted');
          localStorage.setItem('rianellHealthDataConsent', 'accepted');
          localStorage.setItem('rianellSettings', JSON.stringify({
            privacyRegion: 'eea_uk',
            uiLocale: 'en-GB',
            healthDataConsent: true,
            policyAcknowledgedVersion: 'v1.0.0',
          }));
          localStorage.setItem('rianellPerfBenchmark', JSON.stringify({
            version: 5,
            platformType: 'desktop',
            tier: 4,
            heuristic: true,
            ts: Date.now(),
            gpu: { good: false, backend: 'none' },
          }));
        } catch (_) {}
        return;
      }
      try { localStorage.clear(); sessionStorage.clear(); } catch (_) {}
    }, { script: HEARTBEAT_INIT, isCold: cold });

    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message.slice(0, 120)));

    await page.goto(PROBE_URL, { waitUntil: 'load', timeout: 120000 });

    let last = null;
    for (let i = 0; i < 90; i++) {
      const clicked = await clickThrough(page, cfg.evalTimeoutMs, cfg.allowBenchmarkModal);
      if (clicked.includes('#perfBenchmarkContinueBtn')) clickedBenchmark = true;

      try {
        last = await readSnap(page, cfg.evalTimeoutMs);
      } catch (e) {
        if (e.message === 'EVAL_TIMEOUT') fail('EVAL_TIMEOUT');
        throw e;
      }

      const hbAge = Date.now() - (last.heartbeat || 0);
      if (hbAge > cfg.heartbeatStaleMs && !(last.init && last.loaded)) {
        fail('HEARTBEAT_STALE');
      }
      if (last.recovery) fail('RECOVERY_OVERLAY');

      for (const lt of last.longTasks || []) {
        if (lt.d > 50) maxLong50++;
        if (lt.d > 2000) maxLong2000 = Math.max(maxLong2000, lt.d);
      }

      const elapsed = Date.now() - t0;
      if (last.init && last.loaded) {
        return {
          ok: true,
          cold,
          elapsedMs: elapsed,
          clickedBenchmark,
          maxLong50,
          maxLong2000,
          ...last,
          errors: errors.slice(0, 3),
          page,
          browser,
          ctx,
        };
      }
      if (i % 10 === 0) console.error(`+${Math.round(elapsed / 1000)}s`, cold ? 'guest' : 'warm', JSON.stringify(last));
      await page.waitForTimeout(500);
    }

    return {
      ok: false,
      cold,
      elapsedMs: Date.now() - t0,
      clickedBenchmark,
      maxLong50,
      maxLong2000,
      ...last,
      errors,
      page,
      browser,
      ctx,
    };
  } catch (e) {
    await browser.close().catch(() => {});
    killHeadless();
    throw e;
  }
}

async function postInitProbe(page) {
  const t0 = Date.now();
  const evalMs = cfg.evalTimeoutMs;
  const steps = [
    () => document.querySelector('#logTab')?.click() || document.querySelector('[data-tab="log"]')?.click(),
    () => document.querySelector('#settingsTab')?.click() || document.querySelector('[data-tab="settings"]')?.click(),
    () => window.scrollBy(0, 500),
    () => document.querySelector('#aiTab')?.click() || document.querySelector('[data-tab="ai"]')?.click(),
  ];
  const timeouts = [];
  for (const fn of steps) {
    try {
      await evalTimeout(page, fn, undefined, evalMs);
    } catch (e) {
      if (e.message === 'EVAL_TIMEOUT') {
        fail('POST_INIT_FREEZE');
        timeouts.push(true);
      }
    }
  }
  await page.waitForTimeout(5000);
  try {
    const snap = await readSnap(page, evalMs);
    const hbAge = Date.now() - (snap.heartbeat || 0);
    if (hbAge > 1000) fail('POST_INIT_FREEZE');
  } catch (e) {
    if (e.message === 'EVAL_TIMEOUT') fail('POST_INIT_FREEZE');
  }
  return { elapsedMs: Date.now() - t0, evalTimeouts: timeouts.length };
}

function judgeBoot(result, label) {
  let ok = result.ok;
  const passMs = label === 'guest' ? (cfg.guestPassMs || cfg.passMs) : (cfg.warmPassMs || cfg.passMs);
  if (result.elapsedMs > passMs) {
    ok = false;
    fail('SLOW_BOOT');
  }
  if (result.maxLong50 > cfg.longtask50Max) {
    ok = false;
    fail('LONGTASK_50_EXCEEDED');
  }
  if (result.maxLong2000 > cfg.longtask2000Max) {
    ok = false;
    fail('LONGTASK_2000');
  }
  if (cfg.strict && result.clickedBenchmark) {
    ok = false;
    fail('BENCHMARK_MODAL_STRICT');
  }
  if (!cfg.allowBenchmarkModal && result.clickedBenchmark && label === 'guest') {
    // strict already handled
  }
  return ok;
}

async function main() {
  killHeadless();
  console.error('audit-boot-full', { profile: getAuditProfile(), url: PROBE_URL, cfg });

  let previousHash = null;
  const prevPath = path.join(__dirname, '../audit-report-previous.json');
  if (fs.existsSync(prevPath)) {
    try {
      previousHash = JSON.parse(fs.readFileSync(prevPath, 'utf8')).deploy?.appHash;
    } catch (_) {}
  }

  const deploy = await fetchDeployMeta(PROBE_URL);
  if (process.env.REQUIRE_DEPLOY_CHANGE === '1' && previousHash && deploy.appHash === previousHash) {
    fail('DEPLOY_HASH_UNCHANGED');
  }

  const warmResult = await bootProbe(false);
  const warmOk = judgeBoot(warmResult, 'warm');
  await warmResult.browser?.close().catch(() => {});
  killHeadless();

  const guestResult = await bootProbe(true);
  let postInit = null;
  if (guestResult.page) {
    postInit = await postInitProbe(guestResult.page);
  }
  const guestOk = judgeBoot(guestResult, 'guest');
  await guestResult.browser?.close().catch(() => {});
  killHeadless();

  const security = await runSecurityAudit();
  if (!security.ok) {
    for (const f of security.failed) fail(f.code);
  }

  const report = {
    ok: warmOk && guestOk && security.ok && failureCodes.length === 0,
    profile: getAuditProfile(),
    ts: new Date().toISOString(),
    deploy,
    previousAppHash: previousHash,
    warm: {
      ok: warmOk,
      elapsedMs: warmResult.elapsedMs,
      clickedBenchmark: warmResult.clickedBenchmark,
      maxLong50: warmResult.maxLong50,
      script: warmResult.script,
    },
    guest: {
      ok: guestOk,
      elapsedMs: guestResult.elapsedMs,
      clickedBenchmark: guestResult.clickedBenchmark,
      maxLong50: guestResult.maxLong50,
      benchModal: guestResult.benchModal,
      script: guestResult.script,
      bench: guestResult.bench,
    },
    postInit,
    security,
    failureCodes,
  };

  const outPath = path.join(__dirname, '../audit-report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  process.exit(report.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
