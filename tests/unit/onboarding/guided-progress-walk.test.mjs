import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  applyQuestionnaireAnswer,
  buildGuidedQuestionnaire,
  createGuidedOnboardingProgressSession,
  mergeGuidedSessionCards,
  resolveGuidedCardProgressById,
  resolveNextGuidedCardIndex,
} from '@rianell/shared';

const ctx = { platform: 'pwa' };
const freshPwaPrefs = {
  privacyRegion: '',
  healthDataConsent: false,
  cookieConsent: false,
  aiEnabled: true,
  aiModelDownloadConsent: 'deferred',
  tutorialSeen: false,
};

/** Mirrors guided-onboarding.js: answer, rebuild the live list, advance by card order. */
function walk(welcomeChoice) {
  let prefs = { ...freshPwaPrefs };
  const session = createGuidedOnboardingProgressSession(prefs, ctx);
  let cards = buildGuidedQuestionnaire(prefs, ctx);
  let idx = 0;
  const seen = [];
  for (let guard = 0; guard < 40; guard += 1) {
    const card = cards[idx];
    seen.push({ id: card.id, ...session.resolveCard(prefs, ctx, card.id) });
    if (card.id === 'finish') return seen;
    let choice = card.choices && card.choices[0] ? card.choices[0].id : 'continue';
    if (card.id === 'welcome') choice = welcomeChoice;
    if (card.id === 'region') choice = 'confirm';
    prefs = applyQuestionnaireAnswer(prefs, card.id, choice, {
      regionId: 'eea_uk',
      policyPackId: 'v1.0.0',
      reminderTime: '09:00',
    });
    cards = buildGuidedQuestionnaire(prefs, ctx);
    session.refresh(prefs, ctx);
    idx = resolveNextGuidedCardIndex(cards, card.id);
  }
  throw new Error('walk never reached finish');
}

for (const path of ['setUp', 'signIn']) {
  test(`step counter advances by one per card and ends at N of N (${path} path)`, () => {
    const steps = walk(path);
    for (let i = 1; i < steps.length; i += 1) {
      assert.equal(steps[i].current, steps[i - 1].current + 1, `${steps[i].id} follows ${steps[i - 1].id}`);
    }
    const last = steps[steps.length - 1];
    assert.equal(last.id, 'finish');
    assert.equal(last.current, last.total);
  });
}

test('the EEA health consent card joins the session after region confirm', () => {
  const steps = walk('setUp');
  const region = steps.find((s) => s.id === 'region');
  const consent = steps.find((s) => s.id === 'healthConsent');
  assert.ok(consent, 'healthConsent is shown for eea_uk');
  assert.ok(consent.current > region.current);
});

test('mergeGuidedSessionCards adds a new card even when answered cards shrank the list', () => {
  const existing = ['welcome', 'region', 'coachTone', 'cookies', 'finish'].map((id) => ({ id }));
  const next = ['coachTone', 'healthConsent', 'cookies', 'finish'].map((id) => ({ id }));
  const merged = mergeGuidedSessionCards(existing, next).map((c) => c.id);
  assert.deepEqual(merged, ['welcome', 'region', 'coachTone', 'healthConsent', 'cookies', 'finish']);
  assert.equal(mergeGuidedSessionCards(existing, existing.slice(2)), existing, 'no new cards keeps the list');
});

test('resolveGuidedCardProgressById falls back to step 1 for an unknown card', () => {
  const cards = [{ id: 'welcome' }, { id: 'finish' }];
  assert.deepEqual(resolveGuidedCardProgressById(cards, 'finish'), { current: 2, total: 2 });
  assert.deepEqual(resolveGuidedCardProgressById(cards, 'region'), { current: 1, total: 2 });
});

test('PWA wizard resolves progress by card id and highlights the matching dot', () => {
  const src = fs.readFileSync(new URL('../../../apps/pwa-webapp/guided-onboarding.js', import.meta.url), 'utf8');
  assert.match(src, /progressSession\.resolveCard\(readPrefs\(\), platformContext\(\), card\.id\)/);
  assert.match(src, /i === progress\.current - 1 \? ' guided-onboarding-dot--active'/);
});
