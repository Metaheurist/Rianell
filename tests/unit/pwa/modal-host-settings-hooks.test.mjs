import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const modalHostUrl = pathToFileURL(path.join(root, 'apps/pwa-webapp/modules/app/modal-host.js')).href;

const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;

const { registerSettingsModalHooks, closeSettingsModalIfOpen } = await import(modalHostUrl);

function mountSettingsOverlay(open) {
  document.body.innerHTML =
    '<div id="settingsOverlay" class="' + (open ? 'settings-overlay--open' : '') + '">' +
    '<div class="settings-content"></div></div>';
  return document.getElementById('settingsOverlay');
}

beforeEach(() => {
  registerSettingsModalHooks({ captureCarouselState: null, overlaySetOpen: null, toggleSettings: null });
});

test('closeSettingsModalIfOpen does nothing when the settings overlay is closed', () => {
  mountSettingsOverlay(false);
  const calls = [];
  registerSettingsModalHooks({ overlaySetOpen: () => calls.push('setOpen') });
  closeSettingsModalIfOpen();
  assert.deepEqual(calls, []);
});

test('registered carousel capture and overlay close hooks are used', () => {
  const overlay = mountSettingsOverlay(true);
  const calls = [];
  registerSettingsModalHooks({
    captureCarouselState: (el) => calls.push(['capture', el === overlay]),
    overlaySetOpen: (el, open) => calls.push(['setOpen', el === overlay, open]),
  });
  closeSettingsModalIfOpen();
  assert.deepEqual(calls, [['capture', true], ['setOpen', true, false]]);
});

test('toggleSettings hook takes precedence over overlaySetOpen', () => {
  mountSettingsOverlay(true);
  const calls = [];
  registerSettingsModalHooks({
    toggleSettings: () => calls.push('toggle'),
    overlaySetOpen: () => calls.push('setOpen'),
  });
  closeSettingsModalIfOpen();
  assert.deepEqual(calls, ['toggle']);
});

test('without hooks the overlay is hidden directly', () => {
  const overlay = mountSettingsOverlay(true);
  document.body.classList.add('modal-active');
  closeSettingsModalIfOpen();
  assert.equal(overlay.style.display, 'none');
  assert.equal(document.body.classList.contains('modal-active'), false);
});
