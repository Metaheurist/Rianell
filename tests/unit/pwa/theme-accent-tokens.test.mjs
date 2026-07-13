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

test('light mode Red/Black remaps ink, chrome, and page background away from mint', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /body\.light-mode\.theme-red-black/);
  const redLight = css.match(/body\.light-mode\.theme-red-black\s*\{[\s\S]*?\n\}/);
  assert.ok(redLight, 'red-black light block');
  assert.match(redLight[0], /--background-light:\s*linear-gradient\([\s\S]*#ffe7ea/);
  assert.match(redLight[0], /--text-light-rgb:\s*58,\s*10,\s*15/);
  assert.match(redLight[0], /--primary-color:\s*#c62828/);
  assert.match(redLight[0], /--btn-chrome-border:\s*color-mix/);
  assert.match(redLight[0], /--shell-bg:\s*#fff5f6/);
  assert.match(redLight[0], /--avatar-primary:\s*var\(--primary-color\)/);
  assert.doesNotMatch(redLight[0], /#163a23|#0a3d18|#a8e6cf|#1b5e20/);
  assert.match(css, /body\.light-mode \.settings-header[\s\S]*var\(--surface-header-tint\)/);
});

test('light mode Mono remaps chrome and semantic greens to greyscale', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  const monoLight = css.match(/body\.light-mode\.theme-mono\s*\{[\s\S]*?\n\}/);
  assert.ok(monoLight, 'mono light block');
  assert.match(monoLight[0], /--background-light:\s*linear-gradient\([\s\S]*#ffffff/);
  assert.match(monoLight[0], /--text-dark:\s*#151515/);
  assert.match(monoLight[0], /--primary-color:\s*#212121/);
  assert.match(monoLight[0], /--ai-status-optimal:\s*#616161/);
  assert.match(monoLight[0], /--color-success:\s*#424242/);
  assert.match(monoLight[0], /--avatar-primary:\s*var\(--primary-color\)/);
  assert.doesNotMatch(monoLight[0], /#1b5e20|#7bdf8c|#a8e6cf|#163a23/);
});

test('light mode chrome hardcodes use theme ink tokens instead of mint hex', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /body\.light-mode \.tab-btn\.active[\s\S]*?color:\s*var\(--text-dark\)/);
  assert.match(css, /body\.light-mode \.log-metrics-grid \.metric-value[\s\S]*?color:\s*var\(--text-dark\)/);
  assert.match(css, /body\.light-mode \{\s*--text-muted:\s*rgba\(var\(--text-light-rgb\)/);
  assert.match(css, /body\.light-mode \.checkin-slider-stop-label[\s\S]*?var\(--light-ink-deep\)/);
  assert.doesNotMatch(css, /body\.light-mode \.tab-btn\.active[\s\S]*?color:\s*#1b5e20/);
});

test('app.js chart theme helpers read theme ink tokens', () => {
  const appJs = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(appJs, /function getThemeInkColor/);
  assert.match(appJs, /getThemeInkColor\('#151515'\)/);
  assert.doesNotMatch(appJs, /text: light \? '#1b5e20'/);
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
