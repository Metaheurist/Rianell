import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LogWizardScreen } from './LogWizardScreen';
import { ThemeProvider } from '../theme/ThemeProvider';
import { getDefaultPreferences } from '../storage/preferences';

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ goBack: mockGoBack }),
  };
});

jest.mock('../storage/logs', () => ({
  loadLogs: jest.fn(async () => [
    { date: '2026-01-01', symptoms: ['Nausea', 'Headache'], stressors: ['Work deadline'] },
    { date: '2026-01-02', symptoms: ['Nausea'], stressors: ['Work deadline', 'Travel'] },
  ]),
  saveLogs: jest.fn(async () => {}),
  addLogEntry: jest.fn((existing: unknown[], next: unknown) => [...existing, next]),
  getFrequentLogItems: jest.requireActual('../storage/logs').getFrequentLogItems,
}));

function renderWizard() {
  const prefs = getDefaultPreferences();
  return render(
    <ThemeProvider prefs={prefs}>
      <LogWizardScreen />
    </ThemeProvider>
  );
}

test('log wizard can progress through stressors and save', async () => {
  const { getByLabelText, findByText, findByLabelText, getByText, getAllByText } = renderWizard();

  fireEvent.press(getByLabelText('Next step'));
  await findByText('BPM (30–120)');

  fireEvent.press(getByLabelText('Next step'));
  await findByText('Symptoms');
  await findByText('Frequent symptoms');
  fireEvent.press(getByText('Head: none'));
  await findByText('Head: mild');

  fireEvent.press(getAllByText('Nausea')[0]);
  fireEvent.press(getByLabelText('Next step'));
  await findByText('Energy / clarity');
  fireEvent.press(getByText('Good'));
  fireEvent.press(getByLabelText('Next step'));
  await findByText('Frequent stressors');
  fireEvent.press(getAllByText('Work deadline')[0]);
  fireEvent.press(getByLabelText('Next step'));
  await findByText('Daily function (0-10)');
  fireEvent.press(getAllByText('6')[0]);
  fireEvent.press(getAllByText('8')[0]);
  fireEvent.press(getByLabelText('Next step'));
  await findByText('Breakfast (comma separated)');
  fireEvent.press(getByText('Oatmeal'));
  fireEvent.press(getByText('Yogurt'));
  fireEvent.press(getByText('Remove Oatmeal'));
  fireEvent.press(getByText('Oatmeal'));
  fireEvent.changeText(getByLabelText('Lunch items'), 'Chicken salad');
  fireEvent.changeText(getByLabelText('Dinner items'), 'Salmon, Rice');
  fireEvent.changeText(getByLabelText('Snack items'), 'Apple');
  fireEvent.press(getByLabelText('Next step'));
  await findByText('Cardio');
  fireEvent.press(getAllByText('Walking:30')[0]);
  fireEvent.changeText(getByLabelText('Exercise items'), 'Walking:30, Stretching:15');
  fireEvent.press(getByLabelText('Next step'));
  await findByText('Medications (comma separated)');
  fireEvent.press(getByText('Ibuprofen'));
  fireEvent.press(getByText('Remove Ibuprofen'));
  fireEvent.press(getByText('Ibuprofen'));
  fireEvent.changeText(getByLabelText('Medication names'), 'Ibuprofen');
  fireEvent.changeText(getByLabelText('Log notes'), 'Felt ok');
  fireEvent.press(getByLabelText('Next step'));
  await findByText('Review');
  await findByLabelText('Log review summary');
  fireEvent.press(getByLabelText('Save entry'));

  const mockedAddLogEntry = (jest.requireMock('../storage/logs') as { addLogEntry: jest.Mock }).addLogEntry;
  await waitFor(() => expect(mockedAddLogEntry).toHaveBeenCalled());
  const draft = mockedAddLogEntry.mock.calls[0][1];
  expect(draft.food?.breakfast).toEqual(expect.arrayContaining(['Oatmeal', 'Yogurt']));
  expect(draft.food?.lunch).toEqual(['Chicken salad']);
  expect(draft.food?.dinner).toEqual(['Salmon', 'Rice']);
  expect(draft.food?.snack).toEqual(['Apple']);
  expect(draft.exercise).toEqual([{ name: 'Walking', duration: 30 }, { name: 'Stretching', duration: 15 }]);
  expect(draft.medications?.[0]?.name).toBe('Ibuprofen');
  expect(draft.notes).toContain('Felt ok');
});

test('wizard supports custom symptom and stressor entries', async () => {
  const { getByLabelText, findByText } = renderWizard();

  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  await findByText('Symptoms');
  fireEvent.changeText(getByLabelText('Custom symptom input'), 'Brain fog');
  fireEvent.press(getByLabelText('Add custom symptom'));
  await findByText('Brain fog');

  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  await findByText('Stressors');
  fireEvent.changeText(getByLabelText('Custom stressor input'), 'Late commute');
  fireEvent.press(getByLabelText('Add custom stressor'));
  await findByText('Late commute');
});
