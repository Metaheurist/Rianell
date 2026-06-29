import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';
import { RefreshControl } from '../components/legacyRnJsx';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';
import { loadLogs } from '../storage/logs';
import { Share } from 'react-native';
import { runDeterministicAnalysis, exportAnalysisJsonForResearch, type AiRange } from '../ai/analyzeLogs';
import type { Preferences } from '../storage/preferences';
import { loadCachedBenchmark, type BenchmarkResult } from '../performance/benchmark';
import { generateSummaryNote, generateClinicianVisitBrief, generateDoctorQuestions, generateStructuredInsights, sendWeekChatMessage, type WeekChatTurn } from '../ai/llm';
import { MAX_WEEK_CHAT_TURNS, canSendWeekChatTurn, POOL_INSIGHT_MIN_K } from '@rianell/shared';
import { fetchPoolInsights } from '../cloud/sync';
import { EmptyState } from '../components/ui/EmptyState';
import { AiInsightEmptyPreview } from '../components/ui/EmptyPreview';
import { OasisNeuralTrace } from '../components/ui/OasisNeuralTrace';

const RANGE_OPTIONS: AiRange[] = [14, 30, 90, 'all'];

function AiStaggerOnMount({
  delay,
  children,
  style,
}: {
  delay: number;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.spring(anim, { toValue: 1, friction: 8, tension: 120, useNativeDriver: true }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [anim, delay]);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  return (
    <Animated.View style={[style, { opacity: anim, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

function fmt(value: number | null): string {
  return value == null ? '-' : value.toFixed(1);
}

export function AiScreen({ prefs }: { prefs: Preferences }) {
  const theme = useTheme();
  const { t, locale } = useT();
  const bg =
    theme.tokens.color.background ===
    'linear-gradient(135deg, #a8e6cf 0%, #c8e6c9 25%, #e8f5e8 75%, #f1f8e9 100%)'
      ? '#ffffff'
      : theme.tokens.color.background;
  const [range, setRange] = useState<AiRange>(30);
  const [logs, setLogs] = useState<Awaited<ReturnType<typeof loadLogs>>>([]);
  const [summaryNote, setSummaryNote] = useState<string>('');
  const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);
  const [clinicianBrief, setClinicianBrief] = useState<string>('');
  const [structuredInsights, setStructuredInsights] = useState<string>('');
  const [clinicianBriefLoading, setClinicianBriefLoading] = useState(false);
  const [doctorQuestions, setDoctorQuestions] = useState<string[]>([]);
  const [doctorQuestionsLoading, setDoctorQuestionsLoading] = useState(false);
  const [weekChatTurns, setWeekChatTurns] = useState<WeekChatTurn[]>([]);
  const [weekChatInput, setWeekChatInput] = useState('');
  const [weekChatLoading, setWeekChatLoading] = useState(false);
  const [poolInsightMessage, setPoolInsightMessage] = useState<string | null>(null);
  const [poolInsights, setPoolInsights] = useState<Array<{ id: string; highFlarePct: number; lowFlarePct: number; kMin: number }>>([]);

  const analysis = useMemo(() => {
    if (!prefs.aiEnabled) return null;
    return runDeterministicAnalysis(logs, range, {
      translate: t,
      goals: prefs.goals,
      conditionPack: prefs.medicalCondition?.toLowerCase().includes('migraine')
        ? 'migraine'
        : prefs.medicalCondition?.toLowerCase().includes('ibs')
          ? 'ibs'
          : undefined,
    });
  }, [logs, prefs.aiEnabled, prefs.goals, prefs.medicalCondition, range, t]);

  const summary = analysis?.summary ?? null;

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const nextLogs = await loadLogs();
      setLogs(nextLogs);
    } catch {
      setError(t('ai.load.failed'));
      setSummaryNote('');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCachedBenchmark().then(setBenchmark).catch(() => setBenchmark(null));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!prefs.contributeAnonData || !prefs.medicalCondition?.trim()) {
      setPoolInsights([]);
      setPoolInsightMessage(null);
      return;
    }
    void fetchPoolInsights(prefs.medicalCondition).then((result) => {
      if (!result.ok) {
        setPoolInsights([]);
        setPoolInsightMessage(result.message);
        return;
      }
      setPoolInsightMessage(
        result.insights.suppressed
          ? t('research.pool.insights.suppressed', { kMin: String(result.insights.kMin || POOL_INSIGHT_MIN_K) })
          : null,
      );
      const sleepFlareRows = (result.insights.insights || []).filter(
        (row: { id?: string; highFlarePct?: number; lowFlarePct?: number; kMin?: number }) =>
          row.id === 'sleep-flare' && typeof row.highFlarePct === 'number',
      );
      setPoolInsights(
        sleepFlareRows.map((row: { id?: string; highFlarePct?: number; lowFlarePct?: number; kMin?: number }) => ({
          id: row.id as string,
          highFlarePct: row.highFlarePct as number,
          lowFlarePct: row.lowFlarePct as number,
          kMin: row.kMin ?? POOL_INSIGHT_MIN_K,
        })),
      );
    });
  }, [prefs.contributeAnonData, prefs.medicalCondition, t]);

  useEffect(() => {
    let cancelled = false;
    if (!prefs.aiEnabled || !summary) {
      setSummaryNote('');
      return;
    }
    if (summary.totalLogs === 0) {
      setSummaryNote(t('ai.empty.noRangeNote'));
      return;
    }
    void (async () => {
      try {
        const note = await generateSummaryNote(
          summary,
          prefs.performance.preferredLlmModelSize,
          benchmark,
          locale
        );
        if (!cancelled) setSummaryNote(note);
      } catch {
        if (!cancelled) setSummaryNote('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [benchmark, locale, prefs.aiEnabled, prefs.performance.preferredLlmModelSize, summary, t]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor:
                theme.mode === 'light' ? `${theme.tokens.color.text}0D` : 'rgba(0,0,0,0.18)',
              position: 'relative',
              overflow: 'hidden',
            },
          ]}
        >
        <OasisNeuralTrace color={theme.tokens.color.accent + '88'} height={72} />
        <Text style={[styles.title, { color: theme.tokens.color.accent, fontSize: theme.font(22) }]}>{t('nav.ai')}</Text>

          <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
            {t('ai.lead')}
          </Text>

          {!prefs.aiEnabled ? (
            <Text style={[styles.error, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
              {t('ai.disabled.hint')}
            </Text>
          ) : null}

          {prefs.aiEnabled && logs.length === 0 ? <AiInsightEmptyPreview /> : null}

          <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{t('ai.filter.range')}</Text>
          <View style={styles.rangeRow}>
            {RANGE_OPTIONS.map((opt) => {
              const selected = opt === range;
              const label = opt === 'all' ? 'All' : `${opt}d`;
              return (
                <Pressable
                  key={String(opt)}
                  accessibilityRole="button"
                  accessibilityLabel={opt === 'all' ? 'AI analysis range all time' : `AI analysis range ${opt} days`}
                  accessibilityState={{ selected }}
                  style={[
                    styles.rangeChip,
                    {
                      backgroundColor: selected
                        ? `${theme.tokens.color.accent}33`
                        : `${theme.tokens.color.text}14`,
                    },
                  ]}
                  onPress={() => setRange(opt)}
                >
                  <Text
                    style={[
                      styles.rangeChipText,
                      {
                        color: selected ? theme.tokens.color.accent : theme.tokens.color.text,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {error ? (
            <Text style={[styles.error, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{error}</Text>
          ) : null}

          {prefs.aiEnabled && summary && summary.totalLogs === 0 && logs.length > 0 ? (
            <EmptyState variant="ai" message={t('ai.empty.warm.message')} />
          ) : null}

          {summary && prefs.aiEnabled && summary.totalLogs > 0 ? (
            <>
              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{t('ai.section.summaryNote')}</Text>
              <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                {summaryNote || t('ai.loading.generating')}
              </Text>

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{t('common.at.a.glance')}</Text>
              <AiStaggerOnMount delay={0}>
                <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  Range: {summary.rangeLabel} ({summary.totalLogs} log{summary.totalLogs === 1 ? '' : 's'})
                </Text>
              </AiStaggerOnMount>
              <AiStaggerOnMount delay={55}>
                <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  Flare days: {summary.flareDays}
                </Text>
              </AiStaggerOnMount>
              <AiStaggerOnMount delay={110}>
                <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  Top symptoms: {summary.topSymptoms.length ? summary.topSymptoms.join(', ') : '-'}
                </Text>
              </AiStaggerOnMount>
              <AiStaggerOnMount delay={165}>
                <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  Top stressors: {summary.topStressors.length ? summary.topStressors.join(', ') : '-'}
                </Text>
              </AiStaggerOnMount>

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{t('ai.section.whatWeFound')}</Text>
              <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                Patterns in everyday language from your own logs in this range.
              </Text>
              <AiStaggerOnMount delay={220}>
                <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  Mood avg: {fmt(summary.avgMood)} / 10
                </Text>
              </AiStaggerOnMount>
              <AiStaggerOnMount delay={275}>
                <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  Sleep avg: {fmt(summary.avgSleep)} / 10
                </Text>
              </AiStaggerOnMount>
              <AiStaggerOnMount delay={330}>
                <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  Fatigue avg: {fmt(summary.avgFatigue)} / 10
                </Text>
              </AiStaggerOnMount>

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{t('ai.top.insights')}</Text>
              <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                {t('ai.top.insights.hint')}
              </Text>
              {(analysis?.insights ?? []).map((insight, index) => (
                <AiStaggerOnMount key={insight.id} delay={385 + index * 55}>
                  <Pressable
                    onPress={() => setExpandedInsightId(expandedInsightId === insight.id ? null : insight.id)}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                      {insight.rank}. {insight.text} ({insight.confidence}%)
                    </Text>
                    {expandedInsightId === insight.id && insight.why?.contributingDates?.length ? (
                      <Text style={[styles.meta, { color: theme.tokens.color.textMuted, fontSize: theme.font(12) }]}>
                        Dates: {insight.why.contributingDates.join(', ')}
                      </Text>
                    ) : null}
                  </Pressable>
                </AiStaggerOnMount>
              ))}

              {analysis?.triggerHypotheses?.length ? (
                <>
                  <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{t('ai.trigger.hypotheses')}</Text>
                  {analysis.triggerHypotheses.map((h) => (
                    <Text key={h.id} style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                      {h.label}: +{h.lift}% flare lift ({h.overlap} days)
                    </Text>
                  ))}
                </>
              ) : null}

              {analysis?.weeklyDigest ? (
                <>
                  <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{t('ai.weekly.digest')}</Text>
                  <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                    {analysis.weeklyDigest.headline}
                  </Text>
                </>
              ) : null}

              {analysis?.anomalies?.length ? (
                <>
                  <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{t('ai.anomaly.alerts')}</Text>
                  {analysis.anomalies.map((a) => (
                    <Text key={a.id} style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                      {a.message}
                    </Text>
                  ))}
                </>
              ) : null}

              {analysis?.treatmentComparisons?.length ? (
                <>
                  <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{t('ai.treatment.windows')}</Text>
                  {analysis.treatmentComparisons.map((comparison) => (
                    <Text key={comparison.id} style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                      {comparison.label}: fatigue {comparison.preFatigueAvg ?? '-'} → {comparison.postFatigueAvg ?? '-'}
                    </Text>
                  ))}
                </>
              ) : null}

              {analysis?.conditionHints?.hints?.length ? (
                <>
                  <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{t('ai.condition.pack')}</Text>
                  {analysis.conditionHints.hints.map((hint) => (
                    <Text key={hint} style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                      {hint}
                    </Text>
                  ))}
                </>
              ) : null}

              <Pressable
                style={[styles.rangeChip, { alignSelf: 'flex-start', marginTop: 8 }]}
                onPress={() => {
                  if (!summary || clinicianBriefLoading) return;
                  setClinicianBriefLoading(true);
                  void generateClinicianVisitBrief(
                    summary,
                    logs,
                    prefs.performance.preferredLlmModelSize,
                    benchmark,
                    locale,
                    prefs
                  )
                    .then((text) => setClinicianBrief(text))
                    .catch(() => setError(t('settings.export.failed')))
                    .finally(() => setClinicianBriefLoading(false));
                }}
              >
                <Text style={{ color: theme.tokens.color.accent, fontWeight: '700' }}>
                  {clinicianBriefLoading ? t('ai.clinicianBrief.loading') : t('ai.clinicianBrief.action')}
                </Text>
              </Pressable>

              {clinicianBrief ? (
                <>
                  <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
                    {t('ai.clinicianBrief.section')}
                  </Text>
                  <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                    {clinicianBrief}
                  </Text>
                </>
              ) : null}

              <Pressable
                style={[styles.rangeChip, { alignSelf: 'flex-start', marginTop: 8 }]}
                onPress={() => {
                  if (!summary || doctorQuestionsLoading) return;
                  setDoctorQuestionsLoading(true);
                  void generateDoctorQuestions(
                    summary,
                    prefs.performance.preferredLlmModelSize,
                    benchmark,
                    locale,
                    prefs
                  )
                    .then((items) => setDoctorQuestions(items))
                    .catch(() => setError(t('settings.export.failed')))
                    .finally(() => setDoctorQuestionsLoading(false));
                }}
              >
                <Text style={{ color: theme.tokens.color.accent, fontWeight: '700' }}>
                  {doctorQuestionsLoading ? t('ai.doctorQuestions.loading') : t('ai.doctorQuestions.action')}
                </Text>
              </Pressable>

              {doctorQuestions.length ? (
                <>
                  <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
                    {t('ai.doctorQuestions.section')}
                  </Text>
                  {doctorQuestions.map((q, idx) => (
                    <Text key={`dq-${idx}`} style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                      {idx + 1}. {q}
                    </Text>
                  ))}
                </>
              ) : null}

              <Pressable
                style={[styles.rangeChip, { alignSelf: 'flex-start', marginTop: 8 }]}
                onPress={() => {
                  if (!summary) return;
                  void generateStructuredInsights(
                    summary,
                    prefs.performance.preferredLlmModelSize,
                    benchmark,
                    locale,
                    prefs
                  ).then((text) => setStructuredInsights(text));
                }}
              >
                <Text style={{ color: theme.tokens.color.accent, fontWeight: '700' }}>{t('ai.structuredInsights.section')}</Text>
              </Pressable>

              {structuredInsights ? (
                <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  {structuredInsights}
                </Text>
              ) : null}

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
                {t('ai.weekChat.section')}
              </Text>
              <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                {t('ai.weekChat.hint', { max: String(MAX_WEEK_CHAT_TURNS) })}
              </Text>
              {weekChatTurns.map((turn, idx) => (
                <View key={`week-chat-${idx}`} style={{ marginBottom: 8 }}>
                  <Text style={[styles.metric, { color: theme.tokens.color.accent, fontSize: theme.font(13) }]}>
                    {turn.user}
                  </Text>
                  <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                    {turn.assistant}
                  </Text>
                </View>
              ))}
              {canSendWeekChatTurn(weekChatTurns.length) ? (
                <>
                  <TextInput
                    value={weekChatInput}
                    onChangeText={setWeekChatInput}
                    placeholder={t('ai.weekChat.placeholder')}
                    placeholderTextColor={`${theme.tokens.color.text}88`}
                    editable={!weekChatLoading}
                    style={[
                      styles.weekChatInput,
                      {
                        color: theme.tokens.color.text,
                        borderColor: `${theme.tokens.color.text}33`,
                        fontSize: theme.font(14),
                      },
                    ]}
                  />
                  <Pressable
                    style={[styles.rangeChip, { alignSelf: 'flex-start', marginTop: 8, opacity: weekChatLoading ? 0.6 : 1 }]}
                    disabled={weekChatLoading || !weekChatInput.trim()}
                    onPress={() => {
                      if (!summary || weekChatLoading || !weekChatInput.trim()) return;
                      const message = weekChatInput.trim();
                      setWeekChatLoading(true);
                      void sendWeekChatMessage(
                        summary,
                        logs,
                        weekChatTurns,
                        message,
                        prefs.performance.preferredLlmModelSize,
                        benchmark,
                        locale,
                        prefs
                      )
                        .then(({ reply, canSendAnother }) => {
                          setWeekChatTurns((prev) => [...prev, { user: message, assistant: reply }]);
                          setWeekChatInput('');
                          if (!canSendAnother) setWeekChatInput('');
                        })
                        .catch(() => setError(t('settings.export.failed')))
                        .finally(() => setWeekChatLoading(false));
                    }}
                  >
                    <Text style={{ color: theme.tokens.color.accent, fontWeight: '700' }}>
                      {weekChatLoading ? t('ai.weekChat.loading') : t('ai.weekChat.send')}
                    </Text>
                  </Pressable>
                  <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                    {t('ai.weekChat.turnsLeft', {
                      left: String(MAX_WEEK_CHAT_TURNS - weekChatTurns.length),
                    })}
                  </Text>
                </>
              ) : (
                <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                  {t('ai.weekChat.limitReached')}
                </Text>
              )}

              <Pressable
                style={[styles.rangeChip, { alignSelf: 'flex-start', marginTop: 8 }]}
                onPress={() => {
                  try {
                    const json = exportAnalysisJsonForResearch(analysis, { optIn: true });
                    void Share.share({ message: json, title: t('ai.analysis.export') });
                  } catch {
                    setError(t('settings.export.failed'));
                  }
                }}
              >
                <Text style={{ color: theme.tokens.color.accent, fontWeight: '700' }}>{t('ai.export.analysis.json.research')}</Text>
              </Pressable>

              {prefs.contributeAnonData ? (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
                    {t('research.pool.insights.title')}
                  </Text>
                  <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                    {t('research.pool.insights.lead', { kMin: String(POOL_INSIGHT_MIN_K) })}
                  </Text>
                  {poolInsightMessage ? (
                    <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                      {poolInsightMessage}
                    </Text>
                  ) : null}
                  {poolInsights.map((insight) => (
                    <Text
                      key={insight.id}
                      style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                    >
                      {t('research.pool.insight.sleepFlare', {
                        highPct: String(insight.highFlarePct),
                        lowPct: String(insight.lowFlarePct),
                        kMin: String(insight.kMin),
                      })}
                    </Text>
                  ))}
                </View>
              ) : null}

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{t('ai.section.whatYouLogged')}</Text>
              {summary.whatYouLogged.map((line) => (
                <Text key={`wyl-${line}`} style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  {line}
                </Text>
              ))}

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{t('ai.section.howYouAreDoing')}</Text>
              <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                Recent averages versus latest entries. This is guidance, not diagnosis.
              </Text>
              {summary.howYouAreDoing.map((line) => (
                <Text key={`hyd-${line}`} style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  {line}
                </Text>
              ))}

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{t('ai.section.thingsToWatch')}</Text>
              <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                Unusual patterns that may be worth checking in with your symptoms and routine.
              </Text>
              {summary.thingsToWatch.map((line) => (
                <Text key={`ttw-${line}`} style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  {line}
                </Text>
              ))}

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{t('ai.important')}</Text>
              <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                {t('ai.disclaimer.medical')}
              </Text>
              {summary.important.map((line) => (
                <Text key={`imp-${line}`} style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  {line}
                </Text>
              ))}

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{t('ai.section.flareUp')}</Text>
              <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                A simple score from current log patterns - not a medical test.
              </Text>
              <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                Level: {summary.possibleFlareUp.level} ({summary.possibleFlareUp.matchingSignals} / 5 signs)
              </Text>
              {summary.possibleFlareUp.notes.map((line) => (
                <Text key={`pfu-${line}`} style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  {line}
                </Text>
              ))}

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{t('ai.section.correlations')}</Text>
              <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                Metrics that tend to move together in your recent logs.
              </Text>
              {summary.correlations.map((line) => (
                <Text key={`corr-${line}`} style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  {line}
                </Text>
              ))}

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{t('ai.groups.that.change.together')}</Text>
              <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                Clusters of metrics that often shift in the same period.
              </Text>
              {summary.groupsThatChangeTogether.map((line) => (
                <Text key={`grp-${line}`} style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  {line}
                </Text>
              ))}
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  scrollContent: { paddingBottom: 28 },
  card: { borderRadius: 16, padding: 16, backgroundColor: 'rgba(0,0,0,0.18)' },
  title: { fontWeight: '700', marginBottom: 8 },
  text: { opacity: 0.95, marginBottom: 10 },
  section: { marginTop: 12, marginBottom: 6, fontWeight: '800', opacity: 0.85 },
  metric: { marginBottom: 5, opacity: 0.95 },
  meta: { marginBottom: 6, opacity: 0.82 },
  error: { marginTop: 8, opacity: 0.95 },
  rangeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  rangeChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  rangeChipText: { fontWeight: '800' },
  weekChatInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    minHeight: 44,
  },
});

