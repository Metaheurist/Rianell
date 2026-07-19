import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const chatJs = readFileSync('apps/pwa-webapp/modules/ai-chat.js', 'utf8');
const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');

const STARTER_KEYS = [
  'home.chat.starter.sleep',
  'home.chat.starter.mood',
  'home.chat.starter.patterns',
];

const LOCALE_FILES = [
  'i18n-packs/locale-packs/v1/en-GB.json',
  'apps/pwa-webapp/i18n-packs/locale-packs/v1/en-GB.json',
];

function loadStrings(file) {
  const pack = JSON.parse(readFileSync(file, 'utf8'));
  return pack && pack.strings ? pack.strings : pack;
}

function block(re, label) {
  const m = chatJs.match(re);
  assert.ok(m, `${label} should exist in ai-chat.js`);
  return m[0];
}

test('STARTERS model is icon-led and reuses the full-question prompt keys', () => {
  const model = block(/var STARTERS = \[[\s\S]*?\];/, 'STARTERS model');
  // Icon-led: whitelisted sprite names.
  assert.match(model, /icon: 'sleep'/);
  assert.match(model, /icon: 'discover-mood'/);
  assert.match(model, /icon: 'activity'/);
  // Short label keys + full-question prompt keys.
  for (const key of STARTER_KEYS) {
    assert.ok(chatJs.includes(key), `ai-chat.js should reference "${key}"`);
  }
  assert.match(model, /promptKey: 'home\.chat\.followup\.sleep'/);
  assert.match(model, /promptKey: 'home\.chat\.followup\.mood'/);
  assert.match(model, /promptKey: 'home\.chat\.followup\.patterns'/);
});

test('starter set is capped at 5 (ranking guidance)', () => {
  const items = block(/function starterItems\(\)\s*\{[\s\S]*?\r?\n  \}/, 'starterItems');
  assert.match(items, /\.slice\(0,\s*5\)/, 'starterItems must cap the set at 5');
});

test('renderStarters emits sprite icon markup + a short label span', () => {
  const render = block(/function renderStarters\(\)\s*\{[\s\S]*?\r?\n  \}/, 'renderStarters');
  assert.match(render, /svgIcon\(it\.icon, 'ai-chat-chip-icon'\)/, 'chips must render an svg sprite icon');
  assert.match(render, /ai-chat-chip-label/, 'chips must render a text label span');
  assert.match(render, /data-prompt="/, 'chips must carry the full prompt in data-prompt');
});

test('tapping a starter pre-fills the editable input and does NOT auto-send', () => {
  const render = block(/function renderStarters\(\)\s*\{[\s\S]*?\r?\n  \}/, 'renderStarters');
  // Pre-fills the input + focuses (caret at end), per NN/g "editable starting point".
  assert.match(render, /input\.value = prompt;/, 'starter click must set the input value');
  assert.match(render, /input\.focus\(\);/, 'starter click must focus the input');
  assert.match(render, /setSelectionRange/, 'starter click should move the caret to the end');
  // Crucially: the starter path must never submit for the user.
  assert.doesNotMatch(render, /submitUserMessage/, 'starter click must not auto-send');
});

test('first-run empty state shows starters instead of full-sentence followups', () => {
  const open = block(/function openAiHealthChat\(options\)\s*\{[\s\S]*?\r?\n  \}/, 'openAiHealthChat');
  // No-seed branch renders starters; the old contextualFollowups() empty-state call is gone.
  assert.match(open, /renderStarters\(\);/, 'openAiHealthChat must render starters on first run');
  assert.doesNotMatch(open, /renderFollowups\(contextualFollowups\(\)\)/, 'empty state must not use full-sentence followup pills');
});

test('en-GB packs define the starter labels (root + app mirror), no em dash', () => {
  for (const file of LOCALE_FILES) {
    const strings = loadStrings(file);
    for (const key of STARTER_KEYS) {
      assert.equal(typeof strings[key], 'string', `${file} should define "${key}"`);
      assert.ok(strings[key].length > 0, `${file} "${key}" must not be empty`);
      assert.doesNotMatch(strings[key], /\u2014/, `${file} "${key}" must not use an em dash`);
    }
  }
});

test('chips keep a >=44px tap target (WCAG target size) and a focus-visible ring', () => {
  const chip = css.match(/\r?\n\.ai-chat-followup-chip\s*\{[^}]*\}/);
  assert.ok(chip, '.ai-chat-followup-chip rule should exist');
  assert.match(chip[0], /min-height:\s*44px/, 'chip must keep a 44px tap target');
  assert.match(css, /\.ai-chat-followup-chip:focus-visible\s*\{/, 'chip must define a focus-visible ring');
});

test('desktop modal is enlarged while keeping all four rounded corners', () => {
  // Enlarged desktop width.
  assert.match(css, /width:\s*min\(42rem,\s*92vw\)/, 'desktop panel must be min(42rem, 92vw)');
  // Four-corner radius still asserted by the base panel rule.
  const base = css.match(/\.ai-chat-panel\s*\{\s*display:\s*flex[^}]*\}/);
  assert.ok(base, '.ai-chat-panel base rule should exist');
  assert.match(base[0], /border-radius:\s*var\(--radius-lg[^;]*\);/);
});
