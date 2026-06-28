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
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';
import type { MainTabParamList, RootStackParamList } from '../navigation/RootNavigator';
import { loadLogs, saveLogs, type LogEntry } from '../storage/logs';
import type { Preferences } from '../storage/preferences';
import { savePreferences } from '../storage/preferences';
import { loadCachedBenchmark } from '../performance/benchmark';
import { generateMotd, answerHomeQuestion } from '../ai/llm';
import {
  getNativeAiModelStatus,
  preloadNativeLlm,
  setAiModelDownloadConsent,
} from '../ai/llmNative';
import {
  pickHomeAiSuggestionBundle,
  analysisSnapshotFromSummary,
  computeHomeCardContext,
  resolveHomeCardOrder,
  canOfferWeeklyReview,
  isoWeekMondayKey,
  applyMicroCheckin,
  completedCheckinPeriods,
  HOME_CHECKIN_PERIODS,
  computeHomeStreakSnapshot,
  fetchHomeWeatherSnapshot,
  isWeatherCacheFresh,
  normalizeWeatherCoords,
  nextHomeQuestionAnswerState,
  formatDate,
  computePersonalBests,
  pickPersonalBestHighlight,
  computeAchievementSnapshots,
  shouldSuppressFirstRunLoggingPrompt,
} from '@rianell/shared';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { HomeWelcomeCard } from '../components/ui/HomeWelcomeCard';
import { HomeDiscoveryChips } from '../components/ui/HomeDiscoveryChips';
import { useToast } from '../components/ui/Toast';
import {
  daysSinceDate,
  detectNewLogMilestone,
  setTabDiscoveryBadge,
} from '../utils/engagementGamification';
import { getWeatherDisplayMetrics, resolveWeatherIconColor, weatherIconIonName } from '../utils/weatherIcons';
import { requestWeatherCoords } from '../utils/homeWeatherLocation';
import { summarizeLogsForAi } from '../ai/analyzeLogs';
import Constants from 'expo-constants';
import { buildLogReviewSummary } from '../log/buildLogReviewSummary';
import { speakLabel } from '../accessibility/tts';
import { submitBugReport } from '../utils/submitBugReport';
import { getBugReportAttachmentText } from '../utils/bugReportLogs';
import { requestOpenGoalsModal } from '../achievements/goalsModalBridge';
import { TargetBullseyeIcon } from '../components/goalsModalIcons';

/** Web `index.html` parity: top chrome includes bug-report modal entry. */
const SECURITY_DOC_URL = 'https://github.com/Metaheurist/Rianell/blob/main/docs/SECURITY.md';

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function hapticLight() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
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

function checkinPeriodIcon(period: CheckinPeriod): keyof typeof Ionicons.glyphMap {
  if (period === 'AM') return 'sunny-outline';
  if (period === 'PM') return 'moon-outline';
  return 'sunny';
}

function defaultCheckinPeriod(): CheckinPeriod {
  const h = new Date().getHours();
  if (h < 12) return 'AM';
  if (h < 17) return 'midday';
  return 'PM';
}

