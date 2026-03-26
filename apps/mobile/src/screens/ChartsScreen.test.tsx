import React from 'react';
import { ScrollView } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';
import { ChartsScreen } from './ChartsScreen';
import { ThemeProvider } from '../theme/ThemeProvider';
import { getDefaultPreferences } from '../storage/preferences';
import { loadLogs } from '../storage/logs';

jest.mock('../storage/logs', () => ({
  loadLogs: jest.fn(async () => []),
}));

const mockedLoadLogs = loadLogs as jest.MockedFunction<typeof loadLogs>;

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

test('charts pull-to-refresh calls loadLogs again', async () => {
  mockedLoadLogs.mockClear();
  mockedLoadLogs.mockResolvedValue([]);

  const prefs = getDefaultPreferences();
  const { UNSAFE_getByType } = render(
    <ThemeProvider prefs={prefs}>
      <ChartsScreen />
    </ThemeProvider>
  );

  await waitFor(() => expect(mockedLoadLogs).toHaveBeenCalledTimes(1));

  const scroll = UNSAFE_getByType(ScrollView);
  const refresh = scroll.props.refreshControl;
  expect(refresh).toBeTruthy();

  await act(async () => {
    await refresh.props.onRefresh();
  });

  await waitFor(() => expect(mockedLoadLogs).toHaveBeenCalledTimes(2));
});
