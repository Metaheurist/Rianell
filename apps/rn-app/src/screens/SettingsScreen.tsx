import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import type { AppearanceMode, LlmCoachPersona, Preferences, PreferredLlmModelSize } from '../storage/preferences';
import { useTheme } from '../theme/ThemeProvider';
import { resolveScreenBackground } from '../theme/themeHelpers';
import { useT } from '../i18n/I18nProvider';
import { speakLabel } from '../accessibility/tts';
import {
  mergeLogsAppend,
  parseLogImportCsv,
  parseLogImportJson,
  parseLogImportMigration,
  serializeLogsCsvForExport,
  serializeLogsForExport,
} from '../data/logExportImport';
import {
  buildEncryptedBackupBlob,
  createReadOnlyShareEnvelope,
  encryptExportWithPassphrase,
  logsToFhirBundle,
  putWebDavEncryptedBackup,
  shareEnvelopeToPortableJson,
} from '@rianell/shared';
import { recordProcessingActivity } from '../storage/processingActivity';
import { loadLogs, saveLogs, persistLogs } from '../storage/logs';
import { SettingsCloudPane } from '../settings/SettingsCloudPane';
import { SettingsPrivacyRegionPane } from '../settings/SettingsPrivacyRegionPane';
import { SettingsAppInstallSection } from '../settings/SettingsAppInstallSection';
import { SettingsConsentDashboard } from '../settings/SettingsConsentDashboard';
import { SettingsPrivacyTrustPane } from '../settings/SettingsPrivacyTrustPane';
import { SettingsSecurityLockPane } from '../settings/SettingsSecurityLockPane';
import { SettingsPerformanceLearnPane } from '../settings/SettingsPerformanceLearnPane';
import { AnonPoolFieldChecklist } from '../settings/AnonPoolFieldChecklist';
import { SettingsChapter } from '../components/ui/SettingsChapter';
import { computeSetupProgress } from '../utils/engagementGamification';
import { EncryptedExportModal } from '../settings/EncryptedExportModal';
import { QrHandoffModal } from '../settings/QrHandoffModal';
import { SettingsLoggingPane } from '../settings/SettingsLoggingPane';
import { exportContributionHistory } from '../cloud/sync';
import {
  buildSettingsProfileExport,
  PROFILE_AVATAR_IDS,
} from '@rianell/shared';
import { printOrShareLogs } from '../utils/printLogs';
import { clearCachedBenchmark, loadCachedBenchmark, resolveLlmModelSize, runAndCacheBenchmark, type BenchmarkResult } from '../performance/benchmark';
import { disableDemoMode, enableDemoMode } from '../demo/demoMode';
import {
  Permissions,
  type DailyReminderResult,
  type ReminderAction,
  type ReminderCapabilities,
} from '../permissions/permissions';
import { resolveEffectiveReminderSchedule, syncMedDoseReminders } from '../notifications/smartReminderSync';

/** Matches `data-settings-pane-i18n` order in `apps/pwa-webapp/index.html` settings carousel. */
const PANE_TITLE_KEYS = [
  'settings.privacy.title',
  'settings.personal.title',
  'settings.ai.title',
  'settings.display.title',
  'settings.customisation.title',
  'settings.accessibility.title',
  'settings.dataOptions.title',
  'settings.performance.title',
  'settings.dataManagement.title',
  'settings.security.title',
] as const;

/**
 * Ionicons names aligned with `SETTINGS_PANE_ICON_BY_KEY` in `apps/pwa-webapp/modules/settings.js`.
 */
const SETTINGS_PANE_ICON_BY_KEY: Record<
  string,
  React.ComponentProps<typeof Ionicons>['name']
> = {
  'settings.privacy.title': 'shield-checkmark-outline',
  'settings.personal.title': 'person-outline',
  'settings.ai.title': 'medical-outline',
  'settings.display.title': 'bar-chart-outline',
  'settings.customisation.title': 'color-palette-outline',
  'settings.accessibility.title': 'accessibility-outline',
  'settings.dataOptions.title': 'save-outline',
  'settings.performance.title': 'flash-outline',
  'settings.dataManagement.title': 'cloud-upload-outline',
  'settings.connectors.title': 'link-outline',
  'settings.security.title': 'lock-open-outline',
};

