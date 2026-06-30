import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { SPACING_TOKENS } from '../../theme/themeHelpers';

type Props = ViewProps;

/** Standard screen horizontal inset — replaces repeated padding: 16. */
export function ScreenContainer({ style, children, ...rest }: Props) {
  return (
    <View style={[styles.container, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING_TOKENS.base,
  },
});
