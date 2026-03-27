import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getTeamIds } from '@rianell/tokens';
import type { AppearanceMode, Preferences, PreferredLlmModelSize } from '../storage/preferences';
import { useTheme } from '../theme/ThemeProvider';
import { speakLabel } from '../accessibility/tts';
import { mergeLogsAppend, parseLogImportJson, serializeLogsForExport } from '../data/logExportImport';
import { loadLogs, saveLogs } from '../storage/logs';
import { SettingsCloudPane } from '../settings/SettingsCloudPane';
import { clearCachedBenchmark, loadCachedBenchmark, resolveLlmModelSize, runAndCacheBenchmark, type BenchmarkResult } from '../performance/benchmark';
import { disableDemoMode, enableDemoMode } from '../demo/demoMode';
import { Permissions } from '../permissions/permissions';

const PANE_TITLES = ['Personal & cloud', 'AI & theme', 'Accessibility', 'Data'] as const;

export function SettingsScreen({
  prefs,
  onChangePrefs,
}: {
  prefs: Preferences;
  onChangePrefs: (next: Preferences) => void;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [paneIndex, setPaneIndex] = useState(0);
  const bg =
    theme.tokens.color.background ===
    'linear-gradient(135deg, #a8e6cf 0%, #c8e6c9 25%, #e8f5e8 75%, #f1f8e9 100%)'
      ? '#ffffff'
      : theme.tokens.color.background;
  const tts = { enabled: prefs.accessibility.ttsEnabled, readModeEnabled: prefs.accessibility.ttsReadModeEnabled };

  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [exportBusy, setExportBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);
  const [benchmarkBusy, setBenchmarkBusy] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<'unavailable' | 'denied' | 'granted'>('unavailable');
  const [notificationScheduleState, setNotificationScheduleState] = useState<'idle' | 'scheduled' | 'invalid-time' | 'unavailable'>('idle');

  useEffect(() => {
    loadCachedBenchmark().then(setBenchmark).catch(() => setBenchmark(null));
  }, []);

  useEffect(() => {
    Permissions.getStatus('notifications')
      .then(setNotificationPermission)
      .catch(() => setNotificationPermission('unavailable'));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (notificationPermission !== 'granted') {
        if (!cancelled) setNotificationScheduleState('idle');
        return;
      }
      const ok = await Permissions.scheduleDailyReminder({
        enabled: prefs.notifications.enabled,
        time: prefs.notifications.dailyReminderTime,
        soundEnabled: prefs.notifications.soundEnabled,
      });
      if (cancelled) return;
      if (ok) {
        setNotificationScheduleState(prefs.notifications.enabled ? 'scheduled' : 'idle');
      } else if (!/^\d{2}:\d{2}$/.test(prefs.notifications.dailyReminderTime)) {
        setNotificationScheduleState('invalid-time');
      } else {
        setNotificationScheduleState('unavailable');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    notificationPermission,
    prefs.notifications.dailyReminderTime,
    prefs.notifications.enabled,
    prefs.notifications.soundEnabled,
  ]);

  function goPane(next: number) {
    const clamped = Math.max(0, Math.min(PANE_TITLES.length - 1, next));
    scrollRef.current?.scrollTo({ x: clamped * width, animated: true });
    setPaneIndex(clamped);
  }

  function onPaneScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const x = e.nativeEvent.contentOffset.x;
    setPaneIndex(Math.round(x / width));
  }

  async function onExportLogs() {
    if (prefs.demoMode) {
      Alert.alert('Demo Mode', 'Data export is disabled in demo mode. Demo data is not saved or synced.');
      return;
    }
    setExportBusy(true);
    try {
      const logs = await loadLogs();
      const json = serializeLogsForExport(logs);
      await Share.share({ message: json, title: 'Rianell health logs (JSON)' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Export failed';
      Alert.alert('Export', msg);
    } finally {
      setExportBusy(false);
    }
  }

  async function applyImport(mode: 'replace' | 'append') {
    if (prefs.demoMode) {
      Alert.alert('Demo Mode', 'Import is disabled in demo mode. Turn off demo mode first.');
      return;
    }
    try {
      const incoming = parseLogImportJson(importText);
      if (mode === 'replace') {
        await saveLogs(incoming);
      } else {
        const existing = await loadLogs();
        await saveLogs(mergeLogsAppend(existing, incoming));
      }
      setImportOpen(false);
      setImportText('');
      Alert.alert('Import', 'Logs saved.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Import failed';
      Alert.alert('Import', msg);
    }
  }

  async function runBenchmarkNow() {
    setBenchmarkBusy(true);
    try {
      const next = await runAndCacheBenchmark();
      setBenchmark(next);
      Alert.alert(
        'Performance benchmark',
        `Tier ${next.tier} (${next.deviceClass})\nRecommended model: ${next.llmModelSize}\nScore: ${next.scoreMs.toFixed(1)} ms`
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Benchmark failed';
      Alert.alert('Performance benchmark', msg);
    } finally {
      setBenchmarkBusy(false);
    }
  }

  async function setDemoMode(next: boolean) {
    if (demoBusy || prefs.demoMode === next) return;
    setDemoBusy(true);
    try {
      if (next) {
        await enableDemoMode();
        onChangePrefs({ ...prefs, demoMode: true });
        Alert.alert('Demo Mode', 'Demo mode enabled. Sample logs loaded for exploration.');
      } else {
        await disableDemoMode();
        onChangePrefs({ ...prefs, demoMode: false });
        Alert.alert('Demo Mode', 'Demo mode disabled. Previous logs restored.');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not update demo mode.';
      Alert.alert('Demo Mode', msg);
    } finally {
      setDemoBusy(false);
    }
  }

  async function requestNotificationPermission() {
    try {
      const status = await Permissions.request('notifications');
      setNotificationPermission(status);
      if (status === 'granted') {
        Alert.alert('Notifications', 'Notification permission granted.');
      } else if (status === 'denied') {
        Alert.alert('Notifications', 'Permission denied. You can retry or update it in system settings.');
      } else {
        Alert.alert('Notifications', 'Notifications are unavailable on this runtime.');
      }
    } catch {
      Alert.alert('Notifications', 'Could not request notification permission.');
    }
  }

  function updateGoalValue(key: 'moodTarget' | 'sleepTarget' | 'fatigueTarget', raw: string) {
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    const clamped = Math.min(10, Math.max(0, n));
    onChangePrefs({
      ...prefs,
      goals: {
        ...prefs.goals,
        [key]: clamped,
      },
    });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.carouselChrome}>
        <View style={styles.carouselNav}>
          <Pressable
            onPress={() => goPane(paneIndex - 1)}
            disabled={paneIndex <= 0}
            accessibilityRole="button"
            accessibilityLabel="Previous settings section"
            style={styles.carouselSide}
          >
            <Ionicons name="chevron-back" size={22} color={theme.tokens.color.text} />
          </Pressable>
          <Text
            style={[styles.carouselMeta, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}
            accessibilityRole="text"
            accessibilityLiveRegion="polite"
          >
            {paneIndex + 1} / {PANE_TITLES.length} — {PANE_TITLES[paneIndex]}
          </Text>
          <Pressable
            onPress={() => goPane(paneIndex + 1)}
            disabled={paneIndex >= PANE_TITLES.length - 1}
            accessibilityRole="button"
            accessibilityLabel="Next settings section"
            style={styles.carouselSide}
          >
            <Ionicons name="chevron-forward" size={22} color={theme.tokens.color.text} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paneTabRow}>
          {PANE_TITLES.map((t, i) => {
            const active = i === paneIndex;
            return (
              <Pressable
                key={t}
                testID={`settings-pane-tab-${i}`}
                onPress={() => goPane(i)}
                style={[styles.paneTab, active && styles.paneTabActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.paneTabText,
                    { fontSize: theme.font(12) },
                    active && styles.paneTabTextActive,
                    { color: theme.tokens.color.text },
                  ]}
                >
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.dotsRow} accessibilityRole="tablist">
          {PANE_TITLES.map((_, i) => (
            <View
              key={`dot-${i}`}
              style={[styles.dot, i === paneIndex ? styles.dotOn : styles.dotOff]}
              accessibilityElementsHidden
            />
          ))}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onPaneScrollEnd}
        keyboardShouldPersistTaps="handled"
      >
        {/* Pane 0 — Personal & cloud */}
        <View style={{ width }}>
          <ScrollView contentContainerStyle={styles.content} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            <Section title="Personal & cloud sync">
              <Hint>Matches web Settings → first carousel pane (account + Supabase).</Hint>
              <Row label="Demo mode">
                <Switch value={prefs.demoMode === true} onValueChange={(on) => void setDemoMode(on)} disabled={demoBusy} />
              </Row>
              <Hint>Loads a fresh sample dataset each app launch and pauses data portability actions.</Hint>
              <SettingsCloudPane />
            </Section>
            <Section title="Notifications">
              <Hint>Phase E baseline: notification prefs + permission state for RN parity.</Hint>
              <Row label="Enable daily reminder">
                <Switch
                  value={prefs.notifications.enabled}
                  onValueChange={(on) =>
                    onChangePrefs({
                      ...prefs,
                      notifications: { ...prefs.notifications, enabled: on },
                    })
                  }
                />
              </Row>
              <Row label="Reminder time (HH:MM)">
                <TextInput
                  value={prefs.notifications.dailyReminderTime}
                  onChangeText={(value) =>
                    onChangePrefs({
                      ...prefs,
                      notifications: { ...prefs.notifications, dailyReminderTime: value },
                    })
                  }
                  accessibilityLabel="Daily reminder time"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.timeInput, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                  placeholder="20:00"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                />
              </Row>
              <Row label="Reminder sound">
                <Switch
                  value={prefs.notifications.soundEnabled}
                  onValueChange={(on) =>
                    onChangePrefs({
                      ...prefs,
                      notifications: { ...prefs.notifications, soundEnabled: on },
                    })
                  }
                />
              </Row>
              <Text style={[styles.hint, { fontSize: theme.font(13) }]}>
                Notification permission: {notificationPermission}
              </Text>
              {notificationScheduleState === 'scheduled' ? (
                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>
                  Daily reminder scheduled at {prefs.notifications.dailyReminderTime}.
                </Text>
              ) : null}
              {notificationScheduleState === 'invalid-time' ? (
                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>
                  Reminder time must be HH:MM to schedule notifications.
                </Text>
              ) : null}
              {notificationScheduleState === 'unavailable' ? (
                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>
                  Notification scheduling is unavailable on this runtime.
                </Text>
              ) : null}
              <Pressable
                style={styles.dataBtn}
                onPress={() => void requestNotificationPermission()}
                accessibilityRole="button"
                accessibilityLabel="Request notification permission"
              >
                <Text style={[styles.dataBtnText, { fontSize: theme.font(15) }]}>🔔 Request notification permission</Text>
              </Pressable>
            </Section>
          </ScrollView>
        </View>

        {/* Pane 1 — AI & theme */}
        <View style={{ width }}>
          <ScrollView contentContainerStyle={styles.content} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            <Section title="Theme">
              <Row label="Enable AI features & Goals">
                <Switch
                  value={prefs.aiEnabled !== false}
                  onValueChange={(on) => onChangePrefs({ ...prefs, aiEnabled: on })}
                />
              </Row>

              <Row label="Appearance mode">
                <InlineChoices
                  value={prefs.appearanceMode}
                  options={['system', 'dark', 'light']}
                  onChange={(v) => onChangePrefs({ ...prefs, appearanceMode: v as AppearanceMode })}
                  tts={tts}
                />
              </Row>

              <Row label="Team">
                <InlineChoices
                  value={prefs.team}
                  options={getTeamIds()}
                  onChange={(v) => onChangePrefs({ ...prefs, team: v })}
                  tts={tts}
                />
              </Row>
            </Section>
            <Section title="Performance">
              <Hint>
                Benchmark parity with web: tiers 1-5 + recommended on-device AI model. Use this to pick model size and profile.
              </Hint>
              <Row label="On-device AI model">
                <InlineChoices
                  value={prefs.performance.preferredLlmModelSize}
                  options={['recommended', 'tier1', 'tier2', 'tier3', 'tier4', 'tier5']}
                  onChange={(v) =>
                    onChangePrefs({
                      ...prefs,
                      performance: {
                        ...prefs.performance,
                        preferredLlmModelSize: v as PreferredLlmModelSize,
                      },
                    })
                  }
                  tts={tts}
                />
              </Row>
              <Text style={[styles.hint, { fontSize: theme.font(13) }]}>
                Active model: {resolveLlmModelSize(prefs.performance.preferredLlmModelSize, benchmark)}
                {benchmark ? ` (recommended ${benchmark.llmModelSize}, tier ${benchmark.tier})` : ' (no benchmark yet)'}
              </Text>
              <View style={styles.performanceActions}>
                <Pressable
                  style={[styles.dataBtn, { opacity: benchmarkBusy ? 0.6 : 1 }]}
                  onPress={() => void runBenchmarkNow()}
                  disabled={benchmarkBusy}
                  accessibilityRole="button"
                  accessibilityLabel="Run performance benchmark"
                >
                  {benchmarkBusy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={[styles.dataBtnText, { fontSize: theme.font(15) }]}>⚡ Run benchmark</Text>
                  )}
                </Pressable>
                <Pressable
                  style={styles.dataBtn}
                  onPress={() => {
                    void clearCachedBenchmark().then(() => setBenchmark(null));
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Clear performance benchmark"
                >
                  <Text style={[styles.dataBtnText, { fontSize: theme.font(15) }]}>🧹 Clear benchmark cache</Text>
                </Pressable>
              </View>
            </Section>
            <Section title="Goals & targets">
              <Hint>Persisted goals feed Charts balance targets (mood, sleep, fatigue).</Hint>
              <Row label="Mood target (0-10)">
                <TextInput
                  value={String(prefs.goals.moodTarget)}
                  onChangeText={(value) => updateGoalValue('moodTarget', value)}
                  accessibilityLabel="Mood target value"
                  keyboardType="decimal-pad"
                  style={[styles.timeInput, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                />
              </Row>
              <Row label="Sleep target (0-10)">
                <TextInput
                  value={String(prefs.goals.sleepTarget)}
                  onChangeText={(value) => updateGoalValue('sleepTarget', value)}
                  accessibilityLabel="Sleep target value"
                  keyboardType="decimal-pad"
                  style={[styles.timeInput, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                />
              </Row>
              <Row label="Fatigue target (0-10)">
                <TextInput
                  value={String(prefs.goals.fatigueTarget)}
                  onChangeText={(value) => updateGoalValue('fatigueTarget', value)}
                  accessibilityLabel="Fatigue target value"
                  keyboardType="decimal-pad"
                  style={[styles.timeInput, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                />
              </Row>
            </Section>
          </ScrollView>
        </View>

        {/* Pane 2 — Accessibility */}
        <View style={{ width }}>
          <ScrollView contentContainerStyle={styles.content} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            <Section title="Accessibility">
              <Row label="Large text">
                <Switch
                  value={prefs.accessibility.largeTextEnabled}
                  onValueChange={(on) =>
                    onChangePrefs({
                      ...prefs,
                      accessibility: {
                        ...prefs.accessibility,
                        largeTextEnabled: on,
                        textScale: on ? Math.max(prefs.accessibility.textScale, 1.2) : 1,
                      },
                    })
                  }
                />
              </Row>

              <Hint>Text scale is now applied across mobile screens via theme typography scaling.</Hint>

              <Row label="Text-to-speech (tap-to-read)">
                <Switch
                  value={prefs.accessibility.ttsEnabled}
                  onValueChange={(on) =>
                    onChangePrefs({
                      ...prefs,
                      accessibility: { ...prefs.accessibility, ttsEnabled: on },
                    })
                  }
                />
              </Row>

              <Row label="Read mode (auto-read on focus)">
                <Switch
                  value={prefs.accessibility.ttsReadModeEnabled}
                  onValueChange={(on) =>
                    onChangePrefs({
                      ...prefs,
                      accessibility: { ...prefs.accessibility, ttsReadModeEnabled: on },
                    })
                  }
                />
              </Row>

              <Row label="Colorblind mode">
                <InlineChoices
                  value={prefs.accessibility.colorblindMode}
                  options={['none', 'deuteranopia', 'protanopia', 'tritanopia', 'high-contrast']}
                  onChange={(v) =>
                    onChangePrefs({
                      ...prefs,
                      accessibility: { ...prefs.accessibility, colorblindMode: v },
                    })
                  }
                  tts={tts}
                />
              </Row>
            </Section>
          </ScrollView>
        </View>

        {/* Pane 3 — Data */}
        <View style={{ width }}>
          <ScrollView contentContainerStyle={styles.content} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            <Section title="Data management">
              <Hint>Export JSON matches web portability; import accepts the same array format (replace or merge by date).</Hint>
              <Pressable
                style={[styles.dataBtn, { opacity: exportBusy ? 0.6 : 1 }]}
                onPress={() => void onExportLogs()}
                disabled={exportBusy}
                accessibilityRole="button"
                accessibilityLabel="Export logs as JSON"
              >
                {exportBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.dataBtnText, { fontSize: theme.font(15) }]}>📤 Export logs (JSON)</Text>
                )}
              </Pressable>
              <Pressable
                style={styles.dataBtn}
                onPress={() => setImportOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Import logs from JSON"
              >
                <Text style={[styles.dataBtnText, { fontSize: theme.font(15) }]}>📥 Import logs (JSON)</Text>
              </Pressable>
            </Section>
          </ScrollView>
        </View>
      </ScrollView>

      <Modal visible={importOpen} animationType="slide" transparent onRequestClose={() => setImportOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: 'rgba(20,30,28,0.97)' }]}>
            <Text style={[styles.modalTitle, { color: theme.tokens.color.text, fontSize: theme.font(17) }]}>Import JSON</Text>
            <Text style={[styles.hint, { fontSize: theme.font(13) }]}>
              Paste a JSON array of log entries (same shape as web export).
            </Text>
            <TextInput
              value={importText}
              onChangeText={setImportText}
              multiline
              placeholder="[...]"
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={[styles.importInput, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
              accessibilityLabel="Import JSON text"
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalBtn} onPress={() => setImportOpen(false)} accessibilityRole="button">
                <Text style={styles.dataBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalBtn}
                onPress={() => void applyImport('append')}
                accessibilityRole="button"
                accessibilityLabel="Merge with existing logs"
              >
                <Text style={styles.dataBtnText}>Merge</Text>
              </Pressable>
              <Pressable
                style={styles.modalBtn}
                onPress={() => {
                  Alert.alert('Replace all logs?', 'This will replace every log on this device.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Replace', style: 'destructive', onPress: () => void applyImport('replace') },
                  ]);
                }}
                accessibilityRole="button"
                accessibilityLabel="Replace all logs"
              >
                <Text style={styles.dataBtnText}>Replace all</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { fontSize: theme.font(18) }]}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { fontSize: theme.font(15) }]}>{label}</Text>
      <View style={styles.rowRight}>{children}</View>
    </View>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return <Text style={[styles.hint, { fontSize: theme.font(13) }]}>{children}</Text>;
}

function InlineChoices({
  value,
  options,
  onChange,
  tts,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  tts: { enabled: boolean; readModeEnabled: boolean };
}) {
  const theme = useTheme();
  return (
    <View style={styles.choiceRow}>
      {options.map((o) => {
        const active = o === value;
        return (
          <Pressable
            key={o}
            onPress={() => {
              speakLabel(o, tts);
              onChange(o);
            }}
            onFocus={() => {
              if (tts.readModeEnabled) speakLabel(o, tts);
            }}
            style={[styles.choice, active && styles.choiceActive]}
            accessibilityRole="button"
            accessibilityLabel={o}
          >
            <Text style={[styles.choiceText, active && styles.choiceTextActive, { fontSize: theme.font(13) }]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  carouselChrome: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  carouselNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  carouselSide: { padding: 8 },
  carouselMeta: { flex: 1, textAlign: 'center', fontWeight: '600', opacity: 0.92 },
  paneTabRow: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 4 },
  paneTab: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.12)',
    maxWidth: 160,
  },
  paneTabActive: { backgroundColor: 'rgba(0,0,0,0.22)' },
  paneTabText: { fontWeight: '600', opacity: 0.85 },
  paneTabTextActive: { opacity: 1, fontWeight: '800' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotOn: { backgroundColor: 'rgba(0,180,120,0.95)' },
  dotOff: { backgroundColor: 'rgba(0,0,0,0.2)' },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  section: { borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.16)', padding: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10, color: '#fff' },
  sectionBody: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowLabel: { color: '#fff', fontSize: 15, flex: 1 },
  rowRight: { alignItems: 'flex-end' },
  hint: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: -4 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },
  choice: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
  choiceActive: { backgroundColor: 'rgba(255,255,255,0.32)' },
  choiceText: { color: '#fff', fontWeight: '600' },
  choiceTextActive: { color: '#000' },
  dataBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
  },
  dataBtnText: { color: '#fff', fontWeight: '800' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: { borderRadius: 16, padding: 16, maxHeight: '90%' },
  modalTitle: { fontWeight: '800', marginBottom: 8 },
  importInput: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)' },
  performanceActions: { gap: 8, marginTop: 6 },
  timeInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 96,
    textAlign: 'right',
  },
});
