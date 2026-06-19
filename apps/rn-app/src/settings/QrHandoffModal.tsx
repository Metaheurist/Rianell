import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { createQrHandoffPayload } from '@rianell/shared';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';
import { loadLogs } from '../storage/logs';

type Props = {
  visible: boolean;
  busy: boolean;
  onClose: () => void;
  onBusyChange: (busy: boolean) => void;
};

export function QrHandoffModal({ visible, busy, onClose, onBusyChange }: Props) {
  const theme = useTheme();
  const { t } = useT();
  const [passphrase, setPassphrase] = useState('');
  const [token, setToken] = useState('');
  const [meta, setMeta] = useState('');

  async function onCreate() {
    if (passphrase.length < 8 || busy) return;
    onBusyChange(true);
    try {
      const logs = await loadLogs();
      const payload = await createQrHandoffPayload(logs, passphrase, { ttlMinutes: 60 });
      setToken(payload.token);
      setMeta(t('settings.export.qrHandoff.meta', { count: String(payload.logCount), expires: payload.expiresAt }));
      await Share.share({ message: payload.token, title: t('settings.export.qrHandoff.shareTitle') }).catch(() => {});
    } catch (e) {
      setToken('');
      setMeta(e instanceof Error ? e.message : t('settings.export.failed'));
    } finally {
      onBusyChange(false);
    }
  }

  function handleClose() {
    setPassphrase('');
    setToken('');
    setMeta('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.tokens.color.background }]}>
          <Text style={[styles.title, { color: theme.tokens.color.textPrimary }]}>{t('settings.export.qrHandoff.title')}</Text>
          <Text style={[styles.hint, { color: theme.tokens.color.textMuted }]}>{t('settings.export.qrHandoff.hint')}</Text>
          {!token ? (
            <>
              <TextInput
                value={passphrase}
                onChangeText={setPassphrase}
                secureTextEntry
                placeholder={t('settings.export.qrHandoff.placeholder')}
                placeholderTextColor={theme.tokens.color.textMuted}
                style={[styles.input, { color: theme.tokens.color.textPrimary, borderColor: theme.tokens.color.border }]}
              />
              <Pressable
                style={[styles.btn, { backgroundColor: theme.tokens.color.accent, opacity: busy || passphrase.length < 8 ? 0.6 : 1 }]}
                disabled={busy || passphrase.length < 8}
                onPress={() => void onCreate()}
              >
                <Text style={styles.btnText}>{t('settings.export.qrHandoff.action')}</Text>
              </Pressable>
            </>
          ) : (
            <>
              {meta ? <Text style={[styles.hint, { color: theme.tokens.color.textMuted }]}>{meta}</Text> : null}
              <ScrollView style={styles.tokenBox} nestedScrollEnabled>
                <Text selectable style={{ color: theme.tokens.color.textPrimary, fontSize: 11 }}>
                  {token}
                </Text>
              </ScrollView>
              <Text style={[styles.hint, { color: theme.tokens.color.textMuted }]}>{t('settings.export.qrHandoff.scanHint')}</Text>
            </>
          )}
          <Pressable onPress={handleClose} style={styles.cancel}>
            <Text style={{ color: theme.tokens.color.textMuted }}>{t('common.cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.45)' },
  card: { borderRadius: 12, padding: 20, maxHeight: '85%' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  hint: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 12 },
  btn: { padding: 14, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
  tokenBox: { maxHeight: 160, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 8 },
  cancel: { marginTop: 12, alignItems: 'center' },
});
