import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  rawToWellnessSlider,
  wellnessSliderToRaw,
  classifyWellnessSlider,
  wellnessSliderFillColor,
} from '../../../packages/shared/src/metrics/sliderWellness.mjs';

describe('sliderWellness', () => {
  it('maps symptom metrics so low raw = high wellness', () => {
    assert.equal(rawToWellnessSlider('fatigue', 0), 10);
    assert.equal(rawToWellnessSlider('fatigue', 10), 0);
    assert.equal(wellnessSliderToRaw('fatigue', 0), 10);
    assert.equal(wellnessSliderToRaw('fatigue', 10), 0);
  });

  it('maps positive metrics directly', () => {
    assert.equal(rawToWellnessSlider('mood', 2), 2);
    assert.equal(wellnessSliderToRaw('mood', 8), 8);
  });

  it('round-trips every metric field', () => {
    for (const field of ['fatigue', 'mood', 'sleep', 'irritability', 'mobility']) {
      for (let w = 0; w <= 10; w += 1) {
        assert.equal(rawToWellnessSlider(field, wellnessSliderToRaw(field, w)), w);
      }
    }
  });

  it('classifies wellness zones consistently', () => {
    assert.equal(classifyWellnessSlider(9).id, 'good');
    assert.equal(classifyWellnessSlider(5).id, 'moderate');
    assert.equal(classifyWellnessSlider(1).id, 'bad');
  });

  it('colors low wellness red and high green', () => {
    assert.equal(wellnessSliderFillColor(0), '#F44336');
    assert.equal(wellnessSliderFillColor(10), '#4CAF50');
  });
});
