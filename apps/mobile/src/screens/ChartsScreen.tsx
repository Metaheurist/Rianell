import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { loadLogs, type LogEntry } from '../storage/logs';

function mean(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function lastNDates(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    out.push(x.toISOString().slice(0, 10));
  }
  return out;
}

export function ChartsScreen() {
  const theme = useTheme();
  const bg =
    theme.tokens.color.background ===
    'linear-gradient(135deg, #a8e6cf 0%, #c8e6c9 25%, #e8f5e8 75%, #f1f8e9 100%)'
      ? '#ffffff'
      : theme.tokens.color.background;

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const next = await loadLogs();
      setLogs(next);
    } catch {
      setError('Could not load logs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  const recentSet = new Set(lastNDates(14));
  const recentLogs = logs.filter((l) => recentSet.has(l.date));

  const mood = mean(logs.map((l) => l.mood).filter((v): v is number => v != null));
  const sleep = mean(logs.map((l) => l.sleep).filter((v): v is number => v != null));
  const fatigue = mean(logs.map((l) => l.fatigue).filter((v): v is number => v != null));
  const flareDays = logs.filter((l) => l.flare === 'Yes').length;

  const fmt = (v: number | null) => (v == null ? '—' : v.toFixed(1));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.card}>
          <Text style={[styles.title, { color: theme.tokens.color.accent, fontSize: theme.font(22) }]}>Charts</Text>
          <Text style={[styles.lead, { color: theme.tokens.color.text, fontSize: theme.font(15) }]}>
            Lightweight summary from your saved logs. Full chart parity with the web app (ranges, lazy load) comes next.
          </Text>

          {loading && !logs.length ? (
            <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Loading…</Text>
          ) : null}

          {error ? (
            <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{error}</Text>
          ) : null}

          <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>Overview</Text>
          <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
            Total entries: {logs.length}
          </Text>
          <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
            Last 14 days logged: {recentLogs.length} day(s) with data
          </Text>
          <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
            Flare days (all time): {flareDays}
          </Text>

          <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>Averages (where recorded)</Text>
          <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
            Mood (0–10): {fmt(mood)}
          </Text>
          <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
            Sleep (0–10): {fmt(sleep)}
          </Text>
          <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
            Fatigue (0–10): {fmt(fatigue)}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  scrollContent: { paddingBottom: 32 },
  card: { borderRadius: 16, padding: 16, backgroundColor: 'rgba(0,0,0,0.18)' },
  title: { fontWeight: '700', marginBottom: 8 },
  lead: { opacity: 0.95, marginBottom: 16 },
  section: { fontWeight: '800', marginTop: 14, marginBottom: 6, opacity: 0.85 },
  metric: { marginBottom: 6, opacity: 0.95 },
});
