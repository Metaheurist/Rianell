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
import { SettingsAppInstallSection } from '../settings/SettingsAppInstallSection';
import { clearCachedBenchmark, loadCachedBenchmark, resolveLlmModelSize, runAndCacheBenchmark, type BenchmarkResult } from '../performance/benchmark';
import { disableDemoMode, enableDemoMode } from '../demo/demoMode';
import {
  Permissions,
  type DailyReminderResult,
  type ReminderAction,
  type ReminderCapabilities,
} from '../permissions/permissions';

/** Matches `data-settings-pane-title` order in `apps/pwa-webapp/index.html` settings carousel. */
const PANE_TITLES = [
  'Personal & cloud sync',
  'AI & Goals',
  'Display',
  'Customisation',
  'Accessibility',
  'Data options',
  'Performance',
  'Data management',
] as const;

/**
 * Ionicons names aligned with `settingsIconForTitle` in `apps/pwa-webapp/app.js` (Font Awesome → Ionicons).
 */
function settingsPaneIconName(title: string, idx: number): React.ComponentProps<typeof Ionicons>['name'] {
  const t = title.toLowerCase();
  if (t.includes('personal') || t.includes('cloud')) return 'person-outline';
  if (t.includes('ai') || t.includes('goal')) return 'medical-outline';
  if (t.includes('display') || t.includes('reminder')) return 'bar-chart-outline';
  if (t.includes('custom') || t.includes('theme')) return 'color-palette-outline';
  if (t.includes('access')) return 'accessibility-outline';
  if (t.includes('data option')) return 'settings-outline';
  if (t.includes('performance')) return 'flash-outline';
  if (t.includes('install')) return 'phone-portrait-outline';
  if (t.includes('data management')) return 'save-outline';
  return idx % 2 === 0 ? 'ellipse-outline' : 'ellipse';
}

function reminderActionLabel(action: ReminderAction): string {
  if (action === 'log-now') return 'Log now';
  if (action === 'later') return 'Later';
  if (action === 'default') return 'Open app';
  if (action === 'unknown') return 'Unknown action';
  return 'None';
}

