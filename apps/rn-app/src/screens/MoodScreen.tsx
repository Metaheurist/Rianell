import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { RefreshControl } from '../components/legacyRnJsx';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';
import { formatIsoDate } from '@rianell/shared';
import type { MainTabParamList } from '../navigation/RootNavigator';
import { loadLogs, saveLogs, type LogEntry } from '../storage/logs';
import type { Preferences } from '../storage/preferences';
import {
  applyMicroCheckin,
  completedCheckinPeriods,
  HOME_CHECKIN_PERIODS,
  summarizeMoodMetrics,
  moodQualitativeKey,
  PHQ2_QUESTIONS,
  GAD2_QUESTIONS,
  PHQ9_FOLLOWUP_QUESTIONS,
  GAD7_FOLLOWUP_QUESTIONS,
  PHQ9_MAX_SCORE,
  GAD7_MAX_SCORE,
  PHQ2_MAX_SCORE,
  GAD2_MAX_SCORE,
  SCREENING_RESPONSE_OPTIONS,
  scoreScreeningResponses,
  interpretPhq2Score,
  interpretGad2Score,
  interpretPhq9Score,
  interpretGad7Score,
  shouldOfferPhq9FollowUp,
  shouldOfferGad7FollowUp,
  mergePhq9Responses,
  mergeGad7Responses,
  scorePhq9FromResponses,
  scoreGad7FromResponses,
  isPhq9SuicideItemPositive,
  getCrisisResourcesForRegion,
  MENTAL_HEALTH_DISCLAIMER_I18N,
} from '@rianell/shared';

type MoodRange = 7 | 14 | 30;
type CheckinPeriod = 'AM' | 'midday' | 'PM';
type ScreeningKind = 'phq2' | 'gad2';
type ScreeningPhase = 'initial' | 'followup' | 'result';

const RANGE_OPTIONS: MoodRange[] = [7, 14, 30];

function parseScore1to10(raw: string): number | undefined {
  if (!raw.trim()) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1 || n > 10) return undefined;
  return Math.round(n);
}

function checkinPeriodLabelKey(period: CheckinPeriod): string {
  if (period === 'AM') return 'home.checkin.am';
  if (period === 'PM') return 'home.checkin.pm';
  return 'home.checkin.midday';
}

function checkinPeriodIcon(period: CheckinPeriod): keyof typeof Ionicons.glyphMap {
  if (period === 'AM') return 'sunny-outline';
  if (period === 'PM') return 'moon-outline';
  return 'partly-sunny-outline';
}

function periodMetaLabel(period: string | null, t: (key: string) => string): string {
  if (period === 'AM') return t('mood.period.am');
  if (period === 'PM') return t('mood.period.pm');
  if (period === 'midday') return t('mood.period.midday');
  return '';
}

