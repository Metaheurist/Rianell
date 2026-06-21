import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFirstRunPlan,
  isFirstRunWizardComplete,
  migrateFirstRunWizardPrefs,
  completeFirstRunWizard,
  shouldSkipFirstRunStep,
} from '@rianell/shared';

const basePrefs = {
  privacyRegion: '',
  healthDataConsent: false,
  cookieConsent: false,
  trackingProfile: {},
  aiEnabled: true,
  aiModelDownloadConsent: 'deferred',
  tutorialSeen: false,
};

test('buildFirstRunPlan includes core steps for fresh PWA user', () => {
  const plan = buildFirstRunPlan(basePrefs, { platform: 'pwa' });
  const ids = plan.map((s) => s.id);
  assert.ok(ids.includes('region'));
  assert.ok(ids.includes('sessionRecording'));
  assert.ok(ids.includes('tutorial'));
  assert.ok(ids.includes('install'));
  assert.equal(ids.includes('healthConsent'), false);
  assert.equal(ids.includes('trackingProfile'), false);
});

test('trackingProfile step skipped during first-run wizard', () => {
  assert.equal(shouldSkipFirstRunStep('trackingProfile', basePrefs, { platform: 'pwa' }), true);
  assert.equal(shouldSkipFirstRunStep('trackingProfile', basePrefs, { platform: 'rn' }), true);
});

test('healthConsent step appears for eea_uk region', () => {
  const plan = buildFirstRunPlan(
    { ...basePrefs, privacyRegion: 'eea_uk' },
    { platform: 'rn' },
  );
  assert.ok(plan.some((s) => s.id === 'healthConsent'));
});

test('aiDownload skipped when AI disabled', () => {
  assert.equal(
    shouldSkipFirstRunStep('aiDownload', { ...basePrefs, aiEnabled: false }, { platform: 'rn' }),
    true,
  );
});

test('install step skipped on RN', () => {
  assert.equal(shouldSkipFirstRunStep('install', basePrefs, { platform: 'rn' }), true);
});

test('isFirstRunWizardComplete respects firstRunWizardCompletedAt', () => {
  assert.equal(
    isFirstRunWizardComplete({ ...basePrefs, firstRunWizardCompletedAt: '2026-01-01T00:00:00.000Z' }),
    true,
  );
});

test('legacy migration when region and tutorial already done', () => {
  const prefs = {
    ...basePrefs,
    privacyRegion: 'eea_uk',
    tutorialSeen: true,
  };
  assert.equal(isFirstRunWizardComplete(prefs, { platform: 'rn' }), true);
  const migrated = migrateFirstRunWizardPrefs(prefs, { platform: 'rn' });
  assert.ok(migrated.firstRunWizardCompletedAt);
});

test('completeFirstRunWizard sets flags', () => {
  const next = completeFirstRunWizard(basePrefs);
  assert.ok(next.firstRunWizardCompletedAt);
  assert.equal(next.tutorialSeen, true);
  assert.ok(next.trackingProfile && typeof next.trackingProfile === 'object');
  assert.ok(next.trackingProfile.configuredAt);
});

test('sessionRecording step included for fresh user when feature enabled for region', () => {
  assert.equal(shouldSkipFirstRunStep('sessionRecording', basePrefs, { platform: 'pwa' }), false);
  const plan = buildFirstRunPlan(basePrefs, { platform: 'rn' });
  assert.ok(plan.some((s) => s.id === 'sessionRecording'));
});
