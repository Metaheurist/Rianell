import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { MoodScreen } from './MoodScreen';
import { renderWithProviders } from '../test/renderWithProviders';
import { getDefaultPreferences } from '../storage/preferences';

const mockLoadLogs = jest.fn(async () => [] as Awaited<ReturnType<typeof import('../storage/logs').loadLogs>>);

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: jest.fn() }),
  };
});

jest.mock('../storage/logs', () => ({
  loadLogs: (...args: unknown[]) => mockLoadLogs(...(args as Parameters<typeof mockLoadLogs>)),
  saveLogs: jest.fn(async () => {}),
}));

function renderMood(prefs = getDefaultPreferences()) {
  return renderWithProviders(<MoodScreen prefs={prefs} />, { prefs });
}

test('mood screen shows warm empty state when no readings', async () => {
  mockLoadLogs.mockResolvedValueOnce([]);
  const { findByText } = renderMood();

  await findByText('Your mood story builds here');
  await findByText(/Each check-in helps spot patterns/);
});

test('screening modal shows what-is-this info card on first open', async () => {
  mockLoadLogs.mockResolvedValueOnce([]);
  const { findByText } = renderMood();

  fireEvent.press(await findByText('Quick mood check'));

  expect(
    await findByText(/validated wellbeing questions/i),
  ).toBeTruthy();
});
