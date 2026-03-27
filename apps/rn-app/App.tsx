import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { RootNavigator } from './src/navigation/RootNavigator';
import { getDefaultPreferences, loadPreferences, savePreferences, type Preferences } from './src/storage/preferences';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { BootLoadingScreen } from './src/components/BootLoadingScreen';
import { refreshDemoModeLogsOnLaunch } from './src/demo/demoMode';

export default function App() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);

  useEffect(() => {
    loadPreferences().then(setPrefs).catch(() => setPrefs(getDefaultPreferences()));
  }, []);

  useEffect(() => {
    if (!prefs) return;
    savePreferences(prefs).catch(() => {});
  }, [prefs]);

  useEffect(() => {
    if (!prefs?.demoMode) return;
    refreshDemoModeLogsOnLaunch().catch(() => {});
  }, [prefs?.demoMode]);

  if (!prefs) return <BootLoadingScreen />;

  return (
    <ThemeProvider prefs={prefs}>
      <RootNavigator prefs={prefs} onChangePrefs={setPrefs} />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
