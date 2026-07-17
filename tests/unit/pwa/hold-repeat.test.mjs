import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

function loadHoldRepeat(window) {
  const src = readFileSync('apps/pwa-webapp/modules/hold-repeat.js', 'utf8');
  vm.runInNewContext(src, {
    window,
    globalThis: window,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  });
  return window.RianellHoldRepeat;
}

function dispatchPointer(el, type, pointerId) {
  const ev = new el.ownerDocument.defaultView.Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'pointerId', { value: pointerId });
  Object.defineProperty(ev, 'button', { value: 0 });
  Object.defineProperty(ev, 'pointerType', { value: 'mouse' });
  el.dispatchEvent(ev);
}

test('hold-repeat module is loaded before drum/nudge widgets', () => {
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  const holdIdx = html.indexOf('modules/hold-repeat.js');
  const logIdx = html.indexOf('modules/log-metric-widgets.js');
  const bpIdx = html.indexOf('modules/bp-input-widget.js');
  assert.ok(holdIdx > 0, 'hold-repeat script present');
  assert.ok(holdIdx < logIdx, 'hold-repeat before log-metric-widgets');
  assert.ok(holdIdx < bpIdx, 'hold-repeat before bp-input-widget');
});

test('nudge widgets use RianellHoldRepeat.bindAll', () => {
  const files = [
    'apps/pwa-webapp/modules/bp-input-widget.js',
    'apps/pwa-webapp/modules/advanced-vitals-widgets.js',
    'apps/pwa-webapp/modules/lifestyle-vitals-widgets.js',
    'apps/pwa-webapp/modules/log-metric-widgets.js',
  ];
  for (const file of files) {
    const src = readFileSync(file, 'utf8');
    assert.match(src, /RianellHoldRepeat\.bindAll/, `${file} binds hold-repeat`);
  }
  const app = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(app, /RianellHoldRepeat\.bindAll/);
});

test('hold-repeat fires once then repeats while held', async () => {
  const dom = new JSDOM('<!doctype html><button id="nudge">+</button>');
  const { window } = dom;
  const Hold = loadHoldRepeat(window);
  const btn = window.document.getElementById('nudge');
  btn.setPointerCapture = function () {};
  btn.hasPointerCapture = function () { return false; };
  btn.releasePointerCapture = function () {};

  let count = 0;
  Hold.bind(btn, function () { count += 1; }, { delayMs: 40, intervalMs: 20 });

  dispatchPointer(btn, 'pointerdown', 1);
  assert.equal(count, 1, 'immediate tick');

  await new Promise((r) => setTimeout(r, 110));
  assert.ok(count >= 3, `expected repeats while held, got ${count}`);

  dispatchPointer(btn, 'pointerup', 1);
  const afterUp = count;
  await new Promise((r) => setTimeout(r, 60));
  assert.equal(count, afterUp, 'stops after pointerup');
});