export function SettingsScreen({
  prefs,
  onChangePrefs,
}: {
  prefs: Preferences;
  onChangePrefs: (next: Preferences) => void;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  /** Sized like web `settings-carousel-dots` (clamp ~22–32px), shared across eight pane icons. */
  const settingsPaneIconBtnSize = Math.min(36, Math.max(26, (width - 48 - 7 * 4) / 8));
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
  const [notificationDeliveryState, setNotificationDeliveryState] = useState<DailyReminderResult['delivery']>('runtime-unavailable');
  const [lastReminderAction, setLastReminderAction] = useState<ReminderAction>('none');
  const [unknownReminderActionCount, setUnknownReminderActionCount] = useState(0);
  const [lastUnknownReminderActionAt, setLastUnknownReminderActionAt] = useState<string | null>(null);
  const [firstUnknownReminderActionSource, setFirstUnknownReminderActionSource] = useState<'startup' | 'live' | null>(null);
  const [lastUnknownReminderActionSource, setLastUnknownReminderActionSource] = useState<'startup' | 'live' | null>(null);
  const [unknownStartupCount, setUnknownStartupCount] = useState(0);
  const [unknownLiveCount, setUnknownLiveCount] = useState(0);
  const [reminderCapabilities, setReminderCapabilities] = useState<ReminderCapabilities>({
    hasScheduling: false,
    hasAndroidChannel: false,
    hasIosCategory: false,
    hasResponseListener: false,
    hasSnooze: false,
    hasDismissAction: false,
  });

  useEffect(() => {
    loadCachedBenchmark().then(setBenchmark).catch(() => setBenchmark(null));
  }, []);

  useEffect(() => {
    Permissions.getReminderCapabilities()
      .then(setReminderCapabilities)
      .catch(() =>
        setReminderCapabilities({
          hasScheduling: false,
          hasAndroidChannel: false,
          hasIosCategory: false,
          hasResponseListener: false,
          hasSnooze: false,
          hasDismissAction: false,
        })
      );
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
        if (!cancelled) {
          setNotificationScheduleState('idle');
          setNotificationDeliveryState('runtime-unavailable');
        }
        return;
      }
      const result = await Permissions.scheduleDailyReminder({
        enabled: prefs.notifications.enabled,
        time: prefs.notifications.dailyReminderTime,
        soundEnabled: prefs.notifications.soundEnabled,
      });
      if (cancelled) return;
      setNotificationDeliveryState(result.delivery);
      if (result.ok) {
        setNotificationScheduleState(prefs.notifications.enabled ? 'scheduled' : 'idle');
      } else if (result.reason === 'invalid-time' || !/^\d{2}:\d{2}$/.test(prefs.notifications.dailyReminderTime)) {
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

  useEffect(() => {
    let mounted = true;
    let dispose = () => {};
    void Permissions.getLastReminderAction()
      .then((action) => {
        if (!mounted) return;
        setLastReminderAction(action);
        if (action === 'unknown') {
          setUnknownReminderActionCount((n) => n + 1);
          setLastUnknownReminderActionAt(new Date().toLocaleTimeString());
          setFirstUnknownReminderActionSource((s) => s ?? 'startup');
          setLastUnknownReminderActionSource('startup');
          setUnknownStartupCount((n) => n + 1);
        }
      })
      .catch(() => {
        if (mounted) setLastReminderAction('none');
      });
    void Permissions.subscribeReminderActions((action) => {
      if (!mounted) return;
      setLastReminderAction(action);
      if (action === 'unknown') {
        setUnknownReminderActionCount((n) => n + 1);
        setLastUnknownReminderActionAt(new Date().toLocaleTimeString());
        setFirstUnknownReminderActionSource((s) => s ?? 'live');
        setLastUnknownReminderActionSource('live');
        setUnknownLiveCount((n) => n + 1);
      }
    }).then((cleanup) => {
      dispose = cleanup;
    });
    return () => {
      mounted = false;
      dispose();
    };
  }, []);

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

  function clearAllLogs() {
    if (prefs.demoMode) {
      Alert.alert('Demo Mode', 'Turn off demo mode before clearing data.');
      return;
    }
    Alert.alert(
      'Clear all data?',
      'This removes every health log on this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await saveLogs([]);
              Alert.alert('Cleared', 'All health logs were removed from this device.');
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not clear data');
            }
          },
        },
      ]
    );
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

  const unknownStartupPercent =
    unknownReminderActionCount > 0 ? Math.round((unknownStartupCount / unknownReminderActionCount) * 100) : 0;
  const unknownLivePercent = unknownReminderActionCount > 0 ? Math.round((unknownLiveCount / unknownReminderActionCount) * 100) : 0;
  const unknownDriftDominanceGap = Math.abs(unknownStartupPercent - unknownLivePercent);
  const unknownDominantSourceConfidence =
    unknownReminderActionCount === 0
      ? null
      : unknownStartupPercent === unknownLivePercent
        ? 'balanced (no dominant source)'
        : `${unknownDriftDominanceGap >= 60 ? 'strong' : unknownDriftDominanceGap >= 30 ? 'medium' : 'weak'} (${
            unknownStartupPercent > unknownLivePercent ? 'startup snapshot' : 'live listener'
          })`;
  const unknownObservabilityQuality =
    unknownReminderActionCount === 0
      ? null
      : unknownReminderActionCount < 3
        ? 'low'
        : unknownReminderActionCount >= 5
          ? 'high'
          : 'medium';
  const unknownRecommendedNextCheck =
    unknownObservabilityQuality === 'low'
      ? 'collect at least 3 unknown events before trusting source trends.'
      : unknownObservabilityQuality === 'medium'
        ? 'continue monitoring; trend signal is usable but still maturing.'
        : unknownObservabilityQuality === 'high'
          ? 'trend signal is stable enough for runtime comparison checks.'
          : null;
  const unknownSourceTrajectory =
    firstUnknownReminderActionSource && lastUnknownReminderActionSource
      ? `${firstUnknownReminderActionSource === 'startup' ? 'startup snapshot' : 'live listener'} to ${
          lastUnknownReminderActionSource === 'startup' ? 'startup snapshot' : 'live listener'
        }`
      : null;
  const unknownTrajectoryStability =
    firstUnknownReminderActionSource && lastUnknownReminderActionSource
      ? firstUnknownReminderActionSource === lastUnknownReminderActionSource
        ? 'stable'
        : 'shifted'
      : null;
  const unknownDriftStatus =
    unknownReminderActionCount >= 5 ? 'high drift' : unknownReminderActionCount >= 2 ? 'moderate drift' : 'low drift';
  const unknownSessionSummary =
    unknownReminderActionCount > 0 && unknownObservabilityQuality && unknownTrajectoryStability
      ? `quality ${unknownObservabilityQuality} · drift ${unknownDriftStatus} · trajectory ${unknownTrajectoryStability}`
      : null;

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
            {paneIndex + 1} / {PANE_TITLES.length} - {PANE_TITLES[paneIndex]}
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

        <View style={styles.paneIconRow} accessibilityRole="tablist">
          {PANE_TITLES.map((t, i) => {
            const active = i === paneIndex;
            const iconName = settingsPaneIconName(t, i);
            return (
              <Pressable
                key={t}
                testID={`settings-pane-tab-${i}`}
                onPress={() => goPane(i)}
                style={[
                  styles.paneIconBtn,
                  {
                    width: settingsPaneIconBtnSize,
                    height: settingsPaneIconBtnSize,
                    borderColor: active
                      ? theme.tokens.color.accent
                      : `${theme.tokens.color.text}33`,
                    backgroundColor: active ? `${theme.tokens.color.accent}2E` : `${theme.tokens.color.text}14`,
                  },
                ]}
                accessibilityRole="tab"
                accessibilityLabel={`${t}${active ? ', selected' : ''}`}
                accessibilityState={{ selected: active }}
              >
                <Ionicons
                  name={iconName}
                  size={Math.round(Math.min(settingsPaneIconBtnSize * 0.42, theme.font(16)))}
                  color={active ? theme.tokens.color.accent : theme.tokens.color.text}
                />
              </Pressable>
            );
          })}
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
        {/* Pane 0 — Personal & cloud sync (web pane 1) */}

        <View style={{ width }}>

          <ScrollView contentContainerStyle={styles.content} nestedScrollEnabled keyboardShouldPersistTaps="handled">

            <Section title="Personal & cloud sync">

              <Hint>Matches web Settings → first carousel pane (account + Supabase).</Hint>

              <SettingsCloudPane />

            </Section>

          </ScrollView>

        </View>



        {/* Pane 1 — AI & Goals (web pane 2) */}

        <View style={{ width }}>

          <ScrollView contentContainerStyle={styles.content} nestedScrollEnabled keyboardShouldPersistTaps="handled">

            <Section title="AI & Goals">

              <Row label="Enable AI features & Goals">

                <Switch

                  value={prefs.aiEnabled !== false}

                  onValueChange={(on) => onChangePrefs({ ...prefs, aiEnabled: on })}

                />

              </Row>

              <Hint>When on: AI Analysis tab, chart predictions, and Goals & targets are available (web parity).</Hint>

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



        {/* Pane 2 — Display (web pane 3: daily reminders) */}

        <View style={{ width }}>

          <ScrollView contentContainerStyle={styles.content} nestedScrollEnabled keyboardShouldPersistTaps="handled">

            <Section title="Display">

              <Hint>Daily reminders and notification permission (web “Display Options” pane).</Hint>

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

              <Row label="Snooze minutes (later action)">

                <InlineChoices

                  value={String(prefs.notifications.snoozeMinutes)}

                  options={['10', '15', '30', '60']}

                  onChange={(v) =>

                    reminderCapabilities.hasSnooze

                      ? onChangePrefs({

                          ...prefs,

                          notifications: { ...prefs.notifications, snoozeMinutes: Number(v) },

                        })

                      : undefined

                  }

                  tts={tts}

                />

              </Row>

              <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                Later action snoozes for {prefs.notifications.snoozeMinutes} minutes; if snooze is unavailable, app opens Home.

              </Text>

              {!reminderCapabilities.hasSnooze ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  This runtime does not support scheduled snooze reminders; later action uses Home fallback.

                </Text>

              ) : null}

              <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                Runtime support: schedule {reminderCapabilities.hasScheduling ? 'yes' : 'no'} · Android channel{' '}

                {reminderCapabilities.hasAndroidChannel ? 'yes' : 'no'} · iOS category{' '}

                {reminderCapabilities.hasIosCategory ? 'yes' : 'no'} · actions{' '}

                {reminderCapabilities.hasResponseListener ? 'yes' : 'no'} · dismiss semantics{' '}

                {reminderCapabilities.hasDismissAction ? 'yes' : 'no'}.

              </Text>

              {!reminderCapabilities.hasResponseListener ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  Action listener is unavailable on this runtime; reminder action status may update only on next app open.

                </Text>

              ) : null}

              <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                Action policy: log-now to Log today, later to snooze (or Home fallback), default/unknown to Home.

              </Text>

              <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                Notification permission: {notificationPermission}

              </Text>

              {notificationScheduleState === 'scheduled' ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  Daily reminder scheduled at {prefs.notifications.dailyReminderTime}.

                </Text>

              ) : null}

              {notificationScheduleState === 'scheduled' && notificationDeliveryState === 'scheduled-android-channel' ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  Delivery semantics: Android reminder channel configured for this schedule.

                </Text>

              ) : null}

              {notificationScheduleState === 'scheduled' && notificationDeliveryState === 'scheduled-ios-category' ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  Delivery semantics: iOS reminder actions/category configured for this schedule.

                </Text>

              ) : null}

              {notificationScheduleState === 'scheduled' && notificationDeliveryState === 'scheduled-channel-and-category' ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  Delivery semantics: Android channel and iOS reminder category semantics are both configured.

                </Text>

              ) : null}

              {notificationScheduleState === 'scheduled' && notificationDeliveryState === 'scheduled-basic' ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  Delivery semantics: runtime supports basic daily scheduling without channel controls.

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

              {lastReminderAction !== 'none' ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  Last reminder action: {reminderActionLabel(lastReminderAction)}.

                </Text>

              ) : null}

              {lastReminderAction === 'unknown' ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  Unknown reminder actions use safe Home fallback behavior.

                </Text>

              ) : null}

              {unknownReminderActionCount > 0 ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  Unknown reminder actions observed this session: {unknownReminderActionCount}.

                </Text>

              ) : null}

              {unknownSessionSummary ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  Unknown-action session summary: {unknownSessionSummary}.

                </Text>

              ) : null}

              {unknownReminderActionCount > 0 ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  Unknown action breakdown: startup {unknownStartupCount} · live {unknownLiveCount}.

                </Text>

              ) : null}

              {unknownReminderActionCount > 0 ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  Unknown action split: startup {unknownStartupPercent}% · live {unknownLivePercent}%.

                </Text>

              ) : null}

              {unknownDominantSourceConfidence ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  Unknown-action dominant source confidence: {unknownDominantSourceConfidence}.

                </Text>

              ) : null}

              {unknownReminderActionCount > 0 && unknownReminderActionCount < 3 ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  Unknown-action confidence is preliminary until at least 3 unknown events are observed this session.

                </Text>

              ) : null}

              {unknownObservabilityQuality ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  Unknown-action observability quality: {unknownObservabilityQuality}.

                </Text>

              ) : null}

              {unknownRecommendedNextCheck ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  Unknown-action recommended next check: {unknownRecommendedNextCheck}

                </Text>

              ) : null}

              {unknownSourceTrajectory ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  Unknown-action source trajectory this session: {unknownSourceTrajectory}.

                </Text>

              ) : null}

              {unknownTrajectoryStability ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  Unknown-action trajectory stability: {unknownTrajectoryStability}.

                </Text>

              ) : null}

              {unknownReminderActionCount > 0 ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  Unknown-action stability status: {unknownDriftStatus}.

                </Text>

              ) : null}

              {unknownReminderActionCount > 0 && unknownStartupCount > unknownLiveCount ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  Unknown-action trend: mostly startup snapshot responses this session.

                </Text>

              ) : null}

              {unknownReminderActionCount > 0 && unknownLiveCount > unknownStartupCount ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  Unknown-action trend: mostly live listener callbacks this session.

                </Text>

              ) : null}

              {unknownReminderActionCount > 0 && unknownLiveCount === unknownStartupCount ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  Unknown-action trend: startup and live paths are equally represented this session.

                </Text>

              ) : null}

              {lastUnknownReminderActionAt ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  Last unknown reminder action observed at: {lastUnknownReminderActionAt}.

                </Text>

              ) : null}

              {lastUnknownReminderActionSource ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  Last unknown action source: {lastUnknownReminderActionSource === 'startup' ? 'startup snapshot' : 'live listener'}.

                </Text>

              ) : null}

              {unknownReminderActionCount > 0 && !reminderCapabilities.hasDismissAction ? (

                <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                  This runtime does not expose explicit dismiss action identifiers; some dismiss/close gestures may appear as unknown.

                </Text>

              ) : null}

              {unknownReminderActionCount > 0 ? (

                <Pressable

                  style={styles.dataBtn}

                  onPress={() => {

                    setUnknownReminderActionCount(0);

                    setLastUnknownReminderActionAt(null);

                    setFirstUnknownReminderActionSource(null);

                    setLastUnknownReminderActionSource(null);

                    setUnknownStartupCount(0);

                    setUnknownLiveCount(0);

                  }}

                  accessibilityRole="button"

                  accessibilityLabel="Reset unknown reminder action counter"

                >

                  <Text style={[styles.dataBtnText, { fontSize: theme.font(15) }]}>🧹 Reset unknown action counter</Text>

                </Pressable>

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



        {/* Pane 3 — Customisation (web pane 4) */}

        <View style={{ width }}>

          <ScrollView contentContainerStyle={styles.content} nestedScrollEnabled keyboardShouldPersistTaps="handled">

            <Section title="Theme customisation">

              <Row label="Appearance mode">

                <InlineChoices

                  value={prefs.appearanceMode}

                  options={['system', 'dark', 'light']}

                  onChange={(v) => onChangePrefs({ ...prefs, appearanceMode: v as AppearanceMode })}

                  tts={tts}

                />

              </Row>

              <Hint>Pick a global theme (web parity: mint / red-black / mono / rainbow maps to team tokens on mobile).</Hint>

              <Row label="Team">

                <InlineChoices

                  value={prefs.team}

                  options={getTeamIds()}

                  onChange={(v) => onChangePrefs({ ...prefs, team: v })}

                  tts={tts}

                />

              </Row>

            </Section>

          </ScrollView>

        </View>



        {/* Pane 4 — Accessibility (web pane 5) */}

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



        {/* Pane 5 — Data options (web pane 6) */}

        <View style={{ width }}>

          <ScrollView contentContainerStyle={styles.content} nestedScrollEnabled keyboardShouldPersistTaps="handled">

            <Section title="Data options">

              <Row label="Demo mode">

                <Switch value={prefs.demoMode === true} onValueChange={(on) => void setDemoMode(on)} disabled={demoBusy} />

              </Row>

              <Hint>Loads a fresh sample dataset each app launch and pauses data portability actions (web parity).</Hint>

              <Text style={[styles.hint, { fontSize: theme.font(13) }]}>

                Auto-backup to local storage and chart compression toggles exist on the web PWA only; native uses local storage for logs

                automatically.

              </Text>

            </Section>

          </ScrollView>

        </View>



        {/* Pane 6 — Performance (web pane 7) */}

        <View style={{ width }}>

          <ScrollView contentContainerStyle={styles.content} nestedScrollEnabled keyboardShouldPersistTaps="handled">

            <Section title="Performance">

              <Hint>

                Animation / lazy-load toggles are web-only. On mobile, use the benchmark to pick an on-device AI model tier.

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

          </ScrollView>

        </View>



        {/* Pane 7 — Data management + App installation (web pane 8) */}

        <View style={{ width }}>

          <ScrollView contentContainerStyle={styles.content} nestedScrollEnabled keyboardShouldPersistTaps="handled">

            <Section title="Data management">

              <SettingsAppInstallSection />

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

              <Pressable

                style={[styles.dataBtn, styles.dangerBtn]}

                onPress={clearAllLogs}

                accessibilityRole="button"

                accessibilityLabel="Clear all health logs"

              >

                <Text style={[styles.dataBtnText, { fontSize: theme.font(15) }]}>🗑️ Clear all data</Text>

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
  paneIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    paddingVertical: 4,
    marginTop: 2,
  },
  paneIconBtn: {
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  dangerBtn: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.45)',
  },
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
