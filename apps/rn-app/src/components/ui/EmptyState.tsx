import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { useT } from '../../i18n/I18nProvider';
import { useReduceMotionFlag } from '../../hooks/useReduceMotionFlag';
import { PrimaryButton } from './PrimaryButton';

export type EmptyStateVariant = 'logs' | 'charts' | 'ai' | 'mood' | 'weeklyReview' | 'default';

type Props = {
  variant?: EmptyStateVariant;
  iconName?: keyof typeof Ionicons.glyphMap;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

const VARIANT_DEFAULTS: Record<
  Exclude<EmptyStateVariant, 'default'>,
  { icon: keyof typeof Ionicons.glyphMap; titleKey: string }
> = {
  logs: { icon: 'journal-outline', titleKey: 'logs.empty.warm.title' },
  charts: { icon: 'bar-chart-outline', titleKey: 'charts.empty.warm.title' },
  ai: { icon: 'sparkles-outline', titleKey: 'ai.empty.warm.title' },
  mood: { icon: 'happy-outline', titleKey: 'mood.empty.warm.title' },
  weeklyReview: { icon: 'calendar-outline', titleKey: 'weeklyReview.empty.warm.title' },
};

export function EmptyState({
  variant = 'default',
  iconName,
  title,
  message,
  actionLabel,
  onAction,
}: Props) {
  const theme = useTheme();
  const { t } = useT();
  const reduceMotion = useReduceMotionFlag();
  const translateY = useRef(new Animated.Value(reduceMotion ? 0 : 20)).current;
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const iconPulse = useRef(new Animated.Value(1)).current;

  const inferred = variant !== 'default' ? VARIANT_DEFAULTS[variant] : null;
  const resolvedTitle = title ?? (inferred ? t(inferred.titleKey) : '');
  const resolvedIcon = iconName ?? inferred?.icon ?? 'information-circle-outline';

  useEffect(() => {
    if (reduceMotion) return;
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
    Animated.spring(opacity, { toValue: 1, useNativeDriver: true, bounciness: 6 }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, { toValue: 0.6, duration: 1200, useNativeDriver: true }),
        Animated.timing(iconPulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [iconPulse, opacity, reduceMotion, translateY]);

  const a11yLabel = useMemo(() => {
    const parts = [resolvedTitle, message].filter(Boolean);
    return parts.join('. ');
  }, [message, resolvedTitle]);

  return (
    <Animated.View
      style={[styles.wrap, { opacity, transform: [{ translateY }] }]}
      accessibilityLiveRegion="polite"
      accessibilityRole="text"
      accessibilityLabel={a11yLabel}
    >
      <Animated.View style={{ opacity: iconPulse }} accessibilityElementsHidden>
        <Ionicons name={resolvedIcon} size={48} color={theme.color.accent} style={styles.icon} />
      </Animated.View>
      <Text style={[styles.title, { color: theme.color.text }]}>{resolvedTitle}</Text>
      {message ? (
        <Text style={[styles.message, { color: theme.color.text + 'cc' }]}>{message}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <PrimaryButton
          label={actionLabel}
          onPress={onAction}
          style={styles.btn}
          accessibilityLabel={actionLabel}
        />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16 },
  icon: { marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 15, textAlign: 'center', marginBottom: 16, lineHeight: 22 },
  btn: { minWidth: 160, minHeight: 44 },
});
