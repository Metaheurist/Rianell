import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const indexHtml = fs.readFileSync(new URL('../../web/index.html', import.meta.url), 'utf8');
const appJs = fs.readFileSync(new URL('../../web/app.js', import.meta.url), 'utf8');

test('bug report modal remains wired in index markup', () => {
  assert.match(indexHtml, /id="bugReportModalOverlay"/);
  assert.match(indexHtml, /id="bugReportForm"/);
  assert.match(indexHtml, /id="bugReportSubmitButton"/);
  assert.match(indexHtml, /onclick="openBugReportModal\(\)"/);
});

test('settings theme choices expose all supported themes', () => {
  const expectedThemes = ['mint', 'red-black', 'mono', 'rainbow'];
  for (const theme of expectedThemes) {
    assert.match(indexHtml, new RegExp(`data-theme="${theme}"`));
  }
});

test('app runtime exposes key behavior hooks', () => {
  assert.match(appJs, /function setGlobalTheme\(theme\)/);
  assert.match(appJs, /function updateDashboardTitle\(\)/);
  assert.match(appJs, /function submitBugReport\(event\)/);
  assert.match(appJs, /function initVoiceInputControls\(\)/);
});
