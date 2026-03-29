import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  LayoutAnimation,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import type { MainTabParamList } from '../navigation/RootNavigator';
import { loadLogs, type LogEntry } from '../storage/logs';
import type { Preferences } from '../storage/preferences';
import {
  CHART_METRIC_HEX,
  filterTrendsForChartView,
  formatChartMetricDelta,
  formatChartMetricValue,
  summarizeCharts,
  type ChartRange,
  type ChartViewMode,
} from '../charts/summarizeCharts';

const RANGE_OPTIONS: ChartRange[] = [14, 30, 90, 'all'];

const VIEW_OPTIONS: ChartViewMode[] = ['balance', 'individual', 'combined'];

/** Default wellness target on 0–10 scale; aligns with web demo goals until native `rianellGoals` lands (Phase E). */
const DEFAULT_WELLNESS_TARGET = 7;

type ChartsRoute = RouteProp<MainTabParamList, 'Charts'>;

function CombinedTrendChart({
  series,
}: {
  series: Array<{ key: string; values: number[]; color: string }>;
}) {
  if (!series.length) return null;
  const pointCount = Math.min(
    ...series.map((s) => s.values.length).filter((n) => Number.isFinite(n) && n > 0)
  );
  if (!Number.isFinite(pointCount) || pointCount < 2) return null;
  const normalized = series.map((s) => ({ ...s, values: s.values.slice(-pointCount) }));
  return (
    <View style={styles.combinedChartCard} accessibilityLabel="Combined trend chart">
      <View style={styles.combinedChartGrid}>
        {Array.from({ length: pointCount }, (_, idx) => (
          <View key={`col-${idx}`} style={styles.combinedChartCol}>
            {normalized.map((s) => {
              const v = s.values[idx] ?? 0;
              return (
                <View
                  key={`dot-${s.key}-${idx}`}
                  style={[
                    styles.combinedChartDot,
                    {
                      backgroundColor: s.color,
                      bottom: `${Math.max(0, Math.min(1, v)) * 100}%`,
                    },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

function IndividualMetricChart({
  points,
  color,
  a11yLabel,
}: {
  points: number[];
  color: string;
  a11yLabel: string;
}) {
  if (points.length < 2) return null;
  return (
    <View style={styles.individualChartCard} accessibilityLabel={a11yLabel}>
      <View style={styles.individualChartGrid}>
        {points.map((value, idx) => (
          <View key={`${a11yLabel}-${idx}`} style={styles.individualChartCol}>
            <View
              style={[
                styles.individualChartDot,
                {
                  backgroundColor: color,
                  bottom: `${Math.max(0, Math.min(1, value)) * 100}%`,
                },
              ]}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

function BalanceVisual({
  trends,
}: {
  trends: Array<{ key: keyof typeof CHART_METRIC_HEX; label: string; current: number | null }>;
}) {
  const theme = useTheme();
  const rows = trends
    .map((trend) => ({
      ...trend,
      pct:
        trend.current != null && Number.isFinite(trend.current)
          ? Math.max(0, Math.min(100, (trend.current / 10) * 100))
          : 0,
    }))
    .filter((row) => row.key === 'mood' || row.key === 'sleep' || row.key === 'fatigue');
  if (!rows.length) return null;
  return (
    <View style={styles.balanceVisualCard} accessibilityLabel="Balance visual chart">
      {rows.map((row) => (
        <View key={`balance-${row.key}`} style={styles.balanceVisualRow}>
          <Text style={[styles.balanceVisualLabel, { color: theme.tokens.color.text }]}>{row.label}</Text>
          <View style={styles.balanceVisualTrack}>
            <View
              style={[
                styles.balanceVisualFill,
                {
                  width: `${row.pct}%`,
                  backgroundColor: CHART_METRIC_HEX[row.key],
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

export function ChartsScreen({ prefs }: { prefs?: Preferences }) {
  const route = useRoute<ChartsRoute>();
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
  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReducedMotionEnabled(enabled);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setReducedMotionEnabled(enabled);
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const runLayoutMotion = useCallback(() => {
    if (reducedMotionEnabled) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [reducedMotionEnabled]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const next = await loadLogs();
      runLayoutMotion();
      setLogs(next);
    } catch {
      setError('Could not load logs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [runLayoutMotion]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Home header “Goals & targets” opens Charts in Balance (web `openGoalsModal` / targets chrome parity). */
  useEffect(() => {
    const v = route.params?.initialView;
    if (v && VIEW_OPTIONS.includes(v)) {
      setView(v);
    }
  }, [route.params?.initialView]);

  const onRefresh = () => {
    runLayoutMotion();
    setRefreshing(true);
    void load();
  };

  const summary = useMemo(() => summarizeCharts(logs, range), [logs, range]);
  const trendsForView = useMemo(
    () => filterTrendsForChartView(summary.trends, view),
    [summary.trends, view]
  );

  const showOverview = view === 'combined';
  const showSparks = view !== 'balance';
  const noDataInRange = !loading && !error && summary.totalLogs === 0;
  const targetByKey: Record<'mood' | 'sleep' | 'fatigue', number> = {
    mood: prefs?.goals?.moodTarget ?? DEFAULT_WELLNESS_TARGET,
    sleep: prefs?.goals?.sleepTarget ?? DEFAULT_WELLNESS_TARGET,
    fatigue: prefs?.goals?.fatigueTarget ?? DEFAULT_WELLNESS_TARGET,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor:
                theme.mode === 'light' ? `${theme.tokens.color.text}0D` : 'rgba(0,0,0,0.18)',
            },
          ]}
        >
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
                  style={[
                    styles.rangeChip,
                    {
                      backgroundColor: selected
                        ? `${theme.tokens.color.accent}33`
                        : `${theme.tokens.color.text}14`,
                    },
                  ]}
                  onPress={() => {
                    runLayoutMotion();
                    setView(opt);
                  }}
                >
                  <Text
                    style={[
                      styles.rangeChipText,
                      {
                        color: selected ? theme.tokens.color.accent : theme.tokens.color.text,
                      },
                    ]}
                  >
                    {label}
                  </Text>
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
                  style={[
                    styles.rangeChip,
                    {
                      backgroundColor: selected
                        ? `${theme.tokens.color.accent}33`
                        : `${theme.tokens.color.text}14`,
                    },
                  ]}
                  onPress={() => {
                    runLayoutMotion();
                    setRange(opt);
                  }}
                >
                  <Text
                    style={[
                      styles.rangeChipText,
                      {
                        color: selected ? theme.tokens.color.accent : theme.tokens.color.text,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {reducedMotionEnabled ? (
            <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
              Reduced motion is enabled; chart transitions use minimal animation.
            </Text>
          ) : null}

          {view === 'balance' && !loading && !error && summary.totalLogs > 0 ? (
            <View accessibilityLabel="Charts target snapshot">
              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>Targets</Text>
              <Text
                style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12), marginBottom: 10 }]}
              >
                Target lines from Goals settings (default 7.0/10 when unset).
              </Text>
              {filterTrendsForChartView(summary.trends, 'balance').map((trend) => {
                const cur = trend.current;
                const target =
                  trend.key === 'mood' || trend.key === 'sleep' || trend.key === 'fatigue'
                    ? targetByKey[trend.key]
                    : DEFAULT_WELLNESS_TARGET;
                const pct =
                  cur != null && Number.isFinite(cur) ? Math.min(100, Math.max(0, (cur / 10) * 100)) : 0;
                const targetPct = (target / 10) * 100;
                return (
                  <View key={`target-${trend.key}`} style={styles.targetBlock}>
                    <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                      {trend.label}: {formatChartMetricValue(trend.key, cur)} · target {target.toFixed(1)}
                    </Text>
                    <View style={styles.targetTrack}>
                      <View
                        style={[
                          styles.targetFill,
                          {
                            width: `${pct}%`,
                            backgroundColor: CHART_METRIC_HEX[trend.key],
                          },
                        ]}
                      />
                      <View style={[styles.targetMarker, { left: `${targetPct}%` }]} />
                    </View>
                  </View>
                );
              })}
              <BalanceVisual
                trends={filterTrendsForChartView(summary.trends, 'balance').map((trend) => ({
                  key: trend.key,
                  label: trend.label,
                  current: trend.current,
                }))}
              />
            </View>
          ) : null}

          {showOverview ? (
            <>
              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>Overview</Text>
              <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                {summary.rangeLabel}: {summary.totalLogs} entry{summary.totalLogs === 1 ? '' : 'ies'}
              </Text>
              <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                Flare days: {summary.flareDays}
              </Text>
              {trendsForView.some((trend) => trend.spark.length > 1) ? (
                <CombinedTrendChart
                  series={trendsForView
                    .filter((trend) => trend.spark.length > 1)
                    .map((trend) => ({
                      key: String(trend.key),
                      values: trend.spark
                        .slice(-20)
                        .map((v) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0))
                        .filter((v) => Number.isFinite(v)),
                      color: CHART_METRIC_HEX[trend.key] ?? '#7dd3fc',
                    }))
                    .filter((s) => s.values.length > 1)}
                />
              ) : null}
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
              <View
                key={trend.key}
                style={[styles.trendRow, { borderLeftColor: CHART_METRIC_HEX[trend.key], borderLeftWidth: 3 }]}
              >
                <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                  {trend.label}: avg {formatChartMetricValue(trend.key, trend.average)} · current{' '}
                  {formatChartMetricValue(trend.key, trend.current)}
                </Text>
                <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                  Delta {formatChartMetricDelta(trend.key, trend.delta)} · {trend.points} point
                  {trend.points === 1 ? '' : 's'}
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
                              backgroundColor: CHART_METRIC_HEX[trend.key],
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
                {view === 'individual' ? (
                  <IndividualMetricChart
                    points={trend.spark.slice(-20)}
                    color={CHART_METRIC_HEX[trend.key]}
                    a11yLabel={`Individual trend chart ${trend.label}`}
                  />
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
  trendRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 8,
    marginTop: 4,
    paddingLeft: 8,
  },
  sparkRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, minHeight: 40, marginBottom: 4, marginTop: 2 },
  sparkBar: { width: 6, borderRadius: 4 },
  rangeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  viewRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  rangeChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  rangeChipText: { fontWeight: '800' },
  targetBlock: { marginBottom: 10 },
  targetTrack: {
    marginTop: 4,
    height: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    position: 'relative',
  },
  targetFill: { height: '100%', borderRadius: 6, minWidth: 2 },
  targetMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  combinedChartCard: {
    marginTop: 8,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  combinedChartGrid: {
    minHeight: 120,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 8,
  },
  combinedChartCol: {
    flex: 1,
    position: 'relative',
    minHeight: 100,
    marginHorizontal: 1,
  },
  combinedChartDot: {
    position: 'absolute',
    left: '50%',
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: -3,
    opacity: 0.9,
  },
  individualChartCard: {
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  individualChartGrid: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
    paddingTop: 6,
  },
  individualChartCol: {
    flex: 1,
    position: 'relative',
    minHeight: 56,
    marginHorizontal: 1,
  },
  individualChartDot: {
    position: 'absolute',
    left: '50%',
    width: 5,
    height: 5,
    borderRadius: 3,
    marginLeft: -2.5,
    opacity: 0.9,
  },
  balanceVisualCard: {
    marginTop: 4,
    marginBottom: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 10,
    gap: 8,
  },
  balanceVisualRow: { gap: 4 },
  balanceVisualLabel: { color: '#fff', fontWeight: '700', fontSize: 12 },
  balanceVisualTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  balanceVisualFill: { height: '100%', borderRadius: 6, minWidth: 2 },
});
