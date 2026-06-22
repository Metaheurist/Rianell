import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFirstRunPlan,
  buildUnifiedOnboardingSteps,
  getTutorialVisibleIndices,
  resolveUnifiedOnboardingProgress,
} from '@rianell/shared';

const freshPwaPrefs = {
  privacyRegion: '',
  healthDataConsent: false,
  cookieConsent: false,
  trackingProfile: {},
  aiEnabled: true,
  aiModelDownloadConsent: 'deferred',
  tutorialSeen: false,
};

test('getTutorialVisibleIndices includes cycle slide and respects AI path', () => {
  assert.deepEqual(getTutorialVisibleIndices(true), [0, 1, 8, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(getTutorialVisibleIndices(false), [0, 1, 8, 5, 7]);
});

test('buildUnifiedOnboardingSteps expands tutorial into per-slide steps', () => {
  const ctx = { platform: 'pwa' };
  const plan = buildFirstRunPlan(freshPwaPrefs, ctx);
  const steps = buildUnifiedOnboardingSteps(freshPwaPrefs, ctx);
  const tutorialSlides = getTutorialVisibleIndices(true).length;
  const wizardSteps = plan.filter((s) => s.id !== 'tutorial').length;
  assert.equal(steps.length, wizardSteps + tutorialSlides);
  assert.ok(steps.some((s) => s.type === 'tutorial' && s.slideIndex === 8));
});

test('resolveUnifiedOnboardingProgress counts tutorial slides within full induction', () => {
  const ctx = { platform: 'pwa' };
  const prefs = {
    ...freshPwaPrefs,
    cookieConsent: true,
    sessionRecordingDisclosureAt: '2026-01-01T00:00:00.000Z',
  };
  const indices = getTutorialVisibleIndices(true);
  const total = buildUnifiedOnboardingSteps(prefs, ctx, { tutorialSlideIndices: indices }).length;

  const region = resolveUnifiedOnboardingProgress({
    prefs,
    ctx,
    wizardStepId: 'region',
    tutorialSlideIndices: indices,
  });
  assert.equal(region.current, 1);
  assert.equal(region.total, total);

  const tutorialMid = resolveUnifiedOnboardingProgress({
    prefs,
    ctx,
    wizardStepId: 'tutorial',
    tutorialPos: 2,
    tutorialSlideIndices: indices,
  });
  assert.equal(tutorialMid.current, 4);
  assert.equal(tutorialMid.total, total);

  const install = resolveUnifiedOnboardingProgress({
    prefs,
    ctx,
    wizardStepId: 'install',
    tutorialSlideIndices: indices,
  });
  assert.equal(install.current, total);
  assert.equal(install.total, total);
});
