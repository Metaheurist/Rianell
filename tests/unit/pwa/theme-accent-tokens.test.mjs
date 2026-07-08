import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('styles.css defines theme-aware accent token family', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /--accent-primary:\s*var\(--primary-color\)/);
  assert.match(css, /--accent-soft:/);
  assert.match(css, /--accent-border-solid:/);
  assert.match(css, /body\.theme-red-black[\s\S]*--ui-icon-color:\s*var\(--primary-color\)/);
});

test('styles.css avoids hardcoded Material green literals in component rules', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.doesNotMatch(css, /#4caf50/i);
  assert.doesNotMatch(css, /rgba\(76,\s*175,\s*80/);
});

test('styles.css tokenises shell shade, toggles, and optional weather prompt', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /--shell-shade-spot-a:/);
  assert.match(css, /--toggle-active-shadow:/);
  assert.match(css, /--home-weather-prompt-border:/);
  assert.match(css, /body::before[\s\S]*var\(--shell-shade-spot-a\)/);
  assert.match(css, /\.toggle-switch\.active[\s\S]*var\(--toggle-active-shadow\)/);
  assert.match(css, /\.home-weather-enable-prompt[\s\S]*var\(--home-weather-prompt-border\)/);
  assert.match(css, /@keyframes homeWeatherPromptRadiate/);
  assert.match(css, /@keyframes homeWeatherPromptBeacon/);
  assert.match(css, /\.home-weather-enable-prompt::before[\s\S]*homeWeatherPromptRadiate/);
  assert.match(css, /\.home-weather-enable-prompt[\s\S]*aspect-ratio:\s*1/);
  assert.doesNotMatch(css, /\.home-weather-enable-prompt__label/);
  const shellShadeBlock = css.match(/body::before\s*\{[\s\S]*?\}/);
  assert.ok(shellShadeBlock, 'body::before block should exist');
  assert.doesNotMatch(shellShadeBlock[0], /rgba\(123,\s*223,\s*140/);
  assert.match(css, /body\.theme-red-black[\s\S]*--shell-bg:/);
});

test('app.js theme helpers read from document.body and refresh on theme change', () => {
  const appJs = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(appJs, /document\.body \|\| document\.documentElement/);
  assert.match(appJs, /function getThemePrimaryColor/);
  assert.match(appJs, /function colorToRgba/);
  assert.match(appJs, /borderColor: color/);
  assert.match(appJs, /getElementById\('aiResultsContent'\)/);
  assert.match(appJs, /function renderHomeWeatherEnablePromptHtml/);
  assert.doesNotMatch(appJs, /home-weather-enable-prompt__label/);
  assert.match(appJs, /home\.weather\.enable/);
});

test('styles.css tokenises light-mode text and card surfaces', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /--text-light-rgb:/);
  assert.match(css, /--neutral-card-rgb:/);
  assert.match(css, /body\.light-mode[\s\S]*--text-light-rgb:\s*22,\s*58,\s*35/);
  assert.match(css, /body\.light-mode[\s\S]*--ui-icon-color:/);
  assert.doesNotMatch(css, /color:\s*#e0f2f1/i);
  assert.match(css, /rgba\(var\(--text-light-rgb\)/);
});

test('styles.css tokenises tutorial footer CTA buttons', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /--tutorial-cta-finish-bg:/);
  assert.match(css, /--tutorial-cta-signup-bg:/);
  assert.match(css, /--tutorial-cta-demo-bg:/);
  assert.match(css, /\.tutorial-btn\.tutorial-finish[\s\S]*var\(--tutorial-cta-finish-bg\)/);
  assert.match(css, /\.tutorial-btn\.tutorial-signup[\s\S]*var\(--tutorial-cta-signup-bg\)/);
  assert.match(css, /\.tutorial-btn\.tutorial-demo[\s\S]*var\(--tutorial-cta-demo-bg\)/);
  const tutorialBlock = css.match(/\.tutorial-btn\.tutorial-finish[\s\S]*?\.tutorial-ai-choice-buttons \.tutorial-ai-skip[\s\S]*?\}/);
  assert.ok(tutorialBlock, 'tutorial button block should exist');
  assert.doesNotMatch(tutorialBlock[0], /rgba\(33,\s*150,\s*243/);
  assert.doesNotMatch(tutorialBlock[0], /rgba\(156,\s*39,\s*176/);
});

test('styles.css tokenises irritability face metric animation', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /\.metric-svg--irritability[\s\S]*--metric-color/);
  assert.match(css, /\.metric-irrit-face-top[\s\S]*color-mix\(in srgb, var\(--metric-color/);
  assert.match(css, /@keyframes metricIrritEscape[\s\S]*transform: translate/);
  assert.match(
    css,
    /\.metric-widget--irritability\[data-metric-active="true"\]\.metric-widget--irrit-storm \.metric-irrit-cloud-main/,
  );
  assert.match(css, /\.metric-widget--irritability\[data-metric-active="true"\] \.metric-irrit-escape-burst--on/);
});