function ScreeningFrequencySlider({
  value,
  onChange,
  accent,
  textColor,
  borderColor,
  t,
}: {
  value: number;
  onChange: (next: number) => void;
  accent: string;
  textColor: string;
  borderColor: string;
  t: (key: string) => string;
}) {
  const idx = Math.max(0, Math.min(3, value));
  const fillPct = (idx / 3) * 100;
  return (
    <View style={styles.screeningSlider}>
      <View style={[styles.screeningSliderTrack, { backgroundColor: `${textColor}14` }]}>
        <View style={[styles.screeningSliderFill, { width: `${fillPct}%`, backgroundColor: `${accent}55` }]} />
        <View style={styles.screeningSliderTicks}>
          {SCREENING_RESPONSE_OPTIONS.map((opt) => {
            const active = idx === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => onChange(opt.value)}
                style={styles.screeningSliderTickHit}
                accessibilityRole="adjustable"
                accessibilityState={{ selected: active }}
                accessibilityLabel={t(opt.i18n)}
              >
                <View
                  style={[
                    styles.screeningSliderTick,
                    { borderColor: active ? accent : borderColor },
                    active ? { backgroundColor: accent, transform: [{ scale: 1.12 }] } : null,
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
      <Text style={[styles.screeningSliderLabel, { color: textColor }]}>{t(SCREENING_RESPONSE_OPTIONS[idx].i18n)}</Text>
      <View style={styles.screeningSliderEnds}>
        <Text style={[styles.screeningSliderEndLabel, { color: `${textColor}99` }]}>
          {t(SCREENING_RESPONSE_OPTIONS[0].i18n)}
        </Text>
        <Text style={[styles.screeningSliderEndLabel, { color: `${textColor}99` }]}>
          {t(SCREENING_RESPONSE_OPTIONS[3].i18n)}
        </Text>
      </View>
    </View>
  );
}

export function MoodScreen({ prefs }: { prefs: Preferences }) {
  const theme = useTheme();
  const { t, locale } = useT();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const accent = theme.tokens.color.accent;
  const bg =
    theme.tokens.color.background ===
    'linear-gradient(135deg, #a8e6cf 0%, #c8e6c9 25%, #e8f5e8 75%, #f1f8e9 100%)'
      ? '#ffffff'
      : theme.tokens.color.background;

  const [range, setRange] = useState<MoodRange>(14);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [checkinPeriod, setCheckinPeriod] = useState<CheckinPeriod>('AM');
  const [checkinMood, setCheckinMood] = useState('');
  const [checkinSleep, setCheckinSleep] = useState('');
  const [checkinFatigue, setCheckinFatigue] = useState('');
  const [checkinSaving, setCheckinSaving] = useState(false);

  const [screeningOpen, setScreeningOpen] = useState(false);
  const [screeningKind, setScreeningKind] = useState<ScreeningKind>('phq2');
  const [screeningPhase, setScreeningPhase] = useState<ScreeningPhase>('initial');
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [initialResponses, setInitialResponses] = useState<Record<string, number>>({});
  const [mergedResponses, setMergedResponses] = useState<Record<string, number>>({});
  const [screeningFullInstrument, setScreeningFullInstrument] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setLogs(await loadLogs());
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const summary = useMemo(
    () =>
      summarizeMoodMetrics(logs, {
        days: range,
        todayStr,
        moodTarget: prefs.goals?.moodTarget ?? 7,
      }),
    [logs, prefs.goals?.moodTarget, range, todayStr],
  );

  const todayLog = useMemo(() => logs.find((l) => l.date === todayStr), [logs, todayStr]);
  const doneCheckinPeriods = useMemo(
    () => completedCheckinPeriods(todayLog),
    [todayLog],
  );

  const crisisLinks = useMemo(
    () => getCrisisResourcesForRegion(prefs.privacyRegion || 'other'),
    [prefs.privacyRegion],
  );

  const screeningQuestions =
    screeningPhase === 'followup'
      ? screeningKind === 'phq2'
        ? PHQ9_FOLLOWUP_QUESTIONS
        : GAD7_FOLLOWUP_QUESTIONS
      : screeningKind === 'phq2'
        ? PHQ2_QUESTIONS
        : GAD2_QUESTIONS;

  const activeScored = scoreScreeningResponses(
    screeningQuestions.map((q) => ({ id: q.id, value: responses[q.id] })),
  );

  const resultScored = useMemo(() => {
    if (!showResult) return { total: 0, complete: false, answered: 0 };
    if (screeningFullInstrument) {
      return screeningKind === 'phq2'
        ? scorePhq9FromResponses(mergedResponses)
        : scoreGad7FromResponses(mergedResponses);
    }
    const initialQs = screeningKind === 'phq2' ? PHQ2_QUESTIONS : GAD2_QUESTIONS;
    return scoreScreeningResponses(initialQs.map((q) => ({ id: q.id, value: responses[q.id] })));
  }, [showResult, screeningFullInstrument, screeningKind, mergedResponses, responses]);

  const resultMaxScore = showResult
    ? screeningFullInstrument
      ? screeningKind === 'phq2'
        ? PHQ9_MAX_SCORE
        : GAD7_MAX_SCORE
      : screeningKind === 'phq2'
        ? PHQ2_MAX_SCORE
        : GAD2_MAX_SCORE
    : 6;

  const interpretation = showResult
    ? screeningFullInstrument
      ? screeningKind === 'phq2'
        ? interpretPhq9Score(resultScored.total)
        : interpretGad7Score(resultScored.total)
      : screeningKind === 'phq2'
        ? interpretPhq2Score(resultScored.total)
        : interpretGad2Score(resultScored.total)
    : screeningKind === 'phq2'
      ? interpretPhq2Score(activeScored.total)
      : interpretGad2Score(activeScored.total);

  const showItem9Crisis =
    showResult && screeningFullInstrument && screeningKind === 'phq2' && isPhq9SuicideItemPositive(mergedResponses);

  const openCheckinModal = (period: CheckinPeriod) => {
    setCheckinPeriod(period);
    setCheckinMood('');
    setCheckinSleep('');
    setCheckinFatigue('');
    setCheckinModalOpen(true);
  };

  const onSaveCheckin = async () => {
    const metrics = {
      mood: parseScore1to10(checkinMood),
      sleep: parseScore1to10(checkinSleep),
      fatigue: parseScore1to10(checkinFatigue),
    };
    if (metrics.mood == null && metrics.sleep == null && metrics.fatigue == null) {
      Alert.alert(t('home.checkin.modalTitle'), t('wizard.energy.instructions'));
      return;
    }
    setCheckinSaving(true);
    try {
      const next = applyMicroCheckin(logs, todayStr, checkinPeriod, metrics);
      await saveLogs(next);
      setLogs(next);
      setCheckinModalOpen(false);
      Alert.alert(t('home.checkin.modalTitle'), t('home.checkin.saved'));
    } catch {
      Alert.alert(t('common.error'), t('wizard.alert.saveFailed'));
    } finally {
      setCheckinSaving(false);
    }
  };

  const openScreening = (kind: ScreeningKind) => {
    const questions = kind === 'phq2' ? PHQ2_QUESTIONS : GAD2_QUESTIONS;
    const initial: Record<string, number> = {};
    questions.forEach((q) => {
      initial[q.id] = 0;
    });
    setScreeningKind(kind);
    setScreeningPhase('initial');
    setResponses(initial);
    setInitialResponses({});
    setMergedResponses({});
    setScreeningFullInstrument(false);
    setShowResult(false);
    setScreeningOpen(true);
  };

  const onScreeningSubmit = () => {
    if (!activeScored.complete) return;
    if (screeningPhase === 'initial') {
      const offerFollowUp =
        screeningKind === 'phq2'
          ? shouldOfferPhq9FollowUp(activeScored.total)
          : shouldOfferGad7FollowUp(activeScored.total);
      if (offerFollowUp) {
        setInitialResponses({ ...responses });
        const followUpQs = screeningKind === 'phq2' ? PHQ9_FOLLOWUP_QUESTIONS : GAD7_FOLLOWUP_QUESTIONS;
        const next: Record<string, number> = {};
        followUpQs.forEach((q) => {
          next[q.id] = 0;
        });
        setResponses(next);
        setScreeningPhase('followup');
        return;
      }
      setScreeningFullInstrument(false);
    } else if (screeningPhase === 'followup') {
      const merged =
        screeningKind === 'phq2'
          ? mergePhq9Responses(initialResponses, responses)
          : mergeGad7Responses(initialResponses, responses);
      setMergedResponses(merged);
      setScreeningFullInstrument(true);
    }
    setScreeningPhase('result');
    setShowResult(true);
  };

  const trendKey =
    summary.trend === 'up'
      ? 'mood.trend.up'
      : summary.trend === 'down'
        ? 'mood.trend.down'
        : 'mood.trend.stable';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}
      >
        <Text style={[styles.title, { color: theme.tokens.color.textPrimary, fontSize: theme.font(22) }]}>
          {t('mood.title')}
        </Text>
        <Text style={[styles.lead, { color: theme.tokens.color.textMuted, fontSize: theme.font(14) }]}>
          {t('mood.lead')}
        </Text>

        <Text style={[styles.filterLabel, { color: theme.tokens.color.textMuted }]}>{t('mood.rangeLabel')}</Text>
        <View style={styles.chipRow}>
          {RANGE_OPTIONS.map((days) => {
            const active = range === days;
            return (
              <Pressable
                key={days}
                onPress={() => setRange(days)}
                style={[
                  styles.chip,
                  {
                    borderColor: active ? accent : theme.tokens.color.border,
                    backgroundColor: active ? `${accent}18` : 'transparent',
                  },
                ]}
              >
                <Text style={{ color: active ? accent : theme.tokens.color.textPrimary, fontWeight: '600' }}>
                  {days}d
                </Text>
              </Pressable>
            );
          })}
        </View>

        {summary.count === 0 ? (
          <Text style={[styles.empty, { color: theme.tokens.color.textMuted }]}>{t('mood.empty')}</Text>
        ) : (
          <>
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, { borderColor: theme.tokens.color.border }]}>
                <Text style={[styles.metricLabel, { color: theme.tokens.color.textMuted }]}>{t('mood.avg')}</Text>
                <Text style={[styles.metricValue, { color: accent }]}>{summary.average}/10</Text>
              </View>
              <View style={[styles.metricCard, { borderColor: theme.tokens.color.border }]}>
                <Text style={[styles.metricLabel, { color: theme.tokens.color.textMuted }]}>{t('mood.latest')}</Text>
                <Text style={[styles.metricValue, { color: accent }]}>
                  {summary.latest ? `${summary.latest.mood}/10` : '-'}
                </Text>
                {summary.latest ? (
                  <Text style={{ color: theme.tokens.color.textMuted, fontSize: theme.font(12) }}>
                    {t(moodQualitativeKey(summary.latest.mood))}
                  </Text>
                ) : null}
              </View>
              <View style={[styles.metricCard, { borderColor: theme.tokens.color.border }]}>
                <Text style={[styles.metricLabel, { color: theme.tokens.color.textMuted }]}>{t(trendKey)}</Text>
                <Text style={{ color: theme.tokens.color.textPrimary, fontSize: theme.font(13) }}>
                  {t('mood.count', { count: String(summary.count) })}
                </Text>
                <Text style={{ color: theme.tokens.color.textMuted, fontSize: theme.font(12) }}>
                  {t('mood.atTarget', { target: String(summary.moodTarget) })}: {summary.atTargetCount}
                </Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: theme.tokens.color.textPrimary }]}>{t('mood.recent.title')}</Text>
            {summary.readings.map((r, idx) => {
              const src = r.source === 'checkin' ? t('mood.source.checkin') : t('mood.source.daily');
              const period = r.period ? periodMetaLabel(r.period, t) : '';
              const meta = period ? `${src} · ${period}` : src;
              return (
                <View key={`${r.date}-${r.period ?? 'daily'}-${idx}`} style={[styles.readingRow, { borderColor: theme.tokens.color.border }]}>
                  <Text style={[styles.readingScore, { color: accent }]}>{r.mood}/10</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.tokens.color.textPrimary }}>{formatIsoDate(r.date, locale, { dateStyle: 'medium' })}</Text>
                    <Text style={{ color: theme.tokens.color.textMuted, fontSize: theme.font(12) }}>
                      {meta} · {t(moodQualitativeKey(r.mood))}
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {!prefs.simpleMode ? (
          <>
            <Text style={[styles.sectionTitle, { color: theme.tokens.color.textPrimary, marginTop: 20 }]}>
              {t('mood.checkin.title')}
            </Text>
            <View style={styles.checkinRow}>
              {(HOME_CHECKIN_PERIODS as readonly CheckinPeriod[]).map((period) => {
                const done = doneCheckinPeriods.has(period);
                return (
                  <Pressable
                    key={period}
                    disabled={done}
                    onPress={() => openCheckinModal(period)}
                    style={({ pressed }) => [
                      styles.checkinBtn,
                      {
                        borderColor: `${accent}66`,
                        opacity: done ? 0.55 : pressed ? 0.88 : 1,
                      },
                    ]}
                  >
                    <Ionicons name={checkinPeriodIcon(period)} size={26} color={accent} />
                    <Text style={[styles.checkinBtnLabel, { color: accent, fontSize: theme.font(12) }]}>
                      {t(checkinPeriodLabelKey(period))}
                    </Text>
                    {done ? (
                      <Text style={{ color: theme.tokens.color.textMuted, fontSize: theme.font(10) }}>
                        {t('home.checkin.done')}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            onPress={() => navigation.navigate('Charts', { initialView: 'individual' })}
            style={[styles.actionBtn, { borderColor: `${accent}66` }]}
          >
            <Text style={{ color: accent, fontWeight: '600' }}>{t('mood.viewCharts')}</Text>
          </Pressable>
          {!prefs.simpleMode ? (
            <>
              <Pressable onPress={() => openScreening('phq2')} style={styles.actionBtn}>
                <Text style={{ color: accent, fontWeight: '600' }}>{t('mentalHealth.phq2.action')}</Text>
              </Pressable>
              <Pressable onPress={() => openScreening('gad2')} style={styles.actionBtn}>
                <Text style={{ color: accent, fontWeight: '600' }}>{t('mentalHealth.gad2.action')}</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </ScrollView>

      <Modal visible={checkinModalOpen} animationType="slide" onRequestClose={() => setCheckinModalOpen(false)}>
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: bg }]}>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={[styles.sectionTitle, { color: theme.tokens.color.textPrimary }]}>
              {t('home.checkin.modalTitle')}: {t(checkinPeriodLabelKey(checkinPeriod))}
            </Text>
            <Text style={[styles.fieldLabel, { color: theme.tokens.color.textPrimary }]}>{t('wizard.mood.1.10')}</Text>
            <TextInput
              value={checkinMood}
              onChangeText={setCheckinMood}
              keyboardType="number-pad"
              style={[styles.input, { borderColor: theme.tokens.color.border, color: theme.tokens.color.textPrimary }]}
            />
            <Text style={[styles.fieldLabel, { color: theme.tokens.color.textPrimary }]}>{t('wizard.sleep.1.10')}</Text>
            <TextInput
              value={checkinSleep}
              onChangeText={setCheckinSleep}
              keyboardType="number-pad"
              style={[styles.input, { borderColor: theme.tokens.color.border, color: theme.tokens.color.textPrimary }]}
            />
            <Text style={[styles.fieldLabel, { color: theme.tokens.color.textPrimary }]}>{t('wizard.fatigue.1.10')}</Text>
            <TextInput
              value={checkinFatigue}
              onChangeText={setCheckinFatigue}
              keyboardType="number-pad"
              style={[styles.input, { borderColor: theme.tokens.color.border, color: theme.tokens.color.textPrimary }]}
            />
            <Pressable
              disabled={checkinSaving}
              onPress={() => void onSaveCheckin()}
              style={[styles.primaryBtn, { backgroundColor: accent, opacity: checkinSaving ? 0.6 : 1 }]}
            >
              <Text style={styles.primaryBtnText}>{t('home.checkin.save')}</Text>
            </Pressable>
            <Pressable onPress={() => setCheckinModalOpen(false)} style={{ marginTop: 16 }}>
              <Text style={{ color: theme.tokens.color.textMuted }}>{t('common.close')}</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={screeningOpen} animationType="slide" onRequestClose={() => setScreeningOpen(false)}>
        <ScrollView
          contentContainerStyle={[styles.modalBody, { backgroundColor: bg }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.sectionTitle, { color: theme.tokens.color.textPrimary }]}>
            {screeningKind === 'phq2' ? t('mentalHealth.phq2.title') : t('mentalHealth.gad2.title')}
          </Text>
          <Text style={{ color: theme.tokens.color.textMuted, fontStyle: 'italic', marginBottom: 8 }}>
            {t(MENTAL_HEALTH_DISCLAIMER_I18N)}
          </Text>
          {!showResult ? (
            <>
              {screeningPhase === 'followup' ? (
                <Text style={{ color: theme.tokens.color.textMuted, marginBottom: 12, lineHeight: 20 }}>
                  {t(screeningKind === 'phq2' ? 'mentalHealth.phq2.followUpIntro' : 'mentalHealth.gad2.followUpIntro')}
                </Text>
              ) : null}
              {screeningQuestions.map((q) => (
                <View key={q.id} style={styles.screeningQuestionBlock}>
                  <Text style={[styles.screeningQuestion, { color: theme.tokens.color.textPrimary }]}>
                    {t(q.i18n)}
                  </Text>
                  <ScreeningFrequencySlider
                    value={responses[q.id] ?? 0}
                    onChange={(next) => setResponses((prev) => ({ ...prev, [q.id]: next }))}
                    accent={accent}
                    textColor={theme.tokens.color.textPrimary}
                    borderColor={theme.tokens.color.border}
                    t={t}
                  />
                </View>
              ))}
              <View style={styles.screeningSubmitFooter}>
                <Pressable
                  disabled={!activeScored.complete}
                  onPress={onScreeningSubmit}
                  style={[
                    styles.primaryBtn,
                    styles.screeningSubmitBtn,
                    { opacity: activeScored.complete ? 1 : 0.5, backgroundColor: accent },
                  ]}
                >
                  <Text style={styles.primaryBtnText}>
                    {t(screeningPhase === 'followup' ? 'mentalHealth.submitFollowUp' : 'mentalHealth.submit')}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              {showItem9Crisis ? (
                <Text
                  accessibilityRole="alert"
                  style={{
                    color: theme.tokens.color.textPrimary,
                    fontWeight: '700',
                    marginBottom: 12,
                    lineHeight: 22,
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: accent,
                    backgroundColor: `${accent}14`,
                  }}
                >
                  {t('mentalHealth.phq9.item9Crisis')}
                </Text>
              ) : null}
              <Text style={[styles.sectionTitle, { color: theme.tokens.color.textPrimary }]}>{t('mentalHealth.result.title')}</Text>
              <Text style={{ color: theme.tokens.color.textPrimary, marginBottom: 8 }}>
                {t(interpretation.i18n)} ({resultScored.total}/{resultMaxScore})
              </Text>
              {crisisLinks.map((link) => (
                <Pressable
                  key={link.url}
                  accessibilityRole="link"
                  onPress={() => void Linking.openURL(link.url)}
                  style={[
                    styles.crisisHelpBtn,
                    { borderColor: theme.tokens.color.border, backgroundColor: theme.tokens.color.surfaceRaised },
                  ]}
                >
                  <Text style={[styles.crisisHelpBtnText, { color: accent }]}>{t(link.i18n)}</Text>
                </Pressable>
              ))}
            </>
          )}
          <Pressable onPress={() => setScreeningOpen(false)} style={{ marginTop: 16 }}>
            <Text style={{ color: theme.tokens.color.textMuted }}>{t('common.close')}</Text>
          </Pressable>
        </ScrollView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32 },
  title: { fontWeight: '700', marginBottom: 6 },
  lead: { lineHeight: 20, marginBottom: 14 },
  filterLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  empty: { lineHeight: 20, marginBottom: 12 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  metricCard: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 120,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  metricLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 },
  metricValue: { fontSize: 22, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  readingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  readingScore: { fontWeight: '700', minWidth: 48 },
  checkinRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  checkinBtn: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 88,
    gap: 6,
  },
  checkinBtnLabel: {
    fontWeight: '600',
    textAlign: 'center',
  },
  actions: { marginTop: 20, gap: 10 },
  actionBtn: { paddingVertical: 8 },
  modalSafe: { flex: 1 },
  modalBody: { padding: 20, paddingBottom: 40 },
  fieldLabel: { marginTop: 12, marginBottom: 6, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  primaryBtn: { marginTop: 20, borderRadius: 10, padding: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  crisisHelpBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  crisisHelpBtnText: { fontWeight: '700', textAlign: 'center' },
  screeningQuestionBlock: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 10,
  },
  screeningQuestion: { fontWeight: '600', lineHeight: 22 },
  screeningSlider: { gap: 8 },
  screeningSliderTrack: {
    height: 34,
    borderRadius: 999,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  screeningSliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
  },
  screeningSliderTicks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    zIndex: 1,
  },
  screeningSliderTickHit: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screeningSliderTick: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  screeningSliderLabel: { fontWeight: '600', textAlign: 'center', minHeight: 20 },
  screeningSliderEnds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  screeningSliderEndLabel: { flex: 1, fontSize: 11, lineHeight: 14 },
  screeningSubmitFooter: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
  },
  screeningSubmitBtn: { width: '100%', maxWidth: 280, marginTop: 0 },
});
