import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useReduceMotionFlag } from '../../hooks/useReduceMotionFlag';

export function Skeleton({ height = 12, width = '100%' as `${number}%`, style }: { height?: number; width?: number | `${number}%`; style?: ViewStyle }) {
  const theme = useTheme();
  const reduceMotion = useReduceMotionFlag();
  const opacity = useRef(new Animated.Value(reduceMotion ? 0.35 : 0.45)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 550, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reduceMotion]);

  return (
    <Animated.View
      style={[
        styles.block,
        { height, width, opacity, backgroundColor: theme.color.accent + '33' },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  block: { borderRadius: 8, marginBottom: 8 },
});
