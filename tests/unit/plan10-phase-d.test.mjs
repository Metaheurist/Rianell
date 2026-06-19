import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectHomeLoggingGaps,
  pickDailyHomeGapQuestion,
  canAnswerHomeQuestionToday,
  nextHomeQuestionAnswerState,
  MAX_HOME_QUESTION_ANSWERS_PER_DAY,
} from '@rianell/shared';
import {
  isFoodEmpty,
  hasMissedMeds,
} from '../../packages/shared/src/ai/homeGapDetection.mjs';
import {
  pickHomeAiSuggestionBundle,
  buildHomeQuestionFallback,
} from '../../packages/shared/src/ai/homeSuggestions.mjs';
import { buildHomeQuestionContext } from '../../packages/shared/src/ai/homeQuestionContext.mjs';

const TODAY = '2026-06-19';
const YDAY = '2026-06-18';

test('isFoodEmpty detects empty and populated food logs', () => {
  assert.equal(isFoodEmpty({ food: { breakfast: [], lunch: [], dinner: [], snack: [] } }), true);
  assert.equal(isFoodEmpty({ food: { breakfast: ['Oats'], lunch: [], dinner: [], snack: [] } }), false);
});

test('detectHomeLoggingGaps finds missed meds on yesterday', () => {
  const logs = [
    { date: '2026-06-17', medicationDoses: [{ drug: 'Med A', status: 'taken' }] },
    { date: YDAY, medicationDoses: [{ drug: 'Med A', status: 'missed' }], mood: 6 },
    { date: TODAY, mood: 7 },
  ];
  const gaps = detectHomeLoggingGaps(logs, { todayStr: TODAY, medSchedule: [{ id: 'm1', drug: 'Med A', times: ['08:00'] }] });
  assert.ok(gaps.some((g) => g.id === 'gap-meds'));
});

test('detectHomeLoggingGaps finds missing sleep when user tracks sleep', () => {
  const logs = [
    { date: '2026-06-16', sleep: 7, mood: 6 },
    { date: '2026-06-17', sleep: 6, mood: 6 },
    { date: YDAY, mood: 5, fatigue: 7 },
    { date: TODAY, sleep: 7, mood: 7 },
  ];
  const gaps = detectHomeLoggingGaps(logs, { todayStr: TODAY });
  assert.ok(gaps.some((g) => g.id === 'gap-sleep'));
});

test('pickDailyHomeGapQuestion caches gap for the day', () => {
  const logs = [
    { date: '2026-06-16', sleep: 7 },
    { date: '2026-06-17', sleep: 6 },
    { date: YDAY, mood: 5 },
    { date: TODAY, sleep: 7 },
  ];
  const first = pickDailyHomeGapQuestion(logs, { todayStr: TODAY });
  assert.ok(first.chip?.id === 'gap-sleep');
  assert.ok(first.cacheUpdate?.gapId === 'gap-sleep');

  const second = pickDailyHomeGapQuestion(logs, {
    todayStr: TODAY,
    homeGapQuestionCache: { date: TODAY, gapId: 'gap-sleep' },
  });
  assert.equal(second.cacheUpdate, null);
  assert.equal(second.chip?.id, 'gap-sleep');
});

test('pickHomeAiSuggestionBundle prepends gap chip without logged today', () => {
  const logs = [
    { date: '2026-06-16', medicationDoses: [{ drug: 'A', status: 'taken' }] },
    { date: '2026-06-17', medicationDoses: [{ drug: 'A', status: 'taken' }] },
    { date: YDAY, mood: 6 },
    { date: TODAY, mood: 7 },
  ];
  const bundle = pickHomeAiSuggestionBundle(logs, null, {
    aiEnabled: true,
    loggedToday: false,
    todayStr: TODAY,
    medSchedule: [{ id: 'm1', drug: 'A', times: ['08:00'] }],
  });
  assert.equal(bundle.chips[0]?.id, 'gap-meds');
});

test('home question turn limit blocks after max answers', () => {
  const state = { date: TODAY, count: MAX_HOME_QUESTION_ANSWERS_PER_DAY };
  assert.equal(canAnswerHomeQuestionToday(state, TODAY), false);
  const next = nextHomeQuestionAnswerState({ date: TODAY, count: 0 }, TODAY);
  assert.equal(next.count, 1);
});

test('gap home question fallback and context include gap focus', () => {
  const chip = { id: 'gap-food', labelKey: 'home.questions.gapFood', labelParams: {} };
  const fb = buildHomeQuestionFallback(chip, {});
  assert.ok(fb.includes('food'));
  const ctx = buildHomeQuestionContext({
    questionText: 'What about meals?',
    questionId: 'gap-food',
    analysis: { totalLogs: 4 },
    logs: [],
  });
  assert.ok(ctx.includes('food'));
  assert.ok(ctx.includes('Yesterday'));
});
