import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewImperativeMethods,
} from 'react-native';
import { RefreshControl } from '../components/legacyRnJsx';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
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

function defaultCheckinPeriod(): CheckinPeriod {
  const h = new Date().getHours();
  if (h < 12) return 'AM';
  if (h < 17) return 'midday';
  return 'PM';
}

const CHECKIN_SLIDER_SELECTED_SCALE = 1.8;
const CHECKIN_SLIDER_UNSELECTED_SCALE = 1;

type MoodTone = 'low' | 'moderate' | 'okay' | 'good' | 'neutral';

function moodToneFromScore(score: number): MoodTone {
  if (!Number.isFinite(score)) return 'neutral';
  if (score <= 3) return 'low';
  if (score <= 5) return 'moderate';
  if (score <= 7) return 'okay';
  return 'good';
}

const MOOD_TONE_COLORS: Record<MoodTone, string> = {
  low: '#9575cd',
  moderate: '#ffb74d',
  okay: '#81c784',
  good: '#7bdf8c',
  neutral: 'rgba(255,255,255,0.35)',
};

function formatMoodTimelineDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 10) return dateStr;
  const m = parseInt(dateStr.slice(5, 7), 10);
  const d = parseInt(dateStr.slice(8, 10), 10);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (!Number.isFinite(m) || m < 1 || m > 12) return dateStr.slice(5);
  return `${months[m - 1]} ${d}`;
}

