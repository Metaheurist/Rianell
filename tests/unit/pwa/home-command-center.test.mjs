import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
const js = readFileSync('apps/pwa-webapp/app.js', 'utf8');
const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');

test('home Phase 2 command grid and dashboard header exist', () => {
  assert.match(html, /id="homeDashboardHeader"/);
  assert.match(html, /id="homeCommandGrid"/);
  assert.match(html, /id="homeHeroCtaWrap"/);
  assert.match(html, /id="homeAskBar"/);
  assert.match(html, /id="homeAskInput"/);
  assert.match(html, /data-no-voice-input="true"/);
  assert.doesNotMatch(html, /id="homeAskSend"/);
  assert.doesNotMatch(html, /class="home-ask-send"/);
  assert.match(html, /home-daily-action-hero/);
  assert.match(html, /goals-progress-block--bento/);
});

test('MOTD/EKG title container is hidden for Phase 2 declutter', () => {
  assert.match(html, /title-container"[^>]*hidden/);
  assert.match(css, /\.title-container\[hidden\]|body \.title-container[\s\S]*display:\s*none/);
});

test('home hero CTA and sync chip helpers preserve openLogWizardFromHome', () => {
  assert.match(js, /function renderHomeHeroCta/);
  assert.match(js, /function updateHomeSyncChip/);
  assert.match(js, /function bindHomeAskBarOnce/);
  assert.match(js, /openLogWizardFromHome/);
  assert.match(js, /homeCommandGrid/);
  assert.match(js, /goals-bento-grid/);
});

test('goals bento CSS is flat single-layer 2x2 grid', () => {
  assert.match(css, /\.home-command-grid/);
  assert.match(css, /\.goals-bento-grid/);
  assert.match(css, /minmax\(0,\s*5fr\)\s+minmax\(0,\s*7fr\)/);
  assert.match(css, /\.home-daily-action-cta/);
  assert.match(css, /\.home-ask-bar/);
});
