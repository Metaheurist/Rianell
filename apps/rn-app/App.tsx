import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { isRtlLocale, isTrackingProfileConfigured, resolveActiveLocale } from '@rianell/shared';
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
import { AiModelDownloadGate } from './src/components/AiModelDownloadGate';
import { ToastProvider } from './src/components/ui';
import { refreshDemoModeLogsOnLaunch } from './src/demo/demoMode';
import { installBugReportConsoleCapture } from './src/utils/bugReportLogs';
import { flushOfflineQueue } from './src/storage/offlineQueue';
import { RegionGateScreen } from './src/screens/RegionGateScreen';
import { isPrivacyRegionConfigured } from './src/privacy/helpers';
import { fetchPrivacyProfileAndApply, upsertPrivacyProfile } from './src/cloud/privacyProfile';
import { getSupabaseClient } from './src/cloud/supabaseClient';
import { TutorialModal } from './src/components/TutorialModal';
import { TrackingProfileWizard } from './src/components/TrackingProfileWizard';
import { markTutorialSeen } from './src/storage/preferences';
import { AppLockGate } from './src/components/AppLockGate';
import { I18nProvider } from './src/i18n/I18nProvider';

export default function App() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [bootTeam, setBootTeam] = useState(() => getDefaultPreferences().team);

  useEffect(() => {
    if (!prefs) return;
    const locale = resolveActiveLocale(prefs);
    const rtl = isRtlLocale(locale);
    I18nManager.allowRTL(true);
    if (I18nManager.isRTL !== rtl) {
      I18nManager.forceRTL(rtl);
    }
  }, [prefs?.uiLocale, prefs?.privacyRegion]);

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

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;
    const { data } = client.auth.onAuthStateChange(async (event, session) => {
      if (event !== 'SIGNED_IN' || !session?.user) return;
      const cur = await loadPreferences();
      const { prefs: merged } = await fetchPrivacyProfileAndApply(cur);
      await savePreferences(merged);
      setPrefs(merged);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!prefs) return <BootLoadingScreen team={bootTeam} />;

  if (!isPrivacyRegionConfigured(prefs)) {
    return (
      <SafeAreaProvider>
        <ThemeProvider prefs={prefs}>
          <I18nProvider prefs={prefs} onLocaleChange={setPrefs}>
            <RegionGateScreen
              prefs={prefs}
              onConfirm={(next) => {
                setPrefs(next);
                if (next.privacyRegion === 'eea_uk' && !next.healthDataConsent) {
                  const withConsent = {
                    ...next,
                    healthDataConsent: true,
                    healthDataConsentAt: new Date().toISOString(),
                  };
                  setPrefs(withConsent);
                  void upsertPrivacyProfile(withConsent);
                  return;
                }
                void upsertPrivacyProfile(next);
              }}
            />
          </I18nProvider>
          <StatusBar style="auto" />
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider prefs={prefs}>
        <I18nProvider prefs={prefs} onLocaleChange={setPrefs}>
          <ToastProvider>
            {!prefs.tutorialSeen ? (
              <TutorialModal
                prefs={prefs}
                visible
                onSetAiEnabled={(enabled) => setPrefs({ ...prefs, aiEnabled: enabled })}
                onFinish={() => {
                  void markTutorialSeen({ ...prefs, replayTutorial: false }).then(setPrefs);
                }}
              />
            ) : !isTrackingProfileConfigured(prefs.trackingProfile) ? (
              <TrackingProfileWizard
                prefs={prefs}
                visible
                onComplete={(profile, medicalCondition) => {
                  setPrefs({
                    ...prefs,
                    trackingProfile: profile,
                    medicalCondition: medicalCondition || prefs.medicalCondition,
                  });
                }}
              />
            ) : (
              <>
                <AiModelDownloadGate prefs={prefs} onChangePrefs={setPrefs}>
                  <AppLockGate enabled={prefs.appLockEnabled}>
                    <RootNavigator prefs={prefs} onChangePrefs={setPrefs} />
                  </AppLockGate>
                </AiModelDownloadGate>
                {prefs.replayTutorial ? (
                  <TutorialModal
                    prefs={prefs}
                    visible
                    onSetAiEnabled={(enabled) => setPrefs({ ...prefs, aiEnabled: enabled })}
                    onFinish={() => {
                      void markTutorialSeen({ ...prefs, replayTutorial: false }).then(setPrefs);
                    }}
                  />
                ) : null}
              </>
            )}
          </ToastProvider>
        </I18nProvider>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
