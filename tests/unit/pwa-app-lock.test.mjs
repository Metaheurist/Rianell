import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('app-lock shows overlay with visible opacity and resume listeners', () => {
  const js = readFileSync('apps/pwa-webapp/modules/app-lock.js', 'utf8');
  assert.match(js, /modal-overlay--open/);
  assert.match(js, /visibilitychange/);
  assert.match(js, /pageshow/);
  assert.match(js, /pagehide/);
  assert.match(js, /unlockedThisPage/);
  assert.match(js, /bindAppLock[\s\S]*showLockOverlay/);
});

test('app-lock overlay stacks above consent modals in CSS', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /\.app-lock-overlay[\s\S]*z-index:\s*100002/);
});
