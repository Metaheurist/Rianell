import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const summaryLlm = readFileSync('apps/pwa-webapp/summary-llm.js', 'utf8');

function loadUiFeedback() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
  const { window } = dom;
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  const src = readFileSync('apps/pwa-webapp/ui-feedback.js', 'utf8');
  vm.runInNewContext(src, {
    window,
    globalThis: window,
    document: window.document,
    navigator: window.navigator,
    requestAnimationFrame: (fn) => setTimeout(fn, 0),
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    getComputedStyle: window.getComputedStyle.bind(window),
    MutationObserver: window.MutationObserver,
    IntersectionObserver: undefined,
    CustomEvent: window.CustomEvent,
  });
  return window;
}

test('downloading phase shows a determinate percentage', () => {
  const window = loadUiFeedback();
  window.updateAiModelDownloadProgressUI({ active: true, pct: 42, phase: 'downloading', status: 'progress' });
  const banner = window.document.getElementById('aiModelDownloadBanner') || window.document.querySelector('.ai-model-download-banner');
  assert.ok(banner, 'banner rendered');
  assert.equal(banner.classList.contains('ai-model-download--indeterminate'), false);
  assert.equal(banner.querySelector('.ai-model-download-banner__pct').textContent, '42%');
});

test('preparing phase switches to an indeterminate bar with no stuck percentage', () => {
  const window = loadUiFeedback();
  window.updateAiModelDownloadProgressUI({ active: true, pct: 99, phase: 'preparing', status: 'finalizing' });
  const banner = window.document.querySelector('.ai-model-download-banner');
  assert.ok(banner.classList.contains('ai-model-download--indeterminate'));
  assert.equal(banner.querySelector('.ai-model-download-banner__pct').textContent, '');
  assert.notEqual(banner.querySelector('.ai-model-download-banner__label').textContent.trim(), '');
});

test('a failed load raises one Retry toast that restarts without clearing the cache', () => {
  const window = loadUiFeedback();
  const calls = [];
  window.resetAiModelDownloadState = () => calls.push('reset');
  window.preloadSummaryLLM = () => { calls.push('preload'); return Promise.resolve(); };
  window.clearAiModelCache = () => calls.push('clear');
  const fail = () => window.dispatchEvent(new window.CustomEvent('rianell-llm-download-progress', {
    detail: { active: false, phase: 'error', failed: true, error: 'x' },
  }));
  fail();
  fail();
  const toasts = Array.from(window.document.querySelectorAll('.rianell-toast')).filter((t) => !t._dismissed);
  assert.equal(toasts.length, 1, 'repeated failures dedupe to one toast');
  const retry = toasts[0].querySelector('.rianell-toast__action');
  assert.ok(retry, 'Retry action present');
  retry.click();
  assert.deepEqual(calls, ['reset', 'preload']);
});

test('progress events are not a failure and raise no toast', () => {
  const window = loadUiFeedback();
  window.dispatchEvent(new window.CustomEvent('rianell-llm-download-progress', {
    detail: { active: true, phase: 'downloading', pct: 10 },
  }));
  assert.equal(window.document.querySelectorAll('.rianell-toast').length, 0);
});

test('loader tracks explicit phases and a 90 s preparing watchdog', () => {
  assert.match(summaryLlm, /var FINALIZE_TIMEOUT_MS = 90000;/);
  assert.match(summaryLlm, /phase = isFinal \? 'ready' : \(status === 'finalizing' \? 'preparing' : 'downloading'\)/);
  assert.match(summaryLlm, /downloadProgressState\.phase = 'error'/);
});

test('progress repaint is throttled within a phase', () => {
  assert.match(summaryLlm, /var PROGRESS_EMIT_MIN_MS = 200;/);
  assert.match(summaryLlm, /now - lastProgressEmitAt < PROGRESS_EMIT_MIN_MS\) return;/);
});

test('static progress modal fill has no inline width (it zeroed the scaleX bar on mobile)', () => {
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  assert.match(html, /<div class="ai-model-download-progress__fill"><\/div>/);
  assert.doesNotMatch(html, /ai-model-download-progress__fill" style=/);
});

test('toast buttons out-rank the global mobile button chrome', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /\.rianell-toast \.rianell-toast__close \{[^}]*width: 44px;[^}]*background: transparent;/);
  assert.match(css, /\.rianell-toast \.rianell-toast__action \{[^}]*width: auto;[^}]*min-height: 44px;/);
});

test('instant features (MOTD, suggest note) never request a second model', () => {
  assert.doesNotMatch(summaryLlm, /\{ modelId: MODEL_SMALL \}/);
  assert.match(summaryLlm, /function getResolvedModelIdForFeature\(_feature\) \{\s*return getResolvedModelId\(\);/);
});
