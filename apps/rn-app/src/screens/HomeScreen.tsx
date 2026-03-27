import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeProvider';
import type { MainTabParamList, RootStackParamList } from '../navigation/RootNavigator';
import { loadLogs } from '../storage/logs';
import type { Preferences } from '../storage/preferences';
import { loadCachedBenchmark } from '../performance/benchmark';
import { generateMotd } from '../ai/llm';

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

  const refreshToday = useCallback(() => {
    const d = todayIso();
    loadLogs()
      .then((logs) => setLoggedToday(logs.some((l) => l.date === d)))
      .catch(() => setLoggedToday(false));
  }, []);

  useEffect(() => {
    refreshToday();
  }, [refreshToday]);

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
    }, [refreshToday])
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
      const payload = {
        title: bugTitle.trim(),
        description,
        steps: bugSteps.trim(),
        expected_behavior: bugExpected.trim(),
        actual_behavior: bugActual.trim(),
        page_url: 'rn://home',
        user_agent: 'react-native',
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
            <Text style={[styles.bugMark, { color: accent }]}>?</Text>
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
      <Modal visible={bugModalOpen} animationType="slide" transparent onRequestClose={() => setBugModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: 'rgba(20,30,28,0.97)' }]}>
            <Text style={[styles.modalTitle, { color: theme.tokens.color.text, fontSize: theme.font(18) }]}>Report a bug</Text>
            <Text style={[styles.modalHint, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
              Match web parity: title optional, description required.
            </Text>
            <TextInput
              value={bugTitle}
              onChangeText={setBugTitle}
              placeholder="Short bug summary (optional)"
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={[styles.input, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
              accessibilityLabel="Bug title"
            />
            <TextInput
              value={bugDescription}
              onChangeText={setBugDescription}
              placeholder="What happened? (required)"
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={[styles.input, styles.textarea, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
              accessibilityLabel="Bug description"
              multiline
            />
            <TextInput
              value={bugSteps}
              onChangeText={setBugSteps}
              placeholder="Steps to reproduce (optional)"
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={[styles.input, styles.textarea, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
              accessibilityLabel="Bug steps"
              multiline
            />
            <TextInput
              value={bugExpected}
              onChangeText={setBugExpected}
              placeholder="Expected behavior (optional)"
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={[styles.input, styles.textarea, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
              accessibilityLabel="Bug expected behavior"
              multiline
            />
            <TextInput
              value={bugActual}
              onChangeText={setBugActual}
              placeholder="Actual behavior (optional)"
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={[styles.input, styles.textarea, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
              accessibilityLabel="Bug actual behavior"
              multiline
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalBtn} onPress={() => setBugModalOpen(false)} accessibilityRole="button">
                <Text style={styles.modalBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, bugSubmitting && { opacity: 0.65 }]}
                onPress={() => void onSubmitBugReport()}
                accessibilityRole="button"
                accessibilityLabel="Submit bug report"
                disabled={bugSubmitting}
              >
                <Text style={styles.modalBtnText}>{bugSubmitting ? 'Submitting…' : 'Submit'}</Text>
              </Pressable>
            </View>
          </View>
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
  bugMark: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
  },
  card: { borderRadius: 16, padding: 16, backgroundColor: 'rgba(0,0,0,0.18)' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  text: { fontSize: 16, opacity: 0.95 },
  motd: { marginTop: 10, opacity: 0.82 },
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: { borderRadius: 16, padding: 16, maxHeight: '92%' },
  modalTitle: { fontWeight: '800', marginBottom: 6 },
  modalHint: { opacity: 0.9, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  textarea: { minHeight: 64, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)' },
  modalBtnText: { color: '#fff', fontWeight: '700' },
});
