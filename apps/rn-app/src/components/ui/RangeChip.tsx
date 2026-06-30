import React from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { SPACING_TOKENS } from '../../theme/themeHelpers';

type Props = {
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function RangeChip({ label, onPress, active, disabled, style }: Props) {
  const theme = useTheme();
  const radius = theme.radius?.full ?? 999;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderRadius: radius,
          paddingVertical: SPACING_TOKENS.sm,
          paddingHorizontal: SPACING_TOKENS.md,
          backgroundColor: active ? theme.color.accent + '33' : 'transparent',
          borderColor: theme.color.accent + (active ? '88' : '44'),
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.label, { color: theme.color.accent, fontWeight: active ? '800' : '600' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 14,
  },
});
