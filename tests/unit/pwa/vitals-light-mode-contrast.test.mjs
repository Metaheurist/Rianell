import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('styles.css boosts vital widget idle contrast in light mode', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /body\.light-mode \.hrv-wave-line/);
  assert.match(css, /body\.light-mode \.spo2-ring-track/);
  assert.match(css, /body\.light-mode \.weight-stand/);
  assert.match(css, /body\.light-mode \.glucose-droplet-outline/);
  assert.match(css, /\.vital-widget\[data-vital-active="false"\] \.hrv-wave-line/);
});
