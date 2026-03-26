import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { HomeScreen } from './HomeScreen';
import { ThemeProvider } from '../theme/ThemeProvider';
import { getDefaultPreferences } from '../storage/preferences';
import * as logs from '../storage/logs';

jest.mock('../storage/logs');

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useFocusEffect: (cb: () => void) => {
    cb();
  },
}));

function renderHome() {
  const prefs = getDefaultPreferences();
  return render(
    <ThemeProvider prefs={prefs}>
      <HomeScreen />
    </ThemeProvider>
  );
}

beforeEach(() => {
  mockNavigate.mockClear();
});

test('shows title and log-today FAB with accessibility', async () => {
  jest.mocked(logs.loadLogs).mockResolvedValue([]);
  const { getByText, getByLabelText } = renderHome();

  expect(getByText('Rianell')).toBeTruthy();
  await waitFor(() => {
    expect(getByText(/No log for today yet/i)).toBeTruthy();
  });
  const fab = getByLabelText('Log today');
  expect(fab).toBeTruthy();
  fireEvent.press(fab);
  expect(mockNavigate).toHaveBeenCalledWith('LogWizard');
});

test('reflects when today already has a log', async () => {
  const iso = new Date().toISOString().slice(0, 10);
  jest.mocked(logs.loadLogs).mockResolvedValue([{ date: iso }] as any);
  const { getByText } = renderHome();

  await waitFor(() => {
    expect(getByText(/You have logged today/i)).toBeTruthy();
  });
});
