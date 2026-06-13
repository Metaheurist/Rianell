import React from 'react';
import { renderWithProviders } from '../test/renderWithProviders';
import { SettingsCloudPane } from './SettingsCloudPane';
import { getDefaultPreferences } from '../storage/preferences';

test('cloud pane shows configuration hint when Supabase env is missing', () => {
  const prefs = getDefaultPreferences();
  const { getByText } = renderWithProviders(<SettingsCloudPane />, { prefs });
  getByText(/Cloud sync is not configured/);
});
