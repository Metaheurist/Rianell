import React from 'react';
import { shouldShowAiTab } from './RootNavigator';
import { getDefaultPreferences } from '../storage/preferences';

test('AI tab is hidden when aiEnabled is false', () => {
  const prefs = getDefaultPreferences();
  prefs.aiEnabled = false;
  expect(shouldShowAiTab(prefs)).toBe(false);
});

test('AI tab is shown when aiEnabled is true (default)', () => {
  const prefs = getDefaultPreferences();
  expect(prefs.aiEnabled).not.toBe(false);
  expect(shouldShowAiTab(prefs)).toBe(true);
});

