import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getAuditProfile() {
  if (process.env.AUDIT_PROFILE) return process.env.AUDIT_PROFILE;
  if (process.env.npm_lifecycle_event === 'audit:boot:strict') return 'strict';
  if (process.env.npm_lifecycle_event === 'audit:boot:baseline') return 'baseline';
  return process.env.AUDIT_PROFILE || 'baseline';
}

export const PROBE_URL = process.env.PROBE_URL || 'https://rianell.com/';

export function profileConfig() {
  const AUDIT_PROFILE = getAuditProfile();
  const SECURITY_PROFILE = process.env.SECURITY_PROFILE || (AUDIT_PROFILE === 'strict' ? 'strict' : 'legacy');
  const strict = AUDIT_PROFILE === 'strict';
  return {
    strict,
    passMs: Number(process.env.PROBE_PASS_MS || (strict ? 4000 : 8000)),
    warmPassMs: Number(process.env.PROBE_WARM_PASS_MS || (strict ? 3000 : 8000)),
    guestPassMs: Number(process.env.PROBE_GUEST_PASS_MS || (strict ? 2000 : 8000)),
    allowBenchmarkModal: !strict,
    longtask50Max: strict ? 3 : 10,
    longtask2000Max: 0,
    heartbeatStaleMs: strict ? 2000 : 3000,
    evalTimeoutMs: 2000,
    securityProfile: SECURITY_PROFILE,
  };
}

export function killHeadless() {
  try {
    if (process.platform === 'win32') {
      execSync('taskkill /F /IM chrome-headless-shell.exe /T 2>nul', { stdio: 'ignore' });
    } else {
      execSync('pkill -f chrome-headless-shell || true', { stdio: 'ignore' });
    }
  } catch (_) {}
}

export async function getChromium() {
  try {
    const mod = await import('playwright');
    return mod.chromium;
  } catch (_) {
    const bench = path.resolve(__dirname, '../../benchmarks/node_modules/playwright/index.mjs');
    const mod = await import(bench);
    return mod.chromium;
  }
}

export async function evalTimeout(page, fn, arg, ms = 2000) {
  return Promise.race([
    typeof arg === 'undefined' ? page.evaluate(fn) : page.evaluate(fn, arg),
    new Promise((_, rej) => setTimeout(() => rej(new Error('EVAL_TIMEOUT')), ms)),
  ]);
}

export const HEARTBEAT_INIT = `
  window.__rianellHeartbeat = Date.now();
  window.__rianellLongTasks = [];
  window.__rianellBootDone = false;
  setInterval(function () { window.__rianellHeartbeat = Date.now(); }, 200);
  try {
    new PerformanceObserver(function (list) {
      for (var i = 0; i < list.getEntries().length; i++) {
        var e = list.getEntries()[i];
        if (e.duration > 50) {
          window.__rianellLongTasks.push({ d: e.duration, t: e.startTime });
        }
      }
    }).observe({ type: 'longtask', buffered: true });
  } catch (e) {}
`;

export async function clickThrough(page, evalTimeoutMs, allowBenchmark = true) {
  const clicked = [];
  const sels = [
    allowBenchmark ? '#perfBenchmarkContinueBtn' : null,
    '#privacyRegionGateConfirm',
    '#healthDataConsentOverlay button.modal-save-btn:not(.modal-cancel-btn)',
    '.cookie-banner-accept',
  ].filter(Boolean);
  for (const sel of sels) {
    const ok = await evalTimeout(page, (s) => {
      const el = document.querySelector(s);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      el.click();
      return true;
    }, sel, evalTimeoutMs).catch(() => false);
    if (ok) clicked.push(sel);
  }
  return clicked;
}

export async function readSnap(page, evalTimeoutMs) {
  return evalTimeout(page, () => ({
    loaded: document.body?.classList.contains('loaded'),
    init: !!window.__rianellAppInitStarted,
    boot: !!window.__rianellBootAfterDomStarted,
    script: document.querySelector('script[src*="app."]')?.getAttribute('src') || '',
    bench: document.querySelector('script[src*="device-benchmark"]')?.getAttribute('src') || '',
    benchModal: (() => {
      const o = document.getElementById('perfBenchmarkOverlay');
      return !!(o && o.style.display !== 'none' && o.style.visibility !== 'hidden');
    })(),
    gate: document.getElementById('privacyRegionGateOverlay')?.style.display || '',
    recovery: !!document.getElementById('rianellBootRecoveryOverlay'),
    overlayHidden: document.getElementById('loadingOverlay')?.classList.contains('hidden'),
    heartbeat: window.__rianellHeartbeat || 0,
    longTasks: (window.__rianellLongTasks || []).slice(),
  }), undefined, evalTimeoutMs);
}

export async function fetchDeployMeta(url) {
  const res = await fetch(url, { cache: 'no-store' });
  const html = await res.text();
  const appMatch = html.match(/app\.([a-f0-9]+)\.min\.js/);
  const benchMatch = html.match(/device-benchmark\.js(?:\?v=(\d+))?/);
  return {
    appHash: appMatch ? appMatch[1] : null,
    appScript: appMatch ? appMatch[0] : null,
    benchVersion: benchMatch ? (benchMatch[1] || 'none') : null,
  };
}
