import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
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
import { ToastProvider } from './src/components/ui';
import { refreshDemoModeLogsOnLaunch } from './src/demo/demoMode';
import { installBugReportConsoleCapture } from './src/utils/bugReportLogs';
import { flushOfflineQueue } from './src/storage/offlineQueue';

export default function App() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [bootTeam, setBootTeam] = useState(() => getDefaultPreferences().team);

  useEffect(() => {
    installBugReportConsoleCapture();
  }, []);

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

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        flushOfflineQueue().catch(() => {});
      }
    });
    return () => unsub();
  }, []);

  if (!prefs) return <BootLoadingScreen team={bootTeam} />;

  return (
    <SafeAreaProvider>
      <ThemeProvider prefs={prefs}>
        <ToastProvider>
          <RootNavigator prefs={prefs} onChangePrefs={setPrefs} />
          <StatusBar style="auto" />
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
