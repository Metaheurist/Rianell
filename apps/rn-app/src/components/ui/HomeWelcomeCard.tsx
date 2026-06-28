import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { useT } from '../../i18n/I18nProvider';
import { useReduceMotionFlag } from '../../hooks/useReduceMotionFlag';

type Pill = { icon: keyof typeof Ionicons.glyphMap; labelKey: string; onPress: () => void };

type Props = {
  condition: string;
  onDismiss: () => void;
  pills: Pill[];
};

export function HomeWelcomeCard({ condition, onDismiss, pills }: Props) {
  const theme = useTheme();
  const { t } = useT();
  const reduceMotion = useReduceMotionFlag();
  const translateY = useRef(new Animated.Value(reduceMotion ? 0 : 20)).current;
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const iconScale = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const iconPulse = useRef(new Animated.Value(1)).current;
  const pillScale = useRef(new Animated.Value(1)).current;

  const body = t('home.welcome.body').replace(
    '{condition}',
    condition.trim() || 'your condition'
  );

  useEffect(() => {
    if (reduceMotion) return;
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 9 }).start();
    Animated.spring(opacity, { toValue: 1, useNativeDriver: true, bounciness: 9 }).start();
    Animated.sequence([
      Animated.spring(iconScale, { toValue: 1.18, friction: 4, tension: 300, useNativeDriver: true }),
      Animated.spring(iconScale, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }),
    ]).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, { toValue: 1.08, duration: 2000, useNativeDriver: true }),
        Animated.timing(iconPulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [iconPulse, iconScale, opacity, reduceMotion, translateY]);

  const iconCombinedScale = Animated.multiply(iconScale, iconPulse);

  const springPillTo = (toValue: number) => {
    Animated.spring(pillScale, { toValue, friction: 6, tension: 200, useNativeDriver: true }).start();
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity,
          transform: [{ translateY }],
          borderColor: theme.color.accent,
          backgroundColor: theme.color.accent + '12',
        },
      ]}
      accessibilityRole="none"
    >
      <Pressable
        onPress={onDismiss}
        style={styles.dismiss}
        accessibilityRole="button"
        accessibilityLabel={t('common.close')}
        hitSlop={12}
      >
        <Ionicons name="close" size={22} color={theme.color.text + 'aa'} />
      </Pressable>
      <Animated.View style={{ transform: [{ scale: iconCombinedScale }] }} accessibilityElementsHidden>
        <Ionicons name="heart-circle-outline" size={48} color={theme.color.accent} style={styles.heroIcon} />
      </Animated.View>
      <Text style={[styles.title, { color: theme.color.text }]}>{t('home.welcome.title')}</Text>
      <Text style={[styles.body, { color: theme.color.text + 'cc' }]}>{body}</Text>
      <View style={styles.pillRow}>
        {pills.map((pill) => (
          <Pressable
            key={pill.labelKey}
            onPress={pill.onPress}
            onPressIn={() => springPillTo(0.94)}
            onPressOut={() => springPillTo(1)}
            accessibilityRole="button"
            accessibilityLabel={t(pill.labelKey)}
            hitSlop={6}
          >
            <Animated.View
              style={[
                styles.pill,
                {
                  borderColor: theme.color.accent + '55',
                  backgroundColor: theme.color.accent + '18',
                  transform: [{ scale: pillScale }],
                },
              ]}
            >
              <Ionicons name={pill.icon} size={16} color={theme.color.accent} />
              <Text style={[styles.pillText, { color: theme.color.text }]}>{t(pill.labelKey)}</Text>
            </Animated.View>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  dismiss: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  heroIcon: { alignSelf: 'center', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  body: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 12 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 44,
  },
  pillText: { fontSize: 13, fontWeight: '500' },
});