function settingsPaneIconName(
  title: string,
  idx: number,
  paneKey?: string,
  appLockEnabled?: boolean,
): React.ComponentProps<typeof Ionicons>['name'] {
  if (paneKey === 'settings.security.title') {
    return appLockEnabled ? 'lock-closed' : 'lock-open-outline';
  }
  if (paneKey && SETTINGS_PANE_ICON_BY_KEY[paneKey]) {
    return SETTINGS_PANE_ICON_BY_KEY[paneKey];
  }
  const t = title.toLowerCase();
  if (t.includes('privacy') || t.includes('region')) return 'shield-checkmark-outline';
  if (t.includes('personal') || t.includes('cloud')) return 'person-outline';
  if (t.includes('ai') || t.includes('goal')) return 'medical-outline';
  if (t.includes('display') || t.includes('reminder')) return 'bar-chart-outline';
  if (t.includes('custom') || t.includes('theme')) return 'color-palette-outline';
  if (t.includes('access')) return 'accessibility-outline';
  if (t.includes('data option')) return 'save-outline';
  if (t.includes('performance')) return 'flash-outline';
  if (t.includes('data management')) return 'cloud-upload-outline';
  if (t.includes('integration') || t.includes('connector')) return 'link-outline';
  if (t.includes('security')) return 'lock-open-outline';
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
  const { t, isRtl, locale } = useT();
  const [settingsSearch, setSettingsSearch] = useState('');
  const paneTitles = PANE_TITLE_KEYS.map((key) => t(key));
  const searchHaystack = PANE_TITLE_KEYS.map((key, i) => ({ i, text: `${t(key)} ${key}`.toLowerCase() }));
  const { width } = useWindowDimensions();
  /** Sized like web `settings-carousel-dots` (clamp ~22–32px), shared across ten pane icons. */
  const settingsPaneIconBtnSize = Math.min(36, Math.max(26, (width - 48 - 8 * 4) / 10));
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [paneIndex, setPaneIndex] = useState(0);
  const bg = resolveScreenBackground(theme);
  const tts = { enabled: prefs.accessibility.ttsEnabled, readModeEnabled: prefs.accessibility.ttsReadModeEnabled };

  const [importOpen, setImportOpen] = useState(false);
  const [importFormat, setImportFormat] = useState<'json' | 'csv' | 'migration'>('json');
  const [migrationSource, setMigrationSource] = useState<'bearable' | 'flaredown'>('bearable');
  const [importText, setImportText] = useState('');
  const [profileImportOpen, setProfileImportOpen] = useState(false);
  const [profileImportText, setProfileImportText] = useState('');
  const [exportBusy, setExportBusy] = useState(false);
  const [encryptExportOpen, setEncryptExportOpen] = useState(false);
  const [qrHandoffOpen, setQrHandoffOpen] = useState(false);
  const [shareExportOpen, setShareExportOpen] = useState(false);
  const [webDavOpen, setWebDavOpen] = useState(false);
  const [webDavUrl, setWebDavUrl] = useState('');
  const [webDavUser, setWebDavUser] = useState('');
  const [webDavPass, setWebDavPass] = useState('');
  const [webDavPassphrase, setWebDavPassphrase] = useState('');
  const [anonPoolOpen, setAnonPoolOpen] = useState(false);
  const [printBusy, setPrintBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);
  const [benchmarkBusy, setBenchmarkBusy] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<'unavailable' | 'denied' | 'granted'>('unavailable');
  const [notificationScheduleState, setNotificationScheduleState] = useState<'idle' | 'scheduled' | 'invalid-time' | 'unavailable'>('idle');
  const [notificationDeliveryState, setNotificationDeliveryState] = useState<DailyReminderResult['delivery']>('runtime-unavailable');
  const [effectiveReminderTime, setEffectiveReminderTime] = useState(prefs.notifications.dailyReminderTime);
  const [smartReminderLearned, setSmartReminderLearned] = useState(false);
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
      const schedule = await resolveEffectiveReminderSchedule(prefs);
      const result = await Permissions.scheduleDailyReminder({
        enabled: prefs.notifications.enabled,
        time: schedule.reminderTime,
        missedNudgeTime: schedule.missedNudgeTime,
        soundEnabled: prefs.notifications.soundEnabled,
      });
      if (cancelled) return;
      setSmartReminderLearned(schedule.learned);
      setEffectiveReminderTime(schedule.reminderTime);
      await syncMedDoseReminders(prefs);
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
    prefs.medSchedule,
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
    const clamped = Math.max(0, Math.min(PANE_TITLE_KEYS.length - 1, next));
    scrollRef.current?.scrollTo({ x: clamped * width, animated: true });
    setPaneIndex(clamped);
  }

  function onPaneScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const x = e.nativeEvent.contentOffset.x;
    setPaneIndex(Math.round(x / width));
  }

  async function onExportLogs() {
    if (prefs.demoMode) {
      Alert.alert(t('settings.demo.title'), t('settings.demo.exportDisabled'));
      return;
    }
    setExportBusy(true);
    try {
      const logs = await loadLogs();
      const json = serializeLogsForExport(logs);
      await Share.share({ message: json, title: t('settings.rianell.health.logs.json') });
      await recordProcessingActivity(prefs, { type: 'export', detail: 'json' }, onChangePrefs);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('settings.export.failed');
      Alert.alert(t('settings.export.title'), msg);
    } finally {
      setExportBusy(false);
    }
  }

  async function onExportLogsCsv() {
    if (prefs.demoMode) {
      Alert.alert(t('settings.demo.title'), t('settings.demo.exportDisabled'));
      return;
    }
    setExportBusy(true);
    try {
      const logs = await loadLogs();
      const csv = serializeLogsCsvForExport(logs, t);
      await Share.share({ message: csv, title: t('settings.export.logs.csv') });
      await recordProcessingActivity(prefs, { type: 'export', detail: 'csv' }, onChangePrefs);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('settings.export.failed');
      Alert.alert(t('settings.export.title'), msg);
    } finally {
      setExportBusy(false);
    }
  }

  async function onExportLogsEncrypted(passphrase: string) {
    setExportBusy(true);
    try {
      const logs = await loadLogs();
      const parsed = JSON.parse(serializeLogsForExport(logs));
      const envelope = await encryptExportWithPassphrase({ logs: parsed }, passphrase);
      const json = JSON.stringify(envelope, null, 2);
      await Share.share({ message: json, title: t('settings.export.encrypted.fileTitle') });
      await recordProcessingActivity(prefs, { type: 'encrypted_export' }, onChangePrefs);
      setEncryptExportOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('settings.export.failed');
      Alert.alert(t('settings.export.title'), msg);
    } finally {
      setExportBusy(false);
    }
  }

  async function onPrintLogs() {
    if (prefs.demoMode) {
      Alert.alert(t('settings.demo.title'), t('settings.demo.printDisabled'));
      return;
    }
    setPrintBusy(true);
    try {
      const logs = await loadLogs();
      await printOrShareLogs(logs, locale);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('settings.print.failed');
      Alert.alert(t('settings.print.title'), msg);
    } finally {
      setPrintBusy(false);
    }
  }

  async function onExportLogsFhir() {
    if (prefs.demoMode) {
      Alert.alert(t('settings.demo.title'), t('settings.demo.exportDisabled'));
      return;
    }
    setExportBusy(true);
    try {
      const logs = await loadLogs();
      const bundle = logsToFhirBundle(logs);
      await Share.share({ message: JSON.stringify(bundle, null, 2), title: t('settings.data.export.fhir') });
      await recordProcessingActivity(prefs, { type: 'export', detail: 'fhir' }, onChangePrefs);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('settings.export.failed');
      Alert.alert(t('settings.export.title'), msg);
    } finally {
      setExportBusy(false);
    }
  }

  async function onExportShareLink(passphrase: string) {
    setExportBusy(true);
    try {
      const logs = await loadLogs();
      const envelope = await createReadOnlyShareEnvelope(logs, passphrase);
      const json = shareEnvelopeToPortableJson(envelope);
      await Share.share({ message: json, title: t('settings.data.export.shareLink') });
      await recordProcessingActivity(prefs, { type: 'export', detail: 'share_link' }, onChangePrefs);
      setShareExportOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('settings.export.failed');
      Alert.alert(t('settings.export.title'), msg);
    } finally {
      setExportBusy(false);
    }
  }

  async function onWebDavBackup() {
    if (!webDavUrl.trim() || webDavPassphrase.length < 8) return;
    setExportBusy(true);
    try {
      const logs = await loadLogs();
      const body = await buildEncryptedBackupBlob(logs, webDavPassphrase);
      await putWebDavEncryptedBackup({
        url: webDavUrl.trim(),
        username: webDavUser,
        password: webDavPass,
        body,
        filename: `rianell-backup-${new Date().toISOString().slice(0, 10)}.json`,
      });
      await recordProcessingActivity(prefs, { type: 'export', detail: 'webdav' }, onChangePrefs);
      setWebDavOpen(false);
      setWebDavUrl('');
      setWebDavUser('');
      setWebDavPass('');
      setWebDavPassphrase('');
      Alert.alert(t('settings.export.title'), t('settings.import.saved'));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('settings.export.failed');
      Alert.alert(t('settings.export.title'), msg);
    } finally {
      setExportBusy(false);
    }
  }

  async function applyImport(mode: 'replace' | 'append', format: 'json' | 'csv' | 'migration' = 'json') {
    if (prefs.demoMode) {
      Alert.alert(t('settings.demo.title'), t('settings.demo.importDisabled'));
      return;
    }
    try {
      const incoming =
        format === 'migration'
          ? parseLogImportMigration(importText, migrationSource)
          : format === 'csv'
            ? parseLogImportCsv(importText, t)
            : parseLogImportJson(importText);
      if (mode === 'replace') {
        await persistLogs(incoming, { backup: prefs.backup, compress: prefs.compress });
      } else {
        const existing = await loadLogs();
        await persistLogs(mergeLogsAppend(existing, incoming), { backup: prefs.backup, compress: prefs.compress });
      }
      setImportOpen(false);
      setImportText('');
      Alert.alert(t('settings.import.title'), t('settings.import.saved'));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('settings.import.failed');
      Alert.alert(t('settings.import.title'), msg);
    }
  }

  function clearAllLogs() {
    if (prefs.demoMode) {
      Alert.alert(t('settings.demo.title'), t('settings.demo.clearDisabled'));
      return;
    }
    Alert.alert(
      t('settings.data.clearAll.title'),
      t('settings.data.clearAll.confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.data.clearAll.action'),
          style: 'destructive',
          onPress: async () => {
            try {
              await saveLogs([]);
              Alert.alert(t('common.success'), t('settings.data.clearAll.cleared'));
            } catch (e) {
              Alert.alert(t('common.error'), e instanceof Error ? e.message : t('settings.data.clearAll.failed'));
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
        t('settings.benchmark.title'),
        t('settings.benchmark.result', {
          tier: String(next.tier),
          deviceClass: next.deviceClass,
          model: next.llmModelSize,
          score: next.scoreMs.toFixed(1),
        })
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('settings.benchmark.failed');
      Alert.alert(t('settings.benchmark.title'), msg);
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
        Alert.alert(t('settings.demo.title'), t('settings.demo.enabled'));
      } else {
        await disableDemoMode();
        onChangePrefs({ ...prefs, demoMode: false });
        Alert.alert(t('settings.demo.title'), t('settings.demo.disabled'));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('settings.demo.updateFailed');
      Alert.alert(t('settings.demo.title'), msg);
    } finally {
      setDemoBusy(false);
    }
  }

  async function requestNotificationPermission() {
    try {
      const status = await Permissions.request('notifications');
      setNotificationPermission(status);
      if (status === 'granted') {
        Alert.alert(t('settings.notifications.title'), t('settings.notifications.granted'));
      } else if (status === 'denied') {
        Alert.alert(t('settings.notifications.title'), t('settings.notifications.denied'));
      } else {
        Alert.alert(t('settings.notifications.title'), t('settings.notifications.unavailable'));
      }
    } catch {
      Alert.alert(t('settings.notifications.title'), t('settings.notifications.requestFailed'));
    }
  }

  function updateGoalValue(key: keyof Preferences['goals'], raw: string) {
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    let clamped = n;
    if (key === 'steps') clamped = Math.min(100000, Math.max(0, Math.trunc(n)));
    else if (key === 'hydration') clamped = Math.min(30, Math.max(0, n));
    else if (key === 'goodDaysPerWeek') clamped = Math.min(7, Math.max(0, Math.trunc(n)));
    else clamped = Math.min(10, Math.max(0, n));
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

  const setupProgress = useMemo(() => computeSetupProgress(prefs), [prefs]);
  const [expandedHint, setExpandedHint] = useState<string | null>(null);

  const renderPaneButton = (i: number) => {
    const paneTitle = paneTitles[i];
    const active = i === paneIndex;
    const iconName = settingsPaneIconName(paneTitle, i, PANE_TITLE_KEYS[i], prefs.appLockEnabled);
    return (
      <Pressable
        key={PANE_TITLE_KEYS[i]}
        testID={`settings-pane-tab-${i}`}
        onPress={() => goPane(i)}
        style={[
          styles.paneIconBtn,
          {
            width: settingsPaneIconBtnSize,
            height: settingsPaneIconBtnSize,
            borderColor: active ? theme.tokens.color.accent : `${theme.tokens.color.text}33`,
            backgroundColor: active ? `${theme.tokens.color.accent}2E` : `${theme.tokens.color.text}14`,
          },
        ]}
        accessibilityRole="tab"
        accessibilityLabel={`${paneTitle}${active ? ', selected' : ''}`}
        accessibilityState={{ selected: active }}
      >
        <Ionicons
          name={iconName}
          size={Math.round(Math.min(settingsPaneIconBtnSize * 0.42, theme.font(16)))}
          color={active ? theme.tokens.color.accent : theme.tokens.color.text}
        />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      {setupProgress.done < setupProgress.total ? (
        <View style={[styles.setupStrip, { borderColor: `${theme.tokens.color.accent}44` }]}>
          <Text style={{ color: theme.tokens.color.text, fontSize: theme.font(13) }}>
            {t('settings.setup.progress', {
              done: String(setupProgress.done),
              total: String(setupProgress.total),
            })}
          </Text>
          <View style={[styles.setupTrack, { backgroundColor: `${theme.tokens.color.accent}22` }]}>
            <View
              style={{
                height: 4,
                borderRadius: 2,
                width: `${(setupProgress.done / setupProgress.total) * 100}%`,
                backgroundColor: theme.tokens.color.accent,
              }}
            />
          </View>
        </View>
      ) : null}
      <View style={styles.carouselChrome}>
        <View style={[styles.carouselNav, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
          <Pressable
            onPress={() => goPane(paneIndex - 1)}
            disabled={paneIndex <= 0}
            accessibilityRole="button"
            accessibilityLabel="Previous settings section"
            style={styles.carouselSide}
          >
            <Ionicons name={isRtl ? 'chevron-forward' : 'chevron-back'} size={22} color={theme.tokens.color.text} />
          </Pressable>
          <Text
            style={[styles.carouselMeta, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}
            accessibilityRole="text"
            accessibilityLiveRegion="polite"
          >
            {paneIndex + 1} / {PANE_TITLE_KEYS.length} - {paneTitles[paneIndex]}
          </Text>
          <Pressable
            onPress={() => goPane(paneIndex + 1)}
            disabled={paneIndex >= PANE_TITLE_KEYS.length - 1}
            accessibilityRole="button"
            accessibilityLabel="Next settings section"
            style={styles.carouselSide}
          >
            <Ionicons name={isRtl ? 'chevron-back' : 'chevron-forward'} size={22} color={theme.tokens.color.text} />
          </Pressable>
        </View>

        <SettingsChapter title={t('settings.chapter.gettingStarted')} iconName="rocket-outline" defaultOpen>
          <View style={styles.paneIconRow} accessibilityRole="tablist">
            {[0, 1, 3].map((i) => renderPaneButton(i))}
          </View>
        </SettingsChapter>
        <SettingsChapter title={t('settings.chapter.customise')} iconName="color-palette-outline">
          <View style={styles.paneIconRow} accessibilityRole="tablist">
            {[4, 5].map((i) => renderPaneButton(i))}
          </View>
        </SettingsChapter>
        <SettingsChapter title={t('settings.chapter.advanced')} iconName="construct-outline">
          <View style={styles.paneIconRow} accessibilityRole="tablist">
            {[2, 6, 7, 8, 9].map((i) => renderPaneButton(i))}
          </View>
        </SettingsChapter>
        <TextInput
          value={settingsSearch}
          onChangeText={(q) => {
            setSettingsSearch(q);
            const needle = q.trim().toLowerCase();
            if (!needle) return;
            const hit = searchHaystack.find((row) => row.text.includes(needle));
            if (hit) goPane(hit.i);
          }}
          placeholder={t('settings.search.placeholder')}
          placeholderTextColor={`${theme.tokens.color.text}66`}
          accessibilityLabel={t('settings.search.placeholder')}
          style={[
            styles.searchInput,
            {
              color: theme.tokens.color.text,
              borderColor: `${theme.tokens.color.text}33`,
              backgroundColor: `${theme.tokens.color.text}0D`,
            },
          ]}
        />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.carouselBody}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onPaneScrollEnd}
        keyboardShouldPersistTaps="handled"
      >
        {/* Pane 0 — Privacy & region (web pane 1) */}
        <View style={[styles.paneOuter, { width }]}>
          <ScrollView style={styles.paneScroll} contentContainerStyle={styles.content} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            <Section title={t('settings.privacy.title')}>
              <SettingsPrivacyRegionPane prefs={prefs} onChangePrefs={onChangePrefs} />
              <SettingsPrivacyTrustPane
                prefs={prefs}
                onChangePrefs={onChangePrefs}
                onRequestAnonPoolEnable={() => setAnonPoolOpen(true)}
              />
            </Section>
          </ScrollView>
        </View>

        {/* Pane 1 — Personal & cloud sync (web pane 2) */}

        <View style={[styles.paneOuter, { width }]}>

          <ScrollView style={styles.paneScroll} contentContainerStyle={[styles.content, styles.contentPersonal]} nestedScrollEnabled keyboardShouldPersistTaps="handled">

            <View style={styles.personalPaneLayout}>

            <Section title={t('settings.personal.title')}>

              <Hint>Matches web Settings → first carousel pane (account + Supabase).</Hint>

              <Row label={t('settings.personal.nameLabel')}>
                <TextInput
                  value={prefs.userName}
                  onChangeText={(userName) => onChangePrefs({ ...prefs, userName })}
                  accessibilityLabel={t('settings.personal.nameLabel')}
                  placeholder={t('settings.personal.namePlaceholder')}
                  placeholderTextColor={`${theme.tokens.color.text}88`}
                  style={[styles.timeInput, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                />
              </Row>

              <Row label={t('settings.profile.avatarLabel')}>
                <View style={styles.avatarRow}>
                  {PROFILE_AVATAR_IDS.map((id) => {
                    const iconName =
                      id === 'sun' ? 'sunny-outline' : id === 'pulse' ? 'fitness-outline' : `${id}-outline`;
                    return (
                    <Pressable
                      key={id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: prefs.profileAvatar === id }}
                      onPress={() => onChangePrefs({ ...prefs, profileAvatar: id })}
                      style={[
                        styles.avatarChip,
                        {
                          borderColor: prefs.profileAvatar === id ? theme.tokens.color.accent : `${theme.tokens.color.text}33`,
                        },
                      ]}
                    >
                      <Ionicons name={iconName as 'leaf-outline'} size={18} color={theme.tokens.color.text} />
                    </Pressable>
                    );
                  })}
                </View>
              </Row>

              <Row label={t('settings.personal.conditionLabel')}>
                <TextInput
                  value={prefs.medicalCondition}
                  onChangeText={(medicalCondition) => onChangePrefs({ ...prefs, medicalCondition })}
                  accessibilityLabel={t('settings.personal.conditionLabel')}
                  placeholder={t('settings.personal.namePlaceholder')}
                  placeholderTextColor={`${theme.tokens.color.text}88`}
                  style={[styles.timeInput, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                />
              </Row>

              <Row label="Weight unit">
                <InlineChoices
                  value={prefs.weightUnit}
                  options={['kg', 'lb']}
                  onChange={(weightUnit) => onChangePrefs({ ...prefs, weightUnit: weightUnit as 'kg' | 'lb' })}
                  tts={tts}
                />
              </Row>

              <RowWithInlineHint
                label="Contribute anonymized data"
                hintId="anon"
                hintText={t('settings.anon.inlineHint')}
                expandedHint={expandedHint}
                setExpandedHint={setExpandedHint}
              >
                <Switch
                  value={prefs.contributeAnonData === true}
                  onValueChange={(next) => {
                    if (next && !prefs.contributeAnonData) {
                      setAnonPoolOpen(true);
                      return;
                    }
                    onChangePrefs({ ...prefs, contributeAnonData: next });
                  }}
                />
              </RowWithInlineHint>

              <Row label="Use open health datasets">
                <Switch
                  value={prefs.useOpenData === true}
                  onValueChange={(useOpenData) => onChangePrefs({ ...prefs, useOpenData })}
                />
              </Row>

            </Section>

            <View
              style={[
                styles.personalCloudAnchor,
                { borderTopColor: `${theme.tokens.color.accent}47` },
              ]}
            >
              <Text
                style={[
                  styles.personalCloudTitle,
                  { fontSize: theme.font(18), color: theme.tokens.color.accent },
                ]}
              >
                {t('settings.privacy.activity.cloudSync')}
              </Text>
              <SettingsCloudPane />
            </View>

            </View>

          </ScrollView>

        </View>



        {/* Pane 1 — AI & Goals (web pane 2) */}

        <View style={[styles.paneOuter, { width }]}>

          <ScrollView style={styles.paneScroll} contentContainerStyle={styles.content} nestedScrollEnabled keyboardShouldPersistTaps="handled">

            <Section title={t('settings.ai.title')}>

              <RowWithInlineHint
                label={t('settings.ai.enableFeatures')}
                hintId="ai"
                hintText={t('settings.ai.inlineHint')}
                expandedHint={expandedHint}
                setExpandedHint={setExpandedHint}
              >

                <Switch

                  value={prefs.aiEnabled !== false}

                  onValueChange={(on) => onChangePrefs({ ...prefs, aiEnabled: on })}

                />

              </RowWithInlineHint>

              <Hint>When on: AI Analysis tab, chart predictions, and Goals & targets are available (web parity).</Hint>

              <Hint>{t('onboarding.questionnaire.settingsHint')}</Hint>

            </Section>

            <Section title={t('common.goals.targets')}>

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

              <Row label="Steps target">
                <TextInput
                  value={String(prefs.goals.steps)}
                  onChangeText={(value) => updateGoalValue('steps', value)}
                  accessibilityLabel="Steps target"
                  keyboardType="number-pad"
                  style={[styles.timeInput, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                />
              </Row>

              <Row label="Hydration target (glasses)">
                <TextInput
                  value={String(prefs.goals.hydration)}
                  onChangeText={(value) => updateGoalValue('hydration', value)}
                  accessibilityLabel="Hydration target"
                  keyboardType="decimal-pad"
                  style={[styles.timeInput, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                />
              </Row>

              <Row label="Sleep score target (0-10)">
                <TextInput
                  value={String(prefs.goals.sleepScore)}
                  onChangeText={(value) => updateGoalValue('sleepScore', value)}
                  accessibilityLabel="Sleep score target"
                  keyboardType="decimal-pad"
                  style={[styles.timeInput, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                />
              </Row>

              <Row label="Good days per week">
                <TextInput
                  value={String(prefs.goals.goodDaysPerWeek)}
                  onChangeText={(value) => updateGoalValue('goodDaysPerWeek', value)}
                  accessibilityLabel="Good days per week target"
                  keyboardType="number-pad"
                  style={[styles.timeInput, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                />
              </Row>

            </Section>

            <Pressable
              style={[styles.dataBtn, styles.aiGoalsFooterBtn, { borderColor: `${theme.tokens.color.accent}44` }]}
              accessibilityRole="button"
              accessibilityLabel={t('research.pool.export.action')}
              onPress={() => {
                void (async () => {
                  const result = await exportContributionHistory();
                  if (!result.ok || !result.json) {
                    Alert.alert(t('research.pool.export.action'), result.message);
                    return;
                  }
                  await Share.share({ message: result.json, title: t('research.pool.export.shareTitle') });
                })();
              }}
            >
              <Text style={[styles.dataBtnText, { fontSize: theme.font(15), color: theme.tokens.color.text, fontWeight: '600' }]}>
                {t('research.pool.export.action')}
              </Text>
            </Pressable>

          </ScrollView>

        </View>



        {/* Pane 2 — Display (web pane 3: daily reminders) */}

        <View style={[styles.paneOuter, { width }]}>

          <ScrollView style={styles.paneScroll} contentContainerStyle={styles.content} nestedScrollEnabled keyboardShouldPersistTaps="handled">

            <Section title={t('settings.display.title')}>

              <Hint>Daily reminders and notification permission (web “Display Options” pane).</Hint>

              <Pressable
                style={styles.dataBtn}
                accessibilityRole="button"
                onPress={() => onChangePrefs({ ...prefs, tutorialSeen: false, replayTutorial: true })}
              >
                <Text style={[styles.dataBtnText, { fontSize: theme.font(15), color: theme.tokens.color.text }]}>
                  {t('settings.tutorial.showAgain')}
                </Text>
              </Pressable>

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

                  placeholderTextColor={theme.mode === 'light' ? 'rgba(0,0,0,0.38)' : 'rgba(255,255,255,0.45)'}

                />

              </Row>

              <Row label="Re-engagement reminders">

                <Switch

                  value={prefs.notifications.reEngagementNudgesEnabled}

                  onValueChange={(on) =>

                    onChangePrefs({

                      ...prefs,

                      notifications: { ...prefs.notifications, reEngagementNudgesEnabled: on },

                    })

                  }

                />

              </Row>

              <Hint>Gentle reminder after 7 days without opening the app. At most one per idle period.</Hint>

              <Row label="Streak reminders">

                <Switch

                  value={prefs.notifications.streakReminderNudgesEnabled}

                  onValueChange={(on) =>

                    onChangePrefs({

                      ...prefs,

                      notifications: { ...prefs.notifications, streakReminderNudgesEnabled: on },

                    })

                  }

                />

              </Row>

              <Hint>Optional when you have calm days in a row (pairs with Home streak card). No achievements.</Hint>

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

              <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                Later action snoozes for {prefs.notifications.snoozeMinutes} minutes; if snooze is unavailable, app opens Home.

              </Text>

              {!reminderCapabilities.hasSnooze ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  This runtime does not support scheduled snooze reminders; later action uses Home fallback.

                </Text>

              ) : null}

              <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                Runtime support: schedule {reminderCapabilities.hasScheduling ? 'yes' : 'no'} · Android channel{' '}

                {reminderCapabilities.hasAndroidChannel ? 'yes' : 'no'} · iOS category{' '}

                {reminderCapabilities.hasIosCategory ? 'yes' : 'no'} · actions{' '}

                {reminderCapabilities.hasResponseListener ? 'yes' : 'no'} · dismiss semantics{' '}

                {reminderCapabilities.hasDismissAction ? 'yes' : 'no'}.

              </Text>

              {!reminderCapabilities.hasResponseListener ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  Action listener is unavailable on this runtime; reminder action status may update only on next app open.

                </Text>

              ) : null}

              <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                Action policy: log-now to Log today, later to snooze (or Home fallback), default/unknown to Home.

              </Text>

              <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                Notification permission: {notificationPermission}

              </Text>

              {notificationScheduleState === 'scheduled' ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  {smartReminderLearned
                    ? t('settings.notifications.scheduledLearned', { time: effectiveReminderTime })
                    : t('settings.notifications.scheduledFixed', { time: effectiveReminderTime })}

                </Text>

              ) : null}

              {notificationScheduleState === 'scheduled' && notificationDeliveryState === 'scheduled-android-channel' ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  Delivery semantics: Android reminder channel configured for this schedule.

                </Text>

              ) : null}

              {notificationScheduleState === 'scheduled' && notificationDeliveryState === 'scheduled-ios-category' ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  Delivery semantics: iOS reminder actions/category configured for this schedule.

                </Text>

              ) : null}

              {notificationScheduleState === 'scheduled' && notificationDeliveryState === 'scheduled-channel-and-category' ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  Delivery semantics: Android channel and iOS reminder category semantics are both configured.

                </Text>

              ) : null}

              {notificationScheduleState === 'scheduled' && notificationDeliveryState === 'scheduled-basic' ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  Delivery semantics: runtime supports basic daily scheduling without channel controls.

                </Text>

              ) : null}

              {notificationScheduleState === 'invalid-time' ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  Reminder time must be HH:MM to schedule notifications.

                </Text>

              ) : null}

              {notificationScheduleState === 'unavailable' ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  Notification scheduling is unavailable on this runtime.

                </Text>

              ) : null}

              {lastReminderAction !== 'none' ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  Last reminder action: {reminderActionLabel(lastReminderAction)}.

                </Text>

              ) : null}

              {lastReminderAction === 'unknown' ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  Unknown reminder actions use safe Home fallback behavior.

                </Text>

              ) : null}

              {unknownReminderActionCount > 0 ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  Unknown reminder actions observed this session: {unknownReminderActionCount}.

                </Text>

              ) : null}

              {unknownSessionSummary ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  Unknown-action session summary: {unknownSessionSummary}.

                </Text>

              ) : null}

              {unknownReminderActionCount > 0 ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  Unknown action breakdown: startup {unknownStartupCount} · live {unknownLiveCount}.

                </Text>

              ) : null}

              {unknownReminderActionCount > 0 ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  Unknown action split: startup {unknownStartupPercent}% · live {unknownLivePercent}%.

                </Text>

              ) : null}

              {unknownDominantSourceConfidence ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  Unknown-action dominant source confidence: {unknownDominantSourceConfidence}.

                </Text>

              ) : null}

              {unknownReminderActionCount > 0 && unknownReminderActionCount < 3 ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  Unknown-action confidence is preliminary until at least 3 unknown events are observed this session.

                </Text>

              ) : null}

              {unknownObservabilityQuality ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  Unknown-action observability quality: {unknownObservabilityQuality}.

                </Text>

              ) : null}

              {unknownRecommendedNextCheck ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  Unknown-action recommended next check: {unknownRecommendedNextCheck}

                </Text>

              ) : null}

              {unknownSourceTrajectory ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  Unknown-action source trajectory this session: {unknownSourceTrajectory}.

                </Text>

              ) : null}

              {unknownTrajectoryStability ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  Unknown-action trajectory stability: {unknownTrajectoryStability}.

                </Text>

              ) : null}

              {unknownReminderActionCount > 0 ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  Unknown-action stability status: {unknownDriftStatus}.

                </Text>

              ) : null}

              {unknownReminderActionCount > 0 && unknownStartupCount > unknownLiveCount ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  Unknown-action trend: mostly startup snapshot responses this session.

                </Text>

              ) : null}

              {unknownReminderActionCount > 0 && unknownLiveCount > unknownStartupCount ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  Unknown-action trend: mostly live listener callbacks this session.

                </Text>

              ) : null}

              {unknownReminderActionCount > 0 && unknownLiveCount === unknownStartupCount ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  Unknown-action trend: startup and live paths are equally represented this session.

                </Text>

              ) : null}

              {lastUnknownReminderActionAt ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  Last unknown reminder action observed at: {lastUnknownReminderActionAt}.

                </Text>

              ) : null}

              {lastUnknownReminderActionSource ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

                  Last unknown action source: {lastUnknownReminderActionSource === 'startup' ? 'startup snapshot' : 'live listener'}.

                </Text>

              ) : null}

              {unknownReminderActionCount > 0 && !reminderCapabilities.hasDismissAction ? (

                <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

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

                  <Text style={[styles.dataBtnText, { fontSize: theme.font(15), color: theme.tokens.color.text }]}>🧹 Reset unknown action counter</Text>

                </Pressable>

              ) : null}

              <Pressable

                style={styles.dataBtn}

                onPress={() => void requestNotificationPermission()}

                accessibilityRole="button"

                accessibilityLabel="Request notification permission"

              >

                <Text style={[styles.dataBtnText, { fontSize: theme.font(15), color: theme.tokens.color.text }]}>🔔 Request notification permission</Text>

              </Pressable>

            </Section>

          </ScrollView>

        </View>



        {/* Pane 3 — Customisation (web pane 4) */}

        <View style={[styles.paneOuter, { width }]}>

          <ScrollView style={styles.paneScroll} contentContainerStyle={styles.content} nestedScrollEnabled keyboardShouldPersistTaps="handled">

            <Section title={t('settings.customisation.themeTitle')}>

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

        <View style={[styles.paneOuter, { width }]}>

          <ScrollView style={styles.paneScroll} contentContainerStyle={styles.content} nestedScrollEnabled keyboardShouldPersistTaps="handled">

            <Section title={t('settings.accessibility.title')}>

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



              <Row label={t('common.colorblind.mode')}>

                <InlineChoices

                  value={prefs.accessibility.colorblindMode}

                  options={['none', 'deuteranopia', 'protanopia', 'tritanopia', 'high-contrast']}

                  getLabel={(v) => {
                    if (v === 'none') return t('common.none');
                    if (v === 'deuteranopia') return t('common.colorblind.deuteranopia');
                    if (v === 'protanopia') return t('common.colorblind.protanopia');
                    if (v === 'tritanopia') return t('common.colorblind.tritanopia');
                    if (v === 'high-contrast') return t('common.colorblind.highContrast');
                    return v;
                  }}

                  onChange={(v) =>

                    onChangePrefs({

                      ...prefs,

                      accessibility: { ...prefs.accessibility, colorblindMode: v },

                    })

                  }

                  tts={tts}

                />

              </Row>

              <Row label={t('settings.accessibility.plainLanguage')}>

                <Switch

                  value={prefs.accessibility.plainLanguageEnabled}

                  onValueChange={(on) =>

                    onChangePrefs({

                      ...prefs,

                      accessibility: { ...prefs.accessibility, plainLanguageEnabled: on },

                    })

                  }

                />

              </Row>

              <Hint>{t('settings.accessibility.plainLanguageHint')}</Hint>

              <Row label={t('settings.accessibility.chartPalette')}>

                <InlineChoices

                  value={prefs.accessibility.chartPaletteMode}

                  options={['standard', 'high-contrast']}

                  getLabel={(v) =>

                    v === 'high-contrast'

                      ? t('settings.accessibility.chartPaletteHighContrast')

                      : t('settings.accessibility.chartPaletteStandard')

                  }

                  onChange={(v) =>

                    onChangePrefs({

                      ...prefs,

                      accessibility: { ...prefs.accessibility, chartPaletteMode: v },

                    })

                  }

                  tts={tts}

                />

              </Row>

              <Hint>{t('settings.accessibility.chartPaletteHint')}</Hint>

            </Section>

          </ScrollView>

        </View>



        {/* Pane 5 — Data options (web pane 6) */}

        <View style={[styles.paneOuter, { width }]}>

          <ScrollView style={styles.paneScroll} contentContainerStyle={styles.content} nestedScrollEnabled keyboardShouldPersistTaps="handled">

            <Section title={t('settings.dataOptions.title')}>

              <Row label={t('settings.simpleMode.label')}>
                <Switch
                  value={prefs.simpleMode === true}
                  onValueChange={(simpleMode) => onChangePrefs({ ...prefs, simpleMode })}
                />
              </Row>
              <Hint>{t('settings.simpleMode.hint')}</Hint>

              <Row label="Demo mode">

                <Switch value={prefs.demoMode === true} onValueChange={(on) => void setDemoMode(on)} disabled={demoBusy} />

              </Row>

              <Hint>Loads a fresh sample dataset each app launch and pauses data portability actions (web parity).</Hint>

              <Row label="Auto-backup logs locally">
                <Switch
                  value={prefs.backup !== false}
                  onValueChange={(backup) => onChangePrefs({ ...prefs, backup })}
                />
              </Row>

              <Row label="Compress stored logs">
                <Switch
                  value={prefs.compress === true}
                  onValueChange={(compress) => onChangePrefs({ ...prefs, compress })}
                />
              </Row>

              <Hint>Backup runs before saves when enabled; compression is best-effort on native storage.</Hint>

              <SettingsLoggingPane prefs={prefs} onChangePrefs={onChangePrefs} />

            </Section>

          </ScrollView>

        </View>



        {/* Pane 6 — Performance (web pane 7) */}

        <View style={[styles.paneOuter, { width }]}>

          <ScrollView style={styles.paneScroll} contentContainerStyle={styles.content} nestedScrollEnabled keyboardShouldPersistTaps="handled">

            <Section title={t('settings.performance.title')}>

              <Row label="UI animations">
                <Switch
                  value={prefs.animations !== false}
                  onValueChange={(animations) => onChangePrefs({ ...prefs, animations })}
                />
              </Row>

              <Row label="Lazy-load charts">
                <Switch
                  value={prefs.lazy !== false}
                  onValueChange={(lazy) => onChangePrefs({ ...prefs, lazy, lazyCharts: lazy })}
                />
              </Row>

              <Hint>Use the benchmark below to pick an on-device AI model tier.</Hint>

              {!prefs.simpleMode ? (
              <>
              <RowWithInlineHint
                label="On-device AI model"
                hintId="performance"
                hintText={t('settings.performance.modelHint')}
                expandedHint={expandedHint}
                setExpandedHint={setExpandedHint}
              >

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

              </RowWithInlineHint>

              <Row label={t('settings.performance.llmCoachPersona')}>

                <InlineChoices

                  value={prefs.performance.llmCoachPersona}

                  options={['encouraging', 'clinical', 'minimal']}

                  getLabel={(v) =>
                    v === 'clinical'
                      ? t('settings.performance.llmCoachPersona.clinical')
                      : v === 'minimal'
                        ? t('settings.performance.llmCoachPersona.minimal')
                        : t('settings.performance.llmCoachPersona.encouraging')
                  }

                  onChange={(v) =>

                    onChangePrefs({

                      ...prefs,

                      performance: {

                        ...prefs.performance,

                        llmCoachPersona: v as LlmCoachPersona,

                      },

                    })

                  }

                  tts={tts}

                />

              </Row>

              <Hint>{t('onboarding.questionnaire.settingsHint')}</Hint>

              <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>

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

                    <ActivityIndicator color={theme.tokens.color.text} />

                  ) : (

                    <Text style={[styles.dataBtnText, { fontSize: theme.font(15), color: theme.tokens.color.text }]}>⚡ Run benchmark</Text>

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

                  <Text style={[styles.dataBtnText, { fontSize: theme.font(15), color: theme.tokens.color.text }]}>🧹 Clear benchmark cache</Text>

                </Pressable>

              </View>
              </>
              ) : (
                <Hint>{t('settings.simpleMode.hint')}</Hint>
              )}

              <SettingsPerformanceLearnPane />

            </Section>

          </ScrollView>

        </View>



        {/* Pane 7 — Data management + App installation (web pane 8) */}

        <View style={[styles.paneOuter, { width }]}>

          <ScrollView style={styles.paneScroll} contentContainerStyle={styles.content} nestedScrollEnabled keyboardShouldPersistTaps="handled">

            <Section title={t('settings.dataManagement.title')}>

              <SettingsAppInstallSection />

              <Pressable
                style={styles.dataBtn}
                accessibilityRole="button"
                onPress={async () => {
                  const payload = buildSettingsProfileExport(prefs, prefs.goals);
                  await Share.share({ message: JSON.stringify(payload, null, 2) });
                }}
              >
                <Text style={[styles.dataBtnText, { fontSize: theme.font(15), color: theme.tokens.color.text }]}>
                  {t('settings.profile.export')}
                </Text>
              </Pressable>

              <Hint>Export JSON matches web portability; import accepts the same array format (replace or merge by date).</Hint>

              <Pressable

                style={[styles.dataBtn, { opacity: exportBusy ? 0.6 : 1 }]}

                onPress={() => void onExportLogs()}

                disabled={exportBusy}

                accessibilityRole="button"

                accessibilityLabel="Export logs as JSON"

              >

                {exportBusy ? (

                  <ActivityIndicator color={theme.tokens.color.text} />

                ) : (

                  <View style={styles.dataBtnRow}>
                    <Ionicons name="share-outline" size={20} color={theme.tokens.color.accent} />
                    <Text style={[styles.dataBtnText, { fontSize: theme.font(15), color: theme.tokens.color.text }]}>{t('settings.export.logs.json')}</Text>
                  </View>

                )}

              </Pressable>

              <Pressable
                style={[styles.dataBtn, { opacity: exportBusy ? 0.6 : 1 }]}
                onPress={() => void onExportLogsCsv()}
                disabled={exportBusy}
                accessibilityRole="button"
              >
                <Text style={[styles.dataBtnText, { fontSize: theme.font(15), color: theme.tokens.color.text }]}>
                  {t('settings.export.logs.csv')}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.dataBtn, { opacity: exportBusy ? 0.6 : 1 }]}
                onPress={() => setEncryptExportOpen(true)}
                disabled={exportBusy}
                accessibilityRole="button"
              >
                <Text style={[styles.dataBtnText, { fontSize: theme.font(15), color: theme.tokens.color.text }]}>
                  {t('settings.export.encrypted.action')}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.dataBtn, { opacity: exportBusy ? 0.6 : 1 }]}
                onPress={() => setQrHandoffOpen(true)}
                disabled={exportBusy}
                accessibilityRole="button"
              >
                <Text style={[styles.dataBtnText, { fontSize: theme.font(15), color: theme.tokens.color.text }]}>
                  {t('settings.export.qrHandoff.action')}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.dataBtn, { opacity: exportBusy ? 0.6 : 1 }]}
                onPress={() => void onExportLogsFhir()}
                disabled={exportBusy}
                accessibilityRole="button"
              >
                <Text style={[styles.dataBtnText, { fontSize: theme.font(15), color: theme.tokens.color.text }]}>
                  {t('settings.data.export.fhir')}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.dataBtn, { opacity: exportBusy ? 0.6 : 1 }]}
                onPress={() => setShareExportOpen(true)}
                disabled={exportBusy}
                accessibilityRole="button"
              >
                <Text style={[styles.dataBtnText, { fontSize: theme.font(15), color: theme.tokens.color.text }]}>
                  {t('settings.data.export.shareLink')}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.dataBtn, { opacity: exportBusy ? 0.6 : 1 }]}
                onPress={() => setWebDavOpen(true)}
                disabled={exportBusy}
                accessibilityRole="button"
              >
                <Text style={[styles.dataBtnText, { fontSize: theme.font(15), color: theme.tokens.color.text }]}>
                  {t('settings.data.export.webdav')}
                </Text>
              </Pressable>

              <Pressable

                style={[styles.dataBtn, { opacity: printBusy ? 0.6 : 1 }]}

                onPress={() => void onPrintLogs()}

                disabled={printBusy}

                accessibilityRole="button"

                accessibilityLabel="Print or share logs as PDF"

              >

                {printBusy ? (

                  <ActivityIndicator color={theme.tokens.color.text} />

                ) : (

                  <View style={styles.dataBtnRow}>
                    <Ionicons name="print-outline" size={20} color={theme.tokens.color.accent} />
                    <Text style={[styles.dataBtnText, { fontSize: theme.font(15), color: theme.tokens.color.text }]}>{t('logs.print.action')}</Text>
                  </View>

                )}

              </Pressable>

              <Pressable

                style={styles.dataBtn}

                onPress={() => {
                  setImportFormat('json');
                  setImportOpen(true);
                }}

                accessibilityRole="button"

                accessibilityLabel="Import logs from JSON"

              >

                <Text style={[styles.dataBtnText, { fontSize: theme.font(15), color: theme.tokens.color.text }]}>📥 Import logs (JSON)</Text>

              </Pressable>

              <Pressable
                style={styles.dataBtn}
                onPress={() => {
                  setImportText('');
                  setImportFormat('csv');
                  setImportOpen(true);
                }}
                accessibilityRole="button"
              >
                <Text style={[styles.dataBtnText, { fontSize: theme.font(15), color: theme.tokens.color.text }]}>
                  {t('settings.import.logs.csv')}
                </Text>
              </Pressable>

              <Pressable
                style={styles.dataBtn}
                onPress={() => {
                  setImportText('');
                  setImportFormat('migration');
                  setMigrationSource('bearable');
                  setImportOpen(true);
                }}
                accessibilityRole="button"
              >
                <Text style={[styles.dataBtnText, { fontSize: theme.font(15), color: theme.tokens.color.text }]}>
                  {t('settings.data.import.migrationSource')}
                </Text>
              </Pressable>

              <Pressable

                style={[styles.dataBtn, styles.dangerBtn]}

                onPress={clearAllLogs}

                accessibilityRole="button"

                accessibilityLabel="Clear all health logs"

              >

                <Text style={[styles.dataBtnText, { fontSize: theme.font(15), color: theme.tokens.color.text }]}>🗑️ Clear all data</Text>

              </Pressable>

              <SettingsConsentDashboard prefs={prefs} onChangePrefs={onChangePrefs} />

            </Section>

          </ScrollView>

        </View>

        {/* Pane 9 — Security lock (web pane 10) */}

        <View style={[styles.paneOuter, { width }]}>

          <ScrollView style={styles.paneScroll} contentContainerStyle={styles.content} nestedScrollEnabled keyboardShouldPersistTaps="handled">

            <Section title={t('settings.security.title')}>

              <SettingsSecurityLockPane prefs={prefs} onChangePrefs={onChangePrefs} />

            </Section>

          </ScrollView>

        </View>


      </ScrollView>

      <Modal visible={importOpen} animationType="slide" transparent onRequestClose={() => setImportOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor:
                  theme.mode === 'light' ? 'rgba(255,255,255,0.98)' : 'rgba(20,30,28,0.97)',
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.tokens.color.text, fontSize: theme.font(17) }]}>{t('logs.import')}</Text>
            <Text style={[styles.hint, { fontSize: theme.font(13), color: `${theme.tokens.color.text}CC` }]}>
              {importFormat === 'migration'
                ? 'Paste a Bearable or Flaredown CSV export (header row required).'
                : importFormat === 'csv'
                  ? 'Paste CSV with a header row (same columns as web export).'
                  : 'Paste a JSON array of log entries (same shape as web export).'}
            </Text>
            {importFormat === 'migration' ? (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <Pressable
                  style={[styles.modalBtn, migrationSource === 'bearable' && { opacity: 1 }]}
                  onPress={() => setMigrationSource('bearable')}
                >
                  <Text style={{ color: theme.tokens.color.text }}>{t('settings.import.migration.bearable')}</Text>
                </Pressable>
                <Pressable style={styles.modalBtn} onPress={() => setMigrationSource('flaredown')}>
                  <Text style={{ color: theme.tokens.color.text }}>{t('settings.import.migration.flaredown')}</Text>
                </Pressable>
              </View>
            ) : null}
            <TextInput
              value={importText}
              onChangeText={setImportText}
              multiline
              placeholder={importFormat === 'csv' ? 'Date,BPM,...' : '[...]'}
              placeholderTextColor={theme.mode === 'light' ? 'rgba(0,0,0,0.38)' : 'rgba(255,255,255,0.45)'}
              style={[styles.importInput, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
              accessibilityLabel="Import JSON text"
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalBtn} onPress={() => setImportOpen(false)} accessibilityRole="button">
                <Text style={[styles.dataBtnText, { color: theme.tokens.color.text }]}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={styles.modalBtn}
                onPress={() => void applyImport('append', importFormat)}
                accessibilityRole="button"
                accessibilityLabel="Merge with existing logs"
              >
                <Text style={[styles.dataBtnText, { color: theme.tokens.color.text }]}>{t('settings.merge')}</Text>
              </Pressable>
              <Pressable
                style={styles.modalBtn}
                onPress={() => {
                  Alert.alert(t('settings.import.replaceTitle'), t('settings.import.replaceBody'), [
                    { text: t('common.cancel'), style: 'cancel' },
                    { text: t('settings.import.replaceAction'), style: 'destructive', onPress: () => void applyImport('replace', importFormat) },
                  ]);
                }}
                accessibilityRole="button"
                accessibilityLabel="Replace all logs"
              >
                <Text style={[styles.dataBtnText, { color: theme.tokens.color.text }]}>{t('settings.replace.all')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <EncryptedExportModal
        visible={encryptExportOpen}
        busy={exportBusy}
        onClose={() => setEncryptExportOpen(false)}
        onSubmit={(passphrase) => void onExportLogsEncrypted(passphrase)}
      />
      <EncryptedExportModal
        visible={shareExportOpen}
        busy={exportBusy}
        onClose={() => setShareExportOpen(false)}
        onSubmit={(passphrase) => void onExportShareLink(passphrase)}
      />
      <QrHandoffModal
        visible={qrHandoffOpen}
        busy={exportBusy}
        onClose={() => setQrHandoffOpen(false)}
        onBusyChange={setExportBusy}
      />
      <Modal visible={webDavOpen} animationType="slide" transparent onRequestClose={() => setWebDavOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.tokens.color.background }]}>
            <Text style={[styles.modalTitle, { color: theme.tokens.color.text }]}>{t('settings.data.export.webdav')}</Text>
            <TextInput
              value={webDavUrl}
              onChangeText={setWebDavUrl}
              placeholder="https://dav.example.com/backups"
              placeholderTextColor={theme.tokens.color.textMuted}
              style={[styles.importInput, { minHeight: 44, color: theme.tokens.color.text }]}
              autoCapitalize="none"
            />
            <TextInput
              value={webDavUser}
              onChangeText={setWebDavUser}
              placeholder={t('settings.data.webdav.username')}
              placeholderTextColor={theme.tokens.color.textMuted}
              style={[styles.importInput, { minHeight: 44, color: theme.tokens.color.text }]}
              autoCapitalize="none"
            />
            <TextInput
              value={webDavPass}
              onChangeText={setWebDavPass}
              placeholder={t('settings.data.webdav.password')}
              placeholderTextColor={theme.tokens.color.textMuted}
              secureTextEntry
              style={[styles.importInput, { minHeight: 44, color: theme.tokens.color.text }]}
            />
            <TextInput
              value={webDavPassphrase}
              onChangeText={setWebDavPassphrase}
              placeholder={t('settings.export.encrypted.placeholder')}
              placeholderTextColor={theme.tokens.color.textMuted}
              secureTextEntry
              style={[styles.importInput, { minHeight: 44, color: theme.tokens.color.text }]}
            />
            <Pressable
              style={[styles.dataBtn, { opacity: exportBusy || webDavPassphrase.length < 8 ? 0.6 : 1 }]}
              disabled={exportBusy || webDavPassphrase.length < 8}
              onPress={() => void onWebDavBackup()}
            >
              <Text style={[styles.dataBtnText, { color: theme.tokens.color.text }]}>{t('settings.data.export.webdav')}</Text>
            </Pressable>
            <Pressable style={styles.modalBtn} onPress={() => setWebDavOpen(false)}>
              <Text style={{ color: theme.tokens.color.textMuted }}>{t('common.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <AnonPoolFieldChecklist
        visible={anonPoolOpen}
        onClose={() => setAnonPoolOpen(false)}
        onConfirm={() => {
          setAnonPoolOpen(false);
          onChangePrefs({
            ...prefs,
            contributeAnonData: true,
            contributeAnonDataAt: new Date().toISOString(),
          });
        }}
      />
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  const sectionBg =
    theme.mode === 'light' ? `${theme.tokens.color.text}10` : 'rgba(0,0,0,0.16)';
  return (
    <View style={[styles.section, { backgroundColor: sectionBg }]}>
      <Text
        style={[styles.sectionTitle, { fontSize: theme.font(18), color: theme.tokens.color.text }]}
      >
        {title}
      </Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { fontSize: theme.font(15), color: theme.tokens.color.text }]}>
        {label}
      </Text>
      <View style={styles.rowRight}>{children}</View>
    </View>
  );
}

