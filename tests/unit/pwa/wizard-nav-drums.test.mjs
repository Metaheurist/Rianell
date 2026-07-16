import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
const app = readFileSync('apps/pwa-webapp/app.js', 'utf8');
const drum = readFileSync('apps/pwa-webapp/modules/drum-picker-scroll.js', 'utf8');
const metrics = readFileSync('apps/pwa-webapp/modules/log-metric-widgets.js', 'utf8');
const graphics = readFileSync('apps/pwa-webapp/modules/graphics-portfolio.js', 'utf8');
const advanced = readFileSync('apps/pwa-webapp/modules/advanced-vitals-widgets.js', 'utf8');
const lifestyle = readFileSync('apps/pwa-webapp/modules/lifestyle-vitals-widgets.js', 'utf8');

test('desktop wizard shows side nav and hides chunky bottom nav row', () => {
  assert.match(css, /\.log-wizard-nav-row--desktop\s*\{\s*display:\s*none\s*!important/);
  assert.match(css, /\.log-wizard-side-nav\s*\{[\s\S]*?display:\s*flex/);
  assert.doesNotMatch(
    css,
    /@media \(min-width:\s*769px\)\s*\{\s*\.log-wizard-side-nav\s*\{\s*display:\s*none\s*!important/
  );
});

test('log wizard bottom dock does not block side navigation clicks', () => {
  assert.match(css, /\.log-wizard-bottom-dock\s*\{[\s\S]*?pointer-events:\s*none/);
  assert.match(css, /\.log-wizard-bottom-dock button,\s*[\s\S]*?\.log-wizard-bottom-dock \.log-wizard-step-dot\s*\{[\s\S]*?pointer-events:\s*auto/);
});

test('side Next saves on review step', () => {
  assert.match(app, /data-nav-mode',\s*onReviewStep \? 'save' : 'next'/);
  assert.match(app, /logWizardSaveBtn[\s\S]*\.click\(\)/);
});

test('drum picker maps horizontal drag and arrow keys to scroll', () => {
  assert.match(drum, /axis === 'h'/);
  assert.match(drum, /ArrowLeft/);
  assert.match(drum, /ArrowRight/);
  assert.match(drum, /shiftKey/);
  assert.match(drum, /prefers-reduced-motion:\s*reduce/);
  assert.match(drum, /Snap without bounce when reduced motion/);
});

test('log-metric widgets keep range input sync via compact drums', () => {
  assert.match(metrics, /function syncMetricDrumFromSlider/);
  assert.match(metrics, /slider\.dispatchEvent\(new Event\('input'/);
  assert.match(metrics, /RianellDrumPicker\.bind/);
  assert.doesNotMatch(metrics, /SegmentedScaleInput|mountSegmented/);
});

test('metric widgets use compact drums synced to hidden range inputs', () => {
  assert.match(metrics, /function bindMetricDrum/);
  assert.match(metrics, /metric-drum-shell/);
  assert.match(metrics, /visually-hidden/);
});

test('advanced and lifestyle vitals use drum mounts', () => {
  assert.match(html, /id="glucoseDrum"/);
  assert.match(html, /id="hrvDrum"/);
  assert.match(html, /id="bodyWeightDrum"/);
  assert.match(html, /id="stepsDrum"/);
  assert.match(html, /id="hydrationDrum"/);
  assert.match(advanced, /glucoseDrum/);
  assert.match(lifestyle, /stepsDrum/);
  assert.doesNotMatch(html, /id="glucoseSlider"/);
  assert.doesNotMatch(html, /id="stepsSlider"/);
});

test('discovery pill icon stroke is thinned', () => {
  assert.match(css, /\.home-discovery-pill-icon \.home-discovery-card-icon-svg[\s\S]*?--ui-icon-stroke:\s*1\.4/);
});

test('active chart view toggle forces white SVG icon', () => {
  assert.match(css, /\.view-toggle-btn\.active \.ui-svg-icon[\s\S]*?--ui-icon-color:\s*#fff/);
});

test('overview monitor symbol is a thin simple outline', () => {
  assert.match(html, /id="icon-overview-monitor"/);
  assert.doesNotMatch(html, /overviewMonitorScreenClip|overview-monitor-page|overview-monitor-scrollbar/);
  assert.match(css, /\.ai-chapter--overview \.ai-chapter-header \.ai-inline-icon[\s\S]*?--ui-icon-stroke:\s*1\.4/);
});

test('home weather strip is header sibling; date stays under greeting', () => {
  assert.match(html, /home-dashboard-header__aside/);
  const asideIdx = html.indexOf('home-dashboard-header__aside');
  const weatherIdx = html.indexOf('id="homeWeatherStrip"');
  const dateIdx = html.indexOf('id="homeTodayDate"');
  assert.ok(dateIdx > 0 && weatherIdx > dateIdx);
  assert.ok(weatherIdx > asideIdx);
  assert.match(css, /\.home-dashboard-header__aside/);
});

test('named avatars inline paths without use or role=img', () => {
  const fn = graphics.slice(graphics.indexOf('function renderAvatarSvgUse'), graphics.indexOf('function avatarCarouselNavIcon'));
  assert.match(fn, /avatarSymbolPathsForId\(iconRef\)/);
  assert.doesNotMatch(fn, /<use href="#icon-/);
  assert.doesNotMatch(graphics, /graphics-achievement-icon__svg" viewBox="0 0 64 64" role="img"/);
});
