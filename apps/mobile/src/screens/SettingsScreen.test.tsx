import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SettingsScreen } from './SettingsScreen';
import { ThemeProvider } from '../theme/ThemeProvider';
import { getDefaultPreferences } from '../storage/preferences';

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
}));

test('settings renders theme and accessibility sections', () => {
  const prefs = getDefaultPreferences();
  const { getByText } = render(
    <ThemeProvider prefs={prefs}>
      <SettingsScreen prefs={prefs} onChangePrefs={() => {}} />
    </ThemeProvider>
  );

  getByText('Theme');
  getByText('Accessibility');
  getByText('Enable AI features & Goals');
  getByText('Large text');
  getByText('Text-to-speech (tap-to-read)');
  getByText('Read mode (auto-read on focus)');
});

test('textScale affects rendered typography sizes', () => {
  const prefs1 = getDefaultPreferences();
  prefs1.accessibility.textScale = 1;
  const prefs2 = getDefaultPreferences();
  prefs2.accessibility.textScale = 1.5;

  const r1 = render(
    <ThemeProvider prefs={prefs1}>
      <SettingsScreen prefs={prefs1} onChangePrefs={() => {}} />
    </ThemeProvider>
  );
  const r2 = render(
    <ThemeProvider prefs={prefs2}>
      <SettingsScreen prefs={prefs2} onChangePrefs={() => {}} />
    </ThemeProvider>
  );

  const s1 = r1.getByText('Theme');
  const s2 = r2.getByText('Theme');

  // Style is an array in RN; last fontSize comes from ThemeProvider scaling.
  const fontSize1 = Array.isArray(s1.props.style)
    ? [...s1.props.style].reverse().find((x: any) => x && x.fontSize)?.fontSize
    : s1.props.style?.fontSize;
  const fontSize2 = Array.isArray(s2.props.style)
    ? [...s2.props.style].reverse().find((x: any) => x && x.fontSize)?.fontSize
    : s2.props.style?.fontSize;

  expect(fontSize1).toBeTruthy();
  expect(fontSize2).toBeTruthy();
  expect(fontSize2).toBeGreaterThan(fontSize1);
});

test('TTS reads choice label on press when enabled', () => {
  const Speech = require('expo-speech');
  const prefs = getDefaultPreferences();
  prefs.accessibility.ttsEnabled = true;

  const { getByLabelText } = render(
    <ThemeProvider prefs={prefs}>
      <SettingsScreen prefs={prefs} onChangePrefs={() => {}} />
    </ThemeProvider>
  );

  fireEvent.press(getByLabelText('dark'));
  expect(Speech.speak).toHaveBeenCalled();
});

