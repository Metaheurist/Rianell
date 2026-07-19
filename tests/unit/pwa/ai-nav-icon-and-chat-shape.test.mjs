import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');

/** Collect the `d="..."` path data from a symbol markup blob. */
function pathData(markup) {
  return (markup.match(/\sd="([^"]+)"/g) || []).map((m) => m.replace(/^\sd="/, '').replace(/"$/, ''));
}

test('AI nav brain icon reuses the #icon-brain logo (same as the "insights on their way" empty state)', () => {
  const navSymbol = html.match(/<symbol id="rianell-nav-ai"[\s\S]*?<\/symbol>/);
  const brainSymbol = html.match(/<symbol id="icon-brain"[\s\S]*?<\/symbol>/);
  assert.ok(navSymbol, 'rianell-nav-ai symbol should exist');
  assert.ok(brainSymbol, 'icon-brain symbol should exist');
  const navD = pathData(navSymbol[0]);
  const brainD = pathData(brainSymbol[0]);
  // Every path in the empty-state brain logo (two hemispheres + fold ticks)
  // is present in the nav AI icon, so the two render as the same logo.
  for (const d of brainD) {
    assert.ok(navD.includes(d), `nav AI icon should reuse #icon-brain path: ${d}`);
  }
  // Rendered as an outline (matching the empty-state look), not a solid fill.
  assert.match(navSymbol[0], /fill="none"/);
});

test('AI nav brain icon keeps the animatable fold group', () => {
  const symbol = html.match(/<symbol id="rianell-nav-ai"[\s\S]*?<\/symbol>/)[0];
  // Fold group class drives the navIconAiBrainFold animation.
  assert.match(symbol, /class="nav-icon-ai-brain-fold"/);
  // The four gyrus fold ticks from #icon-brain live inside the fold group.
  assert.match(symbol, /M10 9H7\.5M14 9h2\.5M10 14H7\.5M14 14h2\.5/);
});

test('ai-chat panel rounds all four corners', () => {
  const block = css.match(/\.ai-chat-panel\s*\{\s*display:\s*flex[^}]*\}/);
  assert.ok(block, '.ai-chat-panel layout rule should exist');
  // No longer a bottom-flat sheet ("... 0 0"); uses a single uniform radius.
  assert.doesNotMatch(block[0], /border-radius:[^;]*\)\s+0\s+0/);
  assert.match(block[0], /border-radius:\s*var\(--radius-lg[^;]*\);/);
});
