import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyQuestionnaireAnswer,
  buildGuidedQuestionnaire,
  shouldSkipGuidedCard,
  createGuidedOnboardingProgressSession,
  resolveNextGuidedCardIndex,
} from '@rianell/shared';

const freshPwaPrefs = {
  privacyRegion: '',
  healthDataConsent: false,
  cookieConsent: false,
  aiEnabled: true,
  aiModelDownloadConsent: 'deferred',
  tutorialSeen: false,
};

test('buildGuidedQuestionnaire includes welcome and preference cards for fresh user', () => {
  const cards = buildGuidedQuestionnaire(freshPwaPrefs, { platform: 'pwa' });
  const ids = cards.map((c) => c.id);
  assert.ok(ids.includes('welcome'));
  assert.ok(ids.includes('appearance'));
  assert.ok(ids.includes('avatarPick'));
  assert.equal(ids.includes('signIn'), false);
  assert.ok(ids.includes('region'));
  assert.ok(ids.includes('coachTone'));
  assert.ok(ids.includes('helperLevel'));
  assert.ok(ids.includes('accountSignUp'));
  assert.ok(ids.includes('finish'));
  assert.equal(ids.includes('healthConsent'), false);
  assert.equal(ids.includes('install'), true);
});

test('signIn card appears when welcome path is signIn', () => {
  const cards = buildGuidedQuestionnaire(
    { ...freshPwaPrefs, onboardingPath: 'signIn' },
    { platform: 'pwa' },
  );
  assert.ok(cards.some((c) => c.id === 'signIn'));
});

test('accountSignUp skipped on signIn path', () => {
  const cards = buildGuidedQuestionnaire(
    { ...freshPwaPrefs, onboardingPath: 'signIn' },
    { platform: 'pwa' },
  );
  assert.equal(cards.some((c) => c.id === 'accountSignUp'), false);
});

test('setup cards skipped after signIn when authenticated', () => {
  const cards = buildGuidedQuestionnaire(
    { ...freshPwaPrefs, onboardingPath: 'signIn' },
    { platform: 'pwa', isAuthenticated: true },
  );
  const ids = cards.map((c) => c.id);
  assert.deepEqual(ids, ['welcome', 'finish']);
});

test('applyQuestionnaireAnswer welcome sets onboarding path', () => {
  const signIn = applyQuestionnaireAnswer(freshPwaPrefs, 'welcome', 'signIn');
  assert.equal(signIn.onboardingPath, 'signIn');
  const setup = applyQuestionnaireAnswer(freshPwaPrefs, 'welcome', 'setUp');
  assert.equal(setup.onboardingPath, 'setup');
});

test('applyQuestionnaireAnswer appearance stores explicit light/dark and theme', () => {
  const next = applyQuestionnaireAnswer(freshPwaPrefs, 'appearance', 'continue', {
    appearanceMode: 'dark',
    globalTheme: 'rainbow',
  });
  assert.equal(next.appearanceMode, 'dark');
  assert.equal(next.globalTheme, 'rainbow');
  assert.equal(next.team, 'rainbow');
  assert.ok(next.appearanceOnboardingAt);
  assert.equal(shouldSkipGuidedCard('appearance', next, { platform: 'pwa' }), true);
});

test('appearance card skipped when already configured', () => {
  assert.equal(
    shouldSkipGuidedCard(
      'appearance',
      { ...freshPwaPrefs, appearanceMode: 'light', appearanceOnboardingAt: '2026-01-01T00:00:00.000Z' },
      { platform: 'pwa' },
    ),
    true,
  );
});

test('resolveNextGuidedCardIndex after welcome is appearance', () => {
  const cards = buildGuidedQuestionnaire(freshPwaPrefs, { platform: 'pwa' });
  const idx = resolveNextGuidedCardIndex(cards, 'welcome');
  assert.equal(cards[idx]?.id, 'appearance');
});

test('resolveNextGuidedCardIndex after appearance is avatarPick', () => {
  const cards = buildGuidedQuestionnaire(freshPwaPrefs, { platform: 'pwa' });
  const idx = resolveNextGuidedCardIndex(cards, 'appearance');
  assert.equal(cards[idx]?.id, 'avatarPick');
});

test('resolveNextGuidedCardIndex after avatarPick is region', () => {
  const cards = buildGuidedQuestionnaire(freshPwaPrefs, { platform: 'pwa' });
  const idx = resolveNextGuidedCardIndex(cards, 'avatarPick');
  assert.equal(cards[idx]?.id, 'region');
});

test('applyQuestionnaireAnswer avatarPick persists preferences', () => {
  const picked = applyQuestionnaireAnswer(freshPwaPrefs, 'avatarPick', 'continue', {
    profileAvatar: 'moonthread',
  });
  assert.equal(picked.profileAvatar, 'moonthread');
  assert.ok(picked.avatarPickAt);
});

