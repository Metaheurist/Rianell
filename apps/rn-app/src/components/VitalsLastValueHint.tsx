import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type Props = {
  label: string;
  onPress: () => void;
};

export function VitalsLastValueHint({ label, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.wrap}
    >
      <Text style={[styles.text, { color: theme.tokens.color.accent, fontSize: theme.font(12) }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 8,
    maxWidth: '100%',
  },
  text: {
    fontStyle: 'italic',
    textDecorationLine: 'underline',
  },
});
