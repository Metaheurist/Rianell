import React from 'react';
import { render } from '@testing-library/react-native';
import { ChartsScreen } from './ChartsScreen';
import { ThemeProvider } from '../theme/ThemeProvider';
import { getDefaultPreferences } from '../storage/preferences';

jest.mock('../storage/logs', () => ({
  loadLogs: jest.fn(async () => []),
}));

test('charts shows empty state when no logs in range', async () => {
  const prefs = getDefaultPreferences();
  const { findByLabelText, getByText } = render(
    <ThemeProvider prefs={prefs}>
      <ChartsScreen />
    </ThemeProvider>
  );

  await findByLabelText('Charts empty state');
  expect(getByText(/No log entries in this date range/i)).toBeTruthy();
});
