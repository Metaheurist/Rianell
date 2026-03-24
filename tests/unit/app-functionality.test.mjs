import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const indexHtml = fs.readFileSync(new URL('../../web/index.html', import.meta.url), 'utf8');
const appJs = fs.readFileSync(new URL('../../web/app.js', import.meta.url), 'utf8');
const stylesCss = fs.readFileSync(new URL('../../web/styles.css', import.meta.url), 'utf8');

function extractFunctionBlock(source, functionName) {
  const start = source.indexOf(`function ${functionName}(`);
  assert.notEqual(start, -1, `function ${functionName} should exist`);
  const openBrace = source.indexOf('{', start);
  assert.notEqual(openBrace, -1, `function ${functionName} should have a body`);
  let depth = 0;
  for (let i = openBrace; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  assert.fail(`function ${functionName} block did not terminate`);
}

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

test('setGlobalTheme applies in-place without forcing reload', () => {
  const fn = extractFunctionBlock(appJs, 'setGlobalTheme');
  assert.match(fn, /saveSettings\(\)/);
  assert.match(fn, /applyGlobalTheme\(\)/);
  assert.match(fn, /loadSettingsState\(\)/);
  assert.doesNotMatch(fn, /window\.location\.reload\(/);
});

test('dashboard title logic keeps MOTD scoped to home tab', () => {
  assert.match(appJs, /if \(activeTab !== 'home'\) return;/);
  assert.match(appJs, /titleElement\.textContent = 'Rianell';/);
});

test('voice input permission gate exists before speech flow', () => {
  assert.match(appJs, /async function ensureVoiceInputPermission\(\)/);
  assert.match(appJs, /showVoiceInputPermissionHelp\(\)/);
  assert.match(appJs, /var hasPermission = await ensureVoiceInputPermission\(\);/);
});

test('settings hint text reflects instant background theme apply', () => {
  assert.match(indexHtml, /Selecting a theme applies it instantly across the app in the background\./);
});

test('voice icon alignment and settings icon rail mobile contract stays intact', () => {
  assert.match(stylesCss, /textarea \+ \.voice-input-btn\s*\{\s*top:\s*50%;\s*transform:\s*translateY\(-50%\);/s);
  assert.match(stylesCss, /\.settings-carousel-dots\s*\{[\s\S]*flex-wrap:\s*nowrap;[\s\S]*overflow-x:\s*auto;/);
});
