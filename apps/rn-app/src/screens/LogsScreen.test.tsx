import React from 'react';
import { FlatList } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LogsScreen } from './LogsScreen';
import { ThemeProvider } from '../theme/ThemeProvider';
import { getDefaultPreferences } from '../storage/preferences';

const mockLoadLogs = jest.fn(async () => [] as Awaited<ReturnType<typeof import('../storage/logs').loadLogs>>);

function ymdDaysFromToday(delta: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

jest.mock('../storage/logs', () => {
  function todayYmd(): string {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return {
    // Wrapper so `mockLoadLogs` is read when `loadLogs` runs (after const init), not when the mock factory runs (Jest hoisting).
    loadLogs: (...a: unknown[]) => mockLoadLogs(...(a as Parameters<typeof mockLoadLogs>)),
    saveLogs: jest.fn(async () => {}),
    migrateLegacyLogsIfNeeded: jest.fn(async () => {}),
    makeSampleLog: jest.fn(() => ({
      date: todayYmd(),
      flare: 'No' as const,
      bpm: 70,
      mood: 6,
      fatigue: 3,
      sleep: 7,
      notes: '',
    })),
  };
});

function renderLogs() {
  const prefs = getDefaultPreferences();
  return render(
    <ThemeProvider prefs={prefs}>
      <LogsScreen />
    </ThemeProvider>
  );
}

test('logs screen shows empty state when no logs', async () => {
  mockLoadLogs.mockResolvedValueOnce([]);
  const { findByText, getByLabelText } = renderLogs();

  await findByText(/No logs yet\./);
  expect(getByLabelText('Date range, last 30 days')).toBeTruthy();
  expect(getByLabelText('Sort, newest first')).toBeTruthy();
});

test('logs screen shows entries and count after load', async () => {
  const older = ymdDaysFromToday(-2);
  const newer = ymdDaysFromToday(-1);
  mockLoadLogs.mockResolvedValueOnce([
    { date: older, flare: 'No', mood: 5, fatigue: 2, sleep: 8 },
    { date: newer, flare: 'No', mood: 6, fatigue: 2, sleep: 7 },
  ] as Awaited<ReturnType<typeof import('../storage/logs').loadLogs>>);

  const { findByText } = renderLogs();

  await findByText('Showing 2 of 2 entries');
  await findByText(newer);
});

test('logs screen text filter narrows results', async () => {
  const older = ymdDaysFromToday(-2);
  const newer = ymdDaysFromToday(-1);
  mockLoadLogs.mockResolvedValueOnce([
    { date: older, flare: 'No', mood: 5, fatigue: 2, sleep: 8, notes: 'Stress at work', symptoms: ['Headache'] },
    { date: newer, flare: 'No', mood: 6, fatigue: 2, sleep: 7, notes: 'Calm day', symptoms: ['Nausea'] },
  ] as Awaited<ReturnType<typeof import('../storage/logs').loadLogs>>);

  const { findByText, getByLabelText, queryByText } = renderLogs();
  await findByText('Showing 2 of 2 entries');
  fireEvent.changeText(getByLabelText('Filter logs text'), 'headache');
  await findByText('Showing 1 of 2 entries');
  expect(queryByText(newer)).toBeNull();
});

test('logs entry opens detail modal with share/delete actions', async () => {
  const day = ymdDaysFromToday(-1);
  mockLoadLogs.mockResolvedValueOnce([
    {
      date: day,
      flare: 'No',
      mood: 6,
      fatigue: 2,
      sleep: 7,
      notes: 'Detail modal test',
      symptoms: ['Nausea'],
      stressors: ['Work deadline'],
      painLocation: 'Left knee (mild)',
      food: { breakfast: ['Oatmeal'], lunch: [], dinner: [], snack: [] },
      exercise: [{ name: 'Walking', duration: 30 }],
    },
  ] as Awaited<ReturnType<typeof import('../storage/logs').loadLogs>>);

  const { findByLabelText, findByText, findAllByText } = renderLogs();
  fireEvent.press(await findByLabelText(`Open log entry ${day}`));
  await findByText('Share');
  await findByLabelText('Delete log entry');
  expect((await findAllByText(/Symptoms: Nausea/)).length).toBeGreaterThan(0);
  expect((await findAllByText(/Stressors: Work deadline/)).length).toBeGreaterThan(0);
  await findByText(/Pain locations: Left knee/);
  expect((await findAllByText(/Food: Oatmeal/)).length).toBeGreaterThan(0);
  expect((await findAllByText(/Exercise: Walking:30/)).length).toBeGreaterThan(0);
});

test('logs entry edit flow updates details and persists', async () => {
  const day = ymdDaysFromToday(-1);
  mockLoadLogs.mockResolvedValueOnce([
    { date: day, flare: 'No', bpm: 70, mood: 6, fatigue: 2, sleep: 7, notes: 'Before edit' },
  ] as Awaited<ReturnType<typeof import('../storage/logs').loadLogs>>);

  const mockedSaveLogs = (jest.requireMock('../storage/logs') as { saveLogs: jest.Mock }).saveLogs;
  mockedSaveLogs.mockClear();

  const { findByLabelText, findByDisplayValue, getByLabelText, findByText, findAllByText } = renderLogs();
  fireEvent.press(await findByLabelText(`Open log entry ${day}`));
  fireEvent.press(await findByLabelText('Edit log entry'));
  await findByDisplayValue(day);

  fireEvent.changeText(getByLabelText('Edit log notes'), 'After edit');
  fireEvent.press(getByLabelText('Set flare Yes'));
  fireEvent.changeText(getByLabelText('Edit log bpm'), '88');
  fireEvent.press(getByLabelText('Save log edit'));

  expect((await findAllByText(/Flare Yes/)).length).toBeGreaterThan(0);
  expect((await findAllByText(/BPM 88/)).length).toBeGreaterThan(0);
  await findByText(/Notes: After edit/);

  await waitFor(() => expect(mockedSaveLogs).toHaveBeenCalled());
});

test('dev-only: add sample log adds row when __DEV__', async () => {
  if (!__DEV__) {
    console.warn('Skipping add-sample test when __DEV__ is false');
    return;
  }
  mockLoadLogs.mockResolvedValueOnce([]);
  const { findByText, getByLabelText } = renderLogs();
  await findByText(/No logs yet\./);
  const sampleDate = ymdDaysFromToday(0);
  fireEvent.press(getByLabelText('Add sample log'));
  await waitFor(() => findByText(sampleDate));
});

test('large-list baseline exposes virtualization tuning props', async () => {
  const rows = Array.from({ length: 260 }, (_, idx) => ({
    date: ymdDaysFromToday(-idx),
    flare: idx % 3 === 0 ? 'Yes' : ('No' as const),
    mood: 5,
    fatigue: 3,
    sleep: 7,
    notes: `note-${idx}`,
  }));
  mockLoadLogs.mockResolvedValueOnce(rows as Awaited<ReturnType<typeof import('../storage/logs').loadLogs>>);

  const { UNSAFE_getByType, findByText, getByLabelText } = renderLogs();
  fireEvent.press(getByLabelText('Date range, all entries'));
  await findByText('Showing 260 of 260 entries');
  const list = UNSAFE_getByType(FlatList);
  expect(list.props.getItemLayout).toBeTruthy();
  expect(list.props.windowSize).toBeGreaterThanOrEqual(8);
  expect(list.props.maxToRenderPerBatch).toBeGreaterThanOrEqual(10);
});
