import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { HomeWelcomeCard } from './HomeWelcomeCard';
import { renderWithProviders } from '../../test/renderWithProviders';
import { getDefaultPreferences } from '../../storage/preferences';

beforeEach(() => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(
    () => ({ remove: jest.fn() }) as unknown as ReturnType<typeof AccessibilityInfo.addEventListener>
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('HomeWelcomeCard renders pills and dismiss', () => {
  const onDismiss = jest.fn();
  const prefs = getDefaultPreferences();
  const { getByText, getAllByRole, getByLabelText } = renderWithProviders(
    <HomeWelcomeCard
      condition="Fibromyalgia"
      onDismiss={onDismiss}
      pills={[
        { icon: 'moon-outline', labelKey: 'home.welcome.pill.sleep', onPress: jest.fn() },
        { icon: 'happy-outline', labelKey: 'home.welcome.pill.mood', onPress: jest.fn() },
        { icon: 'flash-outline', labelKey: 'home.welcome.pill.energy', onPress: jest.fn() },
      ]}
    />,
    { prefs }
  );
  expect(getByText('Welcome to Rianell')).toBeTruthy();
  expect(getAllByRole('button').length).toBeGreaterThanOrEqual(4);
  fireEvent.press(getByLabelText('Close'));
  expect(onDismiss).toHaveBeenCalled();
});
