import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');

test('settings overlay uses flex centering without 100vw fixed offset', () => {
  assert.match(css, /\.settings-overlay\.settings-overlay--visible\s*\{[^}]*display:\s*flex\s*!important/s);
  assert.match(css, /\.settings-overlay\s*\{[^}]*justify-content:\s*center/s);
  assert.match(css, /\.settings-overlay\s*\{[^}]*align-items:\s*center/s);
  assert.match(css, /\.settings-menu\s*\{[^}]*position:\s*relative\s*!important/s);
  assert.match(css, /\.settings-overlay\.settings-overlay--open\s+\.settings-menu\s*\{[^}]*transform:\s*none/s);
  assert.doesNotMatch(css, /\.settings-overlay\s*\{[^}]*width:\s*100vw\s*!important/s);
  assert.doesNotMatch(css, /\.settings-overlay\.settings-overlay--open\s+\.settings-menu\s*\{[^}]*translate\(-50%,\s*-50%\)/s);
});
