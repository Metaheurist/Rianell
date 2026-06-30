import React from 'react';
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { SPACING_TOKENS, surfaceCard, type ThemeSlice } from '../../theme/themeHelpers';

type CardStyleOptions = { flex?: boolean; compact?: boolean; paddingEnd?: number };

export function screenCardStyle(theme: ThemeSlice, options?: CardStyleOptions): ViewStyle {
  const radius = theme.radius?.lg ?? 16;
  const pad = options?.compact ? SPACING_TOKENS.md : SPACING_TOKENS.base;
  return {
    borderRadius: radius,
    padding: pad,
    paddingEnd: options?.paddingEnd,
    backgroundColor: surfaceCard(theme),
    marginBottom: SPACING_TOKENS.md,
    ...(options?.flex ? { flex: 1 } : {}),
  };
}

type Props = ViewProps & {
  flex?: boolean;
  compact?: boolean;
};

/** Shared screen card scaffold — replaces duplicated rgba(0,0,0,0.18) blocks. */
export function ScreenCard({ style, children, flex, compact, ...rest }: Props) {
  const theme = useTheme();
  return (
    <View style={[screenCardStyle(theme, { flex, compact }), style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({});
