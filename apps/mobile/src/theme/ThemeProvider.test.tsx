import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ThemeProvider, useTheme } from './ThemeProvider';
import { getDefaultPreferences } from '../storage/preferences';

function Probe() {
  const t = useTheme();
  return <Text testID="probe">{`${t.mode}|${t.team}|${Math.round(t.textScale * 100)}`}</Text>;
}

test('ThemeProvider respects manual appearance override + textScale', () => {
  const prefs = getDefaultPreferences();
  prefs.appearanceMode = 'dark';
  prefs.team = 'mono';
  prefs.accessibility.textScale = 1.5;

  const { getByTestId } = render(
    <ThemeProvider prefs={prefs}>
      <Probe />
    </ThemeProvider>
  );

  expect(getByTestId('probe').props.children).toBe('dark|mono|150');
});

