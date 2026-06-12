import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
  disabled?: boolean;
};

export function PrimaryButton({ label, onPress, variant = 'primary', style, disabled }: Props) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        isPrimary
          ? { backgroundColor: theme.color.accent, borderColor: theme.color.accent }
          : { backgroundColor: 'rgba(18,20,21,0.97)', borderColor: theme.color.accent + '44' },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, { color: isPrimary ? '#041008' : theme.color.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  label: { fontWeight: '600', fontSize: 16 },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  disabled: { opacity: 0.5 },
});
