import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LogsScreen } from './LogsScreen';
import { ThemeProvider } from '../theme/ThemeProvider';
import { getDefaultPreferences } from '../storage/preferences';

jest.mock('../storage/logs', () => ({
  loadLogs: jest.fn(async () => []),
  saveLogs: jest.fn(async () => {}),
  migrateLegacyLogsIfNeeded: jest.fn(async () => {}),
  makeSampleLog: jest.fn(() => ({ date: '2026-01-01', bpm: 70, mood: 6, notes: '' })),
}));

test('logs screen shows empty state then adds sample', async () => {
  const prefs = getDefaultPreferences();
  const { findByText, getByLabelText } = render(
    <ThemeProvider prefs={prefs}>
      <LogsScreen />
    </ThemeProvider>
  );

  await findByText('No logs yet.');
  fireEvent.press(getByLabelText('Add sample log'));
  await findByText('2026-01-01');
});

