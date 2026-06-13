import React from 'react';
import { renderWithProviders } from '../test/renderWithProviders';
import { SettingsPrivacyRegionPane } from './SettingsPrivacyRegionPane';
import { getDefaultPreferences } from '../storage/preferences';

test('privacy region pane shows residency label and region options', () => {
  const prefs = { ...getDefaultPreferences(), privacyRegion: 'eea_uk' };
  const { getByText } = renderWithProviders(
    <SettingsPrivacyRegionPane prefs={prefs} onChangePrefs={() => {}} />,
    { prefs },
  );
  getByText('Privacy & region');
  getByText('View privacy policies');
  getByText('EEA & United Kingdom');
});

test('privacy region pane shows language picker label', () => {
  const prefs = { ...getDefaultPreferences(), privacyRegion: 'eea_uk', uiLocale: 'en-GB' };
  const { getByText } = renderWithProviders(
    <SettingsPrivacyRegionPane prefs={prefs} onChangePrefs={() => {}} />,
    { prefs },
  );
  getByText('Language');
});
