import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { EmptyState } from './EmptyState';
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

test('logs variant renders title and CTA', () => {
  const onAction = jest.fn();
  const prefs = getDefaultPreferences();
  const { getByText, getByLabelText } = renderWithProviders(
    <EmptyState variant="logs" actionLabel="Add today's entry" onAction={onAction} />,
    { prefs }
  );
  expect(getByText('Your health story starts here')).toBeTruthy();
  fireEvent.press(getByText("Add today's entry"));
  expect(onAction).toHaveBeenCalled();
});

test('ai variant renders without CTA when action omitted', () => {
  const prefs = getDefaultPreferences();
  const { getByText, queryByRole } = renderWithProviders(<EmptyState variant="ai" />, { prefs });
  expect(getByText('Insights are on their way')).toBeTruthy();
  expect(queryByRole('button')).toBeNull();
});
