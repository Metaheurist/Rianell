import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { HomeDiscoveryChips } from './HomeDiscoveryChips';
import { renderWithProviders } from '../../test/renderWithProviders';
import { getDefaultPreferences } from '../../storage/preferences';

test('HomeDiscoveryChips renders three accessible chips', () => {
  const prefs = getDefaultPreferences();
  const { getByLabelText } = renderWithProviders(
    <HomeDiscoveryChips onOpenGoals={jest.fn()} onNavigateMood={jest.fn()} />,
    { prefs }
  );
  expect(getByLabelText('How does mood tracking help?')).toBeTruthy();
  expect(getByLabelText('Set my first health goals')).toBeTruthy();
  expect(getByLabelText('What can AI analysis show me?')).toBeTruthy();
});

test('goals chip calls onOpenGoals', () => {
  const onOpenGoals = jest.fn();
  const prefs = getDefaultPreferences();
  const { getByLabelText } = renderWithProviders(
    <HomeDiscoveryChips onOpenGoals={onOpenGoals} onNavigateMood={jest.fn()} />,
    { prefs }
  );
  fireEvent.press(getByLabelText('Set my first health goals'));
  expect(onOpenGoals).toHaveBeenCalled();
});
