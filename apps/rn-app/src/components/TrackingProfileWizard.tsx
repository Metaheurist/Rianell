import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { normalizeTrackingProfile, TRACKING_PROFILE_FIELD_KEYS } from '@rianell/shared';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';
import type { Preferences, TrackingProfile } from '../storage/preferences';

export function TrackingProfileWizard({
  prefs,
  visible,
  onComplete,
}: {
  prefs: Preferences;
  visible: boolean;
  onComplete: (profile: TrackingProfile, medicalCondition: string) => void;
}) {
  const theme = useTheme();
  const { t } = useT();
  const base = normalizeTrackingProfile(prefs.trackingProfile);
  const [condition, setCondition] = useState(prefs.medicalCondition || base.condition || '');
  const [fields, setFields] = useState({ ...base.fields });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={[styles.root, { backgroundColor: theme.tokens.color.background }]}>
        <Text style={[styles.title, { color: theme.tokens.color.textPrimary }]}>
          {t('settings.trackingProfile.title')}
        </Text>
        <Text style={[styles.lead, { color: theme.tokens.color.textSecondary }]}>
          {t('settings.trackingProfile.lead')}
        </Text>
        <Text style={[styles.lead, { color: theme.tokens.color.textSecondary, marginTop: 12 }]}>
          {t('progressiveDisclosure.lead')}
        </Text>
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={[styles.label, { color: theme.tokens.color.textPrimary }]}>
            {t('common.medical.condition')}
          </Text>
          <TextInput
            value={condition}
            onChangeText={setCondition}
            placeholder={t('common.enter.your.condition')}
            placeholderTextColor={theme.tokens.color.textMuted}
            style={[styles.input, { color: theme.tokens.color.textPrimary, borderColor: theme.tokens.color.border }]}
          />
          <Text style={[styles.label, { color: theme.tokens.color.textPrimary, marginTop: 16 }]}>
            {t('settings.trackingProfile.fieldsLabel')}
          </Text>
          {TRACKING_PROFILE_FIELD_KEYS.map((key) => {
            const fieldKey = key as keyof typeof fields;
            return (
            <View key={key} style={styles.row}>
              <Text style={{ color: theme.tokens.color.textSecondary, flex: 1 }}>
                {t(`settings.trackingProfile.field.${key}`)}
              </Text>
              <Switch
                value={fields[fieldKey]}
                onValueChange={(v) => setFields((f) => ({ ...f, [fieldKey]: v }))}
              />
            </View>
            );
          })}
        </ScrollView>
        <Pressable
          accessibilityRole="button"
          style={[styles.primary, { backgroundColor: theme.tokens.color.accent }]}
          onPress={() => {
            const profile = normalizeTrackingProfile({
              condition: condition.trim(),
              fields,
              configuredAt: new Date().toISOString(),
            });
            onComplete(profile, condition.trim());
          }}
        >
          <Text style={styles.primaryText}>{t('settings.trackingProfile.save')}</Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: '700' },
  lead: { fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 12 },
  body: { paddingBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  primary: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
