import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  applyRegionDowngradeToggles,
  getPolicyPack,
  getRegionLabels,
} from '../privacy/helpers';
import { PolicyDocumentsModal } from '../privacy/PolicyDocumentsModal';
import { upsertPrivacyProfile } from '../cloud/privacyProfile';
import { useT } from '../i18n/I18nProvider';
import { getDefaultLocaleForRegion, applyRegionDefaultLocale } from '@rianell/shared';
import type { Preferences } from '../storage/preferences';
import { useTheme } from '../theme/ThemeProvider';

export function SettingsPrivacyRegionPane({
  prefs,
  onChangePrefs,
}: {
  prefs: Preferences;
  onChangePrefs: (next: Preferences) => void;
}) {
  const theme = useTheme();
  const { t, localeOptions, setLocale } = useT();
  const pack = getPolicyPack();
  const labels = useMemo(() => getRegionLabels(pack), [pack]);
  const [policyOpen, setPolicyOpen] = useState(false);

  function onRegionChange(nextId: string) {
    const oldId = prefs.privacyRegion;
    if (nextId === oldId) return;
    Alert.alert(t('settings.privacy.regionChangeTitle'), t('settings.privacy.regionChangeBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.continue'),
        onPress: () => {
          const downgraded = applyRegionDowngradeToggles(prefs, oldId, nextId);
          const next = applyRegionDefaultLocale(
            {
              ...downgraded,
              privacyRegion: nextId,
              privacyRegionSource: 'user',
              privacyRegionUpdatedAt: new Date().toISOString(),
            },
            nextId,
            pack,
          ) as Preferences;
          onChangePrefs(next);
          void upsertPrivacyProfile(next);
          if (nextId === 'eea_uk' && !next.healthDataConsent) {
            Alert.alert(t('settings.privacy.gdprConsent'), t('settings.privacy.gdprConsent'));
          }
        },
      },
    ]);
  }

  function onLanguageChange(nextLocale: string) {
    if (nextLocale === prefs.uiLocale) return;
    const next: Preferences = {
      ...prefs,
      uiLocale: nextLocale,
      uiLocaleSource: 'user',
      uiLocaleUpdatedAt: new Date().toISOString(),
    };
    onChangePrefs(next);
    setLocale(nextLocale, 'user');
    void upsertPrivacyProfile(next);
  }

  return (
    <View>
      <Text style={[styles.heading, { color: theme.tokens.color.text }]}>{t('settings.privacy.title')}</Text>
      <Text style={[styles.label, { color: theme.tokens.color.textMuted }]}>{t('settings.privacy.regionLabel')}</Text>
      {labels.map((r) => (
        <Pressable
          key={r.id}
          style={[styles.regionRow, prefs.privacyRegion === r.id && styles.regionRowSelected]}
          onPress={() => onRegionChange(r.id)}
        >
          <Text style={{ color: theme.tokens.color.text }}>{r.label}</Text>
        </Pressable>
      ))}
      <Text style={[styles.label, { color: theme.tokens.color.textMuted, marginTop: 8 }]}>
        {t('settings.privacy.languageLabel')}
      </Text>
      {localeOptions.map((opt) => (
        <Pressable
          key={opt.id}
          style={[styles.regionRow, prefs.uiLocale === opt.id && styles.regionRowSelected]}
          onPress={() => onLanguageChange(opt.id)}
        >
          <Text style={{ color: theme.tokens.color.text }}>{opt.label}</Text>
        </Pressable>
      ))}
      <Text style={[styles.label, { color: theme.tokens.color.textMuted, marginTop: 8 }]}>
        {t('settings.privacy.storageLabel')}
      </Text>
      <Text style={[styles.residency, { color: theme.tokens.color.textMuted, fontSize: 13 }]}>
        {t('settings.privacy.storageNote')}
      </Text>
      <Pressable style={styles.linkBtn} onPress={() => setPolicyOpen(true)}>
        <Text style={styles.linkText}>{t('settings.privacy.viewPolicies')}</Text>
      </Pressable>
      <Pressable
        style={styles.linkBtn}
        onPress={() =>
          Alert.alert(
            t('settings.privacy.gdprConsent'),
            prefs.healthDataConsent
              ? `Granted${prefs.healthDataConsentAt ? ` on ${prefs.healthDataConsentAt}` : ''}.`
              : 'Not yet granted.',
          )
        }
      >
        <Text style={styles.linkText}>{t('settings.privacy.gdprConsent')}</Text>
      </Pressable>
      <PolicyDocumentsModal
        visible={policyOpen}
        regionId={prefs.privacyRegion || 'other'}
        onClose={() => setPolicyOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  label: { fontSize: 13, marginBottom: 4 },
  regionRow: { padding: 12, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, marginBottom: 8 },
  regionRowSelected: { borderColor: '#0d9488', backgroundColor: 'rgba(13,148,136,0.12)' },
  residency: { fontSize: 14, marginBottom: 12 },
  linkBtn: { paddingVertical: 10 },
  linkText: { color: '#0d9488', fontWeight: '600' },
});