const CHECKIN_SLIDER_SELECTED_SCALE = 1.8;
const CHECKIN_SLIDER_UNSELECTED_SCALE = 1;

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
  const { show: showToast } = useToast();
  const reduceMotion = useReduceMotionFlag();
  const fabPulse = useRef(new Animated.Value(0)).current;
  const prevLogCountRef = useRef<number | null>(null);
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
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherSnapshot, setWeatherSnapshot] = useState(prefs.weatherCache);
  const weatherDisplay = useMemo(() => getWeatherDisplayMetrics(weatherSnapshot), [weatherSnapshot]);
  const weatherSummaryLabel = useMemo(() => {
    if (!weatherSnapshot) return '';
    return t('home.weather.summary', {
      temp: weatherSnapshot.tempC != null ? String(weatherSnapshot.tempC) : '-',
      pressure: weatherSnapshot.pressureHpa != null ? String(weatherSnapshot.pressureHpa) : '-',
      aqi: weatherSnapshot.usAqi != null ? String(weatherSnapshot.usAqi) : '-',
    });
  }, [t, weatherSnapshot]);

  const todayStr = todayIso();
  const todayLog = useMemo(() => homeLogs.find((l) => l.date === todayStr), [homeLogs, todayStr]);
  const doneCheckinPeriods = useMemo(() => completedCheckinPeriods(todayLog), [todayLog]);
  const streakSnapshot = useMemo(
    () => computeHomeStreakSnapshot(homeLogs, { dismissed: prefs.homeStreakCardDismissed }),
    [homeLogs, prefs.homeStreakCardDismissed]
  );
  const showWeeklyReview = useMemo(() => {
    const gate = canOfferWeeklyReview(homeLogs, {
      simpleMode: prefs.simpleMode,
      aiEnabled: prefs.aiEnabled,
      todayStr,
      weeklyReviewDismissedWeek: prefs.weeklyReviewDismissedWeek,
    });
    return gate.allowed;
  }, [homeLogs, prefs.aiEnabled, prefs.simpleMode, prefs.weeklyReviewDismissedWeek, todayStr]);

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

  useEffect(() => {
    if (!prefs.firstOpenDate) {
      void persistPrefs({ ...prefs, firstOpenDate: todayStr });
    }
  }, [persistPrefs, prefs, prefs.firstOpenDate, todayStr]);

  useEffect(() => {
    const count = homeLogs.length;
    const prev = prevLogCountRef.current;
    if (prev == null) {
      prevLogCountRef.current = count;
      return;
    }
    if (count > prev) {
      void detectNewLogMilestone(prev, count).then((key) => {
        if (key) {
          showToast(t(key), 'success');
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      });
      if (prev === 0 && count >= 1) void setTabDiscoveryBadge('tabBadge_charts');
      if (prev < 7 && count >= 7) void setTabDiscoveryBadge('tabBadge_ai');
    }
    prevLogCountRef.current = count;
  }, [homeLogs.length, showToast, t]);

  const suppressLoggingPrompt = useMemo(
    () => shouldSuppressFirstRunLoggingPrompt(prefs, homeLogs, { platform: 'rn' }),
    [homeLogs, prefs],
  );

  useEffect(() => {
    if (loggedToday || reduceMotion || suppressLoggingPrompt) {
      fabPulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(fabPulse, { toValue: 0.5, duration: 900, useNativeDriver: true }),
        Animated.timing(fabPulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [fabPulse, loggedToday, reduceMotion, suppressLoggingPrompt]);

  const showWelcomeCard = useMemo(() => {
    if (prefs.homeWelcomeCardDismissed) return false;
    const days = daysSinceDate(prefs.firstOpenDate ?? prefs.firstRunWizardCompletedAt);
    return homeLogs.length < 3 && days <= 7;
  }, [homeLogs.length, prefs.firstOpenDate, prefs.firstRunWizardCompletedAt, prefs.homeWelcomeCardDismissed]);

  const weeklyReviewCompleteBanner = useMemo(() => {
    if (!prefs.weeklyReviewCompletedAt) return false;
    const at = Date.parse(prefs.weeklyReviewCompletedAt);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < 60 * 60 * 1000;
  }, [prefs.weeklyReviewCompletedAt]);

  const unseenAchievementCount = useMemo(() => {
    const { snapshots } = computeAchievementSnapshots(prefs.trackingProfile, prefs.achievements);
    return snapshots.filter((s) => s.unlocked && !s.seenAt).length;
  }, [prefs.trackingProfile, prefs.achievements]);

  const personalBestHighlight = useMemo(() => {
    if (prefs.personalBestDismissedAt) return null;
    if (homeLogs.length < 14) return null;
    const bests = computePersonalBests(homeLogs);
    return pickPersonalBestHighlight(bests, streakSnapshot);
  }, [homeLogs, prefs.personalBestDismissedAt, streakSnapshot]);

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
      speakLabel(buildLogReviewSummary(entry, locale), {
        enabled: prefs.accessibility.ttsEnabled,
        readModeEnabled: false,
      });
    } catch {
      Alert.alert(t('common.error'), t('wizard.alert.saveFailed'));
    }
  }, [prefs.accessibility.ttsEnabled, t]);

  const onGoalsTargets = useCallback(() => {
    hapticLight();
    requestOpenGoalsModal(0);
  }, []);

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
        showCheckin: false,
        showStreak: streakSnapshot.showCard,
        showWeather: true,
        showWeeklyReview,
      }),
    [
      homeLogs,
      prefs.aiEnabled,
      prefs.simpleMode,
      showWeeklyReview,
      streakSnapshot.showCard,
      todayStr,
    ]
  );
  const cardOrder = useMemo(() => resolveHomeCardOrder(cardContext), [cardContext]);
  const visibleCardOrder = useMemo(
    () => cardOrder.filter((id) => id !== 'streak' && id !== 'weeklyReview'),
    [cardOrder]
  );

  const homeSalutation = useMemo(() => {
    const hour = new Date().getHours();
    const key = hour < 12 ? 'home.greeting.morning' : hour < 17 ? 'home.greeting.afternoon' : 'home.greeting.evening';
    const base = t(key);
    const name = prefs.userName?.trim();
    return name ? `${base}, ${name}` : base;
  }, [prefs.userName, t]);

  const homeDateLabel = useMemo(
    () => formatDate(new Date(), locale, { weekday: 'long', month: 'long', day: 'numeric' }),
    [locale],
  );

  const openCheckinModal = useCallback((period: CheckinPeriod) => {
    hapticLight();
    setCheckinTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setSelectedPeriod(period);
    setCheckinPeriod(period);
    setCheckinMood('');
    setCheckinSleep('');
    setCheckinFatigue('');
    setCheckinModalOpen(true);
  }, []);

  const animateSliderTo = useCallback(
    (period: CheckinPeriod) => {
      (HOME_CHECKIN_PERIODS as readonly CheckinPeriod[]).forEach((p) => {
        const toValue = p === period ? CHECKIN_SLIDER_SELECTED_SCALE : CHECKIN_SLIDER_UNSELECTED_SCALE;
        if (reduceMotion) {
          sliderScales[p].setValue(toValue);
        } else {
          Animated.spring(sliderScales[p], {
            toValue,
            useNativeDriver: true,
            tension: 180,
            friction: 12,
          }).start();
        }
      });
    },
    [reduceMotion, sliderScales],
  );

  useEffect(() => {
    if (!doneCheckinPeriods.has(selectedPeriod)) return;
    const next = (HOME_CHECKIN_PERIODS as readonly CheckinPeriod[]).find((p) => !doneCheckinPeriods.has(p));
    if (!next) return;
    setSelectedPeriod(next);
    animateSliderTo(next);
  }, [animateSliderTo, doneCheckinPeriods, selectedPeriod]);

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

  const onDismissWeeklyReview = useCallback(() => {
    void persistPrefs({ ...prefs, weeklyReviewDismissedWeek: isoWeekMondayKey(todayStr) });
  }, [persistPrefs, prefs, todayStr]);

  const weeklyReviewAiReady = useMemo(() => {
    if (prefs.aiEnabled === false) return false;
    if (prefs.aiModelDownloadConsent !== 'granted') return false;
    return getNativeAiModelStatus().state === 'ready';
  }, [prefs.aiEnabled, prefs.aiModelDownloadConsent]);

  const onWeeklyReviewPress = useCallback(async () => {
    hapticLight();
    if (weeklyReviewAiReady) {
      navigation.navigate('WeeklyReview');
      return;
    }
    const next: Preferences = { ...prefs, aiEnabled: true };
    if (prefs.aiModelDownloadConsent !== 'granted') {
      await setAiModelDownloadConsent('granted');
      next.aiModelDownloadConsent = 'granted';
    }
    await persistPrefs(next);
    if (prefs.aiModelDownloadConsent === 'granted') {
      void preloadNativeLlm(next).catch(() => {});
    }
  }, [navigation, persistPrefs, prefs, weeklyReviewAiReady]);

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

  const renderHomeCard = (cardId: string) => {
    if (cardId === 'hero') {
      const notLoggedDetail = cardContext.streakGrace
        ? t('home.streak.grace')
        : cardContext.streakBroken
          ? t('home.status.notLoggedStreakBrokenDetail')
          : t('home.status.notLoggedTodayDetail');
      return (
        <View
          key="hero"
          style={[
            styles.card,
            !loggedToday && cardContext.streakBroken && !cardContext.streakGrace ? styles.heroStreakNudgeCard : null,
          ]}
        >
          <Text style={[styles.title, { color: accent, fontSize: theme.font(22) }]}>Rianell</Text>
          {loggedToday === null ? (
            <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(16) }]}>
              {t('home.status.loadingToday')}
            </Text>
          ) : loggedToday ? (
            <>
              <Text style={[styles.heroStatusTitle, { color: theme.tokens.color.text, fontSize: theme.font(16) }]}>
                {t('home.status.loggedToday')}
              </Text>
              <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(16) }]}>
                {t('home.status.loggedTodayDetail')}
              </Text>
            </>
          ) : suppressLoggingPrompt ? (
            <>
              <Text style={[styles.heroStatusTitle, { color: theme.tokens.color.text, fontSize: theme.font(16) }]}>
                {t('home.welcome.title')}
              </Text>
              <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(16) }]}>
                {t('logs.empty.warm.message')}
              </Text>
              <PrimaryButton
                label={t('home.action.logNow')}
                onPress={() => {
                  hapticLight();
                  navigation.navigate('LogWizard');
                }}
                style={{ marginTop: 12 }}
                accessibilityLabel={t('home.action.logNow')}
              />
            </>
          ) : (
            <>
              <Text style={[styles.heroStatusTitle, { color: theme.tokens.color.text, fontSize: theme.font(16) }]}>
                {t('home.status.notLoggedYet')}
              </Text>
              <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(16) }]}>
                {notLoggedDetail}
              </Text>
              <PrimaryButton
                label={t('home.action.logNow')}
                onPress={() => {
                  hapticLight();
                  navigation.navigate('LogWizard');
                }}
                style={{ marginTop: 12 }}
                accessibilityLabel={t('home.action.logNow')}
              />
            </>
          )}
          {weeklyReviewCompleteBanner ? (
            <View style={[styles.heroInset, { borderTopColor: `${accent}33` }]}>
              <Ionicons name="checkmark-circle-outline" size={22} color={accent} style={{ marginBottom: 6 }} />
              <Text style={[styles.insetBody, { color: theme.tokens.color.textPrimary, fontSize: theme.font(14) }]}>
                {t('gamification.weeklyReview.heroCard')}
              </Text>
            </View>
          ) : null}
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
          {cardContext.showStreak ? (
            <View style={[styles.heroInset, { borderTopColor: `${accent}33` }]} accessibilityLabel={t('home.streak.title')}>
              <Pressable
                onPress={() => void onDismissStreak()}
                style={({ pressed }) => [styles.insetDismiss, { borderColor: `${accent}44`, opacity: pressed ? 0.75 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
              >
                <Ionicons name="close" size={18} color={accent} />
              </Pressable>
              <View style={styles.insetHeadRow}>
                <View style={[styles.insetIconWrap, { borderColor: `${accent}44`, backgroundColor: `${accent}18` }]}>
                  <Ionicons name="trending-up-outline" size={18} color={accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.insetTitle, { color: theme.tokens.color.textPrimary, fontSize: theme.font(15) }]}>
                    {t('home.streak.title')}
                  </Text>
                  <Text style={[styles.insetBody, { color: theme.tokens.color.textPrimary, fontSize: theme.font(14) }]}>
                    {t('home.streak.summary', {
                      goodDays: streakSnapshot.goodDayStreak,
                      flareFree: streakSnapshot.flareFreeDays,
                    })}
                  </Text>
                  {cardContext.streakBroken && !loggedToday ? (
                    <Text style={{ color: accent, fontSize: theme.font(12), marginTop: 4 }}>
                      {t('home.streak.graceDay')}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          ) : null}
          {cardContext.showCheckin ? (
            <View style={styles.heroCheckinWrap} accessibilityLabel={t('home.checkin.title')}>
              <Text style={[styles.heroCheckinTitle, { color: theme.tokens.color.textPrimary, fontSize: theme.font(16) }]}>
                {t('home.checkin.title')}
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
            </View>
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
          ) : homeLogs.length === 0 ? (
            <HomeDiscoveryChips
              onOpenGoals={() => requestOpenGoalsModal(0)}
              onNavigateMood={() => navigation.navigate('Mood')}
            />
          ) : null}
          {showWeeklyReview ? (
            <View style={[styles.heroInset, { borderTopColor: `${accent}33` }]} accessibilityLabel={t('weeklyReview.card.title')}>
              <Pressable
                onPress={() => void onDismissWeeklyReview()}
                style={({ pressed }) => [styles.insetDismiss, { borderColor: `${accent}44`, opacity: pressed ? 0.75 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
              >
                <Ionicons name="close" size={18} color={accent} />
              </Pressable>
              <View style={styles.insetHeadRow}>
                <View style={[styles.insetIconWrap, { borderColor: `${accent}44`, backgroundColor: `${accent}18` }]}>
                  <Ionicons name="calendar-outline" size={18} color={accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.insetTitle, { color: theme.tokens.color.textPrimary, fontSize: theme.font(15) }]}>
                    {t('weeklyReview.card.title')}
                  </Text>
                  <Text style={[styles.insetBody, { color: theme.tokens.color.textPrimary, fontSize: theme.font(14) }]}>
                    {t('weeklyReview.card.lead')}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => void onWeeklyReviewPress()}
                style={({ pressed }) => [
                  styles.readTodayBtn,
                  { borderColor: `${accent}66`, opacity: pressed ? 0.88 : 1, marginTop: 8 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={weeklyReviewAiReady ? t('weeklyReview.card.action') : t('weeklyReview.card.enableAi')}
              >
                <Text style={{ color: accent, fontSize: theme.font(14) }}>
                  {weeklyReviewAiReady ? t('weeklyReview.card.action') : t('weeklyReview.card.enableAi')}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      );
    }
    if (cardId === 'streak' || cardId === 'weeklyReview') {
      return null;
    }
    if (cardId === 'goals') {
      const todayEntry = todayLog;
      const stepsVal = todayEntry?.steps != null ? Number(todayEntry.steps) : 0;
      const hydrationVal = todayEntry?.hydration != null ? Number(todayEntry.hydration) : 0;
      const sleepVal = todayEntry?.sleep != null ? Number(todayEntry.sleep) : 0;
      const goalRows = [
        { key: 'steps', label: t('common.steps.per.day'), current: stepsVal, target: prefs.goals.steps },
        { key: 'hydration', label: t('common.hydration.glasses.per.day'), current: hydrationVal, target: prefs.goals.hydration },
        { key: 'sleep', label: t('common.sleep.quality.score.1.10'), current: sleepVal, target: prefs.goals.sleepScore },
      ];
      return (
        <Pressable
          key="goals"
          style={styles.card}
          accessibilityRole="button"
          accessibilityLabel={t('home.goals.title')}
          onPress={() => requestOpenGoalsModal(0)}
        >
          <Text style={[styles.title, { color: accent, fontSize: theme.font(18) }]}>{t('home.goals.title')}</Text>
          {goalRows.map((row) => {
            const progress = row.target > 0 ? Math.min(1, row.current / row.target) : 0;
            const onTrack = row.target > 0 && row.current >= row.target;
            return (
              <View key={row.key} style={{ marginTop: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: theme.tokens.color.text, fontSize: theme.font(13) }}>{row.label}</Text>
                  {onTrack ? (
                    <Text style={{ color: accent, fontSize: theme.font(12), fontWeight: '600' }}>{t('goals.onTrack')}</Text>
                  ) : (
                    <Text style={{ color: theme.tokens.color.text + '99', fontSize: theme.font(12) }}>
                      {row.current} / {row.target}
                    </Text>
                  )}
                </View>
                <View style={{ height: 4, borderRadius: 2, backgroundColor: accent + '22' }}>
                  <View style={{ height: 4, borderRadius: 2, width: `${progress * 100}%`, backgroundColor: accent }} />
                </View>
              </View>
            );
          })}
        </Pressable>
      );
    }
    if (cardId === 'personalBest' && personalBestHighlight) {
      return (
        <View key="personalBest" style={styles.card}>
          <Text style={[styles.title, { color: accent, fontSize: theme.font(16) }]}>
            {personalBestHighlight.kind === 'goodDays'
              ? t('gamification.personalBest.goodDays', { n: String(personalBestHighlight.n) })
              : t('gamification.personalBest.flareFree', { n: String(personalBestHighlight.n) })}
          </Text>
          <Pressable
            onPress={() => void persistPrefs({ ...prefs, personalBestDismissedAt: new Date().toISOString() })}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            style={{ marginTop: 8 }}
          >
            <Text style={{ color: theme.tokens.color.text + '99' }}>{t('common.close')}</Text>
          </Pressable>
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
            accessibilityLabel={
              unseenAchievementCount > 0
                ? `${unseenAchievementCount} new achievement${unseenAchievementCount === 1 ? '' : 's'}`
                : 'Goals and targets'
            }
            accessibilityHint="Opens Goals and targets modal"
          >
            <View>
              <TargetBullseyeIcon color={accent} size={24} />
              {unseenAchievementCount > 0 ? (
                <View
                  style={[styles.goalsBadgeDot, { backgroundColor: theme.tokens.color.accent }]}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                />
              ) : null}
            </View>
          </Pressable>
          <Pressable
            onPress={onBugReport}
            style={({ pressed }) => [styles.chromeBtn, chromeShadow(accent), { borderColor: accent, opacity: pressed ? 0.88 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Report a bug"
            accessibilityHint="Opens bug report form"
          >
            <Ionicons name="bug-outline" size={24} color={accent} />
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
        <View style={styles.homeTodayHeader} accessibilityRole="header">
          <Text style={[styles.homeGreeting, { color: accent, fontSize: theme.font(22) }]}>{homeSalutation}</Text>
          <View style={styles.homeTodayMeta}>
            <Text style={[styles.homeDateLabel, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
              {homeDateLabel}
            </Text>
            {cardContext.showWeather ? (
              <View style={styles.homeWeatherStrip} accessibilityLabel={t('home.weather.title')}>
                {!prefs.weatherStripEnabled ? (
                  <Pressable
                    onPress={() => void onEnableWeather()}
                    disabled={weatherLoading}
                    accessibilityRole="button"
                    accessibilityLabel={t('home.weather.enablePrompt')}
                    style={[
                      styles.homeWeatherEnablePrompt,
                      {
                        borderColor: `${accent}33`,
                      },
                    ]}
                  >
                    <Ionicons
                      name="cloudy-outline"
                      size={16}
                      color={accent}
                      style={styles.homeWeatherEnableIcon}
                    />
                    <Text
                      style={{
                        color: theme.tokens.color.text,
                        fontSize: theme.font(11),
                        fontWeight: '500',
                        opacity: 0.88,
                      }}
                    >
                      {weatherLoading ? t('home.weather.loading') : t('home.weather.enablePrompt')}
                    </Text>
                  </Pressable>
                ) : weatherSnapshot && weatherDisplay ? (
                  <View
                    style={styles.homeWeatherLayout}
                    accessibilityRole="text"
                    accessibilityLabel={weatherSummaryLabel}
                  >
                    {weatherDisplay.conditionIcon !== 'weather-unknown' ? (
                      <Ionicons
                        name={weatherIconIonName(weatherDisplay.conditionIcon)}
                        size={22}
                        color={resolveWeatherIconColor(theme.tokens, weatherDisplay.conditionIcon)}
                        accessibilityElementsHidden
                        importantForAccessibility="no"
                      />
                    ) : null}
                    <View style={styles.homeWeatherMetrics}>
                      {weatherDisplay.metrics.map((metric) => (
                        <View key={metric.key} style={styles.homeWeatherMetric} accessibilityElementsHidden importantForAccessibility="no">
                          <Ionicons name={weatherIconIonName(metric.icon)} size={14} color={resolveWeatherIconColor(theme.tokens, metric.icon)} />
                          <Text style={{ color: theme.tokens.color.text, fontSize: theme.font(12) }}>{metric.text}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : weatherSnapshot ? (
                  <Text style={[styles.homeWeatherSummary, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
                    {weatherSummaryLabel}
                  </Text>
                ) : (
                  <Text style={[styles.homeWeatherSummary, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
                    {weatherLoading ? t('home.weather.loading') : t('home.weather.enablePrompt')}
                  </Text>
                )}
              </View>
            ) : null}
          </View>
        </View>
        {showWelcomeCard ? (
          <HomeWelcomeCard
            condition={prefs.medicalCondition}
            onDismiss={() => void persistPrefs({ ...prefs, homeWelcomeCardDismissed: true })}
            pills={[
              { icon: 'moon-outline', labelKey: 'home.welcome.pill.sleep', onPress: () => navigation.navigate('Charts') },
              { icon: 'happy-outline', labelKey: 'home.welcome.pill.mood', onPress: () => navigation.navigate('Mood') },
              { icon: 'flash-outline', labelKey: 'home.welcome.pill.energy', onPress: () => navigation.navigate('LogWizard') },
            ]}
          />
        ) : null}
        {personalBestHighlight ? renderHomeCard('personalBest') : null}
        {visibleCardOrder.map((cardId) => renderHomeCard(cardId))}
      </ScrollView>

      <View style={[styles.fabWrap, { bottom: tabBarHeight + 16 }]}>
        {!loggedToday && !reduceMotion && !suppressLoggingPrompt ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.fabPulseRing,
              { backgroundColor: accent + '55', opacity: fabPulse },
            ]}
          />
        ) : null}
        <Pressable
          onPress={() => {
            hapticLight();
            navigation.navigate('LogWizard');
          }}
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
                  {t('home.checkin.modalTitle')}: {t(checkinPeriodLabelKey(checkinPeriod))}
                </Text>
                <Pressable onPress={() => setCheckinModalOpen(false)} accessibilityRole="button" accessibilityLabel={t('common.close')}>
                  <Ionicons name="close" size={24} color={accent} />
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Ionicons name={checkinPeriodIcon(checkinPeriod)} size={26} color={accent} />
                <Text style={{ color: accent, fontSize: theme.font(15), fontWeight: '700' }}>{checkinTime}</Text>
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
  goalsBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.55)',
  },
  card: { borderRadius: 16, padding: 16, backgroundColor: 'rgba(0,0,0,0.18)', marginBottom: 12 },
  heroInset: {
    position: 'relative',
    marginTop: 12,
    paddingTop: 12,
    paddingRight: 32,
    borderTopWidth: 1,
  },
  insetDismiss: {
    position: 'absolute',
    top: 10,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  insetTitle: { fontWeight: '700', marginBottom: 4 },
  insetBody: { lineHeight: 20 },
  insetHeadRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  insetIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroStreakNudgeCard: {
    backgroundColor: 'rgba(76,175,80,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.35)',
  },
  heroStatusTitle: { fontWeight: '700', marginBottom: 6 },
  scrollContent: { paddingBottom: 96 },
  homeTodayHeader: { marginBottom: 16, alignItems: 'center' },
  homeGreeting: { fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  homeTodayMeta: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  homeDateLabel: { opacity: 0.85, flexShrink: 1 },
  homeWeatherStrip: { flexShrink: 0, alignItems: 'flex-end' },
  homeWeatherEnablePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  homeWeatherEnableIcon: { opacity: 0.78 },
  homeWeatherLayout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8 },
  homeWeatherMetrics: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
  homeWeatherMetric: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  homeWeatherSummary: { textAlign: 'right', lineHeight: 18 },
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
  heroCheckinWrap: { marginTop: 12, width: '100%' },
  heroCheckinTitle: { fontWeight: '700', marginBottom: 6 },
  checkinBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.22)',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinIconBtn: {
    position: 'relative',
    minWidth: 72,
    minHeight: 72,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinDoneBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
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
    justifyContent: 'center',
  },
  fabPulseRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
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
