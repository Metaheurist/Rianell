import React from 'react';
import {
  shouldClearReminderAction,
  shouldOpenHomeAfterSnoozeFailure,
  shouldOpenHomeFromReminderAction,
  shouldOpenLogWizardFromReminderAction,
  shouldShowAiTab,
  shouldSnoozeReminderFromAction,
} from './RootNavigator';
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

test('log-now reminder action opens LogWizard route', () => {
  expect(shouldOpenLogWizardFromReminderAction('log-now')).toBe(true);
  expect(shouldOpenLogWizardFromReminderAction('later')).toBe(false);
  expect(shouldOpenLogWizardFromReminderAction('default')).toBe(false);
});

test('non-none reminder actions should be cleared after handling', () => {
  expect(shouldClearReminderAction('log-now')).toBe(true);
  expect(shouldClearReminderAction('later')).toBe(true);
  expect(shouldClearReminderAction('default')).toBe(true);
  expect(shouldClearReminderAction('unknown')).toBe(true);
  expect(shouldClearReminderAction('none')).toBe(false);
});

test('later reminder action should trigger snooze behavior', () => {
  expect(shouldSnoozeReminderFromAction('later')).toBe(true);
  expect(shouldSnoozeReminderFromAction('log-now')).toBe(false);
  expect(shouldSnoozeReminderFromAction('default')).toBe(false);
});

test('default reminder action should bring app home', () => {
  expect(shouldOpenHomeFromReminderAction('default')).toBe(true);
  expect(shouldOpenHomeFromReminderAction('unknown')).toBe(true);
  expect(shouldOpenHomeFromReminderAction('log-now')).toBe(false);
  expect(shouldOpenHomeFromReminderAction('later')).toBe(false);
});

test('later action falls back home when snooze scheduling fails', () => {
  expect(shouldOpenHomeAfterSnoozeFailure('later', false)).toBe(true);
  expect(shouldOpenHomeAfterSnoozeFailure('later', true)).toBe(false);
  expect(shouldOpenHomeAfterSnoozeFailure('default', false)).toBe(false);
});

