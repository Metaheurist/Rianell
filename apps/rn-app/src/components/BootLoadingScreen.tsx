import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, useColorScheme } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { getTokens } from '@rianell/tokens';

/**
 * RN port of the web loading overlay motif:
 * - orbit ring progress host
 * - rotating orbit body
 * - central sun with subtle wobble
 * Colors are tokenized from the same team/mode token system.
 */
export function BootLoadingScreen() {
  const scheme = useColorScheme() === 'light' ? 'light' : 'dark';
  const tokens = useMemo(() => getTokens({ team: 'mint', mode: scheme, colorblindMode: 'none' }), [scheme]);

  const orbitRotate = useRef(new Animated.Value(0)).current;
  const bodyPulse = useRef(new Animated.Value(0)).current;
  const sunWobble = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const orbitLoop = Animated.loop(
      Animated.timing(orbitRotate, {
        toValue: 1,
        duration: 2800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bodyPulse, { toValue: 1, duration: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bodyPulse, { toValue: 0, duration: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    const wobbleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sunWobble, { toValue: 1, duration: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(sunWobble, { toValue: -1, duration: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(sunWobble, { toValue: 0, duration: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    orbitLoop.start();
    pulseLoop.start();
    wobbleLoop.start();
    return () => {
      orbitLoop.stop();
      pulseLoop.stop();
      wobbleLoop.stop();
    };
  }, [bodyPulse, orbitRotate, sunWobble]);

  const orbitDeg = orbitRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const pulseScale = bodyPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });
  const sunShiftY = sunWobble.interpolate({ inputRange: [-1, 0, 1], outputRange: [2, 0, -2] });

  return (
    <View style={[styles.root, { backgroundColor: tokens.color.background === 'transparent' ? '#101513' : '#101513' }]}>
      <View style={styles.stage}>
        <Svg width={164} height={164} style={StyleSheet.absoluteFill} accessibilityElementsHidden>
          <Circle cx={82} cy={82} r={66} stroke="rgba(255,255,255,0.16)" strokeWidth={6} fill="none" />
          <Circle cx={82} cy={82} r={66} stroke={tokens.color.accent} strokeWidth={6} fill="none" strokeOpacity={0.38} />
        </Svg>
        <Animated.View style={[styles.orbitTrack, { transform: [{ rotate: orbitDeg }] }]}>
          <Animated.View
            style={[
              styles.orbitBody,
              {
                backgroundColor: tokens.color.accent,
                borderColor: 'rgba(255,255,255,0.45)',
                transform: [{ scale: pulseScale }],
                shadowColor: tokens.color.accent,
              },
            ]}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.sun,
            {
              backgroundColor: '#f4fff2',
              borderColor: 'rgba(255,255,255,0.65)',
              transform: [{ translateY: sunShiftY }],
            },
          ]}
        />
      </View>
      <Text style={[styles.text, { color: tokens.color.text }]}>Loading Rianell...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stage: { width: 164, height: 164, alignItems: 'center', justifyContent: 'center' },
  orbitTrack: { position: 'absolute', width: 132, height: 132, alignItems: 'flex-start', justifyContent: 'center' },
  orbitBody: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 5,
  },
  sun: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  text: { marginTop: 22, fontSize: 16, fontWeight: '700', opacity: 0.95 },
});

