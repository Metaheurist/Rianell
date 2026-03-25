import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { loadLogs, makeSampleLog, saveLogs, migrateLegacyLogsIfNeeded, type LogEntry } from '../storage/logs';

export function LogsScreen({ reloadKey }: { reloadKey?: number }) {
  const theme = useTheme();
  const bg =
    theme.tokens.color.background ===
    'linear-gradient(135deg, #a8e6cf 0%, #c8e6c9 25%, #e8f5e8 75%, #f1f8e9 100%)'
      ? '#ffffff'
      : theme.tokens.color.background;

  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    migrateLegacyLogsIfNeeded()
      .then(() => loadLogs())
      .then(setLogs)
      .catch(() => setLogs([]));
  }, [reloadKey]);

  async function addSample() {
    setLogs((prev) => {
      const next = [makeSampleLog(), ...prev];
      saveLogs(next).catch(() => {});
      return next;
    });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.card}>
        <Text style={[styles.title, { color: theme.tokens.color.accent, fontSize: theme.font(22) }]}>View Logs</Text>

        <Pressable onPress={addSample} style={styles.button} accessibilityRole="button" accessibilityLabel="Add sample log">
          <Text style={[styles.buttonText, { fontSize: theme.font(14) }]}>Add sample log</Text>
        </Pressable>

        {logs.length === 0 ? (
          <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(16) }]}>
            No logs yet.
          </Text>
        ) : (
          <FlatList
            data={logs}
            keyExtractor={(item, idx) => `${item.date}-${idx}`}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={[styles.rowTitle, { color: theme.tokens.color.text, fontSize: theme.font(15) }]}>{item.date}</Text>
                <Text style={[styles.rowMeta, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
                  {item.flare ? `Flare ${item.flare}` : 'Flare —'} · {item.bpm != null ? `BPM ${item.bpm}` : 'BPM —'} ·{' '}
                  {item.sleep != null ? `Sleep ${item.sleep}` : 'Sleep —'} · {item.mood != null ? `Mood ${item.mood}` : 'Mood —'}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { borderRadius: 16, padding: 16, backgroundColor: 'rgba(0,0,0,0.18)' },
  title: { fontWeight: '700', marginBottom: 8 },
  text: { opacity: 0.95 },
  button: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 12,
  },
  buttonText: { color: '#fff', fontWeight: '700' },
  row: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  rowTitle: { fontWeight: '700' },
  rowMeta: { opacity: 0.85, marginTop: 2 },
});

