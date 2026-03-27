import React from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useTheme } from '../theme/ThemeProvider';

/** Matches web `app.js` fallbacks for RN CLI / iOS artifact links. */
export const GITHUB_RELEASES_LATEST = 'https://github.com/Metaheurist/Rianell/releases/latest';
const APK_BETA_URL = 'https://github.com/Metaheurist/Rianell/releases/latest/download/app-debug-beta.apk';

function openUrl(url: string) {
  void Linking.openURL(url).catch(() => {});
}

export function SettingsAppInstallSection() {
  const theme = useTheme();
  const version = Constants.expoConfig?.version ?? '—';
  const build =
    Platform.OS === 'ios'
      ? String(Constants.expoConfig?.ios?.buildNumber ?? '—')
      : String(Constants.expoConfig?.android?.versionCode ?? '—');

  return (
    <View style={styles.block}>
      <Text style={[styles.heading, { color: theme.tokens.color.text, fontSize: theme.font(16) }]}>📱 App installation</Text>
      <Text style={[styles.p, { color: theme.tokens.color.text, fontSize: theme.font(13), opacity: 0.88 }]}>
        You are using the native Rianell app. Install links below are for other devices or the web app (parity with
        Settings → Data management on the website).
      </Text>
      <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
        Platform: {Platform.OS} · Version {version} · Build {build}
      </Text>

      <Pressable
        style={[styles.btn, { borderColor: theme.tokens.color.accent }]}
        onPress={() => openUrl(GITHUB_RELEASES_LATEST)}
        accessibilityRole="button"
        accessibilityLabel="Open GitHub releases page"
      >
        <Text style={[styles.btnText, { color: theme.tokens.color.accent, fontSize: theme.font(14) }]}>
          All releases (GitHub)
        </Text>
      </Pressable>

      {Platform.OS !== 'android' ? (
        <Pressable
          style={[styles.btn, { borderColor: theme.tokens.color.accent }]}
          onPress={() => openUrl(APK_BETA_URL)}
          accessibilityRole="button"
          accessibilityLabel="Download Android APK beta"
        >
          <Text style={[styles.btnText, { color: theme.tokens.color.accent, fontSize: theme.font(14) }]}>
            Android APK (RN CLI beta)
          </Text>
        </Pressable>
      ) : null}

      {Platform.OS !== 'ios' ? (
        <Text style={[styles.p, { color: theme.tokens.color.text, fontSize: theme.font(12), opacity: 0.75 }]}>
          iOS builds are distributed as an Xcode/archive package from the repo releases page; use “All releases” on a Mac
          to download.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 10, marginBottom: 8 },
  heading: { fontWeight: '800', marginBottom: 4 },
  p: { lineHeight: 20 },
  meta: { fontWeight: '600', opacity: 0.9 },
  btn: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  btnText: { fontWeight: '700' },
});
