import React from 'react';
import { Text } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { Accordion } from './Accordion';
import { SegmentedScaleInput } from './SegmentedScaleInput';
import { renderWithProviders } from '../../test/renderWithProviders';
import { getDefaultPreferences } from '../../storage/preferences';

test('Accordion defaults closed and toggles content', () => {
  const prefs = getDefaultPreferences();
  const { getByText, queryByText, getByRole } = renderWithProviders(
    <Accordion title="Advanced vitals">
      <Text>Optional fields</Text>
    </Accordion>,
    { prefs },
  );
  expect(queryByText('Optional fields')).toBeNull();
  fireEvent.press(getByRole('button', { name: 'Advanced vitals' }));
  expect(getByText('Optional fields')).toBeTruthy();
});

test('SegmentedScaleInput selects a value within range', () => {
  const prefs = getDefaultPreferences();
  const onChange = jest.fn();
  const { getByLabelText } = renderWithProviders(
    <SegmentedScaleInput value={5} onChange={onChange} min={1} max={10} accessibilityLabel="Stiffness" />,
    { prefs },
  );
  fireEvent.press(getByLabelText('Stiffness 8'));
  expect(onChange).toHaveBeenCalledWith(8);
});
