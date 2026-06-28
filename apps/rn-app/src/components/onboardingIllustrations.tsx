import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const AnimatedView = Animated.createAnimatedComponent(View);

type IllustrationProps = {
  name: string;
  color: string;
  size?: number;
};

function Mascot({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      <Circle cx="48" cy="48" r="40" stroke={color} strokeWidth="2.5" fill="none" />
      <Circle cx="36" cy="42" r="4" fill={color} />
      <Circle cx="60" cy="42" r="4" fill={color} />
      <Path d="M34 58 Q48 70 62 58" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function Coach({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path d="M8 36V14l16-8 16 8v22" stroke={color} strokeWidth="2" fill="none" />
      <Path d="M18 36V24h12v12" stroke={color} strokeWidth="2" fill="none" />
      <Circle cx="24" cy="18" r="4" fill={color} />
    </Svg>
  );
}

function Helper({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        d="M24 6l4 10h10l-8 6 3 10-9-6-9 6 3-10-8-6h10z"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function Shield({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path d="M24 4L8 10v12c0 10 7 16 16 20 9-4 16-10 16-20V10L24 4z" stroke={color} strokeWidth="2" fill="none" />
      <Path d="M18 24l4 4 8-8" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function Cookie({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Circle cx="24" cy="24" r="18" stroke={color} strokeWidth="2" fill="none" />
      <Circle cx="18" cy="20" r="2" fill={color} />
      <Circle cx="28" cy="18" r="2" fill={color} />
      <Circle cx="30" cy="28" r="2" fill={color} />
      <Circle cx="20" cy="30" r="2" fill={color} />
    </Svg>
  );
}

function Sparkle({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path d="M24 4v8M24 36v8M4 24h8M36 24h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function Brain({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 4.2A3.2 3.2 0 0 0 5.8 7.4v.1A3.5 3.5 0 0 0 5 14a4 4 0 0 0 4 4h1V4.2Z" stroke={color} fill="none" />
      <Path d="M15 4.2a3.2 3.2 0 0 1 3.2 3.2v.1A3.5 3.5 0 0 1 19 14a4 4 0 0 1-4 4h-1V4.2Z" stroke={color} fill="none" />
    </Svg>
  );
}

function Heart({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        d="M24 38S8 28 8 18a8 8 0 0 1 16 0 8 8 0 0 1 16 0c0 10-16 20-16 20z"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
    </Svg>
  );
}

function Bell({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path d="M10 32h28l-4-8a12 12 0 1 0-20 0l-4 8z" stroke={color} strokeWidth="2" fill="none" />
      <Path d="M20 36v2a4 4 0 0 0 8 0v-2" stroke={color} strokeWidth="2" fill="none" />
    </Svg>
  );
}

function Install({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Rect x="10" y="6" width="28" height="36" rx="4" stroke={color} strokeWidth="2" fill="none" />
      <Path d="M24 16v12M18 26l6 6 6-6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function Celebrate({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        d="M24 8l3 9h9l-7 5 3 9-8-6-8 6 3-9-7-5h9z"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function Globe({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="9" stroke={color} fill="none" />
      <Path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" stroke={color} fill="none" />
    </Svg>
  );
}

const ILLUSTRATIONS: Record<string, React.FC<{ color: string; size: number }>> = {
  'mascot-wave': Mascot,
  globe: Globe,
  coach: Coach,
  helper: Helper,
  shield: Shield,
  cookie: Cookie,
  sparkle: Sparkle,
  brain: Brain,
  heart: Heart,
  bell: Bell,
  install: Install,
  celebrate: Celebrate,
};

export function OnboardingIllustration({ name, color, size = 88 }: IllustrationProps) {
  const Comp = ILLUSTRATIONS[name] || Mascot;
  const sway = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(sway, { toValue: -1, duration: 1500, useNativeDriver: true }),
      ]),
    );
    if (name === 'mascot-wave' || name === 'celebrate') loop.start();
    return () => loop.stop();
  }, [name, sway]);

  const rotate = sway.interpolate({ inputRange: [-1, 1], outputRange: ['-3deg', '3deg'] });

  return (
    <AnimatedView style={[styles.wrap, name === 'mascot-wave' ? { transform: [{ rotate }] } : undefined]}>
      <Comp color={color} size={size} />
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
});
