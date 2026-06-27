import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type Props = {
  displayValue: string;
  dateLabel: string;
  actionLabel: string;
  accessibilityLabel: string;
  onPress: () => void;
};

export function VitalsLastValueHint({
  displayValue,
  dateLabel,
  actionLabel,
  accessibilityLabel,
  onPress,
}: Props) {
  const theme = useTheme();
  const accent = theme.tokens.color.accent;
  const accentSoft = `${accent}22`;
  const accentBorder = `${accent}55`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrap,
        {
          backgroundColor: accentSoft,
          borderColor: accentBorder,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={[styles.iconBadge, { backgroundColor: `${accent}33` }]}>
        <Text style={[styles.iconGlyph, { color: accent, fontSize: theme.font(13) }]} accessibilityElementsHidden>
          ↩
        </Text>
      </View>
      <View style={styles.copy}>
        <Text style={[styles.value, { color: theme.tokens.color.text, fontSize: theme.font(13) }]} numberOfLines={1}>
          {displayValue}
        </Text>
        <Text style={[styles.date, { color: theme.tokens.color.text, fontSize: theme.font(11) }]} numberOfLines={1}>
          {dateLabel}
        </Text>
      </View>
      <View style={[styles.actionPill, { borderColor: accentBorder, backgroundColor: `${accent}28` }]}>
        <Text style={[styles.actionText, { color: accent, fontSize: theme.font(11) }]}>{actionLabel}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 10,
    marginTop: 6,
    marginBottom: 10,
    maxWidth: '100%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    fontWeight: '700',
    lineHeight: 16,
  },
  copy: {
    flexShrink: 1,
    minWidth: 0,
    gap: 2,
  },
  value: {
    fontWeight: '600',
  },
  date: {
    opacity: 0.85,
  },
  actionPill: {
    flexShrink: 0,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  actionText: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
