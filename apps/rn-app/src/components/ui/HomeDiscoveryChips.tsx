import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useT } from '../../i18n/I18nProvider';
import { PrimaryButton } from './PrimaryButton';

type ChipId = 'mood' | 'goals' | 'ai';

type Props = {
  onOpenGoals: () => void;
  onNavigateMood: () => void;
};

export function HomeDiscoveryChips({ onOpenGoals, onNavigateMood }: Props) {
  const theme = useTheme();
  const { t } = useT();
  const [openModal, setOpenModal] = useState<ChipId | null>(null);

  const chips: { id: ChipId; labelKey: string; onPress: () => void }[] = [
    { id: 'mood', labelKey: 'home.discover.mood', onPress: () => setOpenModal('mood') },
    { id: 'goals', labelKey: 'home.discover.goals', onPress: onOpenGoals },
    { id: 'ai', labelKey: 'home.discover.ai', onPress: () => setOpenModal('ai') },
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {chips.map((chip) => (
          <Pressable
            key={chip.id}
            onPress={chip.onPress}
            style={[styles.chip, { borderColor: theme.color.accent + '66', backgroundColor: theme.color.accent + '14' }]}
            accessibilityRole="button"
            accessibilityLabel={t(chip.labelKey)}
            hitSlop={6}
          >
            <Text style={[styles.chipText, { color: theme.color.text, fontSize: 13 }]} numberOfLines={2}>
              {t(chip.labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Modal
        visible={openModal === 'mood'}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenModal(null)}
        accessibilityViewIsModal
      >
        <Pressable style={styles.backdrop} onPress={() => setOpenModal(null)}>
          <Pressable style={[styles.modalCard, { backgroundColor: theme.color.background }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: theme.color.text }]}>{t('home.discover.mood')}</Text>
            <Text style={[styles.modalBody, { color: theme.color.text + 'cc' }]}>{t('home.discover.mood.info')}</Text>
            <PrimaryButton
              label={t('home.discover.mood.cta')}
              onPress={() => {
                setOpenModal(null);
                onNavigateMood();
              }}
              style={{ marginTop: 12 }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={openModal === 'ai'}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenModal(null)}
        accessibilityViewIsModal
      >
        <Pressable style={styles.backdrop} onPress={() => setOpenModal(null)}>
          <Pressable style={[styles.modalCard, { backgroundColor: theme.color.background }]} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: theme.color.text }]}>{t('home.discover.ai')}</Text>
            <Text style={[styles.modalBody, { color: theme.color.text + 'cc' }]}>{t('home.discover.ai.info')}</Text>
            <PrimaryButton label={t('common.close')} onPress={() => setOpenModal(null)} style={{ marginTop: 12 }} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8, marginBottom: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flex: 1,
    minWidth: 100,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  chipText: { textAlign: 'center', fontWeight: '500' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: '700', marginBottom: 10 },
  modalBody: { fontSize: 15, lineHeight: 22 },
});
