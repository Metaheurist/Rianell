import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export function Card({ style, children, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.color.background === '#070807' ? 'rgba(22,24,26,0.88)' : 'rgba(255,255,255,0.95)',
          borderColor: theme.color.accent + '33',
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
});
