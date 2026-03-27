import React from 'react';
import { Linking } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { HomeScreen } from './HomeScreen';
import { ThemeProvider } from '../theme/ThemeProvider';
import { getDefaultPreferences } from '../storage/preferences';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/bottom-tabs', () => ({
  useBottomTabBarHeight: () => 49,
}));

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: mockNavigate }),
    useFocusEffect: (effect: () => void) => {
      React.useEffect(() => {
        effect();
      }, []);
    },
  };
});

jest.mock('../storage/logs', () => ({
  loadLogs: jest.fn(async () => []),
}));
jest.mock('../ai/llm', () => ({
  generateMotd: jest.fn(async () => 'Test MOTD'),
}));
jest.mock('../performance/benchmark', () => ({
  loadCachedBenchmark: jest.fn(async () => null),
}));

import { loadLogs } from '../storage/logs';

function renderHome() {
  const prefs = getDefaultPreferences();
  return render(
    <ThemeProvider prefs={prefs}>
      <HomeScreen prefs={prefs} />
    </ThemeProvider>
  );
}

beforeEach(() => {
  mockNavigate.mockClear();
  (loadLogs as jest.Mock).mockResolvedValue([]);
});

test('home shows title and prompts to log when no entry today', async () => {
  const { getByText, findByText } = renderHome();
  getByText('Rianell');
  await findByText('Test MOTD');
  await waitFor(() => {
    expect(loadLogs).toHaveBeenCalled();
  });
  await findByText('No log for today yet. Tap + to record how you feel.');
});

test('home shows logged message when today exists in logs', async () => {
  const today = new Date().toISOString().slice(0, 10);
  (loadLogs as jest.Mock).mockResolvedValue([{ date: today, mood: 5 }]);
  const { findByText } = renderHome();
  await findByText('You have logged today. Open View logs to browse or edit entries.');
});

test('FAB navigates to Log wizard', async () => {
  const { getByLabelText } = renderHome();
  await waitFor(() => {
    expect(loadLogs).toHaveBeenCalled();
  });
  fireEvent.press(getByLabelText('Log today, Beta'));
  expect(mockNavigate).toHaveBeenCalledWith('LogWizard');
});

test('header Goals and targets navigates to Charts in Balance', async () => {
  const { getByLabelText } = renderHome();
  await waitFor(() => {
    expect(loadLogs).toHaveBeenCalled();
  });
  fireEvent.press(getByLabelText('Goals and targets'));
  expect(mockNavigate).toHaveBeenCalledWith('Charts', { initialView: 'balance' });
});

test('header Report a bug opens security documentation URL', async () => {
  const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
  const fetchSpy = jest
    .spyOn(global, 'fetch' as never)
    .mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as never);
  const { getByLabelText, findByText } = renderHome();
  await waitFor(() => {
    expect(loadLogs).toHaveBeenCalled();
  });
  fireEvent.press(getByLabelText('Report a bug'));
  await findByText('Report a bug');
  fireEvent.changeText(getByLabelText('Bug description'), 'Repro steps from RN test');
  fireEvent.press(getByLabelText('Submit bug report'));
  await waitFor(() => {
    expect(fetchSpy).toHaveBeenCalled();
  });
  expect(openSpy).not.toHaveBeenCalledWith(expect.stringContaining('SECURITY.md'));
  fetchSpy.mockRestore();
  openSpy.mockRestore();
});

test('header Settings navigates to Settings tab', async () => {
  const { getByLabelText } = renderHome();
  await waitFor(() => {
    expect(loadLogs).toHaveBeenCalled();
  });
  fireEvent.press(getByLabelText('Settings'));
  expect(mockNavigate).toHaveBeenCalledWith('Settings');
});
