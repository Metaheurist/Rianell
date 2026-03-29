import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import {
  getDefaultPreferences,
  loadPreferences,
  peekStoredTeamForBoot,
  savePreferences,
  type Preferences,
} from './src/storage/preferences';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { BootLoadingScreen } from './src/components/BootLoadingScreen';
import { refreshDemoModeLogsOnLaunch } from './src/demo/demoMode';

export default function App() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [bootTeam, setBootTeam] = useState(() => getDefaultPreferences().team);

  useEffect(() => {
    void peekStoredTeamForBoot().then((t) => {
      if (t) setBootTeam(t);
    });
  }, []);

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

  if (!prefs) return <BootLoadingScreen team={bootTeam} />;

  return (
    <SafeAreaProvider>
      <ThemeProvider prefs={prefs}>
        <RootNavigator prefs={prefs} onChangePrefs={setPrefs} />
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
