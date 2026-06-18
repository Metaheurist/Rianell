import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';
import type { Preferences } from '../storage/preferences';

const SLIDE_BODIES = [
  'tutorial.slide0.body',
  'tutorial.slide1.body',
  'tutorial.slide2.body',
  'tutorial.slide3.body',
  'tutorial.slide4.body',
  'tutorial.slide5.body',
  'tutorial.slide6.body',
  'tutorial.slide7.body',
] as const;

function visibleSlideIndices(aiEnabled: boolean): number[] {
  if (aiEnabled) return [0, 1, 2, 3, 4, 5, 6, 7];
  return [0, 1, 5, 7];
}

export function TutorialModal({
  prefs,
  visible,
  onFinish,
  onSetAiEnabled,
}: {
  prefs: Preferences;
  visible: boolean;
  onFinish: (enableDemo?: boolean) => void;
  onSetAiEnabled: (enabled: boolean) => void;
}) {
  const theme = useTheme();
  const { t } = useT();
  const slides = useMemo(() => visibleSlideIndices(prefs.aiEnabled !== false), [prefs.aiEnabled]);
  const [pos, setPos] = useState(0);
  const slideIndex = slides[Math.min(pos, slides.length - 1)] ?? 0;
  const isFirst = pos <= 0;
  const isLast = pos >= slides.length - 1;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={[styles.root, { backgroundColor: theme.tokens.color.background }]}>
        <Text style={[styles.title, { color: theme.tokens.color.textPrimary }]}>{t('tutorial.welcome')}</Text>
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={[styles.bodyText, { color: theme.tokens.color.textSecondary }]}>
            {t(SLIDE_BODIES[slideIndex])}
          </Text>
          {slideIndex === 0 ? (
            <View style={styles.row}>
              <Pressable
                accessibilityRole="button"
                style={[styles.btn, { borderColor: theme.tokens.color.accent }]}
                onPress={() => {
                  onSetAiEnabled(true);
                  setPos(1);
                }}
              >
                <Text style={{ color: theme.tokens.color.accent }}>{t('common.enable')}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={[styles.btn, { borderColor: theme.tokens.color.border }]}
                onPress={() => {
                  onSetAiEnabled(false);
                  setPos(1);
                }}
              >
                <Text style={{ color: theme.tokens.color.textSecondary }}>{t('common.skip.for.now')}</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
        <View style={styles.footer}>
          {!isFirst ? (
            <Pressable accessibilityRole="button" onPress={() => setPos((p) => Math.max(0, p - 1))}>
              <Text style={{ color: theme.tokens.color.accent }}>{t('common.back')}</Text>
            </Pressable>
          ) : (
            <View />
          )}
          {!isLast ? (
            <Pressable accessibilityRole="button" onPress={() => setPos((p) => Math.min(slides.length - 1, p + 1))}>
              <Text style={{ color: theme.tokens.color.accent }}>{t('tutorial.next')}</Text>
            </Pressable>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => onFinish(false)}>
              <Text style={{ color: theme.tokens.color.accent, fontWeight: '600' }}>{t('tutorial.done')}</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  body: { flexGrow: 1, paddingVertical: 8 },
  bodyText: { fontSize: 16, lineHeight: 24 },
  row: { flexDirection: 'row', gap: 12, marginTop: 20, flexWrap: 'wrap' },
  btn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12 },
});
