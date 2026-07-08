import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('home discovery renders rich prompt cards', () => {
  const js = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.ok(/home-discovery-section/.test(js));
  assert.ok(/home-discovery-pill-title/.test(js));
  assert.ok(/home-discovery-pill-hint/.test(js));
  assert.ok(/discover-mood/.test(js));
  assert.ok(/discover-goals/.test(js));
  assert.ok(/discover-ai/.test(js));
  assert.ok(/openAiHealthChat/.test(js));
  assert.ok(/scheduleDiscoveryOrbEnhancement/.test(js));
});

test('discovery icons are detailed stroke sprites in index.html', () => {
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  assert.ok(/id="icon-discover-mood"/.test(html));
  assert.ok(/id="icon-discover-goals"/.test(html));
  assert.ok(/id="icon-discover-ai"/.test(html));
  assert.ok(/id="icon-discover-orb"/.test(html));
});

test('home discovery shows for users with logs via data-aware cards', () => {
  const js = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.ok(/pickHomeAiSuggestionBundle/.test(js));
  assert.ok(!/if \(count !== 0\)[\s\S]{0,80}wrap\.hidden = true/.test(js));
});

test('home ai suggestions folded into discovery chat', () => {
  const js = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.ok(/renderHomeAiSuggestions[\s\S]*container\.hidden = true/.test(js));
  assert.ok(/openHomeQuestionModal[\s\S]*openAiHealthChat/.test(js));
});

test('discovery styles include AI presence and motion', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.ok(/home-discovery-orb-host/.test(css));
  assert.ok(/home-discovery-pill/.test(css));
  assert.ok(/home-discovery-card-icon-svg/.test(css));
  assert.ok(/shape-rendering:\s*geometricPrecision/.test(css));
  assert.ok(/homeDiscoveryShimmer/.test(css));
  assert.ok(/prefers-reduced-motion/.test(css));
  assert.ok(/ai-chat-panel/.test(css));
});

test('ai-chat module is loaded in index.html', () => {
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  assert.ok(/modules\/ai-chat\.js/.test(html));
});
