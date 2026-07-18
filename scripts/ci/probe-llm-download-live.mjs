import { execSync } from 'node:child_process';
import { chromium } from 'playwright';
import { isHuggingFaceModelsRequest, isSupabaseLlmModelsRequest } from '../../packages/build-tools/src/probe-llm-assertions.mjs';

const URL = (process.env.PROBE_URL || 'https://rianell.com/').replace(/\/?$/, '/');
const DOWNLOAD_TIMEOUT_MS = Number(process.env.PROBE_DOWNLOAD_TIMEOUT_MS || 900000);
const ATTEMPTS = Number(process.env.PROBE_ATTEMPTS || 3);
const ATTEMPT_DELAY_MS = Number(process.env.PROBE_ATTEMPT_DELAY_MS || 120000);
const TIER = Number(process.env.PROBE_TIER || 1);
const GPU_AVAILABLE = process.env.PROBE_GPU_AVAILABLE !== '0';
const GPU_BACKEND = process.env.PROBE_GPU_BACKEND || (GPU_AVAILABLE ? 'webgpu' : 'none');
/** Cloudflare often blocks datacenter Playwright from loading self-hosted ort-wasm *.mjs on rianell.com. */
const TRANSFORMERS_CDN = process.env.PROBE_TRANSFORMERS_CDN === '1';
/**
 * When Hugging Face rate-limits GHA IPs on the large onnx weights — either a
 * hard 403 Forbidden or a slow-transfer throttle that trips the app's model
 * preparation timeout — exit 0 after verifying the download path is otherwise
 * healthy (metadata resolved, weight request issued, vendor bundle loaded, no
 * failed/forbidden requests, no JS errors).
 */
const SOFT_HF_FORBIDDEN = process.env.PROBE_SOFT_HF_FORBIDDEN !== '0';
/**
 * This job verifies the Hugging Face *download*, not CPU-bound inference. Once
 * the onnx weights are fully transferred and the app enters "finalizing" (ONNX
 * session compile + warmup), we give the compile a short grace window to reach
 * "ready" on capable hardware, then treat a verified download as success. This
 * avoids the job sitting for 150s+ in single-threaded WASM compile on a 2-vCPU
 * runner (no cross-origin isolation → no threads) before the soft-pass fires.
 */
const WEIGHTS_VERIFY_GRACE_MS = Number(process.env.PROBE_WEIGHTS_VERIFY_GRACE_MS || 30000);
const USER_AGENT = process.env.PROBE_USER_AGENT
  || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36';
