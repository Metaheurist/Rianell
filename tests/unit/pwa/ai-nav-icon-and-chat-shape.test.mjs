import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');

test('AI nav brain icon has two separated hemispheres', () => {
  const symbol = html.match(/<symbol id="rianell-nav-ai"[\s\S]*?<\/symbol>/);
  assert.ok(symbol, 'rianell-nav-ai symbol should exist');
  const svg = symbol[0];
  // Hemispheres are pushed apart to leave a central gap.
  assert.match(svg, /nav-icon-ai-brain--left"[^>]*transform="translate\(-0\.7 0\)"/);
  assert.match(svg, /nav-icon-ai-brain--right"[^>]*transform="translate\(0\.7 0\)"/);
});

test('AI nav brain icon adds simplified fold lines', () => {
  const symbol = html.match(/<symbol id="rianell-nav-ai"[\s\S]*?<\/symbol>/)[0];
  assert.match(symbol, /class="nav-icon-ai-brain-fold"/);
  // Two gyrus fold strokes per hemisphere (4 total) inside the fold group.
  const foldPaths = symbol.match(/<path d="M[\d.]/g) || [];
  assert.ok(foldPaths.length >= 4, `expected >= 4 fold strokes, found ${foldPaths.length}`);
});

test('ai-chat panel rounds all four corners', () => {
  const block = css.match(/\.ai-chat-panel\s*\{\s*display:\s*flex[^}]*\}/);
  assert.ok(block, '.ai-chat-panel layout rule should exist');
  // No longer a bottom-flat sheet ("... 0 0"); uses a single uniform radius.
  assert.doesNotMatch(block[0], /border-radius:[^;]*\)\s+0\s+0/);
  assert.match(block[0], /border-radius:\s*var\(--radius-lg[^;]*\);/);
});
