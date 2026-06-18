import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ANON_POOL_EXCLUDED_FIELDS, ANON_POOL_INCLUDED_FIELDS } from '@rianell/shared';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function AnonPoolFieldChecklist({ visible, onClose, onConfirm }: Props) {
  const theme = useTheme();
  const { t } = useT();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: theme.tokens.color.background }]}>
        <Text style={[styles.title, { color: theme.tokens.color.textPrimary }]}>{t('settings.privacy.anonPool.title')}</Text>
        <Text style={[styles.lead, { color: theme.tokens.color.textMuted }]}>{t('settings.privacy.anonPool.lead')}</Text>
        <ScrollView style={styles.scroll}>
          <Text style={[styles.section, { color: theme.tokens.color.textPrimary }]}>{t('settings.privacy.anonPool.included')}</Text>
          {ANON_POOL_INCLUDED_FIELDS.map((row) => (
            <Text key={row.id} style={[styles.item, { color: theme.tokens.color.textMuted }]}>
              · {t(row.labelKey)}
            </Text>
          ))}
          <Text style={[styles.section, { color: theme.tokens.color.textPrimary, marginTop: 16 }]}>
            {t('settings.privacy.anonPool.excluded')}
          </Text>
          {ANON_POOL_EXCLUDED_FIELDS.map((row) => (
            <Text key={row.id} style={[styles.item, { color: theme.tokens.color.textMuted }]}>
              · {t(row.labelKey)}
            </Text>
          ))}
        </ScrollView>
        <Pressable style={[styles.btn, { backgroundColor: theme.tokens.color.accent }]} onPress={onConfirm}>
          <Text style={styles.btnText}>{t('settings.privacy.anonPool.confirm')}</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={onClose}>
          <Text style={{ color: theme.tokens.color.textMuted }}>{t('common.cancel')}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20, paddingTop: 48 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  lead: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  scroll: { flex: 1 },
  section: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  item: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  btn: { marginTop: 12, padding: 14, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
  secondary: { marginTop: 12, alignItems: 'center', padding: 8 },
});
