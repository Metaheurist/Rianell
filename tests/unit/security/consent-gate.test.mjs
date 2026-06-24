import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import {
  getConsentBlockReason,
  isHealthLoggingUnlocked,
} from '../../../packages/shared/src/privacy/consentGate.mjs';

const ctx = { platform: 'pwa', tutorialSeenLegacy: false };

test('getConsentBlockReason blocks when region missing', () => {
  assert.equal(getConsentBlockReason({}, ctx), 'region-unconfigured');
  assert.equal(isHealthLoggingUnlocked({}, ctx), false);
});

test('getConsentBlockReason blocks EEA without health consent', () => {
  const prefs = { privacyRegion: 'eea_uk', healthDataConsent: false, tutorialSeen: true };
  assert.equal(getConsentBlockReason(prefs, ctx), 'missing-health-consent');
});

test('getConsentBlockReason allows non-EEA after region confirm', () => {
  const prefs = {
    privacyRegion: 'us_other',
    healthDataConsent: false,
    firstRunWizardCompletedAt: '2026-01-01T00:00:00.000Z',
  };
  assert.equal(getConsentBlockReason(prefs, ctx), null);
  assert.equal(isHealthLoggingUnlocked(prefs, ctx), true);
});

test('getConsentBlockReason blocks until first-run wizard completes', () => {
  const prefs = {
    privacyRegion: 'us_other',
    healthDataConsent: false,
  };
  assert.equal(getConsentBlockReason(prefs, ctx), 'first-run-incomplete');
});

test('PWA enforces consent beyond overlay CSS', () => {
  const gateJs = readFileSync('apps/pwa-webapp/privacy-region.js', 'utf8');
  assert.match(gateJs, /syncConsentEnforcement/);
  assert.match(gateJs, /requireUnlocked/);
  assert.match(gateJs, /startConsentEnforcement/);
  assert.match(gateJs, /onBlockedInteraction/);
  assert.match(gateJs, /isOnboardingInteractionTarget/);
  assert.match(gateJs, /readEnforcementPrefs/);
  assert.match(gateJs, /isFirstRunWizardActive/);
});

test('app.js guards health log writes behind consent', () => {
  const appJs = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(appJs, /requireHealthLoggingUnlocked/);
  assert.match(appJs, /saveLogsToStorage\(\) \{[\s\S]*requireHealthLoggingUnlocked\('save-logs'\)/);
  assert.match(appJs, /openLogWizardFromHome[\s\S]*requireHealthLoggingUnlocked/);
});
