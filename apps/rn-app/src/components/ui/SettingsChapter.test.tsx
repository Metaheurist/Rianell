import React from 'react';
import { Text } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { SettingsChapter } from './SettingsChapter';
import { renderWithProviders } from '../../test/renderWithProviders';
import { getDefaultPreferences } from '../../storage/preferences';

test('SettingsChapter collapses and expands', () => {
  const prefs = getDefaultPreferences();
  const { getByText, queryByText, getByRole } = renderWithProviders(
    <SettingsChapter title="Getting started" iconName="rocket-outline" defaultOpen={false}>
      <Text>Child content</Text>
    </SettingsChapter>,
    { prefs }
  );
  expect(queryByText('Child content')).toBeNull();
  fireEvent.press(getByRole('button', { name: 'Getting started' }));
  expect(getByText('Child content')).toBeTruthy();
  fireEvent.press(getByRole('button', { name: 'Getting started' }));
  expect(queryByText('Child content')).toBeNull();
});
