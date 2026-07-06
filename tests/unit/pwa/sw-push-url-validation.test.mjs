import { readFileSync, existsSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('service worker validates push notification URLs are same-origin', () => {
  const sw = readFileSync('apps/pwa-webapp/sw.js', 'utf8');
  assert.match(sw, /function resolveSameOriginPushUrl/);
  assert.match(sw, /resolved\.origin !== base/);
  assert.match(sw, /resolveSameOriginPushUrl\(payload\.url/);
  assert.match(sw, /resolveSameOriginPushUrl\(data\.url/);
});

test('dead code files removed from PWA tree', () => {
  const removed = [
    'apps/pwa-webapp/print-styles.css',
    'apps/pwa-webapp/model-chunk-loader.js',
    'apps/pwa-webapp/first-run-wizard.js',
  ];
  for (const file of removed) {
    assert.equal(existsSync(file), false, `expected removed: ${file}`);
  }
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  assert.doesNotMatch(html, /first-run-wizard\.js/);
  assert.doesNotMatch(html, /model-chunk-loader\.js/);
  assert.doesNotMatch(html, /print-styles\.css/);
});

test('share modal extracted to modules/share-modal.js', () => {
  const mod = readFileSync('apps/pwa-webapp/modules/share-modal.js', 'utf8');
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  const app = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(mod, /global\.openShareModal = openShareModal/);
  assert.match(mod, /bodyHTML must be static or built with escapeHTML/);
  assert.match(html, /modules\/share-modal\.js/);
  assert.doesNotMatch(app, /let _shareModalEscapeHandler/);
  assert.doesNotMatch(app, /function openShareModal\(options\)/);
});
