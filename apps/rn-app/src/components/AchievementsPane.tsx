import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ALL_ACHIEVEMENTS,
  computeAchievementSnapshots,
  normalizeAchievementState,
  type AchievementPersistedState,
} from '@rianell/shared';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';
import { useReduceMotionFlag } from '../hooks/useReduceMotionFlag';
import type { TrackingProfile } from '../storage/preferences';

type Props = {
  trackingProfile: TrackingProfile | null | undefined;
  achievementState: { achievements: AchievementPersistedState; updatedAt?: string | null };
};

const TIER_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#A8B4C4',
  gold: '#D4AF37',
  platinum: '#7DD3FC',
};

function AchievementProgressBar({
  progress,
  unlocked,
  accent,
  success,
  accessibilityLabel,
}: {
  progress: number;
  unlocked: boolean;
  accent: string;
  success: string;
  accessibilityLabel: string;
}) {
  const reduceMotion = useReduceMotionFlag();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      anim.setValue(progress);
      return;
    }
    Animated.spring(anim, {
      toValue: progress,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();
  }, [anim, progress, reduceMotion]);

  return (
    <View
      style={[styles.progressTrack, { backgroundColor: `${accent}22` }]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
    >
      <Animated.View
        style={[
          styles.progressFill,
          {
            transform: [{ scaleX: anim }],
            backgroundColor: unlocked ? success : accent,
            shadowColor: unlocked ? success : accent,
          },
        ]}
      />
    </View>
  );
}

function AchievementCard({
  snap,
  theme,
  t,
}: {
  snap: ReturnType<typeof computeAchievementSnapshots>['snapshots'][number];
  theme: ReturnType<typeof useTheme>;
  t: (key: string) => string;
}) {
  const iconName =
    snap.icon === 'food'
      ? 'restaurant-outline'
      : snap.icon === 'run'
        ? 'walk-outline'
        : snap.icon === 'pill'
          ? 'medkit-outline'
          : snap.icon === 'calendar'
            ? 'calendar-outline'
            : snap.icon === 'sleep'
              ? 'moon-outline'
              : snap.icon === 'cycle'
                ? 'ellipse-outline'
                : snap.icon === 'star'
                  ? 'star-outline'
                  : 'ribbon-outline';

  const tierColor = TIER_COLORS[snap.tier] ?? theme.tokens.color.accent;
  const progressText = snap.unlocked
    ? t('achievements.unlocked')
    : t('achievements.progress')
        .replace('{days}', String(snap.daysElapsed))
        .replace('{required}', String(snap.requiredDays));
  const percentText = t('achievements.progressPercent').replace(
    '{percent}',
    String(Math.round(snap.progress * 100)),
  );

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: snap.unlocked ? `${theme.tokens.color.success}55` : `${tierColor}44`,
          backgroundColor: snap.unlocked ? `${theme.tokens.color.success}10` : `${tierColor}12`,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            borderColor: snap.unlocked ? theme.tokens.color.success : `${tierColor}88`,
          },
        ]}
      >
        <Ionicons
          name={iconName}
          size={22}
          color={snap.unlocked ? theme.tokens.color.success : `${theme.tokens.color.text}88`}
        />
        {snap.unlocked ? (
          <Ionicons
            name="checkmark-circle"
            size={14}
            color={theme.tokens.color.success}
            style={styles.lockBadge}
          />
        ) : (
          <Ionicons
            name="lock-closed"
            size={12}
            color={`${theme.tokens.color.text}88`}
            style={styles.lockBadge}
          />
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.tokens.color.text, fontSize: theme.font(15) }]}>
            {t(snap.i18nTitle)}
          </Text>
          <Text style={[styles.tierBadge, { color: tierColor, fontSize: theme.font(10) }]}>{snap.tier}</Text>
        </View>
        <Text style={[styles.desc, { color: `${theme.tokens.color.text}BB`, fontSize: theme.font(13) }]}>
          {t(snap.i18nDescription)}
        </Text>
        <View style={styles.progressRow}>
          <AchievementProgressBar
            progress={snap.progress}
            unlocked={snap.unlocked}
            accent={theme.tokens.color.accent}
            success={theme.tokens.color.success}
            accessibilityLabel={percentText}
          />
          <Text
            style={[
              styles.percent,
              {
                color: snap.unlocked ? theme.tokens.color.success : `${theme.tokens.color.text}99`,
                fontSize: theme.font(11),
              },
            ]}
          >
            {percentText}
          </Text>
        </View>
        <Text
          style={[
            styles.pill,
            {
              color: snap.unlocked ? theme.tokens.color.success : `${theme.tokens.color.text}99`,
              fontSize: theme.font(12),
            },
          ]}
        >
          {progressText}
        </Text>
      </View>
    </View>
  );
}

export function AchievementsPane({ trackingProfile, achievementState }: Props) {
  const theme = useTheme();
  const { t } = useT();
  const normalized = normalizeAchievementState(achievementState);
  const { snapshots } = useMemo(
    () => computeAchievementSnapshots(trackingProfile, normalized),
    [trackingProfile, normalized],
  );
  const unlockedCount = snapshots.filter((s) => s.unlocked).length;
  const totalCount = ALL_ACHIEVEMENTS.length;
  const counterText = t('achievements.completionCounter')
    .replace('{unlocked}', String(unlockedCount))
    .replace('{total}', String(totalCount));

  return (
    <View style={styles.list}>
      <View style={styles.counterRow}>
        <Text style={[styles.counterUnlocked, { color: theme.tokens.color.accent, fontSize: theme.font(16) }]}>
          {unlockedCount}
        </Text>
        <Text style={[styles.counterTotal, { color: `${theme.tokens.color.text}99`, fontSize: theme.font(14) }]}>
          {' / '}
          {totalCount} {t('achievements.title')}
        </Text>
      </View>
      <Text style={[styles.counterLabel, { color: `${theme.tokens.color.text}88`, fontSize: theme.font(12) }]}>
        {counterText}
      </Text>
      {snapshots.map((snap) => (
        <AchievementCard key={snap.id} snap={snap} theme={theme} t={t} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  counterRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 2 },
  counterUnlocked: { fontWeight: '800' },
  counterTotal: { fontWeight: '500' },
  counterLabel: { marginBottom: 8 },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: { position: 'absolute', bottom: -2, right: -2 },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  title: { fontWeight: '600', flex: 1 },
  tierBadge: { fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  desc: { lineHeight: 18, marginBottom: 8 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },
  percent: { fontWeight: '600', minWidth: 36, textAlign: 'right' },
  pill: { fontWeight: '600' },
});
