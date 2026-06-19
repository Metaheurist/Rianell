import React, { useMemo, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  getOnDeviceMoatBulletKeys,
  getProgressiveDisclosureMilestones,
  PHQ2_QUESTIONS,
  GAD2_QUESTIONS,
  SCREENING_RESPONSE_OPTIONS,
  scoreScreeningResponses,
  interpretPhq2Score,
  interpretGad2Score,
  getCrisisResourcesForRegion,
  MENTAL_HEALTH_DISCLAIMER_I18N,
} from '@rianell/shared';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';
import type { Preferences } from '../storage/preferences';

type ScreeningKind = 'phq2' | 'gad2';

export function SettingsCrossCuttingPane({ prefs }: { prefs: Preferences }) {
  const theme = useTheme();
  const { t } = useT();
  const [screeningOpen, setScreeningOpen] = useState(false);
  const [screeningKind, setScreeningKind] = useState<ScreeningKind>('phq2');
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);

  const moatBullets = getOnDeviceMoatBulletKeys();
  const milestones = getProgressiveDisclosureMilestones();
  const crisisLinks = useMemo(
    () => getCrisisResourcesForRegion(prefs.privacyRegion || 'other'),
    [prefs.privacyRegion],
  );

  const questions = screeningKind === 'phq2' ? PHQ2_QUESTIONS : GAD2_QUESTIONS;
  const scored = scoreScreeningResponses(
    questions.map((q) => ({ id: q.id, value: responses[q.id] })),
  );
  const interpretation =
    screeningKind === 'phq2'
      ? interpretPhq2Score(scored.total)
      : interpretGad2Score(scored.total);

  const openScreening = (kind: ScreeningKind) => {
    setScreeningKind(kind);
    setResponses({});
    setShowResult(false);
    setScreeningOpen(true);
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.heading, { color: theme.tokens.color.textPrimary }]}>{t('onDeviceMoat.title')}</Text>
      <Text style={[styles.hint, { color: theme.tokens.color.textMuted }]}>{t('onDeviceMoat.lead')}</Text>
      {moatBullets.map((key) => (
        <Text key={key} style={[styles.bullet, { color: theme.tokens.color.textMuted }]}>
          · {t(key)}
        </Text>
      ))}

      <Text style={[styles.heading, { color: theme.tokens.color.textPrimary, marginTop: 20 }]}>
        {t('progressiveDisclosure.title')}
      </Text>
      <Text style={[styles.hint, { color: theme.tokens.color.textMuted }]}>{t('progressiveDisclosure.lead')}</Text>
      {milestones.map((m) => (
        <Text key={m.id} style={[styles.bullet, { color: theme.tokens.color.textMuted }]}>
          · {t(m.i18n)}
        </Text>
      ))}

      <Text style={[styles.heading, { color: theme.tokens.color.textPrimary, marginTop: 20 }]}>
        {t('mentalHealth.title')}
      </Text>
      <Text style={[styles.hint, { color: theme.tokens.color.textMuted }]}>{t('mentalHealth.lead')}</Text>
      <Text style={[styles.disclaimer, { color: theme.tokens.color.textMuted }]}>{t(MENTAL_HEALTH_DISCLAIMER_I18N)}</Text>
      <Pressable onPress={() => openScreening('phq2')} style={styles.linkRow}>
        <Text style={{ color: theme.tokens.color.accent, fontWeight: '600' }}>{t('mentalHealth.phq2.action')}</Text>
      </Pressable>
      <Pressable onPress={() => openScreening('gad2')} style={styles.linkRow}>
        <Text style={{ color: theme.tokens.color.accent, fontWeight: '600' }}>{t('mentalHealth.gad2.action')}</Text>
      </Pressable>

      <Modal visible={screeningOpen} animationType="slide" onRequestClose={() => setScreeningOpen(false)}>
        <ScrollView
          contentContainerStyle={[styles.modalBody, { backgroundColor: theme.tokens.color.background }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.heading, { color: theme.tokens.color.textPrimary }]}>
            {screeningKind === 'phq2' ? t('mentalHealth.phq2.title') : t('mentalHealth.gad2.title')}
          </Text>
          <Text style={[styles.disclaimer, { color: theme.tokens.color.textMuted }]}>{t(MENTAL_HEALTH_DISCLAIMER_I18N)}</Text>

          {!showResult ? (
            <>
              {questions.map((q) => (
                <View key={q.id} style={styles.questionBlock}>
                  <Text style={{ color: theme.tokens.color.textPrimary, marginBottom: 8 }}>{t(q.i18n)}</Text>
                  {SCREENING_RESPONSE_OPTIONS.map((opt) => {
                    const selected = responses[q.id] === opt.value;
                    return (
                      <Pressable
                        key={`${q.id}-${opt.value}`}
                        onPress={() => setResponses((prev) => ({ ...prev, [q.id]: opt.value }))}
                        style={[
                          styles.optionRow,
                          {
                            borderColor: selected ? theme.tokens.color.accent : theme.tokens.color.border,
                            backgroundColor: selected ? `${theme.tokens.color.accent}18` : 'transparent',
                          },
                        ]}
                      >
                        <Text style={{ color: theme.tokens.color.textPrimary }}>{t(opt.i18n)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
              <Pressable
                disabled={!scored.complete}
                onPress={() => setShowResult(true)}
                style={[styles.primaryBtn, { opacity: scored.complete ? 1 : 0.5, backgroundColor: theme.tokens.color.accent }]}
              >
                <Text style={styles.primaryBtnText}>{t('mentalHealth.submit')}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={[styles.heading, { color: theme.tokens.color.textPrimary }]}>{t('mentalHealth.result.title')}</Text>
              <Text style={{ color: theme.tokens.color.textPrimary, marginBottom: 8 }}>
                {t(interpretation.i18n)} ({scored.total}/6)
              </Text>
              {crisisLinks.map((link) => (
                <Pressable key={link.url} onPress={() => void Linking.openURL(link.url)} style={styles.linkRow}>
                  <Text style={{ color: theme.tokens.color.accent }}>{t(link.i18n)}</Text>
                </Pressable>
              ))}
            </>
          )}

          <Pressable onPress={() => setScreeningOpen(false)} style={[styles.linkRow, { marginTop: 16 }]}>
            <Text style={{ color: theme.tokens.color.textMuted }}>{t('common.close')}</Text>
          </Pressable>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
  heading: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  hint: { fontSize: 13, lineHeight: 18, marginBottom: 6 },
  bullet: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  disclaimer: { fontSize: 12, lineHeight: 16, marginTop: 6, marginBottom: 8, fontStyle: 'italic' },
  linkRow: { marginTop: 10 },
  modalBody: { padding: 20, paddingBottom: 40 },
  questionBlock: { marginTop: 16 },
  optionRow: { borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 6 },
  primaryBtn: { marginTop: 20, borderRadius: 10, padding: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
});
