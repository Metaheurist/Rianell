import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { normalizeCaregiverSettings } from '@rianell/shared';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';
import type { Preferences } from '../storage/preferences';

type Props = {
  prefs: Preferences;
  onChangePrefs: (next: Preferences) => void;
};

export function SettingsSecurityLockPane({ prefs, onChangePrefs }: Props) {
  const theme = useTheme();
  const { t } = useT();
  const [pendingEnable, setPendingEnable] = useState(false);
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');

  const showSetup = prefs.appLockEnabled || pendingEnable;

  useEffect(() => {
    if (!showSetup) {
      setPin('');
      setPinConfirm('');
    }
  }, [showSetup]);

  const onToggle = (next: boolean) => {
    if (prefs.appLockEnabled) {
      onChangePrefs({ ...prefs, appLockEnabled: false });
      setPendingEnable(false);
      setPin('');
      setPinConfirm('');
      return;
    }
    if (pendingEnable) {
      setPendingEnable(false);
      setPin('');
      setPinConfirm('');
      return;
    }
    setPendingEnable(true);
  };

  const onSave = () => {
    if (pin.length < 8) {
      Alert.alert(t('settings.security.title'), t('settings.privacy.appLock.setupPrompt'));
      return;
    }
    if (pin !== pinConfirm) {
      Alert.alert(t('settings.security.title'), t('settings.privacy.appLock.mismatch'));
      return;
    }
    setPin('');
    setPinConfirm('');
    setPendingEnable(false);
    onChangePrefs({ ...prefs, appLockEnabled: true });
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.hint, { color: theme.tokens.color.textMuted }]}>{t('settings.security.lead')}</Text>

      <Row label={t('settings.privacy.appLock.enable')}>
        <Switch
          value={prefs.appLockEnabled || pendingEnable}
          onValueChange={onToggle}
        />
      </Row>

      {showSetup ? (
        <View style={styles.setup}>
          {prefs.appLockEnabled ? (
            <View style={styles.statusRow}>
              <Ionicons name="lock-closed" size={18} color={theme.tokens.color.accent} />
              <Text style={{ color: theme.tokens.color.textPrimary, fontSize: 14 }}>
                {t('settings.security.statusLocked')}
              </Text>
            </View>
          ) : null}

          <Text style={[styles.fieldLabel, { color: theme.tokens.color.textMuted }]}>
            {t('settings.privacy.appLock.setupPrompt')}
          </Text>
          <TextInput
            value={pin}
            onChangeText={setPin}
            secureTextEntry
            autoComplete="off"
            textContentType="newPassword"
            placeholder={t('settings.privacy.appLock.setupPrompt')}
            placeholderTextColor={theme.tokens.color.textMuted}
            style={[styles.input, { color: theme.tokens.color.textPrimary, borderColor: theme.tokens.color.border }]}
          />

          <Text style={[styles.fieldLabel, { color: theme.tokens.color.textMuted }]}>
            {t('settings.privacy.appLock.confirmPrompt')}
          </Text>
          <TextInput
            value={pinConfirm}
            onChangeText={setPinConfirm}
            secureTextEntry
            autoComplete="off"
            textContentType="newPassword"
            placeholder={t('settings.privacy.appLock.confirmPrompt')}
            placeholderTextColor={theme.tokens.color.textMuted}
            style={[styles.input, { color: theme.tokens.color.textPrimary, borderColor: theme.tokens.color.border }]}
          />

          <Pressable
            onPress={onSave}
            style={[styles.saveBtn, { backgroundColor: theme.tokens.color.accent }]}
            accessibilityRole="button"
          >
            <Text style={styles.saveBtnText}>{t('settings.security.savePasscode')}</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.caregiverGroup}>
        <Row label={t('settings.privacy.caregiver.enable')}>
          <Switch
            value={prefs.caregiverModeEnabled}
            onValueChange={(caregiverModeEnabled) => {
              const next = normalizeCaregiverSettings({ ...prefs, caregiverModeEnabled });
              onChangePrefs({ ...prefs, ...next });
            }}
          />
        </Row>
        {prefs.caregiverModeEnabled ? (
          <View style={styles.caregiverBox}>
            <Text style={[styles.hint, { color: theme.tokens.color.textMuted }]}>{t('settings.privacy.caregiver.lead')}</Text>
            <Text style={[styles.fieldLabel, { color: theme.tokens.color.textMuted }]}>
              {t('settings.privacy.caregiver.dependentName')}
            </Text>
            <TextInput
              value={prefs.caregiverDependentName}
              onChangeText={(caregiverDependentName) => {
                const next = normalizeCaregiverSettings({ ...prefs, caregiverDependentName });
                onChangePrefs({ ...prefs, ...next });
              }}
              placeholder={t('settings.privacy.caregiver.dependentName')}
              placeholderTextColor={theme.tokens.color.textMuted}
              style={[styles.input, { color: theme.tokens.color.textPrimary, borderColor: theme.tokens.color.border }]}
            />
          </View>
        ) : null}
      </View>
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
  wrap: { marginTop: 4 },
  hint: { fontSize: 12, marginBottom: 10, lineHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 6 },
  rowLabel: { flex: 1, fontSize: 14, paddingRight: 8 },
  setup: { marginTop: 8, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(128,128,128,0.35)' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  fieldLabel: { fontSize: 13, marginBottom: 4, marginTop: 6 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14 },
  saveBtn: { marginTop: 12, padding: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  caregiverGroup: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.35)',
  },
  caregiverBox: { marginTop: 4 },
});
