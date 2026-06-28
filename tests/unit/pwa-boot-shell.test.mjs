import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('privacy-gate CSS hides app chrome only, not every body child', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /body\.privacy-gate-active #appShell/);
  assert.match(css, /body\.consent-locked #appShell/);
  assert.doesNotMatch(css, /body\.privacy-gate-active > \*:not\(#privacyRegionGateOverlay\)/);
});

test('index.html forces shell visible once loaded', () => {
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  assert.match(html, /body\.loaded #appShell/);
  assert.match(html, /body\.loaded #loadingOverlay\.hidden/);
  assert.match(html, /body\.loaded \.tab-content\.active/);
});

test('app.js clears privacy gate lock and logs boot phases', () => {
  const appJs = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(appJs, /function clearPrivacyGateShellLock/);
  assert.match(appJs, /function logBootState/);
  assert.match(appJs, /function ensureAppShellDomPlacement/);
  assert.match(appJs, /clearPrivacyGateShellLock\(\)/);
  assert.match(appJs, /logBootState\('revealAppShell:start'\)/);
  assert.match(appJs, /shellMisplaced/);
  assert.match(appJs, /__rianellBootLog/);
});

test('index.html keeps #appShell outside #settingsOverlay', () => {
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  const lines = html.split('\n');
  const stack = [];
  let appShellParent = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const openRe = /<div\b[^>]*>/gi;
    const closeRe = /<\/div>/gi;
    let m;
    while ((m = openRe.exec(line))) {
      const idMatch = m[0].match(/\bid="([^"]+)"/);
      stack.push(idMatch?.[1] || null);
      if (m[0].includes('id="appShell"')) {
        appShellParent = stack.length >= 2 ? stack[stack.length - 2] : null;
      }
    }
    while ((m = closeRe.exec(line))) stack.pop();
  }
  assert.notEqual(appShellParent, 'settingsOverlay');
  assert.equal(stack.length, 0, 'unclosed divs in index.html');
});

test('privacy-region.js logs gate transitions', () => {
  const gateJs = readFileSync('apps/pwa-webapp/privacy-region.js', 'utf8');
  assert.match(gateJs, /logGateState\('hidePrivacyGateOverlay'\)/);
  assert.match(gateJs, /logGateState\('unlockApp'\)/);
  assert.match(gateJs, /syncConsentEnforcement/);
});

test('privacy-region.js whitelists boot/onboarding overlays for interaction gate', () => {
  const gateJs = readFileSync('apps/pwa-webapp/privacy-region.js', 'utf8');
  assert.match(gateJs, /#aiModelDownloadOverlay/);
  assert.match(gateJs, /#aiModelDownloadProgressOverlay/);
  assert.match(gateJs, /#guidedOnboardingOverlay/);
  assert.match(gateJs, /RianellGuidedOnboarding/);
  assert.match(gateJs, /composedPath/);
  assert.match(gateJs, /hidePrivacyGateOverlay/);
});

test('guided onboarding clears modal-active using shared overlay detector', () => {
  const guidedJs = readFileSync('apps/pwa-webapp/guided-onboarding.js', 'utf8');
  assert.match(guidedJs, /isAnyModalOverlayOpen/);
  assert.match(guidedJs, /bindOverlayInteractionsOnce/);
  assert.match(guidedJs, /hidePrivacyGateIfOpen/);
});

test('app.js reveals shell before blocking AI preload on installed mobile PWA', () => {
  const appJs = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(appJs, /Reveal the shell before AI preload/);
  assert.match(appJs, /__rianellForceRevealBootShell/);
  assert.doesNotMatch(
    appJs,
    /revealAppShellWithLocale\(\);\s*schedulePostShellIdleWork\(true\);\s*\}\);\s*\}\s*else\s*\{\s*revealAppShellWithLocale/s
  );
});

test('ui-feedback.js exposes isAnyModalOverlayOpen helper', () => {
  const uiJs = readFileSync('apps/pwa-webapp/ui-feedback.js', 'utf8');
  assert.match(uiJs, /function isAnyModalOverlayOpen/);
  assert.match(uiJs, /global\.isAnyModalOverlayOpen/);
});

test('modal-active CSS allows pointer events on onboarding overlays', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /body\.modal-active \.guided-onboarding-overlay/);
  assert.match(css, /body\.modal-active \.first-run-wizard-overlay/);
  assert.match(css, /body\.modal-active \.ai-model-download-consent/);
});

test('probe-shell-visible script asserts guest shell after onboarding', () => {
  const probe = readFileSync('scripts/audit/probe-shell-visible.mjs', 'utf8');
  assert.match(probe, /shellVis === 'visible'/);
  assert.match(probe, /__rianellBootLog/);
  assert.match(probe, /#guidedOnboardingOverlay/);
  assert.match(probe, /guided-onboarding-active/);
});

test('guided onboarding advances cards with resolveNextGuidedCardIndex', () => {
  const guidedJs = readFileSync('apps/pwa-webapp/guided-onboarding.js', 'utf8');
  assert.match(guidedJs, /advanceAfterAnswer/);
  assert.match(guidedJs, /resolveNextGuidedCardIndex/);
  assert.match(guidedJs, /onFirstRunWizardComplete/);
});

test('app.js wires onFirstRunWizardComplete after guided onboarding', () => {
  const appJs = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(appJs, /function onFirstRunWizardComplete/);
  assert.match(appJs, /window\.onFirstRunWizardComplete/);
});

test('first-run-wizard.js is a deprecation shim for guided onboarding', () => {
  const shim = readFileSync('apps/pwa-webapp/first-run-wizard.js', 'utf8');
  assert.match(shim, /deprecated/i);
  assert.match(shim, /RianellGuidedOnboarding/);
  assert.match(shim, /RianellFirstRunWizard/);
  assert.doesNotMatch(shim, /buildUnifiedOnboardingSteps/);
});
