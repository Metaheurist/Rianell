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
  getCrisisResourcesForRegion,
  PHQ2_QUESTIONS,
  GAD2_QUESTIONS,
  SCREENING_RESPONSE_OPTIONS,
  MENTAL_HEALTH_DISCLAIMER_I18N,
  normalizePresentationModePrefs,
  getPresentationChartRange,
  shouldLockChartRangeInPresentation,
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

test('getCrisisResourcesForRegion returns regional links', () => {
  assert.ok(getCrisisResourcesForRegion('eea_uk').length >= 1);
  assert.ok(getCrisisResourcesForRegion('us').some((r) => r.url.includes('988')));
});

test('presentation mode prefs normalize and lock 7-day range', () => {
  const prefs = normalizePresentationModePrefs({ chartsPresentationMode: true, weeklyReviewDismissedWeek: '2026-06-02' });
  assert.equal(prefs.chartsPresentationMode, true);
  assert.equal(prefs.weeklyReviewDismissedWeek, '2026-06-02');
  assert.equal(getPresentationChartRange(30), 7);
  assert.equal(shouldLockChartRangeInPresentation(true), true);
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
    'mentalHealth.result.title',
    MENTAL_HEALTH_DISCLAIMER_I18N,
    'mentalHealth.phq2.low',
    'mentalHealth.phq2.elevated',
    'mentalHealth.gad2.low',
    'mentalHealth.gad2.elevated',
  ];
  for (const q of [...PHQ2_QUESTIONS, ...GAD2_QUESTIONS]) keys.push(q.i18n);
  for (const opt of SCREENING_RESPONSE_OPTIONS) keys.push(opt.i18n);
  for (const link of getCrisisResourcesForRegion('eea_uk')) keys.push(link.i18n);
  for (const key of keys) {
    const val = t(key, 'en-GB', CATALOGS);
    assert.notEqual(val, key, `missing translation for ${key}`);
  }
});
