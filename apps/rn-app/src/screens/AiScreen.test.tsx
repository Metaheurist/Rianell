import React from 'react';
import { ScrollView } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { AiScreen } from './AiScreen';
import { renderWithProviders } from '../test/renderWithProviders';
import { getDefaultPreferences } from '../storage/preferences';
import { loadLogs } from '../storage/logs';
import { generateSummaryNote } from '../ai/llm';

/** ISO date within the default 30-day AI range (fixed dates like 2026-03-25 fail in CI later). */
function recentLogDate(daysAgo = 0): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function sampleLogEntry() {
  return {
    date: recentLogDate(),
    flare: 'No' as const,
    mood: 7,
    sleep: 6,
    fatigue: 4,
    symptoms: ['Nausea'],
    stressors: ['Work deadline'],
  };
}

jest.mock('../storage/logs', () => ({
  loadLogs: jest.fn(async () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return [
      {
        date: `${y}-${m}-${day}`,
        flare: 'No',
        mood: 7,
        sleep: 6,
        fatigue: 4,
        symptoms: ['Nausea'],
        stressors: ['Work deadline'],
      },
    ];
  }),
}));
jest.mock('../ai/llm', () => ({
  generateSummaryNote: jest.fn(async () => 'AI summary note test'),
}));

const mockedLoadLogs = loadLogs as jest.MockedFunction<typeof loadLogs>;
const mockedGenerateSummaryNote = generateSummaryNote as jest.MockedFunction<typeof generateSummaryNote>;

test('ai screen renders summary from logs', async () => {
  const prefs = getDefaultPreferences();
  const { findByText, getByText } = renderWithProviders(
    <AiScreen prefs={prefs} />,
    { prefs },
  );

  await findByText(/What we found/i);
  await findByText('At a glance');
  await findByText('Summary note');
  await waitFor(() => expect(mockedGenerateSummaryNote).toHaveBeenCalled());
  await findByText('AI summary note test');
  await findByText('What you logged');
  await findByText("How you're doing");
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
  mockedGenerateSummaryNote.mockClear();
  mockedLoadLogs.mockResolvedValue([sampleLogEntry()]);

  const prefs = getDefaultPreferences();
  const { UNSAFE_getByType } = renderWithProviders(
    <AiScreen prefs={prefs} />,
    { prefs },
  );

  await waitFor(() => expect(mockedLoadLogs).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(mockedGenerateSummaryNote).toHaveBeenCalled());

  const scroll = UNSAFE_getByType(ScrollView);
  const refresh = scroll.props.refreshControl;
  expect(refresh).toBeTruthy();

  await act(async () => {
    await refresh.props.onRefresh();
  });

  await waitFor(() => expect(mockedLoadLogs).toHaveBeenCalledTimes(2));
});

test('ai screen shows disabled copy when aiEnabled is false', async () => {
  const prefs = getDefaultPreferences();
  const disabledPrefs = {
    ...prefs,
    aiEnabled: false,
  };

  const { findByText, queryByText } = renderWithProviders(
    <AiScreen prefs={disabledPrefs} />,
    { prefs: disabledPrefs },
  );

  await findByText(/AI features are disabled in Settings/i);
  expect(queryByText('Summary note')).toBeNull();
});
