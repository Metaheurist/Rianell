import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  computeAchievementSnapshots,
  normalizeAchievementState,
  type AchievementPersistedState,
} from '@rianell/shared';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';
import type { TrackingProfile } from '../storage/preferences';

type Props = {
  trackingProfile: TrackingProfile | null | undefined;
  achievementState: { achievements: AchievementPersistedState; updatedAt?: string | null };
};

export function AchievementsPane({ trackingProfile, achievementState }: Props) {
  const theme = useTheme();
  const t = useT();
  const normalized = normalizeAchievementState(achievementState);
  const { snapshots } = useMemo(
    () => computeAchievementSnapshots(trackingProfile, normalized),
    [trackingProfile, normalized],
  );

  return (
    <View style={styles.list}>
      {snapshots.map((snap) => {
        const iconName =
          snap.icon === 'food' ? 'restaurant-outline' : snap.icon === 'run' ? 'walk-outline' : 'medkit-outline';
        const progressText = snap.unlocked
          ? t('achievements.unlocked')
          : t('achievements.progress')
              .replace('{days}', String(snap.daysElapsed))
              .replace('{required}', String(snap.requiredDays));
        return (
          <View
            key={snap.id}
            style={[
              styles.card,
              {
                borderColor: `${theme.tokens.color.accent}33`,
                backgroundColor: `${theme.tokens.color.accent}14`,
              },
            ]}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  borderColor: snap.unlocked ? theme.tokens.color.success : `${theme.tokens.color.text}44`,
                },
              ]}
            >
              <Ionicons
                name={iconName}
                size={22}
                color={snap.unlocked ? theme.tokens.color.success : `${theme.tokens.color.text}88`}
              />
              {!snap.unlocked ? (
                <Ionicons
                  name="lock-closed"
                  size={12}
                  color={`${theme.tokens.color.text}88`}
                  style={styles.lockBadge}
                />
              ) : null}
            </View>
            <View style={styles.body}>
              <Text style={[styles.title, { color: theme.tokens.color.text, fontSize: theme.font(15) }]}>
                {t(snap.i18nTitle)}
              </Text>
              <Text style={[styles.desc, { color: `${theme.tokens.color.text}BB`, fontSize: theme.font(13) }]}>
                {t(snap.i18nDescription)}
              </Text>
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
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
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
  title: { fontWeight: '600', marginBottom: 4 },
  desc: { lineHeight: 18, marginBottom: 6 },
  pill: { fontWeight: '600' },
});
