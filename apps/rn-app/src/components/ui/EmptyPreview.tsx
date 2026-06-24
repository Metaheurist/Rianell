import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { useT } from '../../i18n/I18nProvider';
import { useReduceMotionFlag } from '../../hooks/useReduceMotionFlag';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

const CHART_BAR_HEIGHTS = [24, 40, 32, 48, 28, 36];
const CHART_LABELS = ['Mood', 'Sleep', 'Fatigue', 'Energy', 'Steps', 'Hydration'];

type PreviewProps = { logsCount: number };

export function ChartsEmptyPreview({ logsCount }: PreviewProps) {
  const theme = useTheme();
  const { t } = useT();
  const reduceMotion = useReduceMotionFlag();
  const translateY = useRef(new Animated.Value(reduceMotion ? 0 : 20)).current;
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const remaining = Math.max(0, 3 - logsCount);
  const dayWord = remaining === 1 ? 'day' : 'days';

  useEffect(() => {
    if (reduceMotion) return;
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
    Animated.spring(opacity, { toValue: 1, useNativeDriver: true, bounciness: 6 }).start();
  }, [opacity, reduceMotion, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <EmptyState
        variant="charts"
        message={t('charts.empty.warm.message')}
      />
      <View
        style={styles.ghostRow}
        accessibilityRole="image"
        accessibilityLabel={t('charts.empty.preview.a11y')}
      >
        {CHART_BAR_HEIGHTS.map((h, i) => (
          <View key={CHART_LABELS[i]} style={styles.barCol}>
            <Skeleton height={h} width={28} style={styles.bar} />
            <Text style={[styles.barLabel, { color: theme.color.text + '88' }]}>{CHART_LABELS[i]}</Text>
          </View>
        ))}
      </View>
      <Text style={[styles.countdown, { color: theme.color.text }]}>
        Log{' '}
        <Text style={{ color: theme.color.accent, fontWeight: '700' }}>
          {remaining} more {dayWord}
        </Text>{' '}
        to see your first chart
      </Text>
    </Animated.View>
  );
}

const AI_LABEL_KEYS = ['ai.preview.label1', 'ai.preview.label2', 'ai.preview.label3'] as const;

export function AiInsightEmptyPreview() {
  const theme = useTheme();
  const { t } = useT();
  const reduceMotion = useReduceMotionFlag();
  const translateY = useRef(new Animated.Value(reduceMotion ? 0 : 20)).current;
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) return;
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
    Animated.spring(opacity, { toValue: 1, useNativeDriver: true, bounciness: 6 }).start();
  }, [opacity, reduceMotion, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <EmptyState variant="ai" message={t('ai.empty.warm.message')} />
      {AI_LABEL_KEYS.map((key) => (
        <View
          key={key}
          style={[
            styles.ghostCard,
            {
              borderLeftColor: theme.color.accent,
              backgroundColor: theme.color.accent + '18',
            },
          ]}
          accessibilityLabel={`${t(key)} — locked until 3 logs`}
        >
          <Ionicons
            name="lock-closed-outline"
            size={16}
            color={theme.color.text}
            style={styles.lockIcon}
          />
          <Skeleton height={10} width="70%" />
          <Skeleton height={8} width="45%" style={{ marginBottom: 0 }} />
          <Text style={[styles.ghostLabel, { color: theme.color.text + '99' }]}>{t(key)}</Text>
        </View>
      ))}
      <Text style={[styles.unlockHint, { color: theme.color.text + 'bb' }]}>{t('ai.preview.unlock')}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ghostRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    height: 72,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  barCol: { alignItems: 'center', flex: 1 },
  bar: { marginBottom: 4, borderRadius: 4 },
  barLabel: { fontSize: 10, textAlign: 'center' },
  countdown: { textAlign: 'center', fontSize: 14, marginBottom: 16, paddingHorizontal: 16 },
  ghostCard: {
    borderLeftWidth: 3,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    minHeight: 56,
  },
  lockIcon: { position: 'absolute', top: 10, right: 10, opacity: 0.4 },
  ghostLabel: { fontSize: 11, marginTop: 6 },
  unlockHint: { textAlign: 'center', fontSize: 13, marginTop: 4, marginBottom: 16, paddingHorizontal: 16 },
});
