import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SettingsScreen } from './SettingsScreen';
import { ThemeProvider } from '../theme/ThemeProvider';
import { getDefaultPreferences } from '../storage/preferences';

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
}));

jest.mock('../performance/benchmark', () => ({
  loadCachedBenchmark: jest.fn(async () => null),
  runAndCacheBenchmark: jest.fn(async () => ({
    scoreMs: 20,
    tier: 4,
    deviceClass: 'high',
    llmModelSize: 'tier4',
    measuredAt: Date.now(),
  })),
  clearCachedBenchmark: jest.fn(async () => {}),
  resolveLlmModelSize: jest.fn(() => 'tier3'),
}));
jest.mock('../permissions/permissions', () => ({
  Permissions: {
    getStatus: jest.fn(async () => 'denied'),
    request: jest.fn(async () => 'granted'),
    scheduleDailyReminder: jest.fn(async () => ({ ok: true, delivery: 'scheduled-basic' })),
    getLastReminderAction: jest.fn(async () => 'none'),
    subscribeReminderActions: jest.fn(async () => () => {}),
    getReminderCapabilities: jest.fn(async () => ({
      hasScheduling: true,
      hasAndroidChannel: false,
      hasIosCategory: false,
      hasResponseListener: true,
      hasSnooze: true,
    })),
  },
}));

test('settings carousel: cloud pane, then AI, accessibility, data panes', () => {
  const prefs = getDefaultPreferences();
  const { getByText, getByTestId } = render(
    <ThemeProvider prefs={prefs}>
      <SettingsScreen prefs={prefs} onChangePrefs={() => {}} />
    </ThemeProvider>
  );

  getByText('1 / 4 — Personal & cloud');
  getByText('Personal & cloud sync');
  getByText('Demo mode');
  getByText('Notifications');
  getByText('Enable daily reminder');
  getByText('Reminder sound');
  getByText('Snooze minutes (later action)');
  getByText(/Later action snoozes for/i);
  getByText(/Action policy: log-now to Log today/i);
  getByText(/Cloud sync is not configured/);

  fireEvent.press(getByTestId('settings-pane-tab-1'));
  getByText('Theme');
  getByText('Enable AI features & Goals');
  getByText('Performance');
  getByText('On-device AI model');
  getByText('Goals & targets');
  getByText('Mood target (0-10)');

  fireEvent.press(getByTestId('settings-pane-tab-2'));
  getByText('3 / 4 — Accessibility');
  getByText('Large text');
  getByText('Text-to-speech (tap-to-read)');
  getByText('Read mode (auto-read on focus)');

  fireEvent.press(getByTestId('settings-pane-tab-3'));
  getByText('4 / 4 — Data');
  getByText('Data management');
  getByText('📤 Export logs (JSON)');
  getByText('📥 Import logs (JSON)');
});

test('goals target inputs trigger preference updates', () => {
  const prefs = getDefaultPreferences();
  const onChangePrefs = jest.fn();
  const { getByLabelText, getByTestId } = render(
    <ThemeProvider prefs={prefs}>
      <SettingsScreen prefs={prefs} onChangePrefs={onChangePrefs} />
    </ThemeProvider>
  );

  fireEvent.press(getByTestId('settings-pane-tab-1'));
  fireEvent.changeText(getByLabelText('Mood target value'), '8');
  expect(onChangePrefs).toHaveBeenCalled();
});

test('notification permission request action is wired', async () => {
  const prefs = getDefaultPreferences();
  const { getByLabelText, findByText } = render(
    <ThemeProvider prefs={prefs}>
      <SettingsScreen prefs={prefs} onChangePrefs={() => {}} />
    </ThemeProvider>
  );

  await findByText(/Notification permission: denied/i);
  fireEvent.press(getByLabelText('Request notification permission'));
});

test('notification scheduling status is shown when permission granted', async () => {
  const { Permissions } = require('../permissions/permissions');
  Permissions.getStatus.mockResolvedValue('granted');

  const prefs = getDefaultPreferences();
  prefs.notifications.enabled = true;
  prefs.notifications.dailyReminderTime = '08:30';

  const { findByText } = render(
    <ThemeProvider prefs={prefs}>
      <SettingsScreen prefs={prefs} onChangePrefs={() => {}} />
    </ThemeProvider>
  );

  await findByText(/Daily reminder scheduled at 08:30/i);
});

test('notification scheduling shows android channel delivery semantics when provided', async () => {
  const { Permissions } = require('../permissions/permissions');
  Permissions.getStatus.mockResolvedValue('granted');
  Permissions.scheduleDailyReminder.mockResolvedValue({
    ok: true,
    delivery: 'scheduled-android-channel',
  });

  const prefs = getDefaultPreferences();
  prefs.notifications.enabled = true;
  prefs.notifications.dailyReminderTime = '09:15';

  const { findByText } = render(
    <ThemeProvider prefs={prefs}>
      <SettingsScreen prefs={prefs} onChangePrefs={() => {}} />
    </ThemeProvider>
  );

  await findByText(/Android reminder channel configured/i);
});

