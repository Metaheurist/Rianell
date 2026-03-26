import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
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
import type { AppearanceMode, Preferences } from '../storage/preferences';
import { useTheme } from '../theme/ThemeProvider';
import { speakLabel } from '../accessibility/tts';
import type { BuildChannel } from '../data/buildDownloads';
import { resolveArtifactUrl } from '../data/buildDownloads';
import { mergeLogsAppend, parseLogImportJson, serializeLogsForExport } from '../data/logExportImport';
import { loadLogs, saveLogs } from '../storage/logs';
import { SettingsCloudPane } from '../settings/SettingsCloudPane';

const PANE_TITLES = ['Personal & cloud', 'AI & theme', 'Accessibility', 'Data & install'] as const;

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
  const [downloadBusy, setDownloadBusy] = useState<BuildChannel | null>(null);

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

  async function openBuildDownload(channel: BuildChannel) {
    setDownloadBusy(channel);
    try {
      const resolved = await resolveArtifactUrl(channel);
      if (!resolved) {
        Alert.alert(
          'Download',
          'Could not load build info from the site. Check your connection or try again later.'
        );
        return;
      }
      await Linking.openURL(resolved.url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Open failed';
      Alert.alert('Download', msg);
    } finally {
      setDownloadBusy(null);
    }
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
              <SettingsCloudPane />
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

        {/* Pane 3 — Data & install */}
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

            <Section title="Install & downloads">
              <Hint>
                Uses the same public manifests as web Settings on rianell.com; opens the resolved download URL in your
                browser.
              </Hint>
              <Pressable
                style={[styles.dataBtn, { opacity: downloadBusy === 'androidLegacy' ? 0.6 : 1 }]}
                onPress={() => void openBuildDownload('androidLegacy')}
                disabled={downloadBusy !== null}
                accessibilityRole="button"
                accessibilityLabel="Download Android legacy Capacitor APK"
              >
                {downloadBusy === 'androidLegacy' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.dataBtnText, { fontSize: theme.font(15) }]}>
                    🤖 Android · legacy Capacitor (Beta)
                  </Text>
                )}
              </Pressable>
              <Pressable
                style={[styles.dataBtn, { opacity: downloadBusy === 'androidRnCli' ? 0.6 : 1 }]}
                onPress={() => void openBuildDownload('androidRnCli')}
                disabled={downloadBusy !== null}
                accessibilityRole="button"
                accessibilityLabel="Download Android React Native CLI APK"
              >
                {downloadBusy === 'androidRnCli' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.dataBtnText, { fontSize: theme.font(15) }]}>
                    🤖 Android · React Native CLI (Beta)
                  </Text>
                )}
              </Pressable>
              <Pressable
                style={[styles.dataBtn, { opacity: downloadBusy === 'ios' ? 0.6 : 1 }]}
                onPress={() => void openBuildDownload('ios')}
                disabled={downloadBusy !== null}
                accessibilityRole="button"
                accessibilityLabel="Download iOS Xcode project zip"
              >
                {downloadBusy === 'ios' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.dataBtnText, { fontSize: theme.font(15) }]}>
                    🍎 iOS · Xcode project (Alpha)
                  </Text>
                )}
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
});
