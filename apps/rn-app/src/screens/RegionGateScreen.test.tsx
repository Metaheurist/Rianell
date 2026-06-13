import React from 'react';
import { renderWithProviders } from '../test/renderWithProviders';
import { RegionGateScreen } from './RegionGateScreen';
import { getDefaultPreferences } from '../storage/preferences';

test('region gate shows confirm and view policies actions', () => {
  const prefs = getDefaultPreferences();
  const { getByText } = renderWithProviders(
    <RegionGateScreen prefs={prefs} onConfirm={() => {}} />,
    { prefs },
  );
  getByText('Privacy region');
  getByText('Confirm and continue');
  getByText('View applicable policies');
});
