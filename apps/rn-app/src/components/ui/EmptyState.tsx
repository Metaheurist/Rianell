import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { PrimaryButton } from './PrimaryButton';

type Props = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, message, actionLabel, onAction }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: theme.color.text }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: theme.color.text + 'cc' }]}>{message}</Text> : null}
      {actionLabel && onAction ? <PrimaryButton label={actionLabel} onPress={onAction} style={styles.btn} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 15, textAlign: 'center', marginBottom: 16, lineHeight: 22 },
  btn: { minWidth: 160 },
});
