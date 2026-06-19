import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  WEEKLY_REVIEW_STEPS,
  summarizeCorrelationStep,
  summarizeDigestStep,
  isoWeekMondayKey,
} from '@rianell/shared';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { Preferences } from '../storage/preferences';
import { loadLogs } from '../storage/logs';
import { runDeterministicAnalysis, summarizeLogsForAi } from '../ai/analyzeLogs';
import { buildCorrelationCards } from '../ai/engine';
import { generateClinicianVisitBrief } from '../ai/llm';
import { loadCachedBenchmark } from '../performance/benchmark';
import { printOrShareAppointmentReport } from '../utils/appointmentPdf';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function WeeklyReviewScreen({
  prefs,
  onChangePrefs,
}: {
  prefs: Preferences;
  onChangePrefs: (next: Preferences) => void;
}) {
  const theme = useTheme();
  const { t, locale } = useT();
  const navigation = useNavigation<Nav>();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [briefText, setBriefText] = useState('');
  const [logs, setLogs] = useState<Awaited<ReturnType<typeof loadLogs>>>([]);

  const analysis = useMemo(
    () =>
      logs.length
        ? runDeterministicAnalysis(logs, 14, {
            translate: t,
            goals: prefs.goals,
          })
        : null,
    [logs, prefs.goals, t],
  );

  const correlationLines = useMemo(() => {
    if (!logs.length) return [];
    return summarizeCorrelationStep(buildCorrelationCards(logs, 14));
  }, [logs]);

  const digest = useMemo(() => summarizeDigestStep(analysis?.weeklyDigest), [analysis]);

  useEffect(() => {
    void loadLogs().then(setLogs);
  }, []);

  const loadBrief = useCallback(async () => {
    if (!prefs.aiEnabled || !logs.length) {
      setBriefText(t('weeklyReview.brief.fallback'));
      return;
    }
    setBusy(true);
    try {
      const summary = summarizeLogsForAi(logs, 14, { translate: t });
      const benchmark = await loadCachedBenchmark().catch(() => null);
      const brief = await generateClinicianVisitBrief(
        summary,
        logs,
        prefs.performance.preferredLlmModelSize,
        benchmark,
        locale,
        prefs,
      ).catch(() => '');
      setBriefText(brief || t('weeklyReview.brief.fallback'));
    } finally {
      setBusy(false);
    }
  }, [locale, logs, prefs, t]);

  useEffect(() => {
    if (step === 2 && !briefText) void loadBrief();
  }, [briefText, loadBrief, step]);

  const onNext = () => {
    if (step < WEEKLY_REVIEW_STEPS.length - 1) setStep(step + 1);
  };

  const onBack = () => {
    if (step > 0) setStep(step - 1);
    else navigation.goBack();
  };

  const onFinishPdf = async () => {
    setBusy(true);
    try {
      await printOrShareAppointmentReport({ logs, prefs, briefText, doctorQuestions: [] });
      const today = new Date().toISOString().slice(0, 10);
      onChangePrefs({ ...prefs, weeklyReviewDismissedWeek: isoWeekMondayKey(today) });
      navigation.goBack();
    } catch (e) {
      Alert.alert(t('weeklyReview.title'), e instanceof Error ? e.message : t('settings.export.failed'));
    } finally {
      setBusy(false);
    }
  };

  const current = WEEKLY_REVIEW_STEPS[step];
  const bg =
    theme.tokens.color.background ===
    'linear-gradient(135deg, #a8e6cf 0%, #c8e6c9 25%, #e8f5e8 75%, #f1f8e9 100%)'
      ? '#ffffff'
      : theme.tokens.color.background;

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.tokens.color.text, fontSize: theme.font(20) }]}>
          {t('weeklyReview.title')}
        </Text>
        <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
          {t('weeklyReview.progress', { current: String(step + 1), total: String(WEEKLY_REVIEW_STEPS.length) })}
        </Text>
        <Text style={[styles.stepTitle, { color: theme.tokens.color.accent, fontSize: theme.font(16) }]}>
          {t(current.i18n)}
        </Text>

        {current.id === 'correlations' ? (
          correlationLines.length ? (
            correlationLines.map((line) => (
              <Text key={line.id} style={[styles.body, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                · {line.label} {line.detail ? `— ${line.detail}` : ''}
              </Text>
            ))
          ) : (
            <Text style={[styles.body, { color: theme.tokens.color.text }]}>{t('weeklyReview.correlations.empty')}</Text>
          )
        ) : null}

        {current.id === 'digest' ? (
          <>
            <Text style={[styles.body, { color: theme.tokens.color.text }]}>{digest.headline}</Text>
            {digest.improvements.map((line) => (
              <Text key={`imp-${line}`} style={[styles.body, { color: theme.tokens.color.text }]}>
                + {line}
              </Text>
            ))}
            {digest.concerns.map((line) => (
              <Text key={`con-${line}`} style={[styles.body, { color: theme.tokens.color.text }]}>
                − {line}
              </Text>
            ))}
          </>
        ) : null}

        {current.id === 'brief' ? (
          busy ? (
            <ActivityIndicator color={theme.tokens.color.accent} />
          ) : (
            <Text style={[styles.body, { color: theme.tokens.color.text }]}>{briefText}</Text>
          )
        ) : null}

        {current.id === 'confirm' ? (
          <Text style={[styles.body, { color: theme.tokens.color.text }]}>{t('weeklyReview.confirm.lead')}</Text>
        ) : null}

        {current.id === 'pdf' ? (
          <Text style={[styles.body, { color: theme.tokens.color.text }]}>{t('weeklyReview.pdf.lead')}</Text>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.btnGhost} onPress={onBack}>
          <Text style={{ color: theme.tokens.color.text }}>{step === 0 ? t('common.cancel') : t('common.back')}</Text>
        </Pressable>
        {current.id === 'pdf' ? (
          <Pressable style={[styles.btnPrimary, { backgroundColor: theme.tokens.color.accent, opacity: busy ? 0.6 : 1 }]} onPress={() => void onFinishPdf()} disabled={busy}>
            <Text style={styles.btnPrimaryText}>{busy ? t('weeklyReview.pdf.busy') : t('weeklyReview.pdf.action')}</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.btnPrimary, { backgroundColor: theme.tokens.color.accent }]} onPress={onNext}>
            <Text style={styles.btnPrimaryText}>{t('common.continue')}</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  content: { padding: 16, paddingBottom: 24 },
  title: { fontWeight: '800', marginBottom: 4 },
  meta: { opacity: 0.75, marginBottom: 12 },
  stepTitle: { fontWeight: '700', marginBottom: 12 },
  body: { lineHeight: 22, marginBottom: 8 },
  footer: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(128,128,128,0.35)' },
  btnGhost: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(128,128,128,0.35)' },
  btnPrimary: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10 },
  btnPrimaryText: { color: '#fff', fontWeight: '700' },
});
