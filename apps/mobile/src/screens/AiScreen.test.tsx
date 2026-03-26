import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { AiScreen } from './AiScreen';
import { ThemeProvider } from '../theme/ThemeProvider';
import { getDefaultPreferences } from '../storage/preferences';

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
