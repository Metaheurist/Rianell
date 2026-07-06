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
  assert.match(gateJs, /#cssReloadOverlay/);
  assert.match(gateJs, /#rianellBootRecoveryOverlay/);
  assert.match(gateJs, /rianell-recovery-reload-btn/);
  assert.match(gateJs, /RianellGuidedOnboarding/);
  assert.match(gateJs, /composedPath/);
  assert.match(gateJs, /hidePrivacyGateOverlay/);
});

test('guided onboarding clears modal-active using shared overlay detector', () => {
  const guidedJs = readFileSync('apps/pwa-webapp/guided-onboarding.js', 'utf8');
  assert.match(guidedJs, /isAnyModalOverlayOpen/);
  assert.match(guidedJs, /bindChoiceButtons/);
  assert.match(guidedJs, /ensureI18nReady/);
  assert.match(guidedJs, /refreshLocaleUI/);
  assert.match(guidedJs, /hidePrivacyGateIfOpen/);
});

test('guided onboarding title is not static data-i18n (per-card titles)', () => {
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  assert.doesNotMatch(html, /id="guidedOnboardingTitle"[^>]*data-i18n/);
});

test('i18n refresh re-renders active guided onboarding', () => {
  const i18nJs = readFileSync('apps/pwa-webapp/i18n-pwa.js', 'utf8');
  assert.match(i18nJs, /RianellGuidedOnboarding\.refreshLocaleUI/);
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
  assert.match(guidedJs, /bindChoiceButtons/);
  assert.match(guidedJs, /\.guided-onboarding-choice/);
  assert.match(guidedJs, /function finishOnboarding[\s\S]*finally[\s\S]*closeWizard\(true\)/);
});

test('guided onboarding choice buttons bind directly (modal-content stops propagation)', () => {
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  assert.match(html, /guided-onboarding-content[^>]*stopPropagation/);
  const guidedJs = readFileSync('apps/pwa-webapp/guided-onboarding.js', 'utf8');
  assert.doesNotMatch(guidedJs, /bindOverlayInteractionsOnce/);
  assert.match(guidedJs, /querySelectorAll\('\.guided-onboarding-choice'\)/);
});

test('app.js wires onFirstRunWizardComplete after guided onboarding', () => {
  const appJs = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(appJs, /function onFirstRunWizardComplete/);
  assert.match(appJs, /window\.onFirstRunWizardComplete/);
  assert.match(appJs, /window\.appSettings && typeof saveSettings === 'function'/);
});

test('guided-onboarding.js replaces deprecated first-run-wizard shim', () => {
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  const onboarding = readFileSync('apps/pwa-webapp/guided-onboarding.js', 'utf8');
  assert.match(html, /guided-onboarding\.js/);
  assert.doesNotMatch(html, /first-run-wizard\.js/);
  assert.match(onboarding, /RianellGuidedOnboarding/);
});

test('index.html syncs system appearance before boot shell paints', () => {
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  assert.match(html, /function readAppearancePrefs/);
  assert.match(html, /function syncAppearanceDom/);
  assert.match(html, /window\.__rianellSyncAppearanceDom/);
  assert.match(html, /__rianellSyncAppearanceDom\(\)/);
  assert.doesNotMatch(html, /<html class="rianell-appearance-dark/);
});

test('app.js applies appearance sync and alert modal theme tokens', () => {
  const appJs = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(appJs, /__rianellSyncAppearanceDom/);
  assert.match(appJs, /alert-modal-message--html/);
  assert.match(appJs, /alert-modal-message--icon/);
});
