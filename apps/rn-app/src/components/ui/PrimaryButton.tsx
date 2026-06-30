import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';
import { SPACING_TOKENS, onAccentText } from '../../theme/themeHelpers';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function PrimaryButton({ label, onPress, variant = 'primary', style, disabled, accessibilityLabel }: Props) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  const scale = useRef(new Animated.Value(1)).current;
  const radius = theme.radius?.sm ?? 8;

  const springTo = (toValue: number) => {
    Animated.spring(scale, { toValue, friction: 12, tension: 200, useNativeDriver: true }).start();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled}
      onPressIn={() => {
        if (!disabled) springTo(0.95);
      }}
      onPressOut={() => springTo(1)}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[styles.base, disabled && styles.disabled, style]}
    >
      <Animated.View
        style={[
          styles.inner,
          {
            borderRadius: radius,
            paddingVertical: SPACING_TOKENS.md,
            paddingHorizontal: SPACING_TOKENS.base,
          },
          isPrimary
            ? { backgroundColor: theme.color.accent, borderColor: theme.color.accent }
            : { backgroundColor: 'rgba(18,20,21,0.97)', borderColor: theme.color.accent + '44' },
          { transform: [{ scale }] },
        ]}
      >
        <Text style={[styles.label, { color: isPrimary ? onAccentText() : theme.color.text }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignSelf: 'stretch' },
  inner: {
    borderWidth: 1,
    alignItems: 'center',
  },
  label: { fontWeight: '600', fontSize: 16 },
  disabled: { opacity: 0.5 },
});
