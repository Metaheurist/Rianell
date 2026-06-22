import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('styles.css defines theme-aware accent token family', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /--accent-primary:\s*var\(--primary-color\)/);
  assert.match(css, /--accent-soft:/);
  assert.match(css, /--accent-border-solid:/);
  assert.match(css, /body\.theme-red-black[\s\S]*--ui-icon-color:\s*var\(--primary-color\)/);
});

test('styles.css avoids hardcoded Material green literals in component rules', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.doesNotMatch(css, /#4caf50/i);
  assert.doesNotMatch(css, /rgba\(76,\s*175,\s*80/);
});

test('app.js theme helpers read from document.body and refresh on theme change', () => {
  const appJs = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(appJs, /document\.body \|\| document\.documentElement/);
  assert.match(appJs, /function getThemePrimaryColor/);
  assert.match(appJs, /function colorToRgba/);
  assert.match(appJs, /borderColor: color/);
  assert.match(appJs, /getElementById\('aiResultsContent'\)/);
});
