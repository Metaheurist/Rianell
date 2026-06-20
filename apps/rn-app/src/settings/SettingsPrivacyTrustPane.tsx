import React, { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Switch, Text, View } from 'react-native';
import {
  formatActivityTypeLabel,
  LOCAL_ONLY_NETWORK_FEATURES,
} from '@rianell/shared';
import { exportContributionHistory } from '../cloud/sync';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';
import type { Preferences } from '../storage/preferences';
import { PolicyDocumentsModal } from '../privacy/PolicyDocumentsModal';

type Props = {
  prefs: Preferences;
  onChangePrefs: (next: Preferences) => void;
  onRequestAnonPoolEnable: () => void;
};

export function SettingsPrivacyTrustPane({ prefs, onChangePrefs, onRequestAnonPoolEnable }: Props) {
  const theme = useTheme();
  const { t } = useT();
  const [policyOpen, setPolicyOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.heading, { color: theme.tokens.color.textPrimary }]}>
        {t('settings.privacy.trustTitle')}
      </Text>
      <Text style={[styles.hint, { color: theme.tokens.color.textMuted }]}>{t('settings.privacy.trustLead')}</Text>

      <Pressable onPress={() => setPolicyOpen(true)} style={styles.linkRow}>
        <Text style={{ color: theme.tokens.color.accent, fontWeight: '600' }}>{t('settings.privacy.viewPolicies')}</Text>
      </Pressable>

      <Row label={t('settings.privacy.localOnly.title')}>
        <Switch
          value={prefs.localOnlyMode}
          onValueChange={(localOnlyMode) => onChangePrefs({ ...prefs, localOnlyMode })}
        />
      </Row>
      {prefs.localOnlyMode ? (
        <View style={styles.box}>
          <Text style={[styles.hint, { color: theme.tokens.color.textMuted }]}>{t('settings.privacy.localOnly.disabledLead')}</Text>
          {LOCAL_ONLY_NETWORK_FEATURES.map((f) => (
            <Text key={f.id} style={{ color: theme.tokens.color.textMuted, fontSize: 13, marginTop: 4 }}>
              · {t(f.labelKey)}
            </Text>
          ))}
        </View>
      ) : null}

      <Text style={[styles.subheading, { color: theme.tokens.color.textPrimary }]}>
        {t('settings.privacy.activity.title')}
      </Text>
      {prefs.processingActivityLog.length === 0 ? (
        <Text style={{ color: theme.tokens.color.textMuted, fontSize: 13 }}>{t('settings.privacy.activity.empty')}</Text>
      ) : (
        prefs.processingActivityLog.slice(0, 8).map((row, idx) => (
          <Text key={`${row.at}-${idx}`} style={{ color: theme.tokens.color.textMuted, fontSize: 13, marginTop: 4 }}>
            {row.at.slice(0, 16).replace('T', ' ')} · {t(formatActivityTypeLabel(row.type))}
            {row.detail ? ` · ${row.detail}` : ''}
          </Text>
        ))
      )}

      <Pressable onPress={onRequestAnonPoolEnable} style={[styles.btn, { borderColor: theme.tokens.color.border }]}>
        <Text style={{ color: theme.tokens.color.textPrimary }}>{t('settings.privacy.anonPool.reviewFields')}</Text>
      </Pressable>

      <Pressable
        onPress={() => {
          void (async () => {
            const result = await exportContributionHistory();
            if (!result.ok || !result.json) {
              Alert.alert(t('research.pool.export.action'), result.message);
              return;
            }
            await Share.share({ message: result.json, title: t('research.pool.export.shareTitle') });
          })();
        }}
        style={[styles.btn, { borderColor: theme.tokens.color.border }]}
      >
        <Text style={{ color: theme.tokens.color.textPrimary }}>{t('research.pool.export.action')}</Text>
      </Pressable>

      <PolicyDocumentsModal visible={policyOpen} regionId={prefs.privacyRegion} onClose={() => setPolicyOpen(false)} />
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8, marginBottom: 16 },
  heading: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  subheading: { fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 4 },
  hint: { fontSize: 12, marginBottom: 8, lineHeight: 18 },
  linkRow: { marginVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 6 },
  rowLabel: { flex: 1, fontSize: 14, paddingRight: 8 },
  box: { marginVertical: 8, padding: 10, borderRadius: 8, backgroundColor: 'rgba(128,128,128,0.08)' },
  btn: { marginTop: 16, padding: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
});
