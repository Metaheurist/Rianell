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

test('bp dial heart svg uses tall proportional viewBox and pulse group', () => {
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  assert.match(html, /class="bp-dial-heart-svg" viewBox="0 0 64 80"/);
  assert.match(html, /class="bp-dial-heart-pulse"/);
  assert.match(html, /class="bp-dial-ekg" pathLength="120"/);
  // Deeper cleft + pointed tip (classic heart) rather than stubby triangle
  assert.match(html, /class="bp-dial-heart"[^>]*d="M32 74/);
  assert.match(html, /C28\.2 6 31 11 32 19/);
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /\.bp-dial-heart-pulse[\s\S]*transform-origin: 32px 40px/);
  assert.match(css, /\.bp-dial-heart-svg[\s\S]*aspect-ratio: 4 \/ 5/);
});
