import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function Chip({ label, selected, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={() => {
        if (onPress) {
          void Haptics.selectionAsync();
          onPress();
        }
      }}
      style={[
        styles.chip,
        {
          borderColor: selected ? theme.color.accent : theme.color.accent + '33',
          backgroundColor: selected ? theme.color.accent + '22' : 'rgba(18,20,21,0.97)',
        },
      ]}
    >
      <Text style={{ color: theme.color.text, fontWeight: selected ? '700' : '500' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
});
