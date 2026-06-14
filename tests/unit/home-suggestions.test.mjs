import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pickHomeAiSuggestions,
  computeHomeAnalysisSnapshot,
  buildHomeQuestionFallback,
  HOME_SUGGESTIONS_MIN_DAYS,
} from '../../packages/shared/src/ai/homeSuggestions.mjs';
import { buildHomeQuestionContext } from '../../packages/shared/src/ai/homeQuestionContext.mjs';

function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function fixtureLogs() {
  const logs = [];
  for (let i = 0; i < 5; i++) {
    logs.push({
      date: isoDaysAgo(i),
      flare: i < 2 ? 'Yes' : 'No',
      fatigue: 6 + i * 0.5,
      sleep: 7 - i * 0.3,
      mood: 6,
      symptoms: i % 2 === 0 ? ['Headache'] : ['Headache', 'Nausea'],
      stressors: i === 0 ? ['Work deadline'] : [],
      notes: i === 0 ? 'Rough morning' : '',
    });
  }
  return logs;
}

test('pickHomeAiSuggestions returns empty when not logged today', () => {
  const logs = fixtureLogs();
  const snap = computeHomeAnalysisSnapshot(logs);
  assert.deepEqual(
    pickHomeAiSuggestions(logs, snap, { aiEnabled: true, loggedToday: false }),
    []
  );
});

test('pickHomeAiSuggestions returns empty when AI disabled', () => {
  const logs = fixtureLogs();
  const snap = computeHomeAnalysisSnapshot(logs);
  assert.deepEqual(
    pickHomeAiSuggestions(logs, snap, { aiEnabled: false, loggedToday: true }),
    []
  );
});

test('pickHomeAiSuggestions returns empty below MIN_DAYS', () => {
  const logs = fixtureLogs().slice(0, HOME_SUGGESTIONS_MIN_DAYS - 1);
  const snap = computeHomeAnalysisSnapshot(logs);
  assert.deepEqual(
    pickHomeAiSuggestions(logs, snap, { aiEnabled: true, loggedToday: true }),
    []
  );
});

test('pickHomeAiSuggestions picks chips when logged today with enough data', () => {
  const logs = fixtureLogs();
  const snap = computeHomeAnalysisSnapshot(logs);
  const chips = pickHomeAiSuggestions(logs, snap, { aiEnabled: true, loggedToday: true });
  assert.ok(chips.length >= 1);
  assert.ok(chips.length <= 3);
  assert.ok(chips.every((c) => c.id && c.labelKey));
});

test('buildHomeQuestionContext caps length and includes question', () => {
  const logs = fixtureLogs();
  const snap = computeHomeAnalysisSnapshot(logs);
  const ctx = buildHomeQuestionContext({
    questionText: 'Why is fatigue trending up?',
    questionId: 'trend-fatigue',
    labelParams: { metric: 'fatigue', direction: 'up' },
    analysis: snap,
    logs,
  });
  assert.ok(ctx.includes('Question:'));
  assert.ok(ctx.length <= 720);
});

test('buildHomeQuestionFallback returns non-empty string', () => {
  const logs = fixtureLogs();
  const snap = computeHomeAnalysisSnapshot(logs);
  const chips = pickHomeAiSuggestions(logs, snap, { aiEnabled: true, loggedToday: true });
  assert.ok(chips.length >= 1);
  const fb = buildHomeQuestionFallback(chips[0], snap);
  assert.ok(typeof fb === 'string' && fb.length > 10);
});
