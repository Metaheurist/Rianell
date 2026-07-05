import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCorrelationCards,
  buildFlarePostMortem,
  correlationConfidenceLevel,
  predictFutureValues,
} from '@rianell/ai-engine';

function daysAgo(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const FIXTURE = [
  { date: daysAgo(7), mood: 3, sleep: 3, fatigue: 9, flare: 'No' },
  { date: daysAgo(6), mood: 4, sleep: 4, fatigue: 8, flare: 'No' },
  { date: daysAgo(5), mood: 5, sleep: 4, fatigue: 7, flare: 'No' },
  { date: daysAgo(4), mood: 2, sleep: 2, fatigue: 9, flare: 'Yes' },
  { date: daysAgo(3), mood: 3, sleep: 3, fatigue: 8, flare: 'No' },
  { date: daysAgo(2), mood: 4, sleep: 4, fatigue: 7, flare: 'No' },
  { date: daysAgo(1), mood: 5, sleep: 5, fatigue: 6, flare: 'No' },
  { date: daysAgo(0), mood: 6, sleep: 6, fatigue: 5, flare: 'No' },
];

test('correlationConfidenceLevel maps pearson strength', () => {
  assert.equal(correlationConfidenceLevel(0.75), 'high');
  assert.equal(correlationConfidenceLevel(-0.55), 'medium');
  assert.equal(correlationConfidenceLevel(0.4), 'low');
  assert.equal(correlationConfidenceLevel(0.2), null);
});

test('buildCorrelationCards returns cards with confidence badge data', () => {
  const cards = buildCorrelationCards(FIXTURE, 30);
  assert.ok(cards.length >= 1);
  for (const card of cards) {
    assert.ok(['high', 'medium', 'low'].includes(card.confidence));
    assert.ok(Math.abs(card.coefficient) >= 0.35);
    assert.ok(card.sampleSize >= 3);
  }
});

test('buildFlarePostMortem compares before/after flare window', () => {
  const post = buildFlarePostMortem(FIXTURE, { windowDays: 3 });
  assert.ok(post);
  assert.equal(post.flareDate, daysAgo(4));
  assert.ok(post.beforeDays >= 1);
  assert.ok(post.afterDays >= 1);
  assert.ok(Array.isArray(post.diverging));
});

test('predictFutureValues exposes lower/upper uncertainty band (C7)', () => {
  const pts = predictFutureValues([4, 5, 6, 5, 6], 3);
  assert.equal(pts.length, 3);
  for (const pt of pts) {
    assert.ok(pt.lower <= pt.value);
    assert.ok(pt.upper >= pt.value);
  }
});
