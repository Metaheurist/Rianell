import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hasActiveGoals } from '../../../packages/shared/src/index.mjs';

describe('hasActiveGoals', () => {
  it('returns false for null, undefined, or non-objects', () => {
    assert.equal(hasActiveGoals(null), false);
    assert.equal(hasActiveGoals(undefined), false);
    assert.equal(hasActiveGoals(''), false);
  });

  it('returns false when every target is zero or missing', () => {
    assert.equal(hasActiveGoals({}), false);
    assert.equal(hasActiveGoals({ steps: 0, hydration: 0, sleep: 0, goodDaysPerWeek: 0 }), false);
  });

  it('returns true when any target is non-zero', () => {
    assert.equal(hasActiveGoals({ steps: 5000 }), true);
    assert.equal(hasActiveGoals({ hydration: 6 }), true);
    assert.equal(hasActiveGoals({ sleep: 7 }), true);
    assert.equal(hasActiveGoals({ goodDaysPerWeek: 3 }), true);
  });

  it('ignores out-of-range values as clamped zero', () => {
    assert.equal(hasActiveGoals({ steps: -1, hydration: 0 }), false);
  });
});
