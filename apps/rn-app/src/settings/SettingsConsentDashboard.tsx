import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { buildConsentDashboardEntries } from '@rianell/shared';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';
import type { Preferences } from '../storage/preferences';

export function SettingsConsentDashboard({
  prefs,
  onChangePrefs,
}: {
  prefs: Preferences;
  onChangePrefs: (next: Preferences) => void;
}) {
  const theme = useTheme();
  const { t } = useT();
  const rows = buildConsentDashboardEntries({
    healthDataConsent: prefs.healthDataConsent,
    healthDataConsentAt: prefs.healthDataConsentAt,
    cookieConsent: prefs.cookieConsent,
    cookieConsentAt: prefs.cookieConsentAt,
    aiModelDownloadConsent: prefs.aiModelDownloadConsent,
    aiModelDownloadConsentAt: prefs.aiModelDownloadConsentAt,
    pushNotificationsEnabled: prefs.pushNotificationsEnabled || prefs.notifications.enabled,
    pushNotificationsEnabledAt: prefs.pushNotificationsEnabledAt,
    notificationsEnabled: prefs.notifications.enabled,
    contributeAnonData: prefs.contributeAnonData,
    contributeAnonDataAt: prefs.contributeAnonDataAt,
    sessionRecording: prefs.sessionRecording,
    sessionRecordingAt: prefs.sessionRecordingAt,
  });

  function revoke(row: (typeof rows)[number]) {
    Alert.alert(t('settings.consent.revokeTitle'), t('settings.consent.revokeBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.consent.revokeConfirm'),
        style: 'destructive',
        onPress: () => {
          const next = { ...prefs };
          if (row.id === 'healthData') {
            next.healthDataConsent = false;
            next.healthDataConsentAt = null;
          } else if (row.id === 'cookie') {
            next.cookieConsent = false;
            next.cookieConsentAt = null;
          } else if (row.id === 'aiModel') {
            next.aiModelDownloadConsent = 'deferred';
            next.aiModelDownloadConsentAt = null;
          } else if (row.id === 'push') {
            next.pushNotificationsEnabled = false;
            next.pushNotificationsEnabledAt = null;
            next.notifications = { ...next.notifications, enabled: false };
          } else if (row.id === 'anonPool') {
            next.contributeAnonData = false;
            next.contributeAnonDataAt = null;
          } else if (row.id === 'sessionRecording') {
            next.sessionRecording = false;
            next.sessionRecordingAt = null;
          }
          onChangePrefs(next);
        },
      },
    ]);
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.heading, { color: theme.tokens.color.textPrimary }]}>
        {t('settings.consent.dashboardTitle')}
      </Text>
      {rows.map((row) => (
        <View key={row.id} style={[styles.row, { borderColor: theme.tokens.color.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.tokens.color.textPrimary, fontWeight: '600' }}>
              {t(`settings.consent.${row.id}.title`)}
            </Text>
            <Text style={{ color: theme.tokens.color.textMuted, fontSize: 13, marginTop: 4 }}>
              {row.granted ? t('settings.consent.statusGranted') : t('settings.consent.statusNotGranted')}
              {row.updatedAt ? ` · ${row.updatedAt.slice(0, 10)}` : ''}
            </Text>
          </View>
          {row.granted ? (
            <Pressable accessibilityRole="button" onPress={() => revoke(row)}>
              <Text style={{ color: theme.tokens.color.danger || '#e57373' }}>
                {t('settings.consent.revoke')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  heading: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 10 },
});
