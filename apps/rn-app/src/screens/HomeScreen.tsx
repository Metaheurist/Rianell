import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Animated,
  Easing,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from '../components/legacyRnJsx';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle, Path } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';
import type { MainTabParamList, RootStackParamList } from '../navigation/RootNavigator';
import { loadLogs, saveLogs, type LogEntry } from '../storage/logs';
import type { Preferences } from '../storage/preferences';
import { savePreferences } from '../storage/preferences';
import { loadCachedBenchmark } from '../performance/benchmark';
import { generateMotd, answerHomeQuestion, generateClinicianVisitBrief, generateDoctorQuestions } from '../ai/llm';
import {
  pickHomeAiSuggestionBundle,
  analysisSnapshotFromSummary,
  computeHomeCardContext,
  resolveHomeCardOrder,
  applyMicroCheckin,
  completedCheckinPeriods,
  HOME_CHECKIN_PERIODS,
  computeHomeStreakSnapshot,
  daysUntilAppointment,
  shouldShowAppointmentCard,
  appointmentCountdownLabelKey,
  fetchHomeWeatherSnapshot,
  isWeatherCacheFresh,
  normalizeWeatherCoords,
  nextHomeQuestionAnswerState,
} from '@rianell/shared';
import { buildTodayPacingBudget } from '../ai/engine';
import { requestWeatherCoords } from '../utils/homeWeatherLocation';
import { summarizeLogsForAi } from '../ai/analyzeLogs';
import Constants from 'expo-constants';
import { buildLogReviewSummary } from '../log/buildLogReviewSummary';
import { speakLabel } from '../accessibility/tts';
import { submitBugReport } from '../utils/submitBugReport';
import { printOrShareAppointmentReport } from '../utils/appointmentPdf';
import { getBugReportAttachmentText } from '../utils/bugReportLogs';

/** Web `index.html` parity: top chrome includes bug-report modal entry. */
const SECURITY_DOC_URL = 'https://github.com/Metaheurist/Rianell/blob/main/docs/SECURITY.md';

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

type CheckinPeriod = 'AM' | 'midday' | 'PM';

function parseScore1to10(raw: string): number | undefined {
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || n < 1 || n > 10) return undefined;
  return Math.round(n);
}

function checkinPeriodLabelKey(period: CheckinPeriod): string {
  if (period === 'AM') return 'home.checkin.am';
  if (period === 'PM') return 'home.checkin.pm';
  return 'home.checkin.midday';
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

function useReduceMotionFlag() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (alive) setReduce(v);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => {
      setReduce(v);
    });
    return () => {
      alive = false;
      if (typeof sub === 'object' && sub != null && 'remove' in sub) {
        (sub as { remove: () => void }).remove();
      }
    };
  }, []);
  return reduce;
}

function heartbeatDurationFromBpm(bpm: number | null) {
  if (bpm == null || bpm < 30 || bpm > 200) {
    const defaultBpm = 72;
    return Math.max(0.8, Math.min(3.2, (60 / defaultBpm) * 1.6));
  }
  return Math.max(0.8, Math.min(3.2, (60 / bpm) * 1.6));
}

function spinOmegaToHeartbeatDuration(absOmega: number) {
  const maxO = 18;
  const t = Math.min(1, absOmega / maxO);
  return 3.2 - t * (3.2 - 0.8);
}

