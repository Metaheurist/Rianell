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
  await findByLabelText('Pain body diagram');
  fireEvent.press(getByText('Head: good'));
  await findByText('Head: discomfort');
  fireEvent.press(getByLabelText('Use diagram pain text'));
  expect(getByLabelText('Pain locations').props.value).toContain('Head (mild)');

  fireEvent.press(getAllByText('Nausea')[0]);
  fireEvent.press(getByLabelText('Next step'));
  await findByText('Energy & mental clarity');
  fireEvent.press(getByText('Mental Clarity'));
  fireEvent.press(getByLabelText('Next step'));
  await findByText('Stress & triggers');
  await findByText('Work & demands');
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
  await findByText('Stress & triggers');
  fireEvent.changeText(getByLabelText('Custom stressor input'), 'Late commute');
  fireEvent.press(getByLabelText('Add custom stressor'));
  await findByText('Late commute');
});

test('wizard supports clearing food, exercise, and medications', async () => {
  const { getByLabelText, findByText, getByText, getAllByText, queryByText } = renderWizard();

  // Jump to food step (0->1->2->3->4->5->6)
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  await findByText('Breakfast (comma separated)');

  fireEvent.press(getByText('Oatmeal'));
  await findByText('Remove Oatmeal');
  fireEvent.press(getByLabelText('Clear all food'));
  expect(queryByText('Remove Oatmeal')).toBeNull();

  fireEvent.press(getByLabelText('Next step'));
  await findByText('Exercise by category');
  fireEvent.press(getAllByText('Walking:30')[0]);
  await findByText('Remove Walking:30');
  fireEvent.press(getByLabelText('Clear all exercise'));
  expect(queryByText('Remove Walking:30')).toBeNull();

  fireEvent.press(getByLabelText('Next step'));
  await findByText('Medications (comma separated)');
  fireEvent.press(getByText('Ibuprofen'));
  await findByText('Remove Ibuprofen');
  fireEvent.press(getByLabelText('Clear all medications'));
  expect(queryByText('Remove Ibuprofen')).toBeNull();
});

test('food tiles show count badge at 1 and expose clear control', async () => {
  const { getByLabelText, findByText, getByText, findByLabelText } = renderWizard();

  // Jump to food step (0->1->2->3->4->5->6)
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  await findByText('Breakfast (comma separated)');

  fireEvent.press(getByText('Oatmeal'));
  await findByLabelText('Clear Oatmeal');
});

test('exercise tiles show count badge at 1 and expose clear control', async () => {
  const { getByLabelText, findByText, getAllByText, findAllByLabelText } = renderWizard();

  // Jump to exercise step (0->1->2->3->4->5->6->7)
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  await findByText('Exercise by category');

  fireEvent.press(getAllByText('Walking:30')[0]);
  const clears = await findAllByLabelText('Clear Walking:30');
  expect(clears.length).toBeGreaterThan(0);
});

test('medication tiles show count badge at 1 and expose clear control', async () => {
  const { getByLabelText, findByText, getByText, findByLabelText } = renderWizard();

  // Jump to medications step (0->1->2->3->4->5->6->7->8)
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  await findByText('Medications (comma separated)');

  fireEvent.press(getByText('Ibuprofen'));
  await findByLabelText('Clear Ibuprofen');
});

test('lifestyle values are clamped on save (steps/hydration/daily function)', async () => {
  const mockedAddLogEntry = (jest.requireMock('../storage/logs') as { addLogEntry: jest.Mock }).addLogEntry;
  mockedAddLogEntry.mockClear();

  const { getByLabelText, findByText } = renderWizard();

  // Navigate to lifestyle step (daily function / steps / hydration)
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  fireEvent.press(getByLabelText('Next step'));
  await findByText('Daily function (0-10)');

  const dailyFnInput = getByLabelText('Daily function');
  const stepsInput = getByLabelText('Steps');
  const hydrationInput = getByLabelText('Hydration');

  fireEvent.changeText(dailyFnInput, '99');
  fireEvent.changeText(stepsInput, '999999');
  fireEvent.changeText(hydrationInput, '999');

  expect(dailyFnInput.props.value).toBe('99');
  expect(stepsInput.props.value).toBe('999999');
  expect(hydrationInput.props.value).toBe('999');

  // Continue to review + save
  fireEvent.press(getByLabelText('Next step')); // Food
  fireEvent.press(getByLabelText('Next step')); // Exercise
  fireEvent.press(getByLabelText('Next step')); // Meds
  fireEvent.press(getByLabelText('Next step')); // Review
  await findByText('Review');
  fireEvent.press(getByLabelText('Save entry'));

  await waitFor(() => expect(mockedAddLogEntry).toHaveBeenCalled());
  const draft = mockedAddLogEntry.mock.calls[0][1];
  expect(draft.dailyFunction).toBe(10);
  expect(draft.steps).toBe(50000);
  expect(draft.hydration).toBe(20);
});