test('notification scheduling shows iOS category delivery semantics when provided', async () => {
  const { Permissions } = require('../permissions/permissions');
  Permissions.getStatus.mockResolvedValue('granted');
  Permissions.scheduleDailyReminder.mockResolvedValue({
    ok: true,
    delivery: 'scheduled-ios-category',
  });

  const prefs = getDefaultPreferences();
  prefs.notifications.enabled = true;
  prefs.notifications.dailyReminderTime = '09:45';

  const { findByText } = render(
    <ThemeProvider prefs={prefs}>
      <SettingsScreen prefs={prefs} onChangePrefs={() => {}} />
    </ThemeProvider>
  );

  await findByText(/iOS reminder actions\/category configured/i);
});

test('notification area shows last reminder action when available', async () => {
  const { Permissions } = require('../permissions/permissions');
  Permissions.getLastReminderAction.mockResolvedValue('default');

  const prefs = getDefaultPreferences();
  const { findByText } = render(
    <ThemeProvider prefs={prefs}>
      <SettingsScreen prefs={prefs} onChangePrefs={() => {}} />
    </ThemeProvider>
  );

  await findByText(/Last reminder action: Open app/i);
});

test('notification area shows listener-unavailable note when actions unsupported', async () => {
  const { Permissions } = require('../permissions/permissions');
  Permissions.getReminderCapabilities.mockResolvedValue({
    hasScheduling: true,
    hasAndroidChannel: false,
    hasIosCategory: false,
    hasResponseListener: false,
    hasSnooze: true,
  });

  const prefs = getDefaultPreferences();
  const { findByText } = render(
    <ThemeProvider prefs={prefs}>
      <SettingsScreen prefs={prefs} onChangePrefs={() => {}} />
    </ThemeProvider>
  );

  await findByText(/Action listener is unavailable on this runtime/i);
});

test('notification area shows unknown-action fallback note', async () => {
  const { Permissions } = require('../permissions/permissions');
  Permissions.getLastReminderAction.mockResolvedValue('unknown');

  const prefs = getDefaultPreferences();
  const { findByText } = render(
    <ThemeProvider prefs={prefs}>
      <SettingsScreen prefs={prefs} onChangePrefs={() => {}} />
    </ThemeProvider>
  );

  await findByText(/Last reminder action: Unknown action/i);
  await findByText(/Unknown reminder actions use safe Home fallback behavior/i);
});

test('notification area shows snooze fallback note when runtime has no snooze support', async () => {
  const { Permissions } = require('../permissions/permissions');
  Permissions.getReminderCapabilities.mockResolvedValue({
    hasScheduling: true,
    hasAndroidChannel: false,
    hasIosCategory: false,
    hasResponseListener: true,
    hasSnooze: false,
  });

  const prefs = getDefaultPreferences();
  const { findByText } = render(
    <ThemeProvider prefs={prefs}>
      <SettingsScreen prefs={prefs} onChangePrefs={() => {}} />
    </ThemeProvider>
  );

  await findByText(/does not support scheduled snooze reminders/i);
});

test('textScale affects rendered typography sizes', () => {
  const prefs1 = getDefaultPreferences();
  prefs1.accessibility.textScale = 1;
  const prefs2 = getDefaultPreferences();
  prefs2.accessibility.textScale = 1.5;

  const r1 = render(
    <ThemeProvider prefs={prefs1}>
      <SettingsScreen prefs={prefs1} onChangePrefs={() => {}} />
    </ThemeProvider>
  );
  const r2 = render(
    <ThemeProvider prefs={prefs2}>
      <SettingsScreen prefs={prefs2} onChangePrefs={() => {}} />
    </ThemeProvider>
  );

  fireEvent.press(r1.getByTestId('settings-pane-tab-1'));
  fireEvent.press(r2.getByTestId('settings-pane-tab-1'));
  const s1 = r1.getByText('Theme');
  const s2 = r2.getByText('Theme');

  // Style is an array in RN; last fontSize comes from ThemeProvider scaling.
  const fontSize1 = Array.isArray(s1.props.style)
    ? [...s1.props.style].reverse().find((x: any) => x && x.fontSize)?.fontSize
    : s1.props.style?.fontSize;
  const fontSize2 = Array.isArray(s2.props.style)
    ? [...s2.props.style].reverse().find((x: any) => x && x.fontSize)?.fontSize
    : s2.props.style?.fontSize;

  expect(fontSize1).toBeTruthy();
  expect(fontSize2).toBeTruthy();
  expect(fontSize2).toBeGreaterThan(fontSize1);
});

test('TTS reads choice label on press when enabled', () => {
  const Speech = require('expo-speech');
  const prefs = getDefaultPreferences();
  prefs.accessibility.ttsEnabled = true;

  const { getByLabelText, getByTestId } = render(
    <ThemeProvider prefs={prefs}>
      <SettingsScreen prefs={prefs} onChangePrefs={() => {}} />
    </ThemeProvider>
  );

  fireEvent.press(getByTestId('settings-pane-tab-1'));
  fireEvent.press(getByLabelText('dark'));
  expect(Speech.speak).toHaveBeenCalled();
});

