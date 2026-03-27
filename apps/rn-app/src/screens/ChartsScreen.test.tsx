import React from 'react';
import { AccessibilityInfo, ScrollView } from 'react-native';

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useRoute: () => ({ key: 'Charts', name: 'Charts', params: undefined }),
  };
});
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { ChartsScreen } from './ChartsScreen';
import { ThemeProvider } from '../theme/ThemeProvider';
import { getDefaultPreferences } from '../storage/preferences';
import { loadLogs } from '../storage/logs';

jest.mock('../storage/logs', () => ({
  loadLogs: jest.fn(async () => []),
}));

const mockedLoadLogs = loadLogs as jest.MockedFunction<typeof loadLogs>;

beforeEach(() => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(
    () =>
      ({
        remove: jest.fn(),
      }) as unknown as ReturnType<typeof AccessibilityInfo.addEventListener>
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

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

test('charts range and view chips expose accessibility labels', async () => {
  const prefs = getDefaultPreferences();
  const { findByLabelText } = render(
    <ThemeProvider prefs={prefs}>
      <ChartsScreen />
    </ThemeProvider>
  );

  await findByLabelText('Charts date range 30 days');
  await findByLabelText('Chart view Combined');
});

test('balance view shows target snapshot when logs exist', async () => {
  const today = new Date().toISOString().slice(0, 10);
  mockedLoadLogs.mockResolvedValue([{ date: today, mood: 6, sleep: 7, fatigue: 4 }]);

  const prefs = getDefaultPreferences();
  prefs.goals.moodTarget = 9;
  const { findByLabelText, getByLabelText, findByText } = render(
    <ThemeProvider prefs={prefs}>
      <ChartsScreen prefs={prefs} />
    </ThemeProvider>
  );

  await waitFor(() => expect(mockedLoadLogs).toHaveBeenCalled());
  fireEvent.press(getByLabelText('Chart view Balance'));
  await findByLabelText('Charts target snapshot');
  await findByLabelText('Balance visual chart');
  await findByText(/target 9.0/);
});

test('combined view shows visual trend chart when logs exist', async () => {
  const today = new Date();
  const older = new Date(today);
  older.setDate(older.getDate() - 1);
  const logs = [
    {
      date: older.toISOString().slice(0, 10),
      mood: 5,
      sleep: 6,
      fatigue: 4,
      flare: 'No',
    },
    {
      date: today.toISOString().slice(0, 10),
      mood: 7,
      sleep: 8,
      fatigue: 3,
      flare: 'No',
    },
  ];
  mockedLoadLogs.mockResolvedValue(logs);

  const prefs = getDefaultPreferences();
  const { findByLabelText } = render(
    <ThemeProvider prefs={prefs}>
      <ChartsScreen />
    </ThemeProvider>
  );

  await findByLabelText('Combined trend chart');
});

test('individual view shows per-metric visual chart baseline', async () => {
  const today = new Date();
  const older = new Date(today);
  older.setDate(older.getDate() - 1);
  mockedLoadLogs.mockResolvedValue([
    {
      date: older.toISOString().slice(0, 10),
      mood: 5,
      sleep: 6,
      fatigue: 4,
      flare: 'No',
    },
    {
      date: today.toISOString().slice(0, 10),
      mood: 7,
      sleep: 8,
      fatigue: 3,
      flare: 'No',
    },
  ]);

  const prefs = getDefaultPreferences();
  const { findAllByLabelText, getByLabelText } = render(
    <ThemeProvider prefs={prefs}>
      <ChartsScreen />
    </ThemeProvider>
  );

  fireEvent.press(getByLabelText('Chart view Individual'));
  const charts = await findAllByLabelText(/Individual trend chart/i);
  expect(charts.length).toBeGreaterThan(0);
});

test('charts shows reduced-motion hint when OS reduced motion is enabled', async () => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  mockedLoadLogs.mockResolvedValue([]);

  const prefs = getDefaultPreferences();
  const { findByText } = render(
    <ThemeProvider prefs={prefs}>
      <ChartsScreen />
    </ThemeProvider>
  );

  await findByText(/Reduced motion is enabled/i);
});
