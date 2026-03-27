import React from 'react';
import { ScrollView } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { AiScreen } from './AiScreen';
import { ThemeProvider } from '../theme/ThemeProvider';
import { getDefaultPreferences } from '../storage/preferences';
import { loadLogs } from '../storage/logs';

jest.mock('../storage/logs', () => ({
  loadLogs: jest.fn(async () => [
    {
      date: '2026-03-25',
      flare: 'No',
      mood: 7,
      sleep: 6,
      fatigue: 4,
      symptoms: ['Nausea'],
      stressors: ['Work deadline'],
    },
  ]),
}));

const mockedLoadLogs = loadLogs as jest.MockedFunction<typeof loadLogs>;

test('ai screen renders summary from logs', async () => {
  const prefs = getDefaultPreferences();
  const { findByText, getByText } = render(
    <ThemeProvider prefs={prefs}>
      <AiScreen />
    </ThemeProvider>
  );

  await findByText(/What we found/i);
  await findByText('What you logged');
  await findByText('How you are doing');
  await findByText('Things to watch');
  await findByText('Important');
  await findByText('Possible flare-up');
  await findByText('Correlations');
  await findByText('Groups that change together');
  await findByText(/Top symptoms:/i);
  fireEvent.press(getByText('14d'));
  await waitFor(() => expect(getByText(/Range:/i)).toBeTruthy());
});

test('ai screen pull-to-refresh calls loadLogs again', async () => {
  mockedLoadLogs.mockClear();
  mockedLoadLogs.mockResolvedValue([
    {
      date: '2026-03-25',
      flare: 'No',
      mood: 7,
      sleep: 6,
      fatigue: 4,
      symptoms: ['Nausea'],
      stressors: ['Work deadline'],
    },
  ]);

  const prefs = getDefaultPreferences();
  const { UNSAFE_getByType } = render(
    <ThemeProvider prefs={prefs}>
      <AiScreen />
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
