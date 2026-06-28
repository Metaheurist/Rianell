import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CHAPTER_SPRING_LAYOUT = {
  duration: 300,
  create: {
    type: LayoutAnimation.Types.spring,
    property: LayoutAnimation.Properties.opacity,
    springDamping: 0.72,
  },
  update: {
    type: LayoutAnimation.Types.spring,
    springDamping: 0.72,
  },
  delete: {
    type: LayoutAnimation.Types.spring,
    property: LayoutAnimation.Properties.opacity,
    springDamping: 0.72,
  },
};

type Props = {
  title: string;
  iconName: keyof typeof Ionicons.glyphMap;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function SettingsChapter({ title, iconName, defaultOpen = false, children }: Props) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(defaultOpen);
  const rotation = useRef(new Animated.Value(defaultOpen ? 0 : -90)).current;

  useEffect(() => {
    Animated.spring(rotation, {
      toValue: expanded ? 0 : -90,
      friction: 8,
      tension: 180,
      useNativeDriver: true,
    }).start();
  }, [expanded, rotation]);

  const toggle = () => {
    LayoutAnimation.configureNext(CHAPTER_SPRING_LAYOUT);
    setExpanded((v) => !v);
  };

  const hint = expanded
    ? `Tap to collapse ${title} settings`
    : `Tap to expand ${title} settings`;

  return (
    <View style={styles.chapter}>
      <Pressable
        onPress={toggle}
        style={[styles.header, { borderBottomColor: theme.color.accent + '22' }]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={title}
        accessibilityHint={hint}
        hitSlop={8}
      >
        <Ionicons name={iconName} size={20} color={theme.color.accent} />
        <Text style={[styles.title, { color: theme.color.text, flex: 1 }]}>{title}</Text>
        <Animated.View style={{ transform: [{ rotate: rotation.interpolate({
          inputRange: [-90, 0],
          outputRange: ['-90deg', '0deg'],
        }) }] }}>
          <Ionicons name="chevron-down-outline" size={20} color={theme.color.text + 'aa'} />
        </Animated.View>
      </Pressable>
      {expanded ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chapter: { marginBottom: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  title: { fontSize: 16, fontWeight: '600' },
  content: { paddingTop: 8, paddingBottom: 4 },
});
