import React, { useMemo } from 'react';
import { Animated, Easing, StyleSheet, Text, View, useColorScheme } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { getTokens } from '@rianell/tokens';

type Props = {
  /** When preferences are not loaded yet, defaults to mint (web parity). */
  team?: string;
  colorblindMode?: string;
};

/**
 * RN port of the web loading overlay motif; colors from @rianell/tokens loader + color palette.
 */
export function BootLoadingScreen({ team = 'mint', colorblindMode = 'none' }: Props) {
  const scheme = useColorScheme() === 'light' ? 'light' : 'dark';
  const tokens = useMemo(
    () => getTokens({ team, mode: scheme, colorblindMode }),
    [team, scheme, colorblindMode]
  );

  const orbitRotate = React.useRef(new Animated.Value(0)).current;
  const bodyPulse = React.useRef(new Animated.Value(0)).current;
  const sunWobble = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
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

  const L = tokens.loader;
  const bg =
    typeof tokens.color.background === 'string' && !tokens.color.background.includes('gradient')
      ? tokens.color.background
      : L.shellBg;

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <View style={styles.stage}>
        <Svg width={164} height={164} style={StyleSheet.absoluteFill} accessibilityElementsHidden>
          <Circle cx={82} cy={82} r={66} stroke={scheme === 'light' ? L.mid : 'rgba(255,255,255,0.16)'} strokeWidth={6} fill="none" strokeOpacity={scheme === 'light' ? 0.35 : 1} />
          <Circle cx={82} cy={82} r={66} stroke={L.primary} strokeWidth={6} fill="none" strokeOpacity={0.38} />
        </Svg>
        <Animated.View style={[styles.orbitTrack, { transform: [{ rotate: orbitDeg }] }]}>
          <Animated.View
            style={[
              styles.orbitBody,
              {
                backgroundColor: L.primary,
                borderColor: L.bright,
                transform: [{ scale: pulseScale }],
                shadowColor: L.primary,
              },
            ]}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.sun,
            {
              backgroundColor: L.bright,
              borderColor: L.mid,
              transform: [{ translateY: sunShiftY }],
              shadowColor: L.deep,
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
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  text: { marginTop: 22, fontSize: 16, fontWeight: '700', opacity: 0.95 },
});
