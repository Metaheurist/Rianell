import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { loadLogs } from '../storage/logs';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function HomeScreen() {
  const theme = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const bg = theme.tokens.color.background === 'linear-gradient(135deg, #a8e6cf 0%, #c8e6c9 25%, #e8f5e8 75%, #f1f8e9 100%)' ? '#ffffff' : theme.tokens.color.background;

  const [loggedToday, setLoggedToday] = useState<boolean | null>(null);

  const refreshToday = useCallback(() => {
    const d = todayIso();
    loadLogs()
      .then((logs) => setLoggedToday(logs.some((l) => l.date === d)))
      .catch(() => setLoggedToday(false));
  }, []);

  useEffect(() => {
    refreshToday();
  }, [refreshToday]);

  useFocusEffect(
    useCallback(() => {
      refreshToday();
    }, [refreshToday])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.card}>
        <Text style={[styles.title, { color: theme.tokens.color.accent, fontSize: theme.font(22) }]}>Rianell</Text>
        <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(16) }]}>
          {loggedToday === null
            ? 'Loading today’s status…'
            : loggedToday
              ? 'You have logged today. Open View logs to browse or edit entries.'
              : 'No log for today yet. Tap + to record how you feel.'}
        </Text>
      </View>

      <View style={[styles.fabWrap, { bottom: tabBarHeight + 16 }]}>
        <Pressable
          onPress={() => navigation.navigate('LogWizard')}
          style={[styles.fab, { backgroundColor: theme.tokens.color.accent }]}
          accessibilityRole="button"
          accessibilityLabel="Log today, Beta"
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
        <View style={styles.betaBadge} pointerEvents="none" accessibilityElementsHidden>
          <Text style={styles.betaBadgeText}>Beta</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { borderRadius: 16, padding: 16, backgroundColor: 'rgba(0,0,0,0.18)' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  text: { fontSize: 16, opacity: 0.95 },
  fabWrap: {
    position: 'absolute',
    right: 24,
    width: 56,
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
  },
  fabText: { color: '#fff', fontSize: 30, fontWeight: '300', lineHeight: 34 },
  betaBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  betaBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