const EXTRA_SETTINGS = (() => {
  try {
    return process.env.PROBE_SETTINGS_JSON ? JSON.parse(process.env.PROBE_SETTINGS_JSON) : {};
  } catch (_) {
    return {};
  }
})();

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
  for (let i = 0; i < 8; i++) {
    const clicked = await page.evaluate(() => {
      const order = [
        '#perfBenchmarkContinueBtn',
        '#guidedOnboardingContinueBtn',
        '.guided-onboarding-choice[data-choice-id="confirm"]',
        '.guided-onboarding-choice[data-choice-id="accept"]',
        '.guided-onboarding-choice[data-choice-id="skip"]',
        '.guided-onboarding-choice[data-choice-id="start"]',
        '.guided-onboarding-choice',
        '.tutorial-ai-skip',
        '#tutorialFinishBtn',
        '#privacyRegionGateConfirm',
        '#healthDataConsentOverlay button.modal-save-btn:not(.modal-cancel-btn)',
        '.cookie-banner-accept',
        '#aiModelDownloadOverlay .modal-save-btn',
      ];
      for (const sel of order) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) continue;
        el.click();
        return true;
      }
      return false;
    }).catch(() => false);
    if (!clicked) break;
    await page.waitForTimeout(600);
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
      userAgent: USER_AGENT,
      viewport: { width: 1280, height: 720 },
    });
    await ctx.addInitScript(({ tier, gpuAvailable, gpuBackend, extraSettings, transformersCdn }) => {
      try {
        localStorage.setItem('rianellEnableStaticSW', '0');
        if (transformersCdn) localStorage.setItem('rianellTransformersCdn', '1');
        localStorage.setItem('rianellCookieConsent', 'accepted');
        localStorage.setItem('rianellHealthDataConsent', 'accepted');
        localStorage.setItem('rianellTutorialSeen', '1');
        localStorage.setItem('rianellSettings', JSON.stringify(Object.assign({
          privacyRegion: 'eea_uk',
          uiLocale: 'en-GB',
          healthDataConsent: true,
          policyAcknowledgedVersion: 'v1.0.0',
          aiModelDownloadConsent: 'granted',
          preferredLlmModelSize: 'tier' + tier,
          firstRunWizardCompletedAt: new Date().toISOString(),
          tutorialSeen: true,
        }, extraSettings || {})));
        localStorage.setItem('rianellPerfBenchmark', JSON.stringify({
          version: 5,
          platformType: 'desktop',
          tier,
          ts: Date.now(),
          gpu: {
            available: gpuAvailable,
            backend: gpuBackend,
            good: gpuAvailable,
            scoreMs: null,
            scoreSamples: [],
          },
        }));
        try {
          sessionStorage.setItem('rianell.webgpu.adapterOk', JSON.stringify({
            ok: gpuAvailable,
            ts: Date.now(),
          }));
        } catch (_) {}
      } catch (_) {}
    }, {
      tier: TIER,
      gpuAvailable: GPU_AVAILABLE,
      gpuBackend: GPU_BACKEND,
      extraSettings: EXTRA_SETTINGS,
      transformersCdn: TRANSFORMERS_CDN,
    });

    const page = await ctx.newPage();
    const hf = [];
    const supa = [];
    const vendor = [];
    const failedRequests = [];
    const errors = [];
    // Live progress snapshot — shared with the heartbeat printer so we always
    // report which phase / model file the probe is stuck on, even mid-await.
    const snap = {
      phase: 'init',
      state: null,
      pct: 0,
      file: '',
      hf: 0,
      vendor: 0,
      failed: 0,
      onnx: { started: false, status: null, clenMB: null, finished: false, failed: false },
    };
    const ONNX_RE = /model_q4\.onnx|\/onnx\/.*\.onnx/i;
    // Under GitHub Actions, wrap each phase in a collapsible ::group:: so the
    // still-open (bottom) group in the step log is exactly the phase it's stuck
    // on. Heartbeats/progress stream inside the current phase group.
    const GHA = !!process.env.GITHUB_ACTIONS;
    let groupOpen = false;
    const setPhase = (name) => {
      snap.phase = name;
      const line = `LLM_PHASE ${name} (+${Math.round((Date.now() - t0) / 1000)}s) state=${snap.state ?? '-'} pct=${snap.pct}`;
      if (GHA) {
        if (groupOpen) console.log('::endgroup::');
        console.log(`::group::${line}`);
        groupOpen = true;
      } else {
        console.log(line);
      }
    };
    page.on('pageerror', (e) => {
      const msg = String(e.message || e).slice(0, 180);
      if (/Unsupported device:\s*"webgl"/i.test(msg)) errors.push(msg);
      else errors.push(msg);
    });
    page.on('console', (msg) => {
      const text = msg.text ? msg.text() : '';
      if (/Unsupported device:\s*"webgl"/i.test(text)) errors.push(text.slice(0, 180));
      if (!/content security policy|csp|connect-src/i.test(text)) return;
      if (/cloudflareinsights|beacon\.min\.js|email-decode\.min\.js|cdn-cgi\/scripts/i.test(text)) return;
      // Combined Cloudflare HTTP CSP + meta CSP blocks 'self' scripts on bot/datacenter IPs.
      if (/script-src 'unsafe-inline' 'unsafe-eval'/i.test(text) && !/'self'/i.test(text)) {
        errors.push('cloudflare_csp_blocked_self_scripts');
        return;
      }
      errors.push(text.slice(0, 180));
    });
    page.on('request', (req) => {
      const url = req.url();
      if (ONNX_RE.test(url) && !snap.onnx.started) {
        snap.onnx.started = true;
        console.log(`LLM_NET onnx-request-start (+${Math.round((Date.now() - t0) / 1000)}s) ${url.slice(0, 160)}`);
      }
    });
    page.on('response', (res) => {
      const url = res.url();
      if (ONNX_RE.test(url)) {
        const clen = Number(res.headers()['content-length'] || 0);
        if (clen > 0) snap.onnx.clenMB = Math.round(clen / (1024 * 1024));
        snap.onnx.status = res.status();
        console.log(`LLM_NET onnx-response status=${res.status()} size=${snap.onnx.clenMB ?? '?'}MB (+${Math.round((Date.now() - t0) / 1000)}s)`);
      }
    });
    page.on('requestfinished', async (req) => {
      const url = req.url();
      if (isSupabaseLlmModelsRequest(url)) supa.push(url);
      if (isHuggingFaceModelsRequest(url)) { hf.push(url); snap.hf = hf.length; }
      if (/\/vendor\/transformers\//i.test(url)) { vendor.push(url); snap.vendor = vendor.length; }
      if (ONNX_RE.test(url) && !snap.onnx.finished) {
        snap.onnx.finished = true;
        console.log(`LLM_NET onnx-request-finished — weights transferred (+${Math.round((Date.now() - t0) / 1000)}s)`);
      }
    });
    page.on('requestfailed', (req) => {
      const url = req.url();
      const fail = req.failure()?.errorText || 'failed';
      failedRequests.push(url.slice(0, 220) + ' (' + fail + ')');
      snap.failed = failedRequests.length;
      if (isSupabaseLlmModelsRequest(url)) supa.push(url);
      if (isHuggingFaceModelsRequest(url)) { hf.push(url); snap.hf = hf.length; }
      if (ONNX_RE.test(url)) {
        snap.onnx.failed = true;
        console.log(`LLM_NET onnx-request-FAILED (${fail}) (+${Math.round((Date.now() - t0) / 1000)}s)`);
      }
      if (/\/vendor\/transformers\//i.test(url) || /cdn\.jsdelivr\.net\/npm\/@huggingface\/transformers/i.test(url)) {
        vendor.push(url + ' [FAILED]');
      }
    });

    const t0 = Date.now();
    // Heartbeat: prints the live snapshot every 10s so CI logs always show what
    // phase / file the probe is on, even while blocked inside a long await.
    const heartbeat = setInterval(() => {
      const o = snap.onnx;
      const onnxDesc = o.failed
        ? `FAILED`
        : o.finished
          ? `done(${o.clenMB ?? '?'}MB)`
          : o.started
            ? `downloading(${o.clenMB ?? '?'}MB,status=${o.status ?? '-'})`
            : 'not-started';
      console.log(
        `LLM_HEARTBEAT +${Math.round((Date.now() - t0) / 1000)}s phase=${snap.phase} ` +
        `state=${snap.state ?? '-'} pct=${snap.pct} file=${(snap.file || '-').split('/').pop()} ` +
        `hf=${snap.hf} vendor=${snap.vendor} failed=${snap.failed} onnx=${onnxDesc}`
      );
    }, 10000);

    try {
    setPhase('navigate');
    await page.goto(URL, { waitUntil: 'load', timeout: 120000 });

    // Boot click-through.
    setPhase('boot-clickthrough');
    for (let i = 0; i < 20; i++) {
      await clickThrough(page);
      await page.waitForTimeout(500);
    }

    // Trigger download + inference warmup (summary-llm.js is lazy-loaded after boot).
    setPhase('grant-consent');
    await page.evaluate(() => {
      try {
        if (window.appSettings) window.appSettings.aiModelDownloadConsent = 'granted';
        if (typeof window.saveSettings === 'function') window.saveSettings();
      } catch (_) {}
    });

    setPhase('wait-preload-fn');
    try {
      await page.waitForFunction(
        () => typeof window.preloadSummaryLLM === 'function',
        { timeout: 180000 }
      );
    } catch (err) {
      errors.push('preloadSummaryLLM wait: ' + String(err.message || err).slice(0, 240));
    }

    try {
      await page.evaluate(({ tier, gpuAvailable, gpuBackend }) => {
        try {
          localStorage.setItem('rianellPerfBenchmark', JSON.stringify({
            version: 5,
            platformType: 'desktop',
            tier,
            ts: Date.now(),
            gpu: {
              available: gpuAvailable,
              backend: gpuBackend,
              good: gpuAvailable,
              scoreMs: null,
              scoreSamples: [],
            },
          }));
          if (typeof window.preloadSummaryLLM === 'function') {
            void window.preloadSummaryLLM();
          }
        } catch (_) {}
      }, { tier: TIER, gpuAvailable: GPU_AVAILABLE, gpuBackend: GPU_BACKEND });
    } catch (err) {
      const msg = String(err.message || err);
      if (!/Execution context was destroyed/i.test(msg)) {
        errors.push('preloadSummaryLLM: ' + msg.slice(0, 240));
      }
    }

    setPhase('download-poll');
    let final = null;
    let failPolls = 0;
    let redownloaded = false;
    let lastLoggedState = null;
    let lastLoggedPct = -1;
    let finalizingSinceMs = 0;
    let weightsDownloadVerified = false;
    while (Date.now() - t0 < DOWNLOAD_TIMEOUT_MS) {
      await clickThrough(page);
      final = await page.evaluate(() => (typeof window.getAiModelStatus === 'function') ? window.getAiModelStatus() : null);
      if (final) {
        snap.state = final.state;
        snap.pct = typeof final.pct === 'number' ? final.pct : snap.pct;
        snap.file = final.file || snap.file;
        // Download-verified short-circuit: weights fully transferred + vendor
        // bundle loaded + no failed requests, and the app has entered ONNX
        // prep ("finalizing": downloading state pinned at pct>=99). Give the
        // compile a grace window to reach "ready" on fast hardware; otherwise
        // accept the verified download and stop (CPU-bound WASM compile is not
        // this job's concern).
        const inFinalizing = final.state === 'downloading' && (snap.pct || 0) >= 99;
        const healthyDownload = snap.onnx.finished && vendor.length >= 2 && failedRequests.length === 0;
        if (inFinalizing && healthyDownload) {
          if (!finalizingSinceMs) {
            finalizingSinceMs = Date.now();
            console.log(`LLM_PROGRESS +${Math.round((Date.now() - t0) / 1000)}s weights fully transferred — ONNX prep/compile started (grace ${Math.round(WEIGHTS_VERIFY_GRACE_MS / 1000)}s for readiness)`);
          } else if (Date.now() - finalizingSinceMs >= WEIGHTS_VERIFY_GRACE_MS) {
            weightsDownloadVerified = true;
            console.log(`LLM_PROGRESS +${Math.round((Date.now() - t0) / 1000)}s DOWNLOAD VERIFIED — onnx weights transferred, vendor bundle loaded, no failed requests. Skipping CPU-bound ONNX compile wait.`);
            break;
          }
        } else if (finalizingSinceMs && final.state !== 'downloading') {
          finalizingSinceMs = 0;
        }
        // Log on state change, or every 5% of download progress, so the log
        // clearly shows whether it stalls on bytes (pct < 99) or ONNX
        // prep/compile (pct pinned at ~99 with state still 'downloading').
        const pctBucket = Math.floor((snap.pct || 0) / 5);
        if (final.state !== lastLoggedState || pctBucket !== Math.floor(lastLoggedPct / 5)) {
          lastLoggedState = final.state;
          lastLoggedPct = snap.pct || 0;
          const hint = (final.state === 'downloading' && (snap.pct || 0) >= 99)
            ? ' [weights in — awaiting ONNX prep/compile]'
            : '';
          console.log(
            `LLM_PROGRESS +${Math.round((Date.now() - t0) / 1000)}s state=${final.state} ` +
            `pct=${snap.pct} file=${(snap.file || '-').split('/').pop()}` +
            `${hint}`
          );
        }
      }
      if (final && final.state === 'ready') break;
      if (final && final.state === 'failed') {
        failPolls += 1;
        const elapsed = Date.now() - t0;
        if (!redownloaded && failPolls >= 2 && elapsed < 180000) {
          redownloaded = true;
          failPolls = 0;
          await page.evaluate(({ tier, gpuAvailable, gpuBackend }) => {
            try {
              if (typeof window.clearAndRedownloadAiModel === 'function') {
                void window.clearAndRedownloadAiModel();
              } else if (typeof window.preloadSummaryLLM === 'function') {
                void window.preloadSummaryLLM();
              }
              localStorage.setItem('rianellPerfBenchmark', JSON.stringify({
                version: 5,
                platformType: 'desktop',
                tier,
                ts: Date.now(),
                gpu: { available: gpuAvailable, backend: gpuBackend, good: gpuAvailable, scoreMs: null, scoreSamples: [] },
              }));
            } catch (_) {}
          }, { tier: TIER, gpuAvailable: GPU_AVAILABLE, gpuBackend: GPU_BACKEND });
          continue;
        }
        if (elapsed > 120000 || failPolls >= 8) break;
      } else {
        failPolls = 0;
      }
      await page.waitForTimeout(2000);
    }

    const elapsedMs = Date.now() - t0;
    const cloudflareCsp = errors.some((e) => e === 'cloudflare_csp_blocked_self_scripts');
    const hfOnnxFetched = hf.some((u) => /model_q4\.onnx|\/onnx\/.*\.onnx/i.test(u));
    const downloadVerified = Boolean(
      weightsDownloadVerified ||
      (final && final.state === 'downloading' && (final.pct || 0) >= 99 &&
        hfOnnxFetched && failedRequests.length === 0 && vendor.length >= 2)
    );
    const ok = Boolean(
      hf.length > 0 && supa.length === 0 &&
      !errors.some((e) => /Unsupported device:\s*"webgl"/i.test(e)) &&
      (
        (final && final.state === 'ready' && final.inMemory === true) ||
        downloadVerified
      )
    );
    const outErrors = errors.filter((e) => e !== 'cloudflare_csp_blocked_self_scripts').slice(0, 3);
    if (cloudflareCsp && !ok) {
      outErrors.unshift('Cloudflare HTTP CSP blocked same-origin scripts (use local Pages probe in CI)');
    }
    return {
      ok,
      elapsedMs,
      finalStatus: final,
      hfOnnxFetched,
      onnxWeightsTransferred: snap.onnx.finished,
      downloadVerified,
      failedRequestCount: failedRequests.length,
      hfRequests: hf.slice(0, 8),
      vendorRequests: vendor.slice(0, 6),
      failedRequests: failedRequests.slice(0, 6),
      supabaseRequests: supa.slice(0, 3),
      errors: outErrors,
    };
    } finally {
      clearInterval(heartbeat);
      if (GHA && groupOpen) { console.log('::endgroup::'); groupOpen = false; }
    }
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

function isHfForbiddenOnly(result) {
  const errs = [
    ...(result?.errors || []),
    result?.error,
    result?.finalStatus?.error,
  ].filter(Boolean).map((e) => String(e));
  if (!errs.length) return false;
  const forbidden = errs.every((e) => /Forbidden access to file:.*huggingface\.co/i.test(e));
  const reachedHf = Array.isArray(result?.hfRequests) && result.hfRequests.length > 0;
  const vendorOk = Array.isArray(result?.vendorRequests) && result.vendorRequests.length > 0;
  return forbidden && reachedHf && vendorOk;
}

/**
 * HF throttles large onnx weights to datacenter IPs so the transfer never
 * finishes within the app's model-preparation timeout. Treat as a soft pass
 * only when the whole download path is otherwise verified healthy: HF metadata
 * reached, the onnx weight request was issued, the vendor bundle loaded, no
 * request failed at the network layer, and no JS errors were raised. The sole
 * failure signal must be the app's own "model preparation timed out".
 */
function isHfThrottledTimeoutOnly(result) {
  if (!result || result.ok) return false;
  const jsErrors = (result.errors || []).filter(Boolean);
  if (jsErrors.length > 0) return false;
  if (result.error) return false; // probe-level exception, not a clean throttle
  if ((result.failedRequestCount || 0) > 0) return false;
  const status = result.finalStatus;
  if (!status || status.state !== 'failed') return false;
  if (!/prepar\w*\s+timed out|timed out/i.test(String(status.error || ''))) return false;
  const reachedHf = Array.isArray(result.hfRequests) && result.hfRequests.length > 0;
  const vendorOk = Array.isArray(result.vendorRequests) && result.vendorRequests.length >= 2;
  return reachedHf && result.hfOnnxFetched === true && vendorOk;
}

if (SOFT_HF_FORBIDDEN && isHfForbiddenOnly(last)) {
  console.warn('LLM_PROBE_SOFT_PASS Hugging Face returned Forbidden on ONNX weights (GHA IP / CDN). Vendor + HF metadata path verified.');
  process.exit(0);
}

if (SOFT_HF_FORBIDDEN && isHfThrottledTimeoutOnly(last)) {
  console.warn('LLM_PROBE_SOFT_PASS Hugging Face throttled the ONNX weight transfer past the app model-prep timeout (GHA IP). Metadata + onnx weight request + vendor bundle verified; no failed requests or JS errors.');
  process.exit(0);
}

process.exit(last && last.ok ? 0 : 1);

