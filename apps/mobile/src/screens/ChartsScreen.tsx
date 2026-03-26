import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { loadLogs, type LogEntry } from '../storage/logs';
import {
  filterTrendsForChartView,
  summarizeCharts,
  type ChartRange,
  type ChartViewMode,
} from '../charts/summarizeCharts';

const RANGE_OPTIONS: ChartRange[] = [14, 30, 90, 'all'];

const VIEW_OPTIONS: ChartViewMode[] = ['balance', 'individual', 'combined'];

export function ChartsScreen() {
  const theme = useTheme();
  const bg =
    theme.tokens.color.background ===
    'linear-gradient(135deg, #a8e6cf 0%, #c8e6c9 25%, #e8f5e8 75%, #f1f8e9 100%)'
      ? '#ffffff'
      : theme.tokens.color.background;

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [range, setRange] = useState<ChartRange>(30);
  const [view, setView] = useState<ChartViewMode>('combined');
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

  const summary = summarizeCharts(logs, range);
  const trendsForView = filterTrendsForChartView(summary.trends, view);

  const fmt = (v: number | null) => (v == null ? '—' : v.toFixed(1));
  const fmtDelta = (v: number | null) => (v == null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(1)}`);
  const showOverview = view === 'combined';
  const showSparks = view !== 'balance';
  const noDataInRange = !loading && !error && summary.totalLogs === 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.card}>
          <Text style={[styles.title, { color: theme.tokens.color.accent, fontSize: theme.font(22) }]}>Charts</Text>
          <Text style={[styles.lead, { color: theme.tokens.color.text, fontSize: theme.font(15) }]}>
            {view === 'balance'
              ? 'Wellness balance: mood, sleep, and fatigue trends for the selected range.'
              : view === 'individual'
                ? 'Each metric listed separately with deltas and mini trend bars.'
                : 'Overview plus all key metrics with deltas and mini trend bars.'}
          </Text>

          {loading && !logs.length ? (
            <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Loading…</Text>
          ) : null}

          {error ? (
            <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{error}</Text>
          ) : null}

          <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>View</Text>
          <View style={styles.viewRow}>
            {VIEW_OPTIONS.map((opt) => {
              const selected = opt === view;
              const label = opt === 'balance' ? 'Balance' : opt === 'individual' ? 'Individual' : 'Combined';
              return (
                <Pressable
                  key={opt}
                  accessibilityRole="button"
                  accessibilityLabel={`Chart view ${label}`}
                  accessibilityState={{ selected }}
                  style={[styles.rangeChip, selected ? styles.rangeChipOn : null]}
                  onPress={() => setView(opt)}
                >
                  <Text style={styles.rangeChipText}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>Range</Text>
          <View style={styles.rangeRow}>
            {RANGE_OPTIONS.map((opt) => {
              const selected = opt === range;
              const label = opt === 'all' ? 'All' : `${opt}d`;
              return (
                <Pressable
                  key={String(opt)}
                  accessibilityRole="button"
                  accessibilityLabel={opt === 'all' ? 'Charts date range all time' : `Charts date range ${opt} days`}
                  accessibilityState={{ selected }}
                  style={[styles.rangeChip, selected ? styles.rangeChipOn : null]}
                  onPress={() => setRange(opt)}
                >
                  <Text style={styles.rangeChipText}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          {showOverview ? (
            <>
              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>Overview</Text>
              <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                {summary.rangeLabel}: {summary.totalLogs} entry{summary.totalLogs === 1 ? '' : 'ies'}
              </Text>
              <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                Flare days: {summary.flareDays}
              </Text>
            </>
          ) : null}

          <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>Metric trends</Text>
          {noDataInRange ? (
            <Text
              style={[styles.emptyHint, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
              accessibilityLabel="Charts empty state"
            >
              No log entries in this date range. Log from Home, widen the range, or pull down to refresh.
            </Text>
          ) : (
            trendsForView.map((trend) => (
              <View key={trend.key} style={styles.trendRow}>
                <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  {trend.label}: avg {fmt(trend.average)} · current {fmt(trend.current)}
                </Text>
                <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                  Delta {fmtDelta(trend.delta)} · {trend.points} point{trend.points === 1 ? '' : 's'}
                </Text>
                {showSparks ? (
                  <View style={styles.sparkRow}>
                    {trend.spark.length ? (
                      trend.spark.slice(-20).map((h, i) => (
                        <View
                          key={`${trend.key}-${i}`}
                          style={[
                            styles.sparkBar,
                            {
                              height: 8 + Math.round(h * 28),
                              opacity: 0.55 + h * 0.45,
                            },
                          ]}
                        />
                      ))
                    ) : (
                      <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>No points yet</Text>
                    )}
                  </View>
                ) : null}
              </View>
            ))
          )}
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
  emptyHint: { opacity: 0.9, marginTop: 4, marginBottom: 8, lineHeight: 22 },
  section: { fontWeight: '800', marginTop: 14, marginBottom: 6, opacity: 0.85 },
  metric: { marginBottom: 6, opacity: 0.95 },
  meta: { opacity: 0.8, marginBottom: 8 },
  trendRow: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 8, marginTop: 4 },
  sparkRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, minHeight: 40, marginBottom: 4, marginTop: 2 },
  sparkBar: { width: 6, borderRadius: 4, backgroundColor: 'rgba(123,223,140,0.95)' },
  rangeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  viewRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  rangeChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  rangeChipOn: { backgroundColor: 'rgba(255,255,255,0.22)' },
  rangeChipText: { color: '#fff', fontWeight: '800' },
});
