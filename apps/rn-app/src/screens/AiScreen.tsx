import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { loadLogs } from '../storage/logs';
import { summarizeLogsForAi, type AiRange, type AiSummary } from '../ai/analyzeLogs';
import type { Preferences } from '../storage/preferences';
import { loadCachedBenchmark, type BenchmarkResult } from '../performance/benchmark';
import { generateSummaryNote } from '../ai/llm';

const RANGE_OPTIONS: AiRange[] = [14, 30, 90, 'all'];

function fmt(value: number | null): string {
  return value == null ? '—' : value.toFixed(1);
}

export function AiScreen({ prefs }: { prefs: Preferences }) {
  const theme = useTheme();
  const bg =
    theme.tokens.color.background ===
    'linear-gradient(135deg, #a8e6cf 0%, #c8e6c9 25%, #e8f5e8 75%, #f1f8e9 100%)'
      ? '#ffffff'
      : theme.tokens.color.background;
  const [range, setRange] = useState<AiRange>(30);
  const [logs, setLogs] = useState<Awaited<ReturnType<typeof loadLogs>>>([]);
  const [summaryNote, setSummaryNote] = useState<string>('');
  const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summary: AiSummary | null = useMemo(() => {
    if (!prefs.aiEnabled) return null;
    return summarizeLogsForAi(logs, range);
  }, [logs, prefs.aiEnabled, range]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const nextLogs = await loadLogs();
      setLogs(nextLogs);
    } catch {
      setError('Could not load logs for AI analysis.');
      setSummaryNote('');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCachedBenchmark().then(setBenchmark).catch(() => setBenchmark(null));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    if (!prefs.aiEnabled || !summary) {
      setSummaryNote('');
      return;
    }
    if (summary.totalLogs === 0) {
      setSummaryNote('No logs yet in this range. Add entries to generate a summary note.');
      return;
    }
    void (async () => {
      try {
        const note = await generateSummaryNote(
          summary,
          prefs.performance.preferredLlmModelSize,
          benchmark
        );
        if (!cancelled) setSummaryNote(note);
      } catch {
        if (!cancelled) setSummaryNote('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [benchmark, prefs.aiEnabled, prefs.performance.preferredLlmModelSize, summary]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}
      >
        <View style={styles.card}>
        <Text style={[styles.title, { color: theme.tokens.color.accent, fontSize: theme.font(22) }]}>AI Analysis</Text>

          <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
            Log-driven AI summary view: at-a-glance insights, trends, symptoms, stressors, and flare signals.
          </Text>

          {!prefs.aiEnabled ? (
            <Text style={[styles.error, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
              AI features are disabled in Settings. Enable AI features & Goals to view analysis.
            </Text>
          ) : null}

          <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>Range</Text>
          <View style={styles.rangeRow}>
            {RANGE_OPTIONS.map((opt) => {
              const selected = opt === range;
              const label = opt === 'all' ? 'All' : `${opt}d`;
              return (
                <Pressable
                  key={String(opt)}
                  accessibilityRole="button"
                  accessibilityLabel={opt === 'all' ? 'AI analysis range all time' : `AI analysis range ${opt} days`}
                  accessibilityState={{ selected }}
                  style={[styles.rangeChip, selected ? styles.rangeChipOn : null]}
                  onPress={() => setRange(opt)}
                >
                  <Text style={styles.rangeChipText}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          {error ? (
            <Text style={[styles.error, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{error}</Text>
          ) : null}

          {summary && prefs.aiEnabled ? (
            <>
              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>Summary note</Text>
              <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                {summaryNote || 'Generating...'}
              </Text>

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>At a glance</Text>
              <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                Range: {summary.rangeLabel} ({summary.totalLogs} log{summary.totalLogs === 1 ? '' : 's'})
              </Text>
              <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                Flare days: {summary.flareDays}
              </Text>
              <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                Top symptoms: {summary.topSymptoms.length ? summary.topSymptoms.join(', ') : '—'}
              </Text>
              <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                Top stressors: {summary.topStressors.length ? summary.topStressors.join(', ') : '—'}
              </Text>

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>What we found</Text>
              <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                Patterns in everyday language from your own logs in this range.
              </Text>
              <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                Mood avg: {fmt(summary.avgMood)} / 10
              </Text>
              <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                Sleep avg: {fmt(summary.avgSleep)} / 10
              </Text>
              <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                Fatigue avg: {fmt(summary.avgFatigue)} / 10
              </Text>

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>What you logged</Text>
              {summary.whatYouLogged.map((line) => (
                <Text key={`wyl-${line}`} style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  {line}
                </Text>
              ))}

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>How you're doing</Text>
              <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                Recent averages versus latest entries. This is guidance, not diagnosis.
              </Text>
              {summary.howYouAreDoing.map((line) => (
                <Text key={`hyd-${line}`} style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  {line}
                </Text>
              ))}

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>Things to watch</Text>
              <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                Unusual patterns that may be worth checking in with your symptoms and routine.
              </Text>
              {summary.thingsToWatch.map((line) => (
                <Text key={`ttw-${line}`} style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  {line}
                </Text>
              ))}

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>Important</Text>
              <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                For patterns only - talk to your clinician before changing care.
              </Text>
              {summary.important.map((line) => (
                <Text key={`imp-${line}`} style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  {line}
                </Text>
              ))}

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>Possible flare-up</Text>
              <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                A simple score from current log patterns - not a medical test.
              </Text>
              <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                Level: {summary.possibleFlareUp.level} ({summary.possibleFlareUp.matchingSignals} / 5 signs)
              </Text>
              {summary.possibleFlareUp.notes.map((line) => (
                <Text key={`pfu-${line}`} style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  {line}
                </Text>
              ))}

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>Correlations</Text>
              <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                Metrics that tend to move together in your recent logs.
              </Text>
              {summary.correlations.map((line) => (
                <Text key={`corr-${line}`} style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  {line}
                </Text>
              ))}

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>Groups that change together</Text>
              <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                Clusters of metrics that often shift in the same period.
              </Text>
              {summary.groupsThatChangeTogether.map((line) => (
                <Text key={`grp-${line}`} style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  {line}
                </Text>
              ))}
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  scrollContent: { paddingBottom: 28 },
  card: { borderRadius: 16, padding: 16, backgroundColor: 'rgba(0,0,0,0.18)' },
  title: { fontWeight: '700', marginBottom: 8 },
  text: { opacity: 0.95, marginBottom: 10 },
  section: { marginTop: 12, marginBottom: 6, fontWeight: '800', opacity: 0.85 },
  metric: { marginBottom: 5, opacity: 0.95 },
  meta: { marginBottom: 6, opacity: 0.82 },
  error: { marginTop: 8, opacity: 0.95 },
  rangeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  rangeChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  rangeChipOn: { backgroundColor: 'rgba(255,255,255,0.22)' },
  rangeChipText: { color: '#fff', fontWeight: '800' },
});

