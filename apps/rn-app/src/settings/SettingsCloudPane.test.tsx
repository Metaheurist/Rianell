import React from 'react';
import { render } from '@testing-library/react-native';
import { SettingsCloudPane } from './SettingsCloudPane';
import { ThemeProvider } from '../theme/ThemeProvider';
import { getDefaultPreferences } from '../storage/preferences';

test('cloud pane shows configuration hint when Supabase env is missing', () => {
  const prefs = getDefaultPreferences();
  const { getByText } = render(
    <ThemeProvider prefs={prefs}>
      <SettingsCloudPane />
    </ThemeProvider>
  );
  getByText(/EXPO_PUBLIC_SUPABASE_URL/);
  getByText(/SUPABASE_URL/);
});
