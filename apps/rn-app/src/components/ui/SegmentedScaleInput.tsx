import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { surfaceBorderMuted, surfaceCardSolid } from '../../theme/themeHelpers';

type Props = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  accessibilityLabel?: string;
  testID?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Horizontal 1–N number pills. Hit targets are at least 44×44. */
export function SegmentedScaleInput({
  value,
  onChange,
  min = 1,
  max = 10,
  accessibilityLabel = 'Scale',
  testID,
}: Props) {
  const theme = useTheme();
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const current = clamp(value, lo, hi);
  const values = useMemo(() => {
    const out: number[] = [];
    for (let n = lo; n <= hi; n += 1) out.push(n);
    return out;
  }, [lo, hi]);

  const border = surfaceBorderMuted(theme);
  const onPress = useCallback(
    (n: number) => {
      onChange(clamp(n, lo, hi));
    },
    [hi, lo, onChange],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      contentContainerStyle={styles.row}
    >
      {values.map((n) => {
        const active = n === current;
        return (
          <Pressable
            key={n}
            onPress={() => onPress(n)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${accessibilityLabel} ${n}`}
            style={[
              styles.btn,
              {
                borderColor: active ? theme.color.accent : border,
                backgroundColor: active ? theme.color.accent + '33' : surfaceCardSolid(theme),
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: active ? theme.color.accent : theme.color.textPrimary },
              ]}
            >
              {n}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  btn: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default SegmentedScaleInput;
