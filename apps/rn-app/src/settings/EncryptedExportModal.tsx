import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';

type Props = {
  visible: boolean;
  busy: boolean;
  onClose: () => void;
  onSubmit: (passphrase: string) => void;
};

export function EncryptedExportModal({ visible, busy, onClose, onSubmit }: Props) {
  const theme = useTheme();
  const { t } = useT();
  const [passphrase, setPassphrase] = useState('');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.tokens.color.background }]}>
          <Text style={[styles.title, { color: theme.tokens.color.textPrimary }]}>{t('settings.export.encrypted.title')}</Text>
          <Text style={[styles.hint, { color: theme.tokens.color.textMuted }]}>{t('settings.export.encrypted.hint')}</Text>
          <TextInput
            value={passphrase}
            onChangeText={setPassphrase}
            secureTextEntry
            placeholder={t('settings.export.encrypted.placeholder')}
            placeholderTextColor={theme.tokens.color.textMuted}
            style={[styles.input, { color: theme.tokens.color.textPrimary, borderColor: theme.tokens.color.border }]}
          />
          <Pressable
            style={[styles.btn, { backgroundColor: theme.tokens.color.accent, opacity: busy ? 0.6 : 1 }]}
            disabled={busy || passphrase.length < 8}
            onPress={() => onSubmit(passphrase)}
          >
            <Text style={styles.btnText}>{t('settings.export.encrypted.action')}</Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={{ color: theme.tokens.color.textMuted }}>{t('common.cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.45)' },
  card: { borderRadius: 12, padding: 20 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  hint: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 12 },
  btn: { padding: 14, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
  cancel: { marginTop: 12, alignItems: 'center' },
});
