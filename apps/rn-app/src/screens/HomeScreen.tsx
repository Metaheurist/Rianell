import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle, Path } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeProvider';
import type { MainTabParamList, RootStackParamList } from '../navigation/RootNavigator';
import { loadLogs } from '../storage/logs';
import type { Preferences } from '../storage/preferences';
import { loadCachedBenchmark } from '../performance/benchmark';
import { generateMotd } from '../ai/llm';
import Constants from 'expo-constants';
import { getBugReportAttachmentText } from '../utils/bugReportLogs';

/** Web `index.html` parity: top chrome includes bug-report modal entry. */
const SECURITY_DOC_URL = 'https://github.com/Metaheurist/Rianell/blob/main/docs/SECURITY.md';
const BUG_REPORT_ENDPOINT = 'https://rianell.com/api/bug-report';

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
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
}: {
  motd: string;
  theme: ReturnType<typeof useTheme>;
  latestBpm: number | null;
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
        <Text style={[styles.motd, { color: textColor, fontSize: theme.font(13) }]}>{motd || 'Loading AI message...'}</Text>
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
            <Text style={[styles.motd, { color: textColor, fontSize: theme.font(13) }]}>{motd || 'Loading AI message...'}</Text>
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

export function HomeScreen({ prefs }: { prefs: Preferences }) {
  const theme = useTheme();
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
      .then((logs) => setLoggedToday(logs.some((l) => l.date === d)))
      .catch(() => setLoggedToday(false));
  }, []);

  useEffect(() => {
    refreshToday();
    refreshBpm();
  }, [refreshToday, refreshBpm]);

  useEffect(() => {
    loadLogs()
      .then(async (logs) => {
        const benchmark = await loadCachedBenchmark().catch(() => null);
        return generateMotd(prefs.performance.preferredLlmModelSize, benchmark, logs.length);
      })
      .then(setMotd)
      .catch(() => setMotd('Consistency beats intensity. One useful entry today is enough.'));
  }, [prefs.performance.preferredLlmModelSize]);

  useFocusEffect(
    useCallback(() => {
      refreshToday();
      refreshBpm();
    }, [refreshToday, refreshBpm])
  );

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
      Alert.alert('Bug report', 'Please describe what happened.');
      return;
    }
    setBugSubmitting(true);
    try {
      const ua = `Rianell-ReactNative/${Platform.OS}/${String(Platform.Version ?? '')} app=${Constants.expoConfig?.version ?? ''}`;
      const payload = {
        title: bugTitle.trim(),
        description,
        steps: bugSteps.trim(),
        expected_behavior: bugExpected.trim(),
        actual_behavior: bugActual.trim(),
        console_output: getBugReportAttachmentText(),
        url: 'rn://home',
        user_agent: ua,
        client_timestamp: new Date().toISOString(),
      };
      const res = await fetch(BUG_REPORT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data?.error === 'string' ? data.error : 'Failed to submit bug report.');
      }
      setBugModalOpen(false);
      setBugTitle('');
      setBugDescription('');
      setBugSteps('');
      setBugExpected('');
      setBugActual('');
      Alert.alert('Bug report', 'Thanks - your bug report was submitted.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to submit bug report.';
      Alert.alert('Bug report', msg, [
        { text: 'Open SECURITY.md', onPress: () => void Linking.openURL(SECURITY_DOC_URL) },
        { text: 'Close', style: 'cancel' },
      ]);
    } finally {
      setBugSubmitting(false);
    }
  }, [bugActual, bugDescription, bugExpected, bugSteps, bugTitle]);

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
            accessibilityHint="Opens security and reporting documentation"
          >
            <Ionicons name="bug-outline" size={22} color={accent} />
          </Pressable>
          <Pressable
            onPress={onSettings}
            style={({ pressed }) => [styles.chromeBtn, chromeShadow(accent), { borderColor: accent, opacity: pressed ? 0.88 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={22} color={accent} />
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={[styles.title, { color: accent, fontSize: theme.font(22) }]}>Rianell</Text>
        <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(16) }]}>
          {loggedToday === null
            ? 'Loading today’s status…'
            : loggedToday
              ? 'You have logged today. Open View logs to browse or edit entries.'
              : 'No log for today yet. Tap + to record how you feel.'}
        </Text>
        <Text style={[styles.motd, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
          {motd || 'Loading AI message...'}
        </Text>
      </View>

      <View style={[styles.fabWrap, { bottom: tabBarHeight + 16 }]}>
        <Pressable
          onPress={() => navigation.navigate('LogWizard')}
          style={[styles.fab, { backgroundColor: accent }]}
          accessibilityRole="button"
          accessibilityLabel="Log today, Beta"
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
        <View style={styles.betaBadge} pointerEvents="none" accessibilityElementsHidden>
          <Text style={styles.betaBadgeText}>Beta</Text>
        </View>
      </View>
      <Modal visible={bugModalOpen} animationType="fade" transparent onRequestClose={() => setBugModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setBugModalOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKb}
          >
            <View style={[styles.modalCard, { borderColor: `${accent}44`, backgroundColor: 'rgba(14,18,17,0.98)' }]}>
              <View style={styles.modalHeaderRow}>
                <Text style={[styles.modalTitle, { color: accent, fontSize: theme.font(18) }]}>Report a bug</Text>
                <Pressable
                  onPress={() => setBugModalOpen(false)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Close bug report"
                >
                  <Ionicons name="close" size={26} color={theme.tokens.color.text} />
                </Pressable>
              </View>
              <Text style={[styles.modalLede, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
                Describe what went wrong. Device info and recent app log lines are attached automatically when you submit.
              </Text>
              <ScrollView
                style={styles.modalScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
                indicatorStyle={Platform.OS === 'ios' ? 'default' : undefined}
              >
                <Text style={[styles.fieldLabel, { color: theme.tokens.color.text }]}>Title (optional)</Text>
                <TextInput
                  value={bugTitle}
                  onChangeText={setBugTitle}
                  placeholder="Short summary"
                  placeholderTextColor="rgba(255,255,255,0.42)"
                  style={[styles.input, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                  accessibilityLabel="Bug title"
                />
                <Text style={[styles.fieldLabel, { color: theme.tokens.color.text }]}>Description *</Text>
                <TextInput
                  value={bugDescription}
                  onChangeText={setBugDescription}
                  placeholder="What happened?"
                  placeholderTextColor="rgba(255,255,255,0.42)"
                  style={[styles.input, styles.textarea, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                  accessibilityLabel="Bug description"
                  multiline
                />
                <Text style={[styles.fieldLabelOptional, { color: theme.tokens.color.text }]}>More detail (optional)</Text>
                <TextInput
                  value={bugSteps}
                  onChangeText={setBugSteps}
                  placeholder="Steps to reproduce"
                  placeholderTextColor="rgba(255,255,255,0.42)"
                  style={[styles.input, styles.textareaSm, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                  accessibilityLabel="Steps to reproduce"
                  multiline
                />
                <TextInput
                  value={bugExpected}
                  onChangeText={setBugExpected}
                  placeholder="Expected behavior"
                  placeholderTextColor="rgba(255,255,255,0.42)"
                  style={[styles.input, styles.textareaSm, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                  accessibilityLabel="Expected behavior"
                  multiline
                />
                <TextInput
                  value={bugActual}
                  onChangeText={setBugActual}
                  placeholder="Actual behavior"
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
                  <Text style={[styles.modalBtnTextSecondary, { color: theme.tokens.color.text }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalBtnPrimary, { backgroundColor: accent, opacity: bugSubmitting ? 0.65 : 1 }]}
                  onPress={() => void onSubmitBugReport()}
                  accessibilityRole="button"
                  accessibilityLabel="Submit bug report"
                  disabled={bugSubmitting}
                >
                  <Text style={styles.modalBtnTextPrimary}>{bugSubmitting ? 'Submitting…' : 'Submit'}</Text>
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
  card: { borderRadius: 16, padding: 16, backgroundColor: 'rgba(0,0,0,0.18)' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  text: { fontSize: 16, opacity: 0.95 },
  motd: { marginTop: 10, opacity: 0.82 },
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
