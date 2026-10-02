import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

function loadUiFeedback() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
  const { window } = dom;
  window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
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
  });
  return window;
}

function liveToasts(window) {
  return Array.from(window.document.querySelectorAll('.rianell-toast')).filter((t) => !t._dismissed);
}

test('identical toasts are refreshed instead of stacked', () => {
  const window = loadUiFeedback();
  const first = window.showToast('Location was not shared.', { type: 'error', duration: 60000 });
  for (let i = 0; i < 7; i++) window.showToast('Location was not shared.', { type: 'error', duration: 60000 });
  const live = liveToasts(window);
  assert.equal(live.length, 1);
  assert.equal(live[0], first);
  for (const t of live) window.dismissToast(t);
});

test('same text with a different type is a separate toast', () => {
  const window = loadUiFeedback();
  window.showToast('Saved', { type: 'success', duration: 60000 });
  window.showToast('Saved', { type: 'error', duration: 60000 });
  assert.equal(liveToasts(window).length, 2);
  for (const t of liveToasts(window)) window.dismissToast(t);
});

test('at most three toasts stay visible; the oldest is dismissed first', () => {
  const window = loadUiFeedback();
  const toasts = [];
  for (let i = 0; i < 5; i++) toasts.push(window.showToast('Message ' + i, { type: 'info', duration: 60000 }));
  const live = liveToasts(window);
  assert.equal(live.length, 3);
  assert.deepEqual(live.map((t) => t.textContent.includes('Message ')), [true, true, true]);
  assert.ok(toasts[0]._dismissed && toasts[1]._dismissed, 'two oldest dismissed');
  assert.equal(live[2], toasts[4]);
  for (const t of live) window.dismissToast(t);
});

test('toast message is rendered as text, not HTML', () => {
  const window = loadUiFeedback();
  const t = window.showToast('<img src=x onerror=alert(1)>', { type: 'info', duration: 60000 });
  assert.equal(t.querySelector('img'), null);
  window.dismissToast(t);
});