function MoodRing({ score, tone, size, accent }: { score: number; tone: MoodTone; size: number; accent: string }) {
  const stroke = tone === 'good' ? accent : MOOD_TONE_COLORS[tone];
  const r = (size - 8) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, score / 10));
  const offset = circ * (1 - pct);
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={cx} cy={cy} r={r} stroke="rgba(255,255,255,0.12)" strokeWidth={4} fill="none" />
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        stroke={stroke}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${circ} ${circ}`}
        strokeDashoffset={offset}
        rotation={-90}
        origin={`${cx}, ${cy}`}
      />
      <SvgText
        x={cx}
        y={cy + 1}
        fill="#e0f2f1"
        fontSize={11}
        fontWeight="800"
        textAnchor="middle"
        alignmentBaseline="middle"
      >
        {String(score)}
      </SvgText>
    </Svg>
  );
}

function readingSourceLabel(
  r: { source: string; period: string | null },
  t: (key: string) => string,
): string {
  if (r.source === 'checkin') {
    if (r.period === 'AM' || r.period === 'midday' || r.period === 'PM') {
      return t(checkinPeriodLabelKey(r.period));
    }
    return t('mood.source.checkin');
  }
  return t('mood.source.daily');
}

function MoodReadingRibbon({
  readings,
  accent,
  textMuted,
  t,
}: {
  readings: Array<{ date: string; period: string | null; mood: number; source: string }>;
  accent: string;
  textMuted: string;
  t: (key: string) => string;
}) {
  const scrollRef = useRef<ScrollViewImperativeMethods | null>(null);
  const ordered = useMemo(() => [...readings].reverse(), [readings]);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, ordered.length - 1));
  const active = ordered[activeIndex] ?? ordered[ordered.length - 1];

  useEffect(() => {
    setActiveIndex(Math.max(0, ordered.length - 1));
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(timer);
  }, [ordered.length]);

  if (!active) return null;
  const activeTone = moodToneFromScore(active.mood);
  const activeQual = t(moodQualitativeKey(active.mood));

  return (
    <View style={styles.moodReadingRibbon}>
      <View style={[styles.moodReadingFocus, { borderColor: `${accent}44` }]}>
        <MoodRing score={active.mood} tone={activeTone} size={52} accent={accent} />
        <View style={styles.moodReadingFocusCopy}>
          <Text style={[styles.moodReadingFocusScore, { color: accent }]}>
            {active.mood}
            <Text style={styles.moodReadingFocusSuffix}>/10</Text>
          </Text>
          <Text style={[styles.moodReadingFocusMeta, { color: textMuted }]}>
            {active.date} · {readingSourceLabel(active, t)} · {activeQual}
          </Text>
        </View>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.moodReadingTrack}
        accessibilityRole="list"
      >
        {ordered.map((r, i) => {
          const tone = moodToneFromScore(r.mood);
          const qual = t(moodQualitativeKey(r.mood));
          const isActive = i === activeIndex;
          const isLatest = i === ordered.length - 1;
          const iconName =
            r.source === 'checkin' ? checkinPeriodIcon((r.period as CheckinPeriod) || 'midday') : 'bar-chart-outline';
          return (
            <Pressable
              key={`${r.date}-${r.period ?? 'daily'}-${i}`}
              accessibilityRole="listitem"
              accessibilityLabel={`${r.mood} out of 10, ${r.date}, ${readingSourceLabel(r, t)}, ${qual}`}
              onPress={() => setActiveIndex(i)}
              style={[
                styles.moodReadingCard,
                { borderColor: isActive ? `${accent}88` : `${accent}33` },
                isActive && styles.moodReadingCardActive,
              ]}
            >
              {isLatest ? <View style={[styles.moodReadingCardPulse, { borderColor: `${accent}66` }]} /> : null}
              <MoodRing score={r.mood} tone={tone} size={44} accent={accent} />
              <Text style={[styles.moodReadingCardDate, { color: textMuted }]}>{formatMoodTimelineDate(r.date)}</Text>
              <View style={styles.moodReadingCardSource}>
                <Ionicons name={iconName} size={11} color={textMuted} />
                <Text style={[styles.moodReadingCardSourceText, { color: textMuted }]} numberOfLines={1}>
                  {readingSourceLabel(r, t)}
                </Text>
              </View>
              <Text
                style={[
                  styles.moodReadingCardQual,
                  tone === 'low' && styles.moodReadingQualLow,
                  tone === 'moderate' && styles.moodReadingQualModerate,
                  tone === 'okay' && styles.moodReadingQualOkay,
                  tone === 'good' && styles.moodReadingQualGood,
                ]}
              >
                {qual}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
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
  const { show: showToast } = useToast();
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
  const initialCheckinPeriod = defaultCheckinPeriod();
  const [selectedPeriod, setSelectedPeriod] = useState<CheckinPeriod>(initialCheckinPeriod);
  const [checkinTime, setCheckinTime] = useState('');
  const sliderScaleAM = useRef(new Animated.Value(initialCheckinPeriod === 'AM' ? CHECKIN_SLIDER_SELECTED_SCALE : CHECKIN_SLIDER_UNSELECTED_SCALE)).current;
  const sliderScaleMid = useRef(new Animated.Value(initialCheckinPeriod === 'midday' ? CHECKIN_SLIDER_SELECTED_SCALE : CHECKIN_SLIDER_UNSELECTED_SCALE)).current;
  const sliderScalePM = useRef(new Animated.Value(initialCheckinPeriod === 'PM' ? CHECKIN_SLIDER_SELECTED_SCALE : CHECKIN_SLIDER_UNSELECTED_SCALE)).current;
  const sliderScales = useMemo(
    () => ({ AM: sliderScaleAM, midday: sliderScaleMid, PM: sliderScalePM }),
    [sliderScaleAM, sliderScaleMid, sliderScalePM],
  );

  const [screeningOpen, setScreeningOpen] = useState(false);
  const [screeningKind, setScreeningKind] = useState<ScreeningKind>('phq2');
  const [screeningPhase, setScreeningPhase] = useState<ScreeningPhase>('initial');
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [initialResponses, setInitialResponses] = useState<Record<string, number>>({});
  const [mergedResponses, setMergedResponses] = useState<Record<string, number>>({});
  const [screeningFullInstrument, setScreeningFullInstrument] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [screeningInfoDismissed, setScreeningInfoDismissed] = useState(false);

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
    setCheckinTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setSelectedPeriod(period);
    setCheckinPeriod(period);
    setCheckinMood('');
    setCheckinSleep('');
    setCheckinFatigue('');
    setCheckinModalOpen(true);
  };

  const animateSliderTo = useCallback(
    (period: CheckinPeriod) => {
      (HOME_CHECKIN_PERIODS as readonly CheckinPeriod[]).forEach((p) => {
        const toValue = p === period ? CHECKIN_SLIDER_SELECTED_SCALE : CHECKIN_SLIDER_UNSELECTED_SCALE;
        Animated.spring(sliderScales[p], {
          toValue,
          useNativeDriver: true,
          tension: 180,
          friction: 12,
        }).start();
      });
    },
    [sliderScales],
  );

  useEffect(() => {
    if (!doneCheckinPeriods.has(selectedPeriod)) return;
    const next = (HOME_CHECKIN_PERIODS as readonly CheckinPeriod[]).find((p) => !doneCheckinPeriods.has(p));
    if (!next) return;
    setSelectedPeriod(next);
    animateSliderTo(next);
  }, [animateSliderTo, doneCheckinPeriods, selectedPeriod]);

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
      showToast(t('home.checkin.saved.toast'), 'success');
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
    setInitialResponses({} as Record<string, number>);
    setMergedResponses({} as Record<string, number>);
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
      setMergedResponses(merged as Record<string, number>);
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
          <EmptyState variant="mood" message={t('mood.empty.warm.message')} />
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
            <MoodReadingRibbon
              readings={summary.readings}
              accent={accent}
              textMuted={theme.tokens.color.textMuted}
              t={t}
            />
          </>
        )}

        {!prefs.simpleMode ? (
          <>
            <Text style={[styles.sectionTitle, { color: theme.tokens.color.textPrimary, marginTop: 20 }]}>
              {t('mood.checkin.title')}
            </Text>
            <View style={styles.checkinSliderWrap}>
              <View style={styles.checkinSliderTrack}>
                {(HOME_CHECKIN_PERIODS as readonly CheckinPeriod[]).map((period, idx) => {
                  const done = doneCheckinPeriods.has(period);
                  const isSelected = selectedPeriod === period;
                  return (
                    <React.Fragment key={period}>
                      {idx > 0 ? <View style={[styles.checkinSliderLine, { backgroundColor: `${accent}33` }]} /> : null}
                      <Pressable
                        disabled={done}
                        onPress={() => {
                          if (isSelected) {
                            openCheckinModal(period);
                          } else {
                            setSelectedPeriod(period);
                            animateSliderTo(period);
                          }
                        }}
                        style={[
                          styles.checkinSliderStop,
                          isSelected && {
                            borderColor: `${accent}66`,
                            backgroundColor: `${accent}14`,
                            paddingTop: 8,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={
                          done
                            ? `${t(checkinPeriodLabelKey(period))}, ${t('home.checkin.done')}`
                            : t(checkinPeriodLabelKey(period))
                        }
                      >
                        <View style={styles.checkinIconSlot}>
                          <Animated.View
                            style={{
                              transform: [{ scale: sliderScales[period] }],
                              opacity: done ? 0.42 : 1,
                            }}
                          >
                            <Ionicons
                              name={checkinPeriodIcon(period)}
                              size={theme.font(22)}
                              color={isSelected ? accent : `${accent}55`}
                            />
                          </Animated.View>
                        </View>
                        <Text
                          style={{
                            fontSize: theme.font(isSelected ? 11 : 10),
                            color: isSelected ? accent : `${accent}66`,
                            fontWeight: '600',
                          }}
                        >
                          {t(checkinPeriodLabelKey(period))}
                        </Text>
                      </Pressable>
                    </React.Fragment>
                  );
                })}
              </View>
              <Pressable
                style={[styles.checkinCtaBtn, { backgroundColor: accent }]}
                onPress={() => openCheckinModal(selectedPeriod)}
                accessibilityRole="button"
                accessibilityLabel={t('home.checkin.cta')}
              >
                <Text style={styles.checkinCtaBtnText}>{t('home.checkin.cta')}</Text>
              </Pressable>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Ionicons name={checkinPeriodIcon(checkinPeriod)} size={26} color={accent} />
              <Text style={{ color: accent, fontSize: theme.font(15), fontWeight: '700' }}>{checkinTime}</Text>
            </View>
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
              {screeningPhase === 'initial' && !screeningInfoDismissed ? (
                <View
                  style={[
                    styles.screeningInfoCard,
                    { borderColor: accent, backgroundColor: `${accent}12` },
                  ]}
                >
                  <Ionicons name="information-circle-outline" size={20} color={accent} />
                  <Text style={{ color: theme.tokens.color.textPrimary, flex: 1, lineHeight: 20 }}>
                    {t('mood.screening.whatIsThis')}
                  </Text>
                  <Pressable
                    onPress={() => setScreeningInfoDismissed(true)}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.close')}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={18} color={theme.tokens.color.textMuted} />
                  </Pressable>
                </View>
              ) : null}
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
              <Text style={{ color: theme.tokens.color.textMuted, fontSize: theme.font(12), lineHeight: 18, marginTop: 8 }}>
                {t('mood.screening.notDiagnosis')}
              </Text>
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
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  screeningInfoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
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
  moodReadingRibbon: { gap: 10, marginBottom: 4 },
  moodReadingFocus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  moodReadingFocusCopy: { flex: 1, gap: 2 },
  moodReadingFocusScore: { fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  moodReadingFocusSuffix: { fontSize: 14, fontWeight: '600', opacity: 0.65 },
  moodReadingFocusMeta: { fontSize: 12, lineHeight: 17 },
  moodReadingTrack: { paddingVertical: 6, paddingHorizontal: 2, gap: 8, alignItems: 'flex-end', minHeight: 118 },
  moodReadingCard: {
    width: 76,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(8,12,11,0.85)',
  },
  moodReadingCardActive: {
    transform: [{ translateY: -3 }, { scale: 1.03 }],
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  moodReadingCardPulse: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 12,
    borderWidth: 2,
  },
  moodReadingCardDate: { fontSize: 10, textAlign: 'center' },
  moodReadingCardSource: { flexDirection: 'row', alignItems: 'center', gap: 3, maxWidth: 68 },
  moodReadingCardSourceText: { fontSize: 9, flexShrink: 1 },
  moodReadingCardQual: { fontSize: 9, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },
  moodReadingQualLow: { backgroundColor: 'rgba(149,117,205,0.22)', color: '#ce93d8' },
  moodReadingQualModerate: { backgroundColor: 'rgba(255,183,77,0.2)', color: '#ffcc80' },
  moodReadingQualOkay: { backgroundColor: 'rgba(129,199,132,0.2)', color: '#a5d6a7' },
  moodReadingQualGood: { backgroundColor: 'rgba(123,223,140,0.22)', color: '#7bdf8c' },
  checkinRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  checkinSliderWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, width: '100%' },
  checkinSliderTrack: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  checkinSliderLine: { flex: 1, height: 2, borderRadius: 1 },
  checkinSliderStop: {
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'visible',
  },
  checkinIconSlot: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  checkinCtaBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  checkinCtaBtnText: { fontWeight: '700', fontSize: 13, color: '#000' },
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
