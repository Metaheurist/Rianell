import React from 'react';
import { render, type RenderOptions } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/ThemeProvider';
import { I18nProvider } from '../i18n/I18nProvider';
import { getDefaultPreferences, type Preferences } from '../storage/preferences';

export function renderWithProviders(
  ui: React.ReactElement,
  {
    prefs = getDefaultPreferences(),
    onChangePrefs,
    ...options
  }: RenderOptions & { prefs?: Preferences; onChangePrefs?: (p: Preferences) => void } = {},
) {
  return render(
    <ThemeProvider prefs={prefs}>
      <I18nProvider prefs={prefs} onLocaleChange={onChangePrefs}>
        {ui}
      </I18nProvider>
    </ThemeProvider>,
    options,
  );
}
