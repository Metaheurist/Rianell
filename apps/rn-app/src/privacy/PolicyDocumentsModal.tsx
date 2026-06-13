import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getPolicyDocumentsForRegion } from './helpers';
import { useT } from '../i18n/I18nProvider';
import { useTheme } from '../theme/ThemeProvider';

export function PolicyDocumentsModal({
  visible,
  regionId,
  onClose,
}: {
  visible: boolean;
  regionId: string;
  onClose: () => void;
}) {
  const theme = useTheme();
  const { t } = useT();
  const docs = getPolicyDocumentsForRegion(regionId || 'other');

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: theme.tokens.color.background }]}>
        <Text style={[styles.title, { color: theme.tokens.color.text }]}>{t('gate.policiesTitle')}</Text>
        <ScrollView style={styles.scroll}>
            {docs.map((d) => (
              <View key={d.id} style={styles.docBlock}>
                <Text style={[styles.docTitle, { color: theme.tokens.color.text }]}>
                  {t(`policy.${d.id}.title`) !== `policy.${d.id}.title` ? t(`policy.${d.id}.title`) : d.title}
                </Text>
                <Text style={[styles.docBody, { color: theme.tokens.color.textMuted }]}>
                  {t(`policy.${d.id}.summary`) !== `policy.${d.id}.summary` ? t(`policy.${d.id}.summary`) : d.summary}
                </Text>
              </View>
            ))}
          </ScrollView>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{t('common.close')}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20, paddingTop: 48 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  scroll: { flex: 1 },
  docBlock: { marginBottom: 16 },
  docTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  docBody: { fontSize: 14, lineHeight: 20 },
  closeBtn: { backgroundColor: '#0d9488', padding: 14, borderRadius: 10, alignItems: 'center' },
  closeBtnText: { color: '#fff', fontWeight: '600' },
});
