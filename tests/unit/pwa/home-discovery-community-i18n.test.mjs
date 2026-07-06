import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const APP_JS = 'apps/pwa-webapp/app.js';
const AI_CHAT_JS = 'apps/pwa-webapp/modules/ai-chat.js';
const LOCALE_DIR = 'i18n-packs/locale-packs/v1';

test('closeHomeDiscoveryModal noop self-reassign is removed from app.js', () => {
  const js = readFileSync(APP_JS, 'utf8');
  assert.doesNotMatch(js, /function closeHomeDiscoveryModal/);
  assert.doesNotMatch(js, /closeHomeDiscoveryModal\s*=\s*function\s*\(\s*\)\s*\{\s*\}/);
  assert.doesNotMatch(js, /window\.closeHomeDiscoveryModal/);
});

test('renderCommunityTipsPane is awaited inside updateHomeTodayPanel', () => {
  const js = readFileSync(APP_JS, 'utf8');
  const panelMatch = js.match(/async function updateHomeTodayPanel\(\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(panelMatch, 'updateHomeTodayPanel should be async');
  const body = panelMatch[1];
  const tipLines = body.split('\n').filter((line) => line.includes('renderCommunityTipsPane('));
  assert.equal(tipLines.length, 1, 'expected exactly one renderCommunityTipsPane call');
  assert.match(tipLines[0], /await\s+renderCommunityTipsPane\(/, `unawaited call: ${tipLines[0].trim()}`);
});

test('refreshAllTabsForLocaleChange does not call renderCommunityTipsPane without await', () => {
  const js = readFileSync(APP_JS, 'utf8');
  const refreshMatch = js.match(/async function refreshAllTabsForLocaleChange\(\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(refreshMatch, 'refreshAllTabsForLocaleChange should be async');
  const body = refreshMatch[1];
  assert.doesNotMatch(body, /renderCommunityTipsPane\(/);
  assert.match(body, /await updateHomeTodayPanel\(\)/);
});

test('home.chat.inputLabel exists in every locale pack', () => {
  const locales = readdirSync(LOCALE_DIR).filter((f) => f.endsWith('.json'));
  assert.ok(locales.length >= 14, 'expected at least 14 locale packs');
  for (const file of locales) {
    const raw = readFileSync(join(LOCALE_DIR, file), 'utf8');
    const pack = JSON.parse(raw);
    const label = pack?.strings?.['home.chat.inputLabel'];
    assert.ok(label && typeof label === 'string' && label.trim().length > 0, `${file} missing home.chat.inputLabel`);
  }
});

test('ai-chat uses home.chat.inputLabel for accessible input label', () => {
  const js = readFileSync(AI_CHAT_JS, 'utf8');
  assert.match(js, /home\.chat\.inputLabel/);
  assert.match(js, /label\.textContent/);
});
