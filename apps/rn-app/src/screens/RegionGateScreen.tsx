import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getPolicyPack, getRegionLabels, suggestRegionForDevice } from '../privacy/helpers';
import { PolicyDocumentsModal } from '../privacy/PolicyDocumentsModal';
import { applyRegionDefaultLocale, DEFAULT_PRIVACY_REGION } from '@rianell/shared';
import { useT } from '../i18n/I18nProvider';
import type { Preferences } from '../storage/preferences';
import { useTheme } from '../theme/ThemeProvider';

export function RegionGateScreen({
  prefs,
  onConfirm,
}: {
  prefs: Preferences;
  onConfirm: (next: Preferences) => void;
}) {
  const theme = useTheme();
  const { t } = useT();
  const pack = getPolicyPack();
  const labels = useMemo(() => getRegionLabels(pack), [pack]);
  const suggested = useMemo(() => suggestRegionForDevice() || DEFAULT_PRIVACY_REGION, []);
  const [selected, setSelected] = useState(suggested);
  const [policyOpen, setPolicyOpen] = useState(false);

  function confirm() {
    const now = new Date().toISOString();
    const base = applyRegionDefaultLocale(
      {
        ...prefs,
        privacyRegion: selected,
        privacyRegionSource: 'onboarding',
        privacyRegionUpdatedAt: now,
        policyAcknowledgedVersion: pack.policyPackId || 'v1.0.0',
        policyAcknowledgedAt: now,
        uiLocaleSource: 'onboarding',
      },
      selected,
      pack,
    ) as Preferences;
    onConfirm(base);
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.tokens.color.background }]}>
      <ScrollView contentContainerStyle={styles.card}>
        <Text style={[styles.title, { color: theme.tokens.color.text }]}>{t('gate.title')}</Text>
        <Text style={[styles.lead, { color: theme.tokens.color.textMuted }]}>{t('gate.lead')}</Text>
        {suggested ? <Text style={styles.hint}>{t('gate.hint')}</Text> : null}
        <Text style={[styles.label, { color: theme.tokens.color.text }]}>{t('gate.regionLabel')}</Text>
        {labels.map((r) => (
          <Pressable
            key={r.id}
            style={[styles.regionRow, selected === r.id && styles.regionRowSelected]}
            onPress={() => setSelected(r.id)}
          >
            <Text style={{ color: theme.tokens.color.text }}>{r.label}</Text>
          </Pressable>
        ))}
        <Pressable style={[styles.btn, styles.btnPrimary]} onPress={confirm}>
          <Text style={styles.btnPrimaryText}>{t('gate.confirm')}</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnSecondary]} onPress={() => setPolicyOpen(true)}>
          <Text style={styles.btnSecondaryText}>{t('gate.viewPolicies')}</Text>
        </Pressable>
      </ScrollView>
      <PolicyDocumentsModal visible={policyOpen} regionId={selected} onClose={() => setPolicyOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  card: { padding: 24, paddingTop: 48 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  lead: { fontSize: 15, lineHeight: 22, marginBottom: 12 },
  hint: { fontSize: 13, color: '#0284c7', marginBottom: 8 },
  label: { fontSize: 14, marginBottom: 6 },
  regionRow: { padding: 12, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, marginBottom: 8 },
  regionRowSelected: { borderColor: '#0d9488', backgroundColor: 'rgba(13,148,136,0.12)' },
  btn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10, marginTop: 8 },
  btnPrimary: { backgroundColor: '#0d9488' },
  btnPrimaryText: { color: '#fff', fontWeight: '600' },
  btnSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#64748b' },
  btnSecondaryText: { color: '#64748b', fontWeight: '600' },
});
