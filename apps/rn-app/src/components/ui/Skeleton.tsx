import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export function Skeleton({ height = 12, width = '100%' as `${number}%`, style }: { height?: number; width?: number | `${number}%`; style?: ViewStyle }) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
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
