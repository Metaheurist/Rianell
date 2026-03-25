import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

export function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const bg = theme.tokens.color.background === 'linear-gradient(135deg, #a8e6cf 0%, #c8e6c9 25%, #e8f5e8 75%, #f1f8e9 100%)' ? '#ffffff' : theme.tokens.color.background;
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.card}>
        <Text style={[styles.title, { color: theme.tokens.color.accent, fontSize: theme.font(22) }]}>Rianell</Text>
        <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(16) }]}>
          Expo scaffold running. Next: port screens + parity checklist.
        </Text>

        <Pressable
          onPress={() => navigation.navigate('LogWizard')}
          style={styles.button}
          accessibilityRole="button"
          accessibilityLabel="Open log wizard"
        >
          <Text style={[styles.buttonText, { fontSize: theme.font(14) }]}>Log today</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { borderRadius: 16, padding: 16, backgroundColor: 'rgba(0,0,0,0.18)' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  text: { fontSize: 16, opacity: 0.95 },
  button: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  buttonText: { color: '#fff', fontWeight: '900' },
});

