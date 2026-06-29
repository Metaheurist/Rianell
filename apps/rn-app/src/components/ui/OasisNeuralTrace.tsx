import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useReduceMotionFlag } from '../../hooks/useReduceMotionFlag';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = {
  color?: string;
  height?: number;
};

/** Bioluminescent neural trace — UI Oasis Overhaul v2.1.0 */
export function OasisNeuralTrace({ color = 'rgba(123,223,140,0.5)', height = 80 }: Props) {
  const reduceMotion = useReduceMotionFlag();
  const dash = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.timing(dash, {
        toValue: -600,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [dash, reduceMotion]);

  if (reduceMotion) return null;

  const midY = height * 0.5;
  const d = `M-20,${midY} C40,${height * 0.17} 80,${height * 0.83} 140,${midY} S220,${height * 0.08} 280,${midY} S360,${height * 0.92} 420,${midY}`;

  return (
    <View style={[styles.wrap, { height }]} pointerEvents="none" accessibilityElementsHidden>
      <Svg width="100%" height={height} viewBox={`0 0 400 ${height}`} preserveAspectRatio="none">
        <AnimatedPath
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray="12 8"
          strokeDashoffset={dash}
          opacity={0.6}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, top: 0, zIndex: 0 },
});
