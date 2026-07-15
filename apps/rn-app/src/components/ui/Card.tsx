import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { SPACING_TOKENS, surfaceBorderMuted, surfaceCardSolid } from '../../theme/themeHelpers';

export function Card({ style, children, ...rest }: ViewProps) {
  const theme = useTheme();
  const radius = theme.radius?.xl ?? theme.radius?.lg ?? 24;
  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: radius,
          padding: SPACING_TOKENS.base,
          marginBottom: SPACING_TOKENS.md,
          backgroundColor: surfaceCardSolid(theme),
          borderColor: surfaceBorderMuted(theme),
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
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
});