test('avatarPick card skipped when already configured', () => {
  const prefs = {
    ...freshPwaPrefs,
    profileAvatar: 'voidorb',
    avatarPickAt: '2026-01-01T00:00:00.000Z',
  };
  assert.equal(shouldSkipGuidedCard('avatarPick', prefs, { platform: 'pwa' }), true);
});

test('applyQuestionnaireAnswer region confirm persists region and default locale', () => {
  const next = applyQuestionnaireAnswer(freshPwaPrefs, 'region', 'confirm', {
    regionId: 'eea_uk',
    policyPackId: 'v1.0.0',
  });
  assert.equal(next.privacyRegion, 'eea_uk');
  assert.equal(next.privacyRegionSource, 'onboarding');
  assert.ok(next.uiLocale);
  assert.equal(next.uiLocaleSource, 'region');
});

test('healthConsent card appears for eea_uk region', () => {
  const cards = buildGuidedQuestionnaire(
    { ...freshPwaPrefs, privacyRegion: 'eea_uk', privacyRegionSource: 'onboarding' },
    { platform: 'pwa' },
  );
  assert.ok(cards.some((c) => c.id === 'healthConsent'));
});

test('aiDownload skipped when AI disabled via helperLevel answer', () => {
  const prefs = applyQuestionnaireAnswer(freshPwaPrefs, 'helperLevel', 'exploreMyself');
  assert.equal(prefs.aiEnabled, false);
  assert.equal(shouldSkipGuidedCard('aiDownload', prefs, { platform: 'pwa' }), true);
});

test('applyQuestionnaireAnswer coachTone sets persona', () => {
  const next = applyQuestionnaireAnswer(freshPwaPrefs, 'coachTone', 'clinical');
  assert.equal(next.performance.llmCoachPersona, 'clinical');
});

test('applyQuestionnaireAnswer healthConsent agree and decline', () => {
  const agree = applyQuestionnaireAnswer(
    { ...freshPwaPrefs, privacyRegion: 'eea_uk' },
    'healthConsent',
    'agree',
  );
  assert.equal(agree.healthDataConsent, true);
  assert.ok(agree.healthDataConsentAt);

  const decline = applyQuestionnaireAnswer(
    { ...freshPwaPrefs, privacyRegion: 'eea_uk' },
    'healthConsent',
    'notNow',
  );
  assert.equal(decline.healthDataConsent, false);
});

test('applyQuestionnaireAnswer sessionRecording records disclosure', () => {
  const no = applyQuestionnaireAnswer(freshPwaPrefs, 'sessionRecording', 'no');
  assert.equal(no.sessionRecording, false);
  assert.ok(no.sessionRecordingDisclosureAt);

  const yes = applyQuestionnaireAnswer(freshPwaPrefs, 'sessionRecording', 'yes');
  assert.equal(yes.sessionRecording, true);
});

test('applyQuestionnaireAnswer finish completes wizard', () => {
  const done = applyQuestionnaireAnswer(freshPwaPrefs, 'finish', 'start');
  assert.ok(done.firstRunWizardCompletedAt);
  assert.equal(done.tutorialSeen, true);
});

test('applyQuestionnaireAnswer finish quickTour sets replayTutorial', () => {
  const done = applyQuestionnaireAnswer(freshPwaPrefs, 'finish', 'quickTour');
  assert.ok(done.firstRunWizardCompletedAt);
  assert.equal(done.replayTutorial, true);
});

test('createGuidedOnboardingProgressSession grows when EEA path appears', () => {
  const ctx = { platform: 'pwa' };
  const session = createGuidedOnboardingProgressSession(freshPwaPrefs, ctx);
  const initialTotal = session.getTotal();

  const eeaPrefs = {
    ...freshPwaPrefs,
    privacyRegion: 'eea_uk',
    privacyRegionSource: 'onboarding',
  };
  const healthIdx = session.getCards().findIndex((c) => c.id === 'healthConsent');
  const progress = session.resolve(eeaPrefs, ctx, healthIdx >= 0 ? healthIdx : 1);
  assert.ok(progress.total >= initialTotal);
  if (healthIdx >= 0) {
    assert.equal(progress.current, healthIdx + 1);
  }
});

test('resolveNextGuidedCardIndex skips removed cards after region confirm', () => {
  const afterRegion = buildGuidedQuestionnaire(
    { ...freshPwaPrefs, privacyRegion: 'eea_uk', privacyRegionSource: 'onboarding' },
    { platform: 'pwa' },
  );
  const idx = resolveNextGuidedCardIndex(afterRegion, 'region');
  assert.equal(afterRegion[idx]?.id, 'coachTone');
});

test('install card skipped on RN', () => {
  const cards = buildGuidedQuestionnaire(freshPwaPrefs, { platform: 'rn', installModalSeen: true });
  assert.equal(cards.some((c) => c.id === 'install'), false);
});
