import test from 'node:test';
import assert from 'node:assert/strict';

import { getDefaultAccessibilitySettings, normalizeAccessibilitySettings } from '@rianell/shared';

test('accessibility settings normalize with sane defaults', () => {
  assert.deepEqual(normalizeAccessibilitySettings(null), getDefaultAccessibilitySettings());
  assert.equal(normalizeAccessibilitySettings({ textScale: 10 }).textScale, 2);
  assert.equal(normalizeAccessibilitySettings({ textScale: 0.1 }).textScale, 0.75);
  assert.equal(normalizeAccessibilitySettings({ ttsEnabled: true }).ttsEnabled, true);
  assert.equal(normalizeAccessibilitySettings({ ttsReadModeEnabled: true }).ttsReadModeEnabled, true);
});

