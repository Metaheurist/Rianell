import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  canOfferWeeklyReview,
  isoWeekMondayKey,
  summarizeCorrelationStep,
  summarizeDigestStep,
  WEEKLY_REVIEW_MIN_LOG_DAYS,
  getOnDeviceMoatBulletKeys,
  getProgressiveDisclosureMilestones,
  scoreScreeningResponses,
  interpretPhq2Score,
  interpretGad2Score,
  interpretPhq9Score,
  interpretGad7Score,
  shouldOfferPhq9FollowUp,
  shouldOfferGad7FollowUp,
  mergePhq9Responses,
  mergeGad7Responses,
  scorePhq9FromResponses,
  scoreGad7FromResponses,
  isPhq9SuicideItemPositive,
  getCrisisResourcesForRegion,
  PHQ2_QUESTIONS,
  GAD2_QUESTIONS,
  PHQ9_QUESTIONS,
  GAD7_QUESTIONS,
  PHQ9_FOLLOWUP_QUESTIONS,
  GAD7_FOLLOWUP_QUESTIONS,
  PHQ9_MAX_SCORE,
  GAD7_MAX_SCORE,
  SCREENING_RESPONSE_OPTIONS,
  MENTAL_HEALTH_DISCLAIMER_I18N,
  normalizeHomeDashboardPrefs,
} from '@rianell/shared';
import { t } from '../../packages/shared/src/i18n/translate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const EN_GB = JSON.parse(
  readFileSync(path.join(ROOT, 'i18n-packs/locale-packs/v1/en-GB.json'), 'utf8'),
);
const CATALOGS = { 'en-GB': EN_GB };

const LOGS = Array.from({ length: 8 }, (_, i) => ({
  date: `2026-06-${String(i + 1).padStart(2, '0')}`,
  mood: 6,
  sleep: 7,
  fatigue: 4,
}));

test('canOfferWeeklyReview requires min log days and respects dismiss week', () => {
  const short = canOfferWeeklyReview(LOGS.slice(0, 3), { aiEnabled: true, simpleMode: false, todayStr: '2026-06-08' });
  assert.equal(short.allowed, false);
  assert.equal(short.reason, 'minDays');
  assert.equal(short.minDays, WEEKLY_REVIEW_MIN_LOG_DAYS);

  const week = isoWeekMondayKey('2026-06-08');
  const dismissed = canOfferWeeklyReview(LOGS, {
    aiEnabled: true,
    simpleMode: false,
    todayStr: '2026-06-08',
    weeklyReviewDismissedWeek: week,
  });
  assert.equal(dismissed.allowed, false);
  assert.equal(dismissed.reason, 'dismissed');

  const ok = canOfferWeeklyReview(LOGS, { aiEnabled: true, simpleMode: false, todayStr: '2026-06-08' });
  assert.equal(ok.allowed, true);
});

test('summarizeCorrelationStep caps to three cards', () => {
  const cards = Array.from({ length: 5 }, (_, i) => ({ id: 'c' + i, label: 'A & B', detail: 'r=0.5' }));
  const out = summarizeCorrelationStep(cards);
  assert.equal(out.length, 3);
  assert.equal(out[0].label, 'A & B');
});

test('summarizeDigestStep normalizes digest object', () => {
  const out = summarizeDigestStep({ headline: 'Stable week', improvements: ['sleep'], concerns: [], changes: [{ metric: 'sleep', priorAvg: 6, thisAvg: 7, kind: 'improvement' }] });
  assert.equal(out.headline, 'Stable week');
  assert.deepEqual(out.improvements, ['sleep']);
  assert.equal(out.changes.length, 1);
});

test('mental health screening scores PHQ-2/GAD-2', () => {
  const low = scoreScreeningResponses([{ value: 0 }, { value: 1 }]);
  assert.equal(low.total, 1);
  assert.equal(interpretPhq2Score(low.total).level, 'low');
  const high = scoreScreeningResponses([{ value: 3 }, { value: 2 }]);
  assert.equal(interpretGad2Score(high.total).level, 'elevated');
});

test('PHQ-2/GAD-2 follow-up gates at score 3', () => {
  assert.equal(shouldOfferPhq9FollowUp(2), false);
  assert.equal(shouldOfferPhq9FollowUp(3), true);
  assert.equal(shouldOfferGad7FollowUp(2), false);
  assert.equal(shouldOfferGad7FollowUp(3), true);
});

