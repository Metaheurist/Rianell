import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { loadPreferences, savePreferences, type Preferences } from './src/storage/preferences';
import { ThemeProvider } from './src/theme/ThemeProvider';

export default function App() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);

  useEffect(() => {
    loadPreferences().then(setPrefs).catch(() => setPrefs(null));
  }, []);

  useEffect(() => {
    if (!prefs) return;
    savePreferences(prefs).catch(() => {});
  }, [prefs]);

  if (!prefs) return <View />;

  return (
    <ThemeProvider prefs={prefs}>
      <RootNavigator prefs={prefs} onChangePrefs={setPrefs} />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
