import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { loadLogs } from '../storage/logs';
import { summarizeLogsForAi, type AiRange, type AiSummary } from '../ai/analyzeLogs';

const RANGE_OPTIONS: AiRange[] = [14, 30, 90, 'all'];

function fmt(value: number | null): string {
  return value == null ? '—' : value.toFixed(1);
}

export function AiScreen() {
  const theme = useTheme();
  const bg =
    theme.tokens.color.background ===
    'linear-gradient(135deg, #a8e6cf 0%, #c8e6c9 25%, #e8f5e8 75%, #f1f8e9 100%)'
      ? '#ffffff'
      : theme.tokens.color.background;
  const [range, setRange] = useState<AiRange>(30);
  const [summary, setSummary] = useState<AiSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const logs = await loadLogs();
      setSummary(summarizeLogsForAi(logs, range));
    } catch {
      setError('Could not load logs for AI analysis.');
    } finally {
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}
      >
        <View style={styles.card}>
        <Text style={[styles.title, { color: theme.tokens.color.accent, fontSize: theme.font(22) }]}>AI Analysis</Text>

          <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
            Log-driven summary view (lite parity): trends, common symptoms, and stressors.
          </Text>

          <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>Range</Text>
          <View style={styles.rangeRow}>
            {RANGE_OPTIONS.map((opt) => {
              const selected = opt === range;
              const label = opt === 'all' ? 'All' : `${opt}d`;
              return (
                <Pressable key={String(opt)} style={[styles.rangeChip, selected ? styles.rangeChipOn : null]} onPress={() => setRange(opt)}>
                  <Text style={styles.rangeChipText}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          {error ? (
            <Text style={[styles.error, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{error}</Text>
          ) : null}

          {summary ? (
            <>
              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>What you logged</Text>
              {summary.whatYouLogged.map((line) => (
                <Text key={`wyl-${line}`} style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  {line}
                </Text>
              ))}

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>What we found</Text>
              <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                Range: {summary.rangeLabel} ({summary.totalLogs} log{summary.totalLogs === 1 ? '' : 's'})
              </Text>
              <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                Flare days: {summary.flareDays}
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

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>How you are doing</Text>
              {summary.howYouAreDoing.map((line) => (
                <Text key={`hyd-${line}`} style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  {line}
                </Text>
              ))}

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>What you logged most</Text>
              <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                Top symptoms: {summary.topSymptoms.length ? summary.topSymptoms.join(', ') : '—'}
              </Text>
              <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                Top stressors: {summary.topStressors.length ? summary.topStressors.join(', ') : '—'}
              </Text>

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>Things to watch</Text>
              {summary.thingsToWatch.map((line) => (
                <Text key={`ttw-${line}`} style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  {line}
                </Text>
              ))}

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>Important</Text>
              {summary.important.map((line) => (
                <Text key={`imp-${line}`} style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  {line}
                </Text>
              ))}

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>Possible flare-up</Text>
              <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                Level: {summary.possibleFlareUp.level} ({summary.possibleFlareUp.matchingSignals} signal{summary.possibleFlareUp.matchingSignals === 1 ? '' : 's'})
              </Text>
              {summary.possibleFlareUp.notes.map((line) => (
                <Text key={`pfu-${line}`} style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  {line}
                </Text>
              ))}

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>Correlations</Text>
              {summary.correlations.map((line) => (
                <Text key={`corr-${line}`} style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  {line}
                </Text>
              ))}

              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>Groups that change together</Text>
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