test('PHQ-9 and GAD-7 full instrument scoring and severity', () => {
  const phq2 = { phq2_1: 1, phq2_2: 2 };
  const phqFollow = Object.fromEntries(PHQ9_FOLLOWUP_QUESTIONS.map((q) => [q.id, 0]));
  const phqMerged = mergePhq9Responses(phq2, phqFollow);
  const phqScored = scorePhq9FromResponses(phqMerged);
  assert.equal(phqScored.total, 3);
  assert.equal(interpretPhq9Score(phqScored.total).level, 'minimal');
  assert.equal(interpretPhq9Score(10).level, 'moderate');
  assert.equal(interpretPhq9Score(20).level, 'severe');

  const gad2 = { gad2_1: 2, gad2_2: 1 };
  const gadFollow = Object.fromEntries(GAD7_FOLLOWUP_QUESTIONS.map((q) => [q.id, 1]));
  const gadMerged = mergeGad7Responses(gad2, gadFollow);
  const gadScored = scoreGad7FromResponses(gadMerged);
  assert.equal(gadScored.total, 8);
  assert.equal(interpretGad7Score(gadScored.total).level, 'mild');
  assert.equal(interpretGad7Score(15).level, 'severe');
});

test('PHQ-9 item 9 suicide item detection', () => {
  const negative = Object.fromEntries(PHQ9_QUESTIONS.map((q) => [q.id, 0]));
  assert.equal(isPhq9SuicideItemPositive(negative), false);
  negative.phq9_9 = 1;
  assert.equal(isPhq9SuicideItemPositive(negative), true);
});

test('PHQ-9 and GAD-7 question counts and max scores', () => {
  assert.equal(PHQ9_QUESTIONS.length, 9);
  assert.equal(GAD7_QUESTIONS.length, 7);
  assert.equal(PHQ9_FOLLOWUP_QUESTIONS.length, 7);
  assert.equal(GAD7_FOLLOWUP_QUESTIONS.length, 5);
  assert.equal(PHQ9_MAX_SCORE, 27);
  assert.equal(GAD7_MAX_SCORE, 21);
});

test('getCrisisResourcesForRegion returns regional links', () => {
  assert.ok(getCrisisResourcesForRegion('eea_uk').length >= 1);
  assert.ok(getCrisisResourcesForRegion('us').some((r) => r.url.includes('988')));
});

test('home dashboard prefs normalize weekly review dismissed week', () => {
  const prefs = normalizeHomeDashboardPrefs({ weeklyReviewDismissedWeek: '2026-06-02' });
  assert.equal(prefs.weeklyReviewDismissedWeek, '2026-06-02');
});

test('on-device moat and progressive disclosure keys exported', () => {
  assert.ok(getOnDeviceMoatBulletKeys().length >= 4);
  assert.ok(getProgressiveDisclosureMilestones().some((m) => m.id === 'day1'));
});

test('settings cross-cutting i18n keys resolve in en-GB catalog', () => {
  for (const key of getOnDeviceMoatBulletKeys()) {
    const val = t(key, 'en-GB', CATALOGS);
    assert.notEqual(val, key, `missing translation for ${key}`);
  }
  for (const milestone of getProgressiveDisclosureMilestones()) {
    const val = t(milestone.i18n, 'en-GB', CATALOGS);
    assert.notEqual(val, milestone.i18n, `missing translation for ${milestone.i18n}`);
  }
});

test('mental health screening i18n keys resolve in en-GB catalog', () => {
  const keys = [
    'mentalHealth.phq2.title',
    'mentalHealth.gad2.title',
    'mentalHealth.submit',
    'mentalHealth.submitFollowUp',
    'mentalHealth.result.title',
    MENTAL_HEALTH_DISCLAIMER_I18N,
    'mentalHealth.phq2.low',
    'mentalHealth.phq2.elevated',
    'mentalHealth.phq2.followUpIntro',
    'mentalHealth.gad2.low',
    'mentalHealth.gad2.elevated',
    'mentalHealth.gad2.followUpIntro',
    'mentalHealth.phq9.item9Crisis',
  ];
  for (const q of [...PHQ2_QUESTIONS, ...GAD2_QUESTIONS, ...PHQ9_QUESTIONS, ...GAD7_QUESTIONS]) keys.push(q.i18n);
  for (const level of ['minimal', 'mild', 'moderate', 'moderatelySevere', 'severe']) {
    keys.push(`mentalHealth.phq9.severity.${level}`);
  }
  for (const level of ['minimal', 'mild', 'moderate', 'severe']) {
    keys.push(`mentalHealth.gad7.severity.${level}`);
  }
  for (const opt of SCREENING_RESPONSE_OPTIONS) keys.push(opt.i18n);
  for (const link of getCrisisResourcesForRegion('eea_uk')) keys.push(link.i18n);
  for (const key of keys) {
    const val = t(key, 'en-GB', CATALOGS);
    assert.notEqual(val, key, `missing translation for ${key}`);
  }
});
