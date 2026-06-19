import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { RefreshControl } from '../components/legacyRnJsx';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';
import type { MainTabParamList } from '../navigation/RootNavigator';
import { loadLogs, type LogEntry } from '../storage/logs';
import type { Preferences } from '../storage/preferences';
import {
  CHART_METRIC_HEX,
  filterTrendsForChartView,
  filterLogsForCharts,
  formatChartMetricDelta,
  formatChartMetricValue,
  summarizeCharts,
  type ChartRange,
  type ChartViewMode,
} from '../charts/summarizeCharts';
import { loadCachedBenchmark, type BenchmarkResult } from '../performance/benchmark';
import {
  buildCorrelationCards,
  buildFlarePostMortem,
  buildCyclePhaseBands,
  compareChartPeriods,
  buildPacingChartSeries,
  buildBalanceRadarData,
  predictFutureValues,
  type PredictedPoint,
  type FlarePostMortemResult,
  type PacingChartRow,
} from '../ai/engine';
import { BalanceRadarChart } from '../charts/BalanceRadarChart';
import { buildRadarSvgForExport, printOrShareChartReport } from '../utils/printChartReport';
import { explainChartRange } from '../ai/llm';

const RANGE_OPTIONS: ChartRange[] = [7, 14, 30, 90, 'all'];

const VIEW_OPTIONS: ChartViewMode[] = ['balance', 'individual', 'combined'];
const BALANCE_TREND_KEYS: Array<'mood' | 'sleep' | 'fatigue'> = ['mood', 'sleep', 'fatigue'];

function ChartLoadingSkeleton({ accent, textColor }: { accent: string; textColor: string }) {
  const pulse = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.85, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Loading charts">
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          style={[
            styles.skeletonRow,
            {
              opacity: pulse,
              backgroundColor: `${textColor}18`,
              borderColor: `${accent}33`,
            },
          ]}
        />
      ))}
    </View>
  );
}

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

function PredictionBandVisual({ point, color }: { point: PredictedPoint; color: string }) {
  const lowerPct = Math.max(0, Math.min(100, (point.lower / 10) * 100));
  const upperPct = Math.max(0, Math.min(100, (point.upper / 10) * 100));
  const valuePct = Math.max(0, Math.min(100, (point.value / 10) * 100));
  return (
    <View style={styles.predictionBandTrack} accessibilityLabel="Forecast uncertainty band">
      <View
        style={[
          styles.predictionBandRange,
          {
            left: `${lowerPct}%`,
            width: `${Math.max(2, upperPct - lowerPct)}%`,
            backgroundColor: `${color}44`,
          },
        ]}
      />
      <View style={[styles.predictionBandDot, { left: `${valuePct}%`, backgroundColor: color }]} />
    </View>
  );
}

