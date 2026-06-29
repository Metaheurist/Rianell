import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';
import {
  registerAchievementToastShowListener,
  type AchievementToastPayload,
} from '../achievements/achievementToastBridge';
import { requestOpenGoalsModal } from '../achievements/goalsModalBridge';

const DISMISS_MS = 4000;

export function AchievementUnlockToast() {
  const theme = useTheme();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [current, setCurrent] = useState<AchievementToastPayload | null>(null);
  const queueRef = useRef<AchievementToastPayload[]>([]);
  const showingRef = useRef(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef(
    Array.from({ length: 8 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      op: new Animated.Value(0),
    })),
  ).current;

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: -120, useNativeDriver: true, friction: 9 }),
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (!finished) return;
      showingRef.current = false;
      setCurrent(null);
      const next = queueRef.current.shift();
      if (next) {
        showingRef.current = true;
        setCurrent(next);
      }
    });
  }, [opacity, translateY]);

  const showNext = useCallback(
    (payload: AchievementToastPayload) => {
      if (showingRef.current) {
        queueRef.current.push(payload);
        return;
      }
      showingRef.current = true;
      setCurrent(payload);
    },
    [],
  );

  useEffect(() => {
    registerAchievementToastShowListener(showNext);
    return () => registerAchievementToastShowListener(null);
  }, [showNext]);

  useEffect(() => {
    if (!current) return;

    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    translateY.setValue(-120);
    opacity.setValue(0);

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 7, tension: 80 }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();

    const particleBurst = Animated.parallel(
      particleAnims.map((anim, i) => {
        const angle = i * (Math.PI / 4);
        const dist = 40 + Math.random() * 20;
        anim.x.setValue(0);
        anim.y.setValue(0);
        anim.op.setValue(1);
        return Animated.parallel([
          Animated.timing(anim.x, {
            toValue: Math.cos(angle) * dist,
            duration: 600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim.y, {
            toValue: Math.sin(angle) * dist,
            duration: 600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim.op, { toValue: 0, duration: 600, delay: 200, useNativeDriver: true }),
        ]);
      }),
    );
    particleBurst.start();

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 900, useNativeDriver: false }),
      ]),
    );
    glowLoop.start();

    dismissTimerRef.current = setTimeout(() => {
      glowLoop.stop();
      hideToast();
    }, DISMISS_MS);

    return () => {
      glowLoop.stop();
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [current, glow, hideToast, opacity, translateY]);

  if (!current) return null;

  const borderColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [`${theme.tokens.color.accent}55`, theme.tokens.color.accent],
  });

  return (
    <View style={[styles.host, { top: insets.top + 8 }]} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.toast,
          {
            width: Math.min(width - 24, 420),
            backgroundColor: theme.tokens.color.background,
            borderColor,
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${theme.tokens.color.accent}22` }]}>
          <Ionicons name="trophy" size={22} color={theme.tokens.color.accent} />
        </View>
        <View style={styles.body}>
          <Text style={[styles.title, { color: theme.tokens.color.text, fontSize: theme.font(15) }]}>
            {current.title}
          </Text>
          <Text style={[styles.bodyText, { color: `${theme.tokens.color.text}BB`, fontSize: theme.font(13) }]}>
            {current.body}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            requestOpenGoalsModal(1);
            hideToast();
          }}
          style={styles.viewBtn}
          accessibilityRole="button"
          accessibilityLabel={t('achievements.viewInGoals')}
        >
          <Text style={[styles.viewText, { color: theme.tokens.color.accent, fontSize: theme.font(13) }]}>
            {t('achievements.toast.view')} →
          </Text>
        </Pressable>
      </Animated.View>
      {particleAnims.map((anim, i) => (
        <Animated.View
          key={`particle-${i}`}
          pointerEvents="none"
          style={{
            position: 'absolute',
            alignSelf: 'center',
            top: '50%',
            left: '50%',
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: theme.tokens.color.accent,
            transform: [{ translateX: anim.x }, { translateY: anim.y }],
            opacity: anim.op,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 20,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  title: { fontWeight: '700', marginBottom: 2 },
  bodyText: { lineHeight: 17 },
  viewBtn: { paddingHorizontal: 4, paddingVertical: 6 },
  viewText: { fontWeight: '700' },
});
