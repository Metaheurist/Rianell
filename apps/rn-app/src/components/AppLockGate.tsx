import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';

type Props = {
  enabled: boolean;
  children: React.ReactNode;
};

export function AppLockGate({ enabled, children }: Props) {
  const theme = useTheme();
  const { t } = useT();
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tryUnlock = useCallback(async () => {
    if (!enabled) {
      setLocked(false);
      return;
    }
    const supported = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!supported || !enrolled) {
      setError(t('settings.privacy.appLock.unavailable'));
      setLocked(false);
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: t('settings.privacy.appLock.prompt'),
      cancelLabel: t('common.cancel'),
    });
    if (result.success) {
      setLocked(false);
      setError(null);
    } else {
      setLocked(true);
      setError(t('settings.privacy.appLock.failed'));
    }
  }, [enabled, t]);

  useEffect(() => {
    if (!enabled) {
      setLocked(false);
      return;
    }
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        setLocked(true);
      } else if (state === 'active') {
        void tryUnlock();
      }
    });
    void tryUnlock();
    return () => sub.remove();
  }, [enabled, tryUnlock]);

  if (!enabled || !locked) return <>{children}</>;

  return (
    <>
      {children}
      <Modal visible animationType="fade" transparent={false}>
        <View style={[styles.root, { backgroundColor: theme.tokens.color.background }]}>
          <Text style={[styles.title, { color: theme.tokens.color.textPrimary }]}>{t('settings.privacy.appLock.title')}</Text>
          <Text style={{ color: theme.tokens.color.textMuted, marginBottom: 16 }}>{t('settings.privacy.appLock.lead')}</Text>
          {error ? <Text style={{ color: theme.tokens.color.danger || '#e57373', marginBottom: 12 }}>{error}</Text> : null}
          <Pressable style={[styles.btn, { backgroundColor: theme.tokens.color.accent }]} onPress={() => void tryUnlock()}>
            <Text style={styles.btnText}>{t('settings.privacy.appLock.unlock')}</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  btn: { padding: 14, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
});