function RowWithInlineHint({
  label,
  hintId,
  hintText,
  expandedHint,
  setExpandedHint,
  children,
}: {
  label: string;
  hintId: string;
  hintText: string;
  expandedHint: string | null;
  setExpandedHint: (value: string | null) => void;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View>
      <View style={styles.row}>
        <View style={styles.rowLabelHintWrap}>
          <Text style={[styles.rowLabel, { fontSize: theme.font(15), color: theme.tokens.color.text, flex: 1 }]}>
            {label}
          </Text>
          <Pressable
            onPress={() => setExpandedHint(expandedHint === hintId ? null : hintId)}
            accessibilityRole="button"
            accessibilityLabel="More information"
            hitSlop={8}
          >
            <Ionicons name="help-circle-outline" size={18} color={theme.tokens.color.accent} />
          </Pressable>
        </View>
        <View style={styles.rowRight}>{children}</View>
      </View>
      {expandedHint === hintId ? <Hint>{hintText}</Hint> : null}
    </View>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const muted = `${theme.tokens.color.text}CC`;
  return <Text style={[styles.hint, { fontSize: theme.font(13), color: muted }]}>{children}</Text>;
}

function InlineChoices({
  value,
  options,
  onChange,
  tts,
  getLabel,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  tts: { enabled: boolean; readModeEnabled: boolean };
  getLabel?: (v: string) => string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.choiceRow}>
      {options.map((o) => {
        const active = o === value;
        const label = getLabel ? getLabel(o) : o;
        return (
          <Pressable
            key={o}
            onPress={() => {
              speakLabel(label, tts);
              onChange(o);
            }}
            onFocus={() => {
              if (tts.readModeEnabled) speakLabel(label, tts);
            }}
            style={[
              styles.choice,
              {
                backgroundColor: active ? `${theme.tokens.color.accent}33` : `${theme.tokens.color.text}14`,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={label}
          >
            <Text
              style={[
                styles.choiceText,
                {
                  fontSize: theme.font(13),
                  color: active ? theme.tokens.color.accent : theme.tokens.color.text,
                },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  setupStrip: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 6 },
  setupTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  /** Horizontal pager: must fill remaining height so inner panes can scroll vertically. */
  carouselBody: { flex: 1, minHeight: 0 },
  paneOuter: { flex: 1, minHeight: 0 },
  paneScroll: { flex: 1 },
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
  content: { padding: 16, gap: 16, paddingBottom: 48 },
  contentPersonal: { flexGrow: 1 },
  personalPaneLayout: { flexGrow: 1, gap: 16 },
  personalCloudAnchor: {
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  personalCloudTitle: { fontWeight: '700', marginBottom: 2 },
  section: { borderRadius: 16, padding: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  sectionBody: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowLabel: { fontSize: 15, flex: 1 },
  rowLabelHintWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 8 },
  rowRight: { alignItems: 'flex-end' },
  hint: { fontSize: 13, marginTop: -4 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },
  choice: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  choiceText: { fontWeight: '600' },
  dataBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
  },
  aiGoalsFooterBtn: { marginTop: 16, borderWidth: 1 },
  dataBtnText: { fontWeight: '800' },
  dataBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
  searchInput: {
    marginTop: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  avatarRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },
  avatarChip: { borderWidth: 1, borderRadius: 999, padding: 8 },
});
