import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCohortBenchmarkCard, COHORT_MIN_K } from '@rianell/shared';

test('cohort card suppressed below k-anon threshold', () => {
  const card = buildCohortBenchmarkCard({ contributor_count: 2 }, 'fibromyalgia');
  assert.equal(card.visible, false);
  assert.equal(card.reason, 'k_anon_suppressed');
});

test('cohort card visible at k threshold', () => {
  const card = buildCohortBenchmarkCard(
    { contributor_count: COHORT_MIN_K, avg_sleep_hours: 7.2, avg_fatigue: 6 },
    'pots',
  );
  assert.equal(card.visible, true);
  assert.ok(card.metrics.length > 0);
});