function PacingDayRow({
  date,
  planned,
  actual,
  fatigue,
  overpaced,
  textColor,
  accent,
}: {
  date: string;
  planned: number;
  actual: number;
  fatigue: number | null;
  overpaced: boolean;
  textColor: string;
  accent: string;
}) {
  return (
    <View style={styles.pacingRow}>
      <Text style={[styles.meta, { color: textColor, fontSize: 12, flex: 1 }]}>{date}</Text>
      <View style={styles.pacingBars}>
        <View style={[styles.pacingBarTrack, { backgroundColor: `${textColor}14` }]}>
          <View style={[styles.pacingBarFill, { width: `${planned * 10}%`, backgroundColor: `${accent}55` }]} />
        </View>
        <View style={[styles.pacingBarTrack, { backgroundColor: `${textColor}14` }]}>
          <View
            style={[
              styles.pacingBarFill,
              {
                width: `${Math.min(100, actual * 10)}%`,
                backgroundColor: overpaced ? '#ef5350' : CHART_METRIC_HEX.steps,
              },
            ]}
          />
        </View>
        {fatigue != null ? (
          <View style={[styles.pacingBarTrack, { backgroundColor: `${textColor}14` }]}>
            <View
              style={[
                styles.pacingBarFill,
                { width: `${fatigue * 10}%`, backgroundColor: CHART_METRIC_HEX.fatigue },
              ]}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function ChartsScreen({ prefs }: { prefs?: Preferences }) {
  const route = useRoute<ChartsRoute>();
  const theme = useTheme();
  const { t, locale } = useT();
  const bg =
    theme.tokens.color.background ===
    'linear-gradient(135deg, #a8e6cf 0%, #c8e6c9 25%, #e8f5e8 75%, #f1f8e9 100%)'
      ? '#ffffff'
      : theme.tokens.color.background;

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [range, setRange] = useState<ChartRange>(7);
  const [view, setView] = useState<ChartViewMode>('combined');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(false);
  const [chartExplanation, setChartExplanation] = useState('');
  const [explainLoading, setExplainLoading] = useState(false);
  const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);
  const [exportingChart, setExportingChart] = useState(false);

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

  useEffect(() => {
    void loadCachedBenchmark().then(setBenchmark).catch(() => setBenchmark(null));
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
      setError(t('charts.load.failed'));
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

  const summary = useMemo(() => summarizeCharts(logs, range, { translate: t }), [logs, range, t]);
  const rangeLogs = useMemo(() => filterLogsForCharts(logs, range), [logs, range]);
  const correlationCards = useMemo(() => buildCorrelationCards(rangeLogs, 'all'), [rangeLogs]);
  const flarePostMortem = useMemo(
    () => buildFlarePostMortem(rangeLogs) as FlarePostMortemResult | null,
    [rangeLogs]
  );
  const cycleOverlay = useMemo(
    () => (prefs?.cycleModuleEnabled ? buildCyclePhaseBands(rangeLogs) : { bands: [], markers: [] }),
    [rangeLogs, prefs?.cycleModuleEnabled]
  );
  const periodCompare = useMemo(() => compareChartPeriods(rangeLogs), [rangeLogs]);
  const pacingSeries = useMemo(() => {
    const build = buildPacingChartSeries as (
      logs: typeof rangeLogs,
      range?: number | 'all'
    ) => PacingChartRow[];
    return build(rangeLogs, range).slice(-7);
  }, [rangeLogs, range]);
  const moodForecast = useMemo(() => {
    const moodSeries = rangeLogs
      .filter((e) => typeof e.mood === 'number')
      .map((e) => e.mood as number);
    if (moodSeries.length < 2) return null;
    const pts = predictFutureValues(moodSeries, 3);
    return pts.length ? pts[pts.length - 1] : null;
  }, [rangeLogs]);
  const trendsForView = useMemo(
    () => filterTrendsForChartView(summary.trends, view),
    [summary.trends, view]
  );
  const customMetrics = prefs?.customChartMetrics ?? [];
  const balanceRadar = useMemo(() => {
    const customFields = customMetrics.map((m) => `custom_${m.id}`);
    const selected = [...BALANCE_TREND_KEYS, ...customFields];
    return buildBalanceRadarData(rangeLogs, {
      selectedFields: selected,
      customMetrics,
      range: 'all',
    });
  }, [rangeLogs, customMetrics]);

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
          <Text style={[styles.title, { color: theme.tokens.color.accent, fontSize: theme.font(22) }]}>{t('charts.title')}</Text>
          <Text style={[styles.lead, { color: theme.tokens.color.text, fontSize: theme.font(15) }]}>
            {view === 'balance'
              ? t('charts.lead.balance')
              : view === 'individual'
                ? t('charts.lead.individual')
                : t('charts.lead.combined')}
          </Text>

          {loading && !logs.length ? (
            <ChartLoadingSkeleton accent={theme.tokens.color.accent} textColor={theme.tokens.color.text} />
          ) : null}

          {error ? (
            <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{error}</Text>
          ) : null}

          <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{t('charts.filter.view')}</Text>
          <View style={styles.viewRow}>
            {VIEW_OPTIONS.map((opt) => {
              const selected = opt === view;
              const label =
                opt === 'balance'
                  ? t('charts.view.balance')
                  : opt === 'individual'
                    ? t('charts.view.individual')
                    : t('charts.view.combined');
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

          <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{t('charts.filter.range')}</Text>
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

          {!noDataInRange ? (
            <Pressable
              style={[styles.rangeChip, { alignSelf: 'flex-start', marginTop: 8 }]}
              accessibilityRole="button"
              accessibilityLabel={t('charts.export.action')}
              disabled={exportingChart}
              onPress={() => {
                if (exportingChart) return;
                setExportingChart(true);
                const viewLabel =
                  view === 'balance'
                    ? t('charts.view.balance')
                    : view === 'individual'
                      ? t('charts.view.individual')
                      : t('charts.view.combined');
                const rows = trendsForView.map((trend) => ({
                  label: trend.label,
                  value: `avg ${formatChartMetricValue(trend.key, trend.average)} · current ${formatChartMetricValue(trend.key, trend.current)}`,
                }));
                const radarSvg =
                  view === 'balance' && balanceRadar.labels.length >= 3
                    ? buildRadarSvgForExport(balanceRadar.labels, balanceRadar.values)
                    : undefined;
                void printOrShareChartReport({
                  title: t('charts.export.title'),
                  viewLabel,
                  rangeLabel: summary.rangeLabel,
                  rows,
                  radarSvg,
                }).finally(() => setExportingChart(false));
              }}
            >
              <Text style={{ color: theme.tokens.color.accent, fontWeight: '700' }}>
                {exportingChart ? t('charts.export.loading') : t('charts.export.action')}
              </Text>
            </Pressable>
          ) : null}

          {prefs?.aiEnabled && !noDataInRange ? (
            <>
              <Pressable
                style={[styles.rangeChip, { alignSelf: 'flex-start', marginTop: 8 }]}
                accessibilityRole="button"
                onPress={() => {
                  if (explainLoading) return;
                  setExplainLoading(true);
                  void explainChartRange(
                    summary,
                    view,
                    prefs?.performance?.preferredLlmModelSize ?? 'recommended',
                    benchmark,
                    locale,
                    prefs
                  )
                    .then((text) => setChartExplanation(text))
                    .finally(() => setExplainLoading(false));
                }}
              >
                <Text style={{ color: theme.tokens.color.accent, fontWeight: '700' }}>
                  {explainLoading ? t('charts.explain.loading') : t('charts.explain.action')}
                </Text>
              </Pressable>
              {chartExplanation ? (
                <>
                  <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
                    {t('charts.explain.section')}
                  </Text>
                  <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                    {chartExplanation}
                  </Text>
                </>
              ) : null}
            </>
          ) : null}

          {reducedMotionEnabled ? (
            <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
              Reduced motion is enabled; chart transitions use minimal animation.
            </Text>
          ) : null}

          {view === 'balance' && !loading && !error && summary.totalLogs > 0 ? (
            <View accessibilityLabel="Charts target snapshot">
              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{t('charts.targets')}</Text>
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
              {balanceRadar.labels.length >= 3 ? (
                <BalanceRadarChart
                  points={balanceRadar.labels.map((label, i) => ({
                    label,
                    value: balanceRadar.values[i] ?? 0,
                  }))}
                  textColor={theme.tokens.color.text}
                  color={theme.tokens.color.accent}
                  a11yLabel={t('charts.radar.a11y')}
                />
              ) : null}
              {customMetrics.length > 0 ? (
                <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                  {t('charts.customMetrics.legend', { count: customMetrics.length })}
                </Text>
              ) : null}
            </View>
          ) : null}

          {correlationCards.length > 0 ? (
            <>
              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
                {t('charts.correlations.title')}
              </Text>
              {correlationCards.map((card) => (
                <View
                  key={card.id}
                  style={[styles.insightCard, { borderLeftColor: CHART_METRIC_HEX.mood }]}
                >
                  <Text style={[styles.insightBadge, { color: theme.tokens.color.accent, fontSize: theme.font(11) }]}>
                    {t(`charts.correlations.confidence.${card.confidence}`)}
                  </Text>
                  <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                    {card.label1}{' '}
                    {t(card.direction === 'positive' ? 'charts.correlations.positive' : 'charts.correlations.negative')}{' '}
                    {card.label2} ({card.coefficient})
                  </Text>
                </View>
              ))}
            </>
          ) : null}

          {flarePostMortem ? (
            <>
              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
                {t('charts.flarePostMortem.title')}
              </Text>
              <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                {t('charts.flarePostMortem.window', {
                  days: flarePostMortem.windowDays,
                  date: flarePostMortem.flareDate,
                })}
              </Text>
              {(flarePostMortem.diverging.length ? flarePostMortem.diverging : flarePostMortem.metrics).map((m) => (
                <Text
                  key={`flare-${m.key}`}
                  style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                >
                  {t('charts.flarePostMortem.metricLine', {
                    label: m.label,
                    before: m.beforeAvg != null ? m.beforeAvg.toFixed(1) : '—',
                    after: m.afterAvg != null ? m.afterAvg.toFixed(1) : '—',
                    delta:
                      m.delta != null
                        ? m.delta >= 0
                          ? `+${m.delta.toFixed(1)}`
                          : m.delta.toFixed(1)
                        : '—',
                  })}
                </Text>
              ))}
            </>
          ) : null}

          {cycleOverlay.bands.length > 0 ? (
            <>
              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
                {t('charts.cycle.title')}
              </Text>
              <View style={styles.cycleLegendRow}>
                {cycleOverlay.bands.map((band) => (
                  <View
                    key={`${band.phase}-${band.startDate}`}
                    style={[styles.cycleChip, { borderColor: band.color }]}
                  >
                    <View style={[styles.cycleDot, { backgroundColor: band.color }]} />
                    <Text style={{ color: theme.tokens.color.text, fontSize: theme.font(12) }}>{band.label}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {periodCompare && periodCompare.current.stats.logDays > 0 ? (
            <>
              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
                {t('charts.compare.title')}
              </Text>
              <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                {t('charts.compare.lede', {
                  current: periodCompare.current.label,
                  previous: periodCompare.previous.label,
                })}
              </Text>
              {(['mood', 'sleep', 'fatigue'] as const).map((key) => {
                const cur = periodCompare.current.stats[`${key}Avg`];
                const prev = periodCompare.previous.stats[`${key}Avg`];
                const d = periodCompare.deltas[key];
                if (cur == null && prev == null) return null;
                return (
                  <Text
                    key={`cmp-${key}`}
                    style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                  >
                    {t('charts.compare.metricLine', {
                      metric: key.charAt(0).toUpperCase() + key.slice(1),
                      current: cur != null ? cur.toFixed(1) : '—',
                      previous: prev != null ? prev.toFixed(1) : '—',
                      delta: d != null ? (d >= 0 ? `+${d.toFixed(1)}` : d.toFixed(1)) : '—',
                    })}
                  </Text>
                );
              })}
            </>
          ) : null}

          {pacingSeries.length > 0 ? (
            <>
              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
                {t('charts.pacing.title')}
              </Text>
              <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                {t('charts.pacing.legend')}
              </Text>
              {pacingSeries.map((row) => (
                <PacingDayRow
                  key={`pace-${row.date}`}
                  date={row.date}
                  planned={row.planned}
                  actual={row.actual}
                  fatigue={row.fatigue}
                  overpaced={row.overpaced}
                  textColor={theme.tokens.color.text}
                  accent={theme.tokens.color.accent}
                />
              ))}
            </>
          ) : null}

          {showOverview ? (
            <>
              <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{t('charts.overview')}</Text>
              <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                {summary.rangeLabel}: {summary.totalLogs} entry{summary.totalLogs === 1 ? '' : 'ies'}
              </Text>
              <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                Flare days: {summary.flareDays}
              </Text>
              {moodForecast ? (
                <>
                  <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
                    {t('charts.forecast.section')}
                  </Text>
                  <Text style={[styles.metric, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
                    {t('charts.forecast.uncertainty', {
                      days: 3,
                      value: moodForecast.value.toFixed(1),
                      lower: moodForecast.lower.toFixed(1),
                      upper: moodForecast.upper.toFixed(1),
                    })}
                  </Text>
                  <PredictionBandVisual point={moodForecast} color={CHART_METRIC_HEX.mood} />
                </>
              ) : null}
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

          <Text style={[styles.section, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{t('charts.metric.trends')}</Text>
          {noDataInRange ? (
            <Text
              style={[styles.emptyHint, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
              accessibilityLabel="Charts empty state"
            >
              {t('charts.empty.noEntries')}
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
                      <Text style={[styles.meta, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>{t('charts.empty.noPoints')}</Text>
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
  skeletonRow: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
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
  insightCard: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 8,
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  insightBadge: { fontWeight: '800', marginBottom: 4, textTransform: 'uppercase' },
  predictionBandTrack: {
    marginTop: 6,
    marginBottom: 10,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
    overflow: 'hidden',
  },
  predictionBandRange: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    borderRadius: 5,
  },
  predictionBandDot: {
    position: 'absolute',
    top: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
  },
  cycleLegendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  cycleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  cycleDot: { width: 10, height: 10, borderRadius: 5 },
  pacingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  pacingBars: { flex: 2, gap: 3 },
  pacingBarTrack: { height: 6, borderRadius: 4, overflow: 'hidden' },
  pacingBarFill: { height: '100%', borderRadius: 4, minWidth: 2 },
});
