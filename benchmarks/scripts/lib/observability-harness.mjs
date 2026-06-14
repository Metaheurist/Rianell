/**
 * Per-step console / pageerror / requestfailed / longtask buckets for benchmark runs.
 */

import { loadAllowlistedNetworkErrors } from './toolkit-env.mjs';

const LLM_BLOCK_RE = /summary-llm\.js|huggingface\.co|\.onnx|\/models\//i;

function isBenignConsole(text) {
  const blob = String(text || '');
  if (!blob) return true;
  if (/favicon\.ico|Failed to load resource|net::ERR_ABORTED|ResizeObserver|Non-Error promise rejection/i.test(blob)) {
    return true;
  }
  if (/chrome-extension:|moz-extension:|Grammarly|i18next|locize/i.test(blob)) return true;
  return false;
}

/**
 * @param {import('playwright').Page} page
 * @param {object} ctx - { tier, runId, aspect, llm_smoke_allowed }
 */
export function createObservabilityHarness(page, ctx = {}) {
  const allowlist = loadAllowlistedNetworkErrors();
  const buckets = {
    console: { log: 0, info: 0, warn: 0, error: 0, debug: 0 },
    pageerror: 0,
    requestfailed: 0,
    debug_timestamps: [],
    steps: [],
  };

  const llmAllowed = !!ctx.llm_smoke_allowed;

  function isAllowlisted(text) {
    const blob = String(text || '');
    if (!llmAllowed) {
      for (const p of allowlist.patterns || []) {
        if (blob.includes(p)) return true;
      }
    }
    return false;
  }

  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' && isBenignConsole(msg.text())) return;
    if (buckets.console[type] != null) buckets.console[type]++;
    else buckets.console.log++;
    if (type === 'debug') buckets.debug_timestamps.push(Date.now());
  });

  page.on('pageerror', (err) => {
    if (!isAllowlisted(err?.message) && !isBenignConsole(err?.message)) buckets.pageerror++;
  });

  page.on('requestfailed', (req) => {
    const url = req.url();
    if (LLM_BLOCK_RE.test(url)) return;
    const fail = req.failure()?.errorText || url;
    if (!isAllowlisted(fail) && !isAllowlisted(url) && !isBenignConsole(fail)) buckets.requestfailed++;
  });

  return {
    startStep(name, meta = {}) {
      const step = {
        name,
        tier: ctx.tier,
        runId: ctx.runId,
        aspect: meta.aspect || ctx.aspect,
        started_at: Date.now(),
        ended_at: null,
        ms: null,
        status: 'running',
      };
      buckets.steps.push(step);
      return step;
    },
    endStep(step, status = 'ok') {
      step.ended_at = Date.now();
      step.ms = step.ended_at - step.started_at;
      step.status = status;
      return step;
    },
    snapshot() {
      const now = Date.now();
      const windowMs = 1000;
      let peak = 0;
      const ts = buckets.debug_timestamps;
      for (let i = 0; i < ts.length; i++) {
        let c = 0;
        for (let j = i; j < ts.length && ts[j] - ts[i] <= windowMs; j++) c++;
        if (c > peak) peak = c;
      }
      return {
        console: { ...buckets.console },
        error: buckets.console.error + buckets.pageerror + buckets.requestfailed,
        debug_per_second_peak: peak,
        steps: buckets.steps.map((s) => ({ ...s })),
      };
    },
  };
}
