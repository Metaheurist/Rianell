import React from 'react';
import { shouldShowAiTab } from './RootNavigator';
import { getDefaultPreferences } from '../storage/preferences';

test('AI tab is hidden when aiEnabled is false', () => {
  const prefs = getDefaultPreferences();
  prefs.aiEnabled = false;
  expect(shouldShowAiTab(prefs)).toBe(false);
});

