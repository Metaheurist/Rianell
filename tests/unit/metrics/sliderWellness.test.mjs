import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  rawToWellnessSlider,
  wellnessSliderToRaw,
  classifyWellnessSlider,
  wellnessSliderFillColor,
} from '../../../packages/shared/src/metrics/sliderWellness.mjs';

describe('sliderWellness', () => {
  it('maps symptom metrics so low raw = low wellness (1–10 scale)', () => {
    assert.equal(rawToWellnessSlider('fatigue', 1), 10);
    assert.equal(rawToWellnessSlider('fatigue', 10), 1);
    assert.equal(wellnessSliderToRaw('fatigue', 1), 10);
    assert.equal(wellnessSliderToRaw('fatigue', 10), 1);
  });

  it('maps positive metrics directly', () => {
    assert.equal(rawToWellnessSlider('mood', 2), 2);
    assert.equal(wellnessSliderToRaw('mood', 8), 8);
  });

  it('round-trips every metric field on 1–10 wellness positions', () => {
    for (const field of ['fatigue', 'mood', 'sleep', 'irritability', 'mobility', 'dailyFunction']) {
      for (let w = 1; w <= 10; w += 1) {
        assert.equal(rawToWellnessSlider(field, wellnessSliderToRaw(field, w)), w);
      }
    }
  });

  it('clamps invalid raw values into 1–10', () => {
    assert.equal(wellnessSliderToRaw('dailyFunction', 0), 1);
    assert.equal(wellnessSliderToRaw('dailyFunction', 11), 10);
    assert.equal(rawToWellnessSlider('dailyFunction', 0), 1);
  });

  it('classifies wellness zones consistently', () => {
    assert.equal(classifyWellnessSlider(9).id, 'good');
    assert.equal(classifyWellnessSlider(5).id, 'moderate');
    assert.equal(classifyWellnessSlider(1).id, 'bad');
  });

  it('colors low wellness red and high green', () => {
    assert.equal(wellnessSliderFillColor(1), '#F44336');
    assert.equal(wellnessSliderFillColor(10), '#4CAF50');
  });
});
