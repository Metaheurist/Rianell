import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { SPACING_TOKENS, accentAlpha, surfaceCardSolid } from '../../theme/themeHelpers';

export function Card({ style, children, ...rest }: ViewProps) {
  const theme = useTheme();
  const radius = theme.radius?.lg ?? 16;
  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: radius,
          padding: SPACING_TOKENS.base,
          marginBottom: SPACING_TOKENS.md,
          backgroundColor: surfaceCardSolid(theme),
          borderColor: accentAlpha(theme, '33'),
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
  },
});
