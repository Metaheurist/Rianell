import React, { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useReduceMotionFlag } from '../../hooks/useReduceMotionFlag';
import { SPACING_TOKENS, surfaceBorderMuted, surfaceCardSolid } from '../../theme/themeHelpers';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  title: string;
  children: React.ReactNode;
  /** Optional blocks default closed (Phase 1). */
  defaultOpen?: boolean;
  testID?: string;
};

/** Flat single-layer accordion for optional data entry. */
export function Accordion({ title, children, defaultOpen = false, testID }: Props) {
  const theme = useTheme();
  const reduceMotion = useReduceMotionFlag();
  const [expanded, setExpanded] = useState(defaultOpen);

  const toggle = () => {
    if (!reduceMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setExpanded((v) => !v);
  };

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        {
          backgroundColor: surfaceCardSolid(theme),
          borderColor: surfaceBorderMuted(theme),
          borderRadius: theme.radius?.xl ?? 24,
        },
      ]}
    >
      <Pressable
        onPress={toggle}
        style={styles.summary}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={title}
        accessibilityHint={expanded ? `Collapse ${title}` : `Expand ${title}`}
      >
        <Text style={[styles.title, { color: theme.color.textPrimary }]}>{title}</Text>
        <Text style={[styles.chevron, { color: theme.color.textSecondary }]}>
          {expanded ? '‹' : '›'}
        </Text>
      </Pressable>
      {expanded ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    marginBottom: SPACING_TOKENS.md,
    overflow: 'hidden',
    // subtle single-layer elevation
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  summary: {
    minHeight: 44,
    paddingHorizontal: SPACING_TOKENS.base,
    paddingVertical: SPACING_TOKENS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    paddingRight: SPACING_TOKENS.sm,
  },
  chevron: {
    fontSize: 18,
    opacity: 0.6,
  },
  body: {
    paddingHorizontal: SPACING_TOKENS.base,
    paddingBottom: SPACING_TOKENS.base,
  },
});

export default Accordion;
