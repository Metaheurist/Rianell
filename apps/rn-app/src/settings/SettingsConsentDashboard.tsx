import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
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
  const [open, setOpen] = useState(false);
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
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={[
          styles.summary,
          {
            borderColor: `${theme.tokens.color.accent}44`,
            backgroundColor: `${theme.tokens.color.text}08`,
          },
        ]}
      >
        <View style={styles.summaryRow}>
          <Ionicons name="document-text-outline" size={18} color={theme.tokens.color.accent} />
          <Text style={[styles.summaryTitle, { color: theme.tokens.color.textPrimary }]}>
            {t('settings.consent.dashboardTitle')}
          </Text>
          <Ionicons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={theme.tokens.color.textMuted}
          />
        </View>
        <Text style={[styles.summaryHint, { color: theme.tokens.color.textMuted }]}>
          {t('settings.consent.dashboardHint')}
        </Text>
      </Pressable>

      {open ? (
        <View
          style={[
            styles.body,
            {
              borderColor: `${theme.tokens.color.accent}33`,
              backgroundColor: `${theme.tokens.color.text}05`,
            },
          ]}
        >
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
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16 },
  summary: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  summaryHint: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  body: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
});