function HomeMotdHeartbeat({
  motd,
  theme,
  latestBpm,
  t,
}: {
  motd: string;
  theme: ReturnType<typeof useTheme>;
  latestBpm: number | null;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const reduceMotion = useReduceMotionFlag();
  const light = theme.mode === 'light';
  const accent = theme.tokens.color.accent;
  const textColor = theme.tokens.color.text;

  const sway = useRef(new Animated.Value(0)).current;
  const spinAngle = useRef(new Animated.Value(0)).current;
  const velocityRef = useRef(0);
  const angleRadRef = useRef(0);
  const springChargeRef = useRef(0);
  const lastMotdTapRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef(0);
  const dashAnim = useRef(new Animated.Value(1000)).current;
  const bpmDurRef = useRef(heartbeatDurationFromBpm(latestBpm));
  const effDurRef = useRef(bpmDurRef.current);

  const [ecgDurationSec, setEcgDurationSec] = useState(() => heartbeatDurationFromBpm(latestBpm));

  useEffect(() => {
    const next = heartbeatDurationFromBpm(latestBpm);
    bpmDurRef.current = next;
    effDurRef.current = next;
    setEcgDurationSec(next);
  }, [latestBpm]);

  useEffect(() => {
    if (light || reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 2100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(sway, { toValue: -1, duration: 2100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [light, reduceMotion, sway]);

  const swayRotate = sway.interpolate({ inputRange: [-1, 1], outputRange: ['-4deg', '4deg'] });
  const spinRotate = spinAngle.interpolate({
    inputRange: [-90, 90],
    outputRange: ['-90deg', '90deg'],
    extrapolate: 'clamp',
  });

  const spinEnergy = useCallback(() => {
    const th = angleRadRef.current;
    const om = velocityRef.current;
    const ch = springChargeRef.current;
    return Math.max(Math.abs(om), 5.5 * Math.abs(th), ch * 0.35);
  }, []);

  const runSpinTick = useCallback((ts: number) => {
    const dt = lastTsRef.current ? (ts - lastTsRef.current) / 1000 : 0;
    lastTsRef.current = ts;
    const d = dt > 0.12 ? 0.12 : dt;
    angleRadRef.current += velocityRef.current * d;
    velocityRef.current *= Math.exp(-1.75 * d);
    if (Math.abs(velocityRef.current) < 0.22) {
      const kSpring = 3.8 + springChargeRef.current * 1.05;
      velocityRef.current -= kSpring * angleRadRef.current * d;
    }
    if (Math.abs(velocityRef.current) < 0.0005) velocityRef.current = 0;
    angleRadRef.current = Math.max(-1.2, Math.min(1.2, angleRadRef.current));
    spinAngle.setValue((angleRadRef.current * 180) / Math.PI);

    const T_bpm = bpmDurRef.current;
    let dur = T_bpm;
    if (spinEnergy() > 0.04) {
      const T_spin = spinOmegaToHeartbeatDuration(spinEnergy());
      dur = Math.min(T_bpm, T_spin);
    }
    if (Math.abs(effDurRef.current - dur) > 0.03) {
      effDurRef.current = dur;
      setEcgDurationSec(dur);
    }

    const settled =
      Math.abs(velocityRef.current) < 0.00055 && Math.abs(angleRadRef.current) < 0.004;
    if (!settled) {
      rafRef.current = requestAnimationFrame(runSpinTick);
    } else {
      rafRef.current = null;
      angleRadRef.current = 0;
      velocityRef.current = 0;
      springChargeRef.current = 0;
      spinAngle.setValue(0);
      effDurRef.current = bpmDurRef.current;
      setEcgDurationSec(bpmDurRef.current);
    }
  }, [spinAngle, spinEnergy]);

  const bumpSpin = useCallback(() => {
    if (light || reduceMotion) return;
    const pnow = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const interval = lastMotdTapRef.current ? pnow - lastMotdTapRef.current : 600;
    lastMotdTapRef.current = pnow;
    springChargeRef.current = Math.min(30, springChargeRef.current + 1);
    let boost = 0;
    if (interval < 340) boost = ((340 - interval) / 340) * 9;
    velocityRef.current += 5.2 + boost + springChargeRef.current * 0.12;
    if (rafRef.current == null) {
      lastTsRef.current = 0;
      rafRef.current = requestAnimationFrame(runSpinTick);
    }
  }, [light, reduceMotion, runSpinTick]);

  const onMotdPressIn = useCallback(() => {
    if (light || reduceMotion) return;
    bumpSpin();
  }, [light, reduceMotion, bumpSpin]);

  useEffect(() => {
    if (light || reduceMotion) return;
    dashAnim.setValue(1000);
    const loop = Animated.loop(
      Animated.timing(dashAnim, {
        toValue: -1000,
        duration: Math.max(0.8, ecgDurationSec) * 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [dashAnim, ecgDurationSec, light, reduceMotion]);

  if (light || reduceMotion) {
    return (
      <>
        <Text style={[styles.motd, { color: textColor, fontSize: theme.font(13) }]}>{motd || t('home.motd.loading')}</Text>
        <View style={styles.ecgWrap} accessibilityElementsHidden>
          <Svg width="100%" height={48} viewBox="0 0 400 60" preserveAspectRatio="xMidYMid meet">
            <Path
              d="M0,30 L400,30"
              fill="none"
              stroke={accent}
              strokeWidth={3}
              strokeOpacity={0.35}
            />
          </Svg>
        </View>
      </>
    );
  }

  return (
    <>
      <Pressable
        onPressIn={onMotdPressIn}
        accessibilityRole="button"
        accessibilityLabel="Daily message"
        accessibilityHint="Tap repeatedly to charge; more taps snap the message back faster"
      >
        <Animated.View style={{ transform: [{ perspective: 900 }, { rotateX: spinRotate }] }}>
          <Animated.View style={{ transform: [{ rotate: swayRotate }] }}>
            <Text style={[styles.motd, { color: textColor, fontSize: theme.font(13) }]}>{motd || t('home.motd.loading')}</Text>
          </Animated.View>
        </Animated.View>
      </Pressable>
      <View style={styles.ecgWrap} accessibilityElementsHidden>
        <Svg width="100%" height={48} viewBox="0 0 400 60" preserveAspectRatio="xMidYMid meet">
          <Path
            d="M0,30 L80,30 L100,10 L120,48 L140,30 L400,30"
            fill="none"
            stroke={accent}
            strokeWidth={3.2}
            strokeOpacity={0.55}
            strokeLinejoin="round"
          />
          <AnimatedPath
            d="M0,30 L80,30 L100,10 L120,48 L140,30 L400,30"
            fill="none"
            stroke={accent}
            strokeWidth={3.8}
            strokeLinejoin="round"
            strokeDasharray={1000}
            strokeDashoffset={dashAnim}
          />
        </Svg>
      </View>
    </>
  );
}

function TargetBullseyeIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} fill="none" />
      <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth={2} fill="none" />
      <Circle cx="12" cy="12" r="2" fill={color} />
    </Svg>
  );
}

export function HomeScreen({
  prefs,
  onChangePrefs,
}: {
  prefs: Preferences;
  onChangePrefs?: (next: Preferences) => void;
}) {
  const theme = useTheme();
  const { t, locale } = useT();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<HomeNav>();
  const bg = theme.tokens.color.background === 'linear-gradient(135deg, #a8e6cf 0%, #c8e6c9 25%, #e8f5e8 75%, #f1f8e9 100%)' ? '#ffffff' : theme.tokens.color.background;
  const accent = theme.tokens.color.accent;

  const [loggedToday, setLoggedToday] = useState<boolean | null>(null);
  const [bugModalOpen, setBugModalOpen] = useState(false);
  const [bugTitle, setBugTitle] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [bugSteps, setBugSteps] = useState('');
  const [bugExpected, setBugExpected] = useState('');
  const [bugActual, setBugActual] = useState('');
  const [bugSubmitting, setBugSubmitting] = useState(false);
  const [motd, setMotd] = useState<string>('');
  const [latestBpm, setLatestBpm] = useState<number | null>(null);
  const [homeLogs, setHomeLogs] = useState<LogEntry[]>([]);
  const [homeSuggestions, setHomeSuggestions] = useState<Array<{ id: string; labelKey: string; labelParams?: Record<string, string> }>>([]);
  const [homeAnalysisSnapshot, setHomeAnalysisSnapshot] = useState<Record<string, unknown> | null>(null);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<{ id: string; labelKey: string; labelParams?: Record<string, string> } | null>(null);
  const [questionAnswer, setQuestionAnswer] = useState('');
  const [questionLoading, setQuestionLoading] = useState(false);
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [checkinPeriod, setCheckinPeriod] = useState<CheckinPeriod>('AM');
  const [checkinMood, setCheckinMood] = useState('');
  const [checkinSleep, setCheckinSleep] = useState('');
  const [checkinFatigue, setCheckinFatigue] = useState('');
  const [checkinSaving, setCheckinSaving] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [appointmentDraft, setAppointmentDraft] = useState('');
  const [prepBusy, setPrepBusy] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherSnapshot, setWeatherSnapshot] = useState(prefs.weatherCache);

  const todayStr = todayIso();
  const pacingBudget = useMemo(() => buildTodayPacingBudget(homeLogs, todayStr), [homeLogs, todayStr]);
  const todayLog = useMemo(() => homeLogs.find((l) => l.date === todayStr), [homeLogs, todayStr]);
  const doneCheckinPeriods = useMemo(() => completedCheckinPeriods(todayLog), [todayLog]);
  const streakSnapshot = useMemo(
    () => computeHomeStreakSnapshot(homeLogs, { dismissed: prefs.homeStreakCardDismissed }),
    [homeLogs, prefs.homeStreakCardDismissed]
  );
  const appointmentDays = useMemo(
    () => (prefs.nextAppointmentDate ? daysUntilAppointment(prefs.nextAppointmentDate, todayStr) : null),
    [prefs.nextAppointmentDate, todayStr]
  );
  const showAppointment = useMemo(
    () =>
      !prefs.nextAppointmentDate ||
      shouldShowAppointmentCard(prefs.nextAppointmentDate, todayStr),
    [prefs.nextAppointmentDate, todayStr]
  );

  const persistPrefs = useCallback(
    async (next: Preferences) => {
      await savePreferences(next);
      onChangePrefs?.(next);
    },
    [onChangePrefs]
  );

  useEffect(() => {
    setWeatherSnapshot(prefs.weatherCache);
  }, [prefs.weatherCache]);

  useEffect(() => {
    if (!prefs.weatherStripEnabled) return;
    if (isWeatherCacheFresh(prefs.weatherCache)) return;
    if (prefs.weatherLat == null || prefs.weatherLon == null) return;
    let alive = true;
    setWeatherLoading(true);
    void fetchHomeWeatherSnapshot(prefs.weatherLat, prefs.weatherLon)
      .then(async (snap) => {
        if (!alive || !snap) return;
        setWeatherSnapshot(snap);
        const next = { ...prefs, weatherCache: snap };
        await persistPrefs(next);
      })
      .finally(() => {
        if (alive) setWeatherLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [persistPrefs, prefs.weatherLat, prefs.weatherLon, prefs.weatherStripEnabled, prefs.weatherCache?.fetchedAt]);

  const refreshBpm = useCallback(() => {
    loadLogs()
      .then((logs) => {
        const sorted = logs.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const b = sorted[0]?.bpm;
        if (typeof b === 'number' && b >= 30 && b <= 200) setLatestBpm(b);
        else setLatestBpm(null);
      })
      .catch(() => setLatestBpm(null));
  }, []);

  const refreshToday = useCallback(() => {
    const d = todayIso();
    loadLogs()
      .then((logs) => {
        setHomeLogs(logs);
        setLoggedToday(logs.some((l) => l.date === d));
      })
      .catch(() => {
        setHomeLogs([]);
        setLoggedToday(false);
      });
  }, []);

  const refreshHomeSuggestions = useCallback(() => {
    const d = todayIso();
    loadLogs()
      .then((logs) => {
        setHomeLogs(logs);
        const logged = logs.some((l) => l.date === d);
        setLoggedToday(logged);
        if (!prefs.aiEnabled || prefs.simpleMode) {
          setHomeSuggestions([]);
          setHomeAnalysisSnapshot(null);
          return;
        }
        const summary = summarizeLogsForAi(logs, 14, { translate: t });
        const snap = analysisSnapshotFromSummary(summary, logs);
        setHomeAnalysisSnapshot(snap);
        const bundle = pickHomeAiSuggestionBundle(logs, snap, {
          aiEnabled: prefs.aiEnabled,
          loggedToday: logged,
          todayStr: d,
          homeGapQuestionCache: prefs.homeGapQuestionCache,
          medSchedule: prefs.medSchedule,
          homeQuestionAnswerState: prefs.homeQuestionAnswerState,
        });
        setHomeSuggestions(bundle.chips);
        if (bundle.gapCacheUpdate) {
          void persistPrefs({
            ...prefs,
            homeGapQuestionCache: bundle.gapCacheUpdate as { date: string; gapId: string },
          });
        }
      })
      .catch(() => {
        setHomeSuggestions([]);
        setHomeAnalysisSnapshot(null);
      });
  }, [
    prefs.aiEnabled,
    prefs.simpleMode,
    prefs.homeGapQuestionCache,
    prefs.medSchedule,
    prefs.homeQuestionAnswerState,
    persistPrefs,
    t,
  ]);

  useEffect(() => {
    refreshToday();
    refreshBpm();
    refreshHomeSuggestions();
  }, [refreshToday, refreshBpm, refreshHomeSuggestions]);

  useEffect(() => {
    refreshHomeSuggestions();
  }, [locale, refreshHomeSuggestions]);

  useEffect(() => {
    loadLogs()
      .then(async (logs) => {
        const benchmark = await loadCachedBenchmark().catch(() => null);
        return generateMotd(prefs.performance.preferredLlmModelSize, benchmark, logs.length, locale);
      })
      .then(setMotd)
      .catch(() => setMotd('Consistency beats intensity. One useful entry today is enough.'));
  }, [locale, prefs.performance.preferredLlmModelSize]);

  useFocusEffect(
    useCallback(() => {
      refreshToday();
      refreshBpm();
      refreshHomeSuggestions();
    }, [refreshToday, refreshBpm, refreshHomeSuggestions])
  );

  const onSuggestionPress = useCallback(
    (chip: { id: string; labelKey: string; labelParams?: Record<string, string> }) => {
      const questionText = t(chip.labelKey, chip.labelParams);
      setActiveQuestion(chip);
      setQuestionAnswer(t('home.questions.loading'));
      setQuestionLoading(true);
      setQuestionModalOpen(true);
      void (async () => {
        try {
          const benchmark = await loadCachedBenchmark().catch(() => null);
          const snap = homeAnalysisSnapshot || analysisSnapshotFromSummary(summarizeLogsForAi(homeLogs, 14, { translate: t }), homeLogs);
          const answer = await answerHomeQuestion(
            chip,
            questionText,
            snap,
            homeLogs,
            prefs.performance.preferredLlmModelSize,
            benchmark,
            locale
          );
          setQuestionAnswer(answer);
          void persistPrefs({
            ...prefs,
            homeQuestionAnswerState: nextHomeQuestionAnswerState(
              prefs.homeQuestionAnswerState,
              todayIso(),
            ),
          });
        } catch {
          setQuestionAnswer(t('home.questions.error'));
        } finally {
          setQuestionLoading(false);
        }
      })();
    },
    [homeAnalysisSnapshot, homeLogs, locale, persistPrefs, prefs, t]
  );

  const onReadTodayEntry = useCallback(async () => {
    if (!prefs.accessibility.ttsEnabled) {
      Alert.alert(t('common.text.to.speech.tap.to.read'), t('common.when.enabled.tapping.buttons.controls.re'));
      return;
    }
    const d = todayIso();
    try {
      const logs = await loadLogs();
      const entry = logs.find((l) => l.date === d);
      if (!entry) {
        Alert.alert(t('home.status.notLoggedYet'), t('home.status.notLoggedTodayDetail'));
        return;
      }
      speakLabel(buildLogReviewSummary(entry), {
        enabled: prefs.accessibility.ttsEnabled,
        readModeEnabled: false,
      });
    } catch {
      Alert.alert(t('common.error'), t('wizard.alert.saveFailed'));
    }
  }, [prefs.accessibility.ttsEnabled, t]);

  const onGoalsTargets = useCallback(() => {
    navigation.navigate('Charts', { initialView: 'balance' });
  }, [navigation]);

  const onBugReport = useCallback(() => {
    setBugModalOpen(true);
  }, []);

  const onSettings = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  const onSubmitBugReport = useCallback(async () => {
    const description = bugDescription.trim();
    if (!description) {
      Alert.alert(t('common.bugReport.title'), t('common.bugReport.validation'));
      return;
    }
    setBugSubmitting(true);
    try {
      const ua = `Rianell-ReactNative/${Platform.OS}/${String(Platform.Version ?? '')} app=${Constants.expoConfig?.version ?? ''}`;
      await submitBugReport({
        title: bugTitle.trim(),
        description,
        steps: bugSteps.trim(),
        expected_behavior: bugExpected.trim(),
        actual_behavior: bugActual.trim(),
        console_output: getBugReportAttachmentText(),
        url: 'rn://home',
        user_agent: ua,
        client_timestamp: new Date().toISOString(),
      });
      setBugModalOpen(false);
      setBugTitle('');
      setBugDescription('');
      setBugSteps('');
      setBugExpected('');
      setBugActual('');
      Alert.alert(t('common.bugReport.title'), t('common.bugReport.submitted'));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('common.bugReport.failed');
      Alert.alert(t('common.bugReport.title'), msg, [
        { text: t('common.bugReport.openSecurity'), onPress: () => void Linking.openURL(SECURITY_DOC_URL) },
        { text: t('common.close'), style: 'cancel' },
      ]);
    } finally {
      setBugSubmitting(false);
    }
  }, [bugActual, bugDescription, bugExpected, bugSteps, bugTitle, t]);

  const cardContext = useMemo(
    () =>
      computeHomeCardContext(homeLogs, todayStr, {
        aiEnabled: prefs.aiEnabled,
        simpleMode: prefs.simpleMode,
        showGoals: true,
        hasPacingData: pacingBudget != null,
        showCheckin: true,
        showStreak: streakSnapshot.showCard,
        showWeather: true,
        showAppointment,
      }),
    [
      homeLogs,
      pacingBudget,
      prefs.aiEnabled,
      prefs.simpleMode,
      showAppointment,
      streakSnapshot.showCard,
      todayStr,
    ]
  );
  const cardOrder = useMemo(() => resolveHomeCardOrder(cardContext), [cardContext]);

  const openCheckinModal = useCallback((period: CheckinPeriod) => {
    setCheckinPeriod(period);
    setCheckinMood('');
    setCheckinSleep('');
    setCheckinFatigue('');
    setCheckinModalOpen(true);
  }, []);

  const onSaveCheckin = useCallback(async () => {
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
      const next = applyMicroCheckin(homeLogs, todayStr, checkinPeriod, metrics);
      await saveLogs(next);
      setHomeLogs(next);
      setLoggedToday(true);
      setCheckinModalOpen(false);
      refreshHomeSuggestions();
      Alert.alert(t('home.checkin.modalTitle'), t('home.checkin.saved'));
    } catch {
      Alert.alert(t('common.error'), t('wizard.alert.saveFailed'));
    } finally {
      setCheckinSaving(false);
    }
  }, [checkinFatigue, checkinMood, checkinPeriod, checkinSleep, homeLogs, refreshHomeSuggestions, t, todayStr]);

  const onDismissStreak = useCallback(() => {
    void persistPrefs({ ...prefs, homeStreakCardDismissed: true });
  }, [persistPrefs, prefs]);

  const onEnableWeather = useCallback(async () => {
    setWeatherLoading(true);
    try {
      const coords = await requestWeatherCoords();
      if (!coords) {
        Alert.alert(t('home.weather.title'), t('home.weather.locationDenied'));
        return;
      }
      const rounded = normalizeWeatherCoords(coords.lat, coords.lon);
      if (!rounded) return;
      const snap = await fetchHomeWeatherSnapshot(rounded.lat, rounded.lon);
      const next = {
        ...prefs,
        weatherStripEnabled: true,
        weatherLat: rounded.lat,
        weatherLon: rounded.lon,
        weatherCache: snap,
      };
      setWeatherSnapshot(snap);
      await persistPrefs(next);
    } finally {
      setWeatherLoading(false);
    }
  }, [persistPrefs, prefs, t]);

  const onOpenAppointmentModal = useCallback(() => {
    setAppointmentDraft(prefs.nextAppointmentDate ?? '');
    setAppointmentModalOpen(true);
  }, [prefs.nextAppointmentDate]);

  const onSaveAppointment = useCallback(async () => {
    const raw = appointmentDraft.trim();
    const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
    if (!date) {
      Alert.alert(t('home.appointment.title'), t('home.appointment.invalidDate'));
      return;
    }
    await persistPrefs({ ...prefs, nextAppointmentDate: date });
    setAppointmentModalOpen(false);
  }, [appointmentDraft, persistPrefs, prefs, t]);

  const onClearAppointment = useCallback(async () => {
    await persistPrefs({ ...prefs, nextAppointmentDate: null });
    setAppointmentModalOpen(false);
  }, [persistPrefs, prefs]);

  const onPrepReport = useCallback(() => {
    if (prepBusy) return;
    setPrepBusy(true);
    void (async () => {
      try {
        const logs = homeLogs.length ? homeLogs : await loadLogs();
        let briefText = '';
        let doctorQuestions: string[] = [];
        if (prefs.aiEnabled) {
          const summary = summarizeLogsForAi(logs, 14, { translate: t });
          const benchmark = await loadCachedBenchmark().catch(() => null);
          const [brief, questions] = await Promise.all([
            generateClinicianVisitBrief(
              summary,
              logs,
              prefs.performance.preferredLlmModelSize,
              benchmark,
              locale,
              prefs
            ).catch(() => ''),
            generateDoctorQuestions(
              summary,
              prefs.performance.preferredLlmModelSize,
              benchmark,
              locale,
              prefs
            ).catch(() => [] as string[]),
          ]);
          briefText = brief;
          doctorQuestions = questions;
        }
        await printOrShareAppointmentReport({ logs, prefs, briefText, doctorQuestions });
      } catch (e) {
        Alert.alert(
          t('home.appointment.prepCta'),
          e instanceof Error ? e.message : t('settings.export.failed')
        );
      } finally {
        setPrepBusy(false);
      }
    })();
  }, [homeLogs, locale, prefs, prepBusy, t]);

  const renderHomeCard = (cardId: string) => {
    if (cardId === 'nudge') {
      return (
        <View
          key="nudge"
          style={[styles.card, styles.nudgeCard, { borderColor: `${accent}55` }]}
          accessibilityRole="text"
          accessibilityLabel={t('home.nudge.streakBroken')}
        >
          <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
            {t('home.nudge.streakBroken')}
          </Text>
        </View>
      );
    }
    if (cardId === 'hero') {
      return (
        <View key="hero" style={styles.card}>
          <Text style={[styles.title, { color: accent, fontSize: theme.font(22) }]}>Rianell</Text>
          <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(16) }]}>
            {loggedToday === null
              ? t('home.status.loadingToday')
              : loggedToday
                ? t('home.status.loggedTodayDetail')
                : t('home.status.notLoggedTodayDetail')}
          </Text>
          {loggedToday ? (
            <Pressable
              onPress={() => void onReadTodayEntry()}
              style={({ pressed }) => [
                styles.readTodayBtn,
                { borderColor: `${accent}66`, opacity: pressed ? 0.88 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('home.action.readTodayEntry')}
            >
              <Text style={{ color: accent, fontSize: theme.font(14) }}>{t('home.action.readTodayEntry')}</Text>
            </Pressable>
          ) : null}
          <HomeMotdHeartbeat motd={motd} theme={theme} latestBpm={latestBpm} t={t} />
          {cardContext.showAiQuestions && homeSuggestions.length > 0 ? (
            <View style={styles.suggestionsRow} accessibilityRole="list">
              {homeSuggestions.map((chip) => (
                <Pressable
                  key={chip.id}
                  onPress={() => onSuggestionPress(chip)}
                  style={({ pressed }) => [
                    styles.suggestionChip,
                    { borderColor: `${accent}66`, opacity: pressed ? 0.88 : 1 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t(chip.labelKey, chip.labelParams)}
                >
                  <Text style={[styles.suggestionChipText, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
                    {t(chip.labelKey, chip.labelParams)}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      );
    }
    if (cardId === 'streak') {
      return (
        <View key="streak" style={styles.card} accessibilityLabel={t('home.streak.title')}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.title, { color: accent, fontSize: theme.font(18), flex: 1, marginBottom: 0 }]}>
              {t('home.streak.title')}
            </Text>
            <Pressable onPress={() => void onDismissStreak()} accessibilityRole="button" accessibilityLabel={t('home.streak.dismiss')}>
              <Text style={{ color: theme.tokens.color.text, fontSize: theme.font(12), opacity: 0.8 }}>{t('home.streak.dismiss')}</Text>
            </Pressable>
          </View>
          <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(14), marginTop: 8 }]}>
            {t('home.streak.summary', {
              goodDays: streakSnapshot.goodDayStreak,
              flareFree: streakSnapshot.flareFreeDays,
            })}
          </Text>
        </View>
      );
    }
    if (cardId === 'weather') {
      if (!prefs.weatherStripEnabled) {
        return (
          <View key="weather" style={styles.card} accessibilityLabel={t('home.weather.title')}>
            <Text style={[styles.title, { color: accent, fontSize: theme.font(18) }]}>{t('home.weather.title')}</Text>
            <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
              {t('home.weather.enableHint')}
            </Text>
            <Pressable
              onPress={() => void onEnableWeather()}
              style={({ pressed }) => [
                styles.readTodayBtn,
                { borderColor: `${accent}66`, opacity: pressed ? 0.88 : 1, marginTop: 10 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('home.weather.enable')}
              disabled={weatherLoading}
            >
              <Text style={{ color: accent, fontSize: theme.font(14) }}>
                {weatherLoading ? t('home.weather.loading') : t('home.weather.enable')}
              </Text>
            </Pressable>
          </View>
        );
      }
      const snap = weatherSnapshot;
      return (
        <View key="weather" style={styles.card} accessibilityLabel={t('home.weather.title')}>
          <Text style={[styles.title, { color: accent, fontSize: theme.font(18) }]}>{t('home.weather.title')}</Text>
          {snap ? (
            <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
              {t('home.weather.summary', {
                temp: snap.tempC != null ? String(snap.tempC) : '—',
                pressure: snap.pressureHpa != null ? String(snap.pressureHpa) : '—',
                aqi: snap.usAqi != null ? String(snap.usAqi) : '—',
              })}
            </Text>
          ) : (
            <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
              {weatherLoading ? t('home.weather.loading') : t('home.weather.enableHint')}
            </Text>
          )}
          <Pressable
            onPress={() => void Linking.openURL('https://open-meteo.com/')}
            style={{ marginTop: 8 }}
            accessibilityRole="link"
            accessibilityLabel={t('home.weather.attribution')}
          >
            <Text style={{ color: accent, fontSize: theme.font(12), opacity: 0.9 }}>{t('home.weather.attribution')}</Text>
          </Pressable>
        </View>
      );
    }
    if (cardId === 'appointment') {
      if (!prefs.nextAppointmentDate) {
        return (
          <View key="appointment" style={styles.card} accessibilityLabel={t('home.appointment.title')}>
            <Text style={[styles.title, { color: accent, fontSize: theme.font(18) }]}>{t('home.appointment.title')}</Text>
            <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
              {t('home.appointment.setupHint')}
            </Text>
            <Pressable
              onPress={onOpenAppointmentModal}
              style={({ pressed }) => [
                styles.readTodayBtn,
                { borderColor: `${accent}66`, opacity: pressed ? 0.88 : 1, marginTop: 10 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('home.appointment.setDate')}
            >
              <Text style={{ color: accent, fontSize: theme.font(14) }}>{t('home.appointment.setDate')}</Text>
            </Pressable>
          </View>
        );
      }
      if (appointmentDays == null) return null;
      const labelKey = appointmentCountdownLabelKey(appointmentDays);
      return (
        <View key="appointment" style={styles.card} accessibilityLabel={t('home.appointment.title')}>
          <Text style={[styles.title, { color: accent, fontSize: theme.font(18) }]}>{t('home.appointment.title')}</Text>
          <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
            {t(labelKey, { days: appointmentDays, date: prefs.nextAppointmentDate ?? '' })}
          </Text>
          <View style={styles.checkinRow}>
            <Pressable
              onPress={onPrepReport}
              disabled={prepBusy}
              style={({ pressed }) => [styles.checkinBtn, { borderColor: `${accent}66`, opacity: pressed || prepBusy ? 0.88 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel={t('home.appointment.prepCta')}
            >
              <Text style={{ color: theme.tokens.color.text, fontSize: theme.font(13) }}>
                {prepBusy ? t('home.appointment.prepBusy') : t('home.appointment.prepCta')}
              </Text>
            </Pressable>
            <Pressable
              onPress={onOpenAppointmentModal}
              style={({ pressed }) => [styles.checkinBtn, { borderColor: `${accent}66`, opacity: pressed ? 0.88 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel={t('home.appointment.edit')}
            >
              <Text style={{ color: theme.tokens.color.text, fontSize: theme.font(13) }}>{t('home.appointment.edit')}</Text>
            </Pressable>
          </View>
        </View>
      );
    }
    if (cardId === 'pacing' && pacingBudget) {
      return (
        <View key="pacing" style={styles.card} accessibilityLabel={t('home.pacing.title')}>
          <Text style={[styles.title, { color: accent, fontSize: theme.font(18) }]}>{t('home.pacing.title')}</Text>
          <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
            {t('home.pacing.summary', { planned: pacingBudget.planned, actual: pacingBudget.rawActual })}
          </Text>
          {pacingBudget.overpaced ? (
            <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(13), marginTop: 6, opacity: 0.9 }]}>
              {t('home.pacing.overpaced')}
            </Text>
          ) : null}
          <Pressable
            onPress={() => navigation.navigate('Charts', { initialView: 'balance' })}
            style={({ pressed }) => [
              styles.readTodayBtn,
              { borderColor: `${accent}66`, opacity: pressed ? 0.88 : 1, marginTop: 10 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('home.pacing.linkCharts')}
          >
            <Text style={{ color: accent, fontSize: theme.font(14) }}>{t('home.pacing.linkCharts')}</Text>
          </Pressable>
        </View>
      );
    }
    if (cardId === 'checkin') {
      return (
        <View key="checkin" style={styles.card} accessibilityLabel={t('home.checkin.title')}>
          <Text style={[styles.title, { color: accent, fontSize: theme.font(18) }]}>{t('home.checkin.title')}</Text>
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
                  accessibilityRole="button"
                  accessibilityLabel={
                    done
                      ? `${t(checkinPeriodLabelKey(period))}, ${t('home.checkin.done')}`
                      : t(checkinPeriodLabelKey(period))
                  }
                >
                  <Text style={{ color: theme.tokens.color.text, fontSize: theme.font(13) }}>
                    {t(checkinPeriodLabelKey(period))}
                    {done ? ` · ${t('home.checkin.done')}` : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      );
    }
    if (cardId === 'goals') {
      return (
        <View key="goals" style={styles.card} accessibilityLabel={t('home.goals.title')}>
          <Text style={[styles.title, { color: accent, fontSize: theme.font(18) }]}>{t('home.goals.title')}</Text>
          <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
            {t('home.goals.summary', {
              steps: prefs.goals.steps.toLocaleString(),
              hydration: String(prefs.goals.hydration),
              sleepScore: String(prefs.goals.sleepScore),
              goodDays: String(prefs.goals.goodDaysPerWeek),
            })}
          </Text>
          <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(13), marginTop: 6 }]}>
            {t('home.goals.wellness', {
              mood: String(prefs.goals.moodTarget),
              sleep: String(prefs.goals.sleepTarget),
              fatigue: String(prefs.goals.fatigueTarget),
            })}
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerSpacer} />
        <View style={styles.chromeRow} accessibilityLabel="Home header actions">
          <Pressable
            onPress={onGoalsTargets}
            style={({ pressed }) => [styles.chromeBtn, chromeShadow(accent), { borderColor: accent, opacity: pressed ? 0.88 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Goals and targets"
            accessibilityHint="Opens Charts in Balance view with targets"
          >
            <TargetBullseyeIcon color={accent} />
          </Pressable>
          <Pressable
            onPress={onBugReport}
            style={({ pressed }) => [styles.chromeBtn, chromeShadow(accent), { borderColor: accent, opacity: pressed ? 0.88 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Report a bug"
            accessibilityHint="Opens bug report form"
          >
            <Ionicons name="bug-outline" size={22} color={accent} />
          </Pressable>
          <Pressable
            onPress={onSettings}
            style={({ pressed }) => [styles.chromeBtn, chromeShadow(accent), { borderColor: accent, opacity: pressed ? 0.88 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel={t('nav.settings')}
          >
            <Ionicons name="settings-outline" size={22} color={accent} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {cardOrder.map((cardId) => renderHomeCard(cardId))}
      </ScrollView>

      <View style={[styles.fabWrap, { bottom: tabBarHeight + 16 }]}>
        <Pressable
          onPress={() => navigation.navigate('LogWizard')}
          style={[styles.fab, { backgroundColor: accent }]}
          accessibilityRole="button"
          accessibilityLabel={`${t('home.action.logNow')}, ${t('home.fab.betaBadge')}`}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
        <View style={styles.betaBadge} pointerEvents="none" accessibilityElementsHidden>
          <Text style={styles.betaBadgeText}>{t('home.fab.betaBadge')}</Text>
        </View>
      </View>
      <Modal visible={questionModalOpen} animationType="fade" transparent onRequestClose={() => setQuestionModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setQuestionModalOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          />
          <View style={[styles.modalCard, styles.questionModalCard, { borderColor: `${accent}44`, backgroundColor: 'rgba(14,18,17,0.98)' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: accent, fontSize: theme.font(18), flex: 1 }]}>
                {activeQuestion ? t(activeQuestion.labelKey, activeQuestion.labelParams) : t('home.questions.modalTitle')}
              </Text>
              <Pressable
                onPress={() => setQuestionModalOpen(false)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
              >
                <Ionicons name="close" size={26} color={theme.tokens.color.text} />
              </Pressable>
            </View>
            <Text style={[styles.questionAnswer, { color: theme.tokens.color.text, fontSize: theme.font(15) }]}>
              {questionAnswer}
            </Text>
            <Text style={[styles.questionDisclaimer, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
              {t('ai.disclaimer.medical')}
            </Text>
            <View style={[styles.modalFooter, { borderTopColor: `${accent}33` }]}>
              <Pressable
                style={[styles.modalBtnPrimary, { backgroundColor: accent, opacity: questionLoading ? 0.65 : 1 }]}
                onPress={() => setQuestionModalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
              >
                <Text style={styles.modalBtnTextPrimary}>{t('common.close')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={bugModalOpen} animationType="fade" transparent onRequestClose={() => setBugModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setBugModalOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={t('motd.dismiss')}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKb}
          >
            <View style={[styles.modalCard, { borderColor: `${accent}44`, backgroundColor: 'rgba(14,18,17,0.98)' }]}>
              <View style={styles.modalHeaderRow}>
                <Text style={[styles.modalTitle, { color: accent, fontSize: theme.font(18) }]}>{t('home.bugReport.title')}</Text>
                <Pressable
                  onPress={() => setBugModalOpen(false)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.close')}
                >
                  <Ionicons name="close" size={26} color={theme.tokens.color.text} />
                </Pressable>
              </View>
              <Text style={[styles.modalLede, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
                {t('home.bugReport.lede')}
              </Text>
              <ScrollView
                style={styles.modalScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
                indicatorStyle={Platform.OS === 'ios' ? 'default' : undefined}
              >
                <Text style={[styles.fieldLabel, { color: theme.tokens.color.text }]}>{t('home.bugReport.field.titleOptional')}</Text>
                <TextInput
                  value={bugTitle}
                  onChangeText={setBugTitle}
                  placeholder={t('common.short.summary')}
                  placeholderTextColor="rgba(255,255,255,0.42)"
                  style={[styles.input, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                  accessibilityLabel="Bug title"
                />
                <Text style={[styles.fieldLabel, { color: theme.tokens.color.text }]}>{t('home.bugReport.field.description')}</Text>
                <TextInput
                  value={bugDescription}
                  onChangeText={setBugDescription}
                  placeholder={t('common.what.happened')}
                  placeholderTextColor="rgba(255,255,255,0.42)"
                  style={[styles.input, styles.textarea, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                  accessibilityLabel="Bug description"
                  multiline
                />
                <Text style={[styles.fieldLabelOptional, { color: theme.tokens.color.text }]}>{t('home.bugReport.field.moreDetail')}</Text>
                <TextInput
                  value={bugSteps}
                  onChangeText={setBugSteps}
                  placeholder={t('common.steps.to.reproduce')}
                  placeholderTextColor="rgba(255,255,255,0.42)"
                  style={[styles.input, styles.textareaSm, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                  accessibilityLabel="Steps to reproduce"
                  multiline
                />
                <TextInput
                  value={bugExpected}
                  onChangeText={setBugExpected}
                  placeholder={t('common.expected.behavior')}
                  placeholderTextColor="rgba(255,255,255,0.42)"
                  style={[styles.input, styles.textareaSm, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                  accessibilityLabel="Expected behavior"
                  multiline
                />
                <TextInput
                  value={bugActual}
                  onChangeText={setBugActual}
                  placeholder={t('common.actual.behavior')}
                  placeholderTextColor="rgba(255,255,255,0.42)"
                  style={[styles.input, styles.textareaSm, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                  accessibilityLabel="Actual behavior"
                  multiline
                />
              </ScrollView>
              <View style={[styles.modalFooter, { borderTopColor: `${accent}33` }]}>
                <Pressable
                  style={[styles.modalBtnSecondary, { borderColor: `${accent}55` }]}
                  onPress={() => setBugModalOpen(false)}
                  accessibilityRole="button"
                >
                  <Text style={[styles.modalBtnTextSecondary, { color: theme.tokens.color.text }]}>{t('common.cancel')}</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalBtnPrimary, { backgroundColor: accent, opacity: bugSubmitting ? 0.65 : 1 }]}
                  onPress={() => void onSubmitBugReport()}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.submit')}
                  disabled={bugSubmitting}
                >
                  <Text style={styles.modalBtnTextPrimary}>{bugSubmitting ? t('common.loading.submitting') : t('common.submit')}</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      <Modal visible={checkinModalOpen} animationType="fade" transparent onRequestClose={() => setCheckinModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setCheckinModalOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalKb}>
            <View style={[styles.modalCard, { borderColor: `${accent}44`, backgroundColor: 'rgba(14,18,17,0.98)' }]}>
              <View style={styles.modalHeaderRow}>
                <Text style={[styles.modalTitle, { color: accent, fontSize: theme.font(18), flex: 1 }]}>
                  {t('home.checkin.modalTitle')} — {t(checkinPeriodLabelKey(checkinPeriod))}
                </Text>
                <Pressable onPress={() => setCheckinModalOpen(false)} accessibilityRole="button" accessibilityLabel={t('common.close')}>
                  <Ionicons name="close" size={24} color={accent} />
                </Pressable>
              </View>
              <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(13), marginBottom: 12 }]}>
                {t('wizard.energy.instructions')}
              </Text>
              <Text style={[styles.fieldLabel, { color: theme.tokens.color.text }]}>{t('wizard.mood.1.10')}</Text>
              <TextInput
                value={checkinMood}
                onChangeText={setCheckinMood}
                style={[styles.input, { color: theme.tokens.color.text }]}
                keyboardType="number-pad"
                accessibilityLabel={t('wizard.aria.moodScore')}
              />
              <Text style={[styles.fieldLabel, { color: theme.tokens.color.text, marginTop: 4 }]}>{t('wizard.sleep.1.10')}</Text>
              <TextInput
                value={checkinSleep}
                onChangeText={setCheckinSleep}
                style={[styles.input, { color: theme.tokens.color.text }]}
                keyboardType="number-pad"
                accessibilityLabel={t('wizard.aria.sleepScore')}
              />
              <Text style={[styles.fieldLabel, { color: theme.tokens.color.text, marginTop: 4 }]}>{t('wizard.fatigue.1.10')}</Text>
              <TextInput
                value={checkinFatigue}
                onChangeText={setCheckinFatigue}
                style={[styles.input, { color: theme.tokens.color.text }]}
                keyboardType="number-pad"
                accessibilityLabel={t('wizard.aria.fatigueScore')}
              />
              <View style={[styles.modalFooter, { borderTopColor: `${accent}33` }]}>
                <Pressable
                  style={[styles.modalBtnSecondary, { borderColor: `${accent}55` }]}
                  onPress={() => setCheckinModalOpen(false)}
                  accessibilityRole="button"
                >
                  <Text style={[styles.modalBtnTextSecondary, { color: theme.tokens.color.text }]}>{t('common.cancel')}</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalBtnPrimary, { backgroundColor: accent, opacity: checkinSaving ? 0.65 : 1 }]}
                  onPress={() => void onSaveCheckin()}
                  accessibilityRole="button"
                  accessibilityLabel={t('home.checkin.save')}
                  disabled={checkinSaving}
                >
                  <Text style={styles.modalBtnTextPrimary}>
                    {checkinSaving ? t('common.loading.submitting') : t('home.checkin.save')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      <Modal visible={appointmentModalOpen} animationType="fade" transparent onRequestClose={() => setAppointmentModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setAppointmentModalOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalKb}>
            <View style={[styles.modalCard, { borderColor: `${accent}44`, backgroundColor: 'rgba(14,18,17,0.98)' }]}>
              <View style={styles.modalHeaderRow}>
                <Text style={[styles.modalTitle, { color: accent, fontSize: theme.font(18), flex: 1 }]}>
                  {t('home.appointment.setDate')}
                </Text>
                <Pressable onPress={() => setAppointmentModalOpen(false)} accessibilityRole="button" accessibilityLabel={t('common.close')}>
                  <Ionicons name="close" size={24} color={accent} />
                </Pressable>
              </View>
              <Text style={[styles.fieldLabel, { color: theme.tokens.color.text }]}>{t('home.appointment.dateLabel')}</Text>
              <TextInput
                value={appointmentDraft}
                onChangeText={setAppointmentDraft}
                placeholder="YYYY-MM-DD"
                style={[styles.input, { color: theme.tokens.color.text }]}
                autoCapitalize="none"
                accessibilityLabel={t('home.appointment.dateLabel')}
              />
              <View style={[styles.modalFooter, { borderTopColor: `${accent}33` }]}>
                {prefs.nextAppointmentDate ? (
                  <Pressable
                    style={[styles.modalBtnSecondary, { borderColor: `${accent}55` }]}
                    onPress={() => void onClearAppointment()}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.modalBtnTextSecondary, { color: theme.tokens.color.text }]}>{t('home.appointment.clear')}</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={[styles.modalBtnPrimary, { backgroundColor: accent }]}
                  onPress={() => void onSaveAppointment()}
                  accessibilityRole="button"
                >
                  <Text style={styles.modalBtnTextPrimary}>{t('common.save')}</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function chromeShadow(accent: string) {
  return {
    shadowColor: accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 5,
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerSpacer: { flex: 1 },
  chromeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chromeBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  card: { borderRadius: 16, padding: 16, backgroundColor: 'rgba(0,0,0,0.18)', marginBottom: 12 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nudgeCard: {
    backgroundColor: 'rgba(76,175,80,0.12)',
    borderWidth: 1,
  },
  scrollContent: { paddingBottom: 96 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  text: { fontSize: 16, opacity: 0.95 },
  readTodayBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  motd: { marginTop: 10, opacity: 0.82 },
  suggestionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  suggestionChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.22)',
    maxWidth: '100%',
  },
  suggestionChipText: { lineHeight: 18 },
  checkinRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  checkinBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  questionModalCard: { maxHeight: '70%' },
  questionAnswer: { lineHeight: 22, marginBottom: 10 },
  questionDisclaimer: { opacity: 0.82, lineHeight: 18, marginBottom: 4 },
  ecgWrap: { marginTop: 8, width: '100%', maxWidth: 400, alignSelf: 'center' },
  fabWrap: {
    position: 'absolute',
    right: 24,
    width: 56,
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
  },
  fabText: { color: '#fff', fontSize: 30, fontWeight: '300', lineHeight: 34 },
  betaBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  betaBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
  },
  modalKb: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    zIndex: 1,
  },
  modalCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    maxHeight: '88%',
    borderWidth: 1,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: { fontWeight: '800' },
  modalLede: { opacity: 0.88, lineHeight: 20, marginBottom: 10 },
  modalScroll: { flexGrow: 0, maxHeight: 420 },
  fieldLabel: { fontSize: 12, fontWeight: '700', opacity: 0.92, marginBottom: 4 },
  fieldLabelOptional: { fontSize: 12, fontWeight: '600', opacity: 0.75, marginBottom: 4, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  textarea: { minHeight: 88, textAlignVertical: 'top' },
  textareaSm: { minHeight: 56, textAlignVertical: 'top' },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  modalBtnSecondary: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  modalBtnPrimary: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  modalBtnTextSecondary: { fontWeight: '700', fontSize: 15 },
  modalBtnTextPrimary: { color: '#0a0c08', fontWeight: '800', fontSize: 15 },
});
