import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import {
  filterLogsByRange,
  replaceLogEntryByDate,
  sortLogsByDate,
  type LogRangePreset,
  type LogSortOrder,
} from '../logs/logsViewHelpers';
import {
  loadLogs,
  makeSampleLog,
  saveLogs,
  migrateLegacyLogsIfNeeded,
  type LogEntry,
} from '../storage/logs';

const RANGE_PRESETS: { key: LogRangePreset; label: string; a11y: string }[] = [
  { key: 'today', label: 'Today', a11y: 'Date range, today' },
  { key: 7, label: '7d', a11y: 'Date range, last 7 days' },
  { key: 30, label: '30d', a11y: 'Date range, last 30 days' },
  { key: 90, label: '90d', a11y: 'Date range, last 90 days' },
  { key: 'all', label: 'All', a11y: 'Date range, all entries' },
];

// Approximate fixed row height used by FlatList virtualization hints.
const LOG_ROW_HEIGHT = 104;

function listPreview(items: unknown, max = 3): string {
  if (!Array.isArray(items) || !items.length) return '—';
  const parts = items
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .slice(0, max);
  if (!parts.length) return '—';
  return parts.join(', ') + (items.length > max ? '…' : '');
}

function foodPreview(entry: LogEntry): string {
  const food = entry.food;
  if (!food) return '—';
  const all = [
    ...(Array.isArray(food.breakfast) ? food.breakfast : []),
    ...(Array.isArray(food.lunch) ? food.lunch : []),
    ...(Array.isArray(food.dinner) ? food.dinner : []),
    ...(Array.isArray(food.snack) ? food.snack : []),
  ];
  return listPreview(all, 4);
}

function exercisePreview(entry: LogEntry): string {
  if (!Array.isArray(entry.exercise) || !entry.exercise.length) return '—';
  const names = entry.exercise
    .map((item: unknown) => {
      if (!item || typeof item !== 'object') return '';
      const ex = item as { name?: unknown; duration?: unknown };
      if (typeof ex.name !== 'string') return '';
      return typeof ex.duration === 'number' ? `${ex.name}:${ex.duration}` : ex.name;
    })
    .filter(Boolean);
  return listPreview(names, 3);
}

export function LogsScreen({ reloadKey }: { reloadKey?: number }) {
  const theme = useTheme();
  const bg =
    theme.tokens.color.background ===
    'linear-gradient(135deg, #a8e6cf 0%, #c8e6c9 25%, #e8f5e8 75%, #f1f8e9 100%)'
      ? '#ffffff'
      : theme.tokens.color.background;

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [range, setRange] = useState<LogRangePreset>(30);
  const [sortOrder, setSortOrder] = useState<LogSortOrder>('newest');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null);
  const [isEditingEntry, setIsEditingEntry] = useState(false);
  const [editDraft, setEditDraft] = useState<LogEntry | null>(null);

  const load = React.useCallback(async () => {
    try {
      const next = await loadLogs();
      setLogs(next);
    } catch {
      setLogs([]);
    }
  }, []);

  useEffect(() => {
    migrateLegacyLogsIfNeeded()
      .then(() => load())
      .catch(() => setLogs([]));
  }, [reloadKey, load]);

  const rangeFiltered = useMemo(() => filterLogsByRange(logs, range), [logs, range]);

  const displayed = useMemo(() => {
    const sorted = sortLogsByDate(rangeFiltered, sortOrder);
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((item) => {
      const haystack = [
        item.date,
        item.notes,
        item.painLocation,
        item.flare,
        ...(Array.isArray(item.symptoms) ? item.symptoms : []),
        ...(Array.isArray(item.stressors) ? item.stressors : []),
      ]
        .filter((v) => typeof v === 'string' && v.trim())
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rangeFiltered, sortOrder, search]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const listTuning = useMemo(() => {
    if (displayed.length >= 500) {
      return { initialNumToRender: 20, maxToRenderPerBatch: 12, windowSize: 9 };
    }
    if (displayed.length >= 200) {
      return { initialNumToRender: 16, maxToRenderPerBatch: 10, windowSize: 8 };
    }
    return { initialNumToRender: 12, maxToRenderPerBatch: 8, windowSize: 7 };
  }, [displayed.length]);

  async function addSample() {
    setLogs((prev) => {
      const next = [makeSampleLog(), ...prev];
      saveLogs(next).catch(() => {});
      return next;
    });
  }

  async function shareEntry(entry: LogEntry) {
    const payload = [
      `Date: ${entry.date}`,
      `Flare: ${entry.flare ?? '—'}`,
      `BPM: ${entry.bpm ?? '—'}`,
      `Sleep: ${entry.sleep ?? '—'}`,
      `Mood: ${entry.mood ?? '—'}`,
      `Fatigue: ${entry.fatigue ?? '—'}`,
      entry.notes ? `Notes: ${entry.notes}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    await Share.share({ message: payload, title: `Rianell log ${entry.date}` });
  }

  function deleteEntry(entry: LogEntry) {
    Alert.alert('Delete entry?', `This will remove ${entry.date} from this device.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setLogs((prev) => {
            const next = prev.filter((x) => x.date !== entry.date);
            saveLogs(next).catch(() => {});
            return next;
          });
          setSelectedEntry(null);
        },
      },
    ]);
  }

  function openEntry(entry: LogEntry) {
    setSelectedEntry(entry);
    setIsEditingEntry(false);
    setEditDraft(entry);
  }

  const renderLogItem = useCallback(
    ({ item }: { item: LogEntry }) => (
      <Pressable
        style={styles.row}
        onPress={() => openEntry(item)}
        accessibilityRole="button"
        accessibilityLabel={`Open log entry ${item.date}`}
      >
        <Text style={[styles.rowTitle, { color: theme.tokens.color.text, fontSize: theme.font(15) }]}>
          {item.date}
        </Text>
        <Text style={[styles.rowMeta, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
          {item.flare ? `Flare ${item.flare}` : 'Flare —'} · {item.bpm != null ? `BPM ${item.bpm}` : 'BPM —'} ·{' '}
          {item.sleep != null ? `Sleep ${item.sleep}` : 'Sleep —'} · {item.mood != null ? `Mood ${item.mood}` : 'Mood —'}
        </Text>
        <Text style={[styles.rowDetail, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
          Symptoms: {listPreview(item.symptoms)} · Stressors: {listPreview(item.stressors)}
        </Text>
        <Text style={[styles.rowDetail, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
          Food: {foodPreview(item)} · Exercise: {exercisePreview(item)}
        </Text>
      </Pressable>
    ),
    [theme.tokens.color.text, theme]
  );

  function startEditing() {
    if (!selectedEntry) return;
    setEditDraft(selectedEntry);
    setIsEditingEntry(true);
  }

  function cancelEditing() {
    setIsEditingEntry(false);
    setEditDraft(selectedEntry);
  }

  function updateDraft(patch: Partial<LogEntry>) {
    setEditDraft((prev: LogEntry | null) => (prev ? { ...prev, ...patch } : prev));
  }

  async function saveEditedEntry() {
    if (!selectedEntry || !editDraft) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(editDraft.date.trim())) {
      Alert.alert('Validation', 'Date must be YYYY-MM-DD');
      return;
    }
    const nextEntry: LogEntry = {
      ...selectedEntry,
      ...editDraft,
      date: editDraft.date.trim(),
      bpm:
        typeof editDraft.bpm === 'number' && Number.isFinite(editDraft.bpm)
          ? editDraft.bpm
          : undefined,
      sleep:
        typeof editDraft.sleep === 'number' && Number.isFinite(editDraft.sleep)
          ? editDraft.sleep
          : undefined,
      mood:
        typeof editDraft.mood === 'number' && Number.isFinite(editDraft.mood)
          ? editDraft.mood
          : undefined,
      fatigue:
        typeof editDraft.fatigue === 'number' && Number.isFinite(editDraft.fatigue)
          ? editDraft.fatigue
          : undefined,
      notes: editDraft.notes?.trim() || '',
      flare: editDraft.flare === 'Yes' ? 'Yes' : 'No',
    };
    setLogs((prev) => {
      const next = replaceLogEntryByDate(prev, selectedEntry.date, nextEntry);
      saveLogs(next).catch(() => {});
      return next;
    });
    setSelectedEntry(nextEntry);
    setEditDraft(nextEntry);
    setIsEditingEntry(false);
  }

  const accent = theme.tokens.color.accent;
  const chipBase = [styles.chip, { borderColor: accent }];
  const chipText = (active: boolean) => [
    styles.chipLabel,
    { color: active ? '#0a0a0a' : theme.tokens.color.text, fontSize: theme.font(13) },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.card}>
        <Text style={[styles.title, { color: accent, fontSize: theme.font(22) }]}>View Logs</Text>
        <Text style={[styles.lead, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>
          Filter by date range and sort (same shortcuts as web: Today / 7 / 30 / 90 / All).
        </Text>

        <Text style={[styles.sectionLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
          Date range
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {RANGE_PRESETS.map(({ key, label, a11y }) => {
            const active = range === key;
            return (
              <Pressable
                key={String(key)}
                onPress={() => setRange(key)}
                style={[...chipBase, active && { backgroundColor: accent }]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={a11y}
              >
                <Text style={chipText(active)}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sortRow}>
          <Text style={[styles.sectionLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
            Sort
          </Text>
          <View style={styles.sortBtns}>
            {(['newest', 'oldest'] as const).map((ord) => {
              const active = sortOrder === ord;
              return (
                <Pressable
                  key={ord}
                  onPress={() => setSortOrder(ord)}
                  style={[styles.sortChip, ...chipBase, active && { backgroundColor: accent }]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={ord === 'newest' ? 'Sort, newest first' : 'Sort, oldest first'}
                >
                  <Text style={chipText(active)}>{ord === 'newest' ? 'Newest' : 'Oldest'}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <Text style={[styles.sectionLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>Filter</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search notes, symptoms, stressors..."
          placeholderTextColor="rgba(255,255,255,0.45)"
          style={[styles.input, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Filter logs text"
        />

        {__DEV__ ? (
          <Pressable onPress={addSample} style={styles.devButton} accessibilityRole="button" accessibilityLabel="Add sample log">
            <Text style={[styles.devButtonText, { fontSize: theme.font(13) }]}>Add sample log (dev)</Text>
          </Pressable>
        ) : null}

        {logs.length > 0 ? (
          <Text
            style={[styles.countLine, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}
            accessibilityLiveRegion="polite"
          >
            {`Showing ${displayed.length} of ${rangeFiltered.length} entries`}
          </Text>
        ) : null}

        {displayed.length === 0 && rangeFiltered.length > 0 && search.trim() ? (
          <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(15) }]}>
            No entries match this filter.
          </Text>
        ) : null}

        {rangeFiltered.length === 0 && logs.length > 0 ? (
          <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(15) }]}>
            No entries in this range. Try a wider date range.
          </Text>
        ) : null}

        {logs.length === 0 ? (
          <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(16) }]}>
            No logs yet. Use Log today on Home to add an entry.
          </Text>
        ) : (
          <FlatList
            data={displayed}
            keyExtractor={(item, idx) => `${item.date}-${item.notes ?? ''}-${idx}`}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            style={styles.list}
            renderItem={renderLogItem}
            getItemLayout={(_, index) => ({
              length: LOG_ROW_HEIGHT,
              offset: LOG_ROW_HEIGHT * index,
              index,
            })}
            initialNumToRender={listTuning.initialNumToRender}
            maxToRenderPerBatch={listTuning.maxToRenderPerBatch}
            windowSize={listTuning.windowSize}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews
          />
        )}
      </View>
      <Modal visible={selectedEntry != null} transparent animationType="slide" onRequestClose={() => setSelectedEntry(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: 'rgba(20,30,28,0.97)' }]}>
            <Text style={[styles.modalTitle, { color: theme.tokens.color.text, fontSize: theme.font(17) }]}>
              {selectedEntry?.date ?? 'Log entry'}
            </Text>
            {isEditingEntry && editDraft ? (
              <View>
                <Text style={[styles.sectionLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>Date</Text>
                <TextInput
                  value={editDraft.date}
                  onChangeText={(value) => updateDraft({ date: value })}
                  style={[styles.input, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                  accessibilityLabel="Edit log date"
                />
                <Text style={[styles.sectionLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>Flare</Text>
                <View style={styles.sortBtns}>
                  {(['No', 'Yes'] as const).map((value) => (
                    <Pressable
                      key={value}
                      onPress={() => updateDraft({ flare: value })}
                      style={[
                        styles.sortChip,
                        ...chipBase,
                        editDraft.flare === value && { backgroundColor: accent },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Set flare ${value}`}
                    >
                      <Text style={chipText(editDraft.flare === value)}>{value}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={[styles.sectionLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>BPM</Text>
                <TextInput
                  value={editDraft.bpm != null ? String(editDraft.bpm) : ''}
                  onChangeText={(value) => updateDraft({ bpm: value.trim() ? Number(value) : undefined })}
                  keyboardType="number-pad"
                  style={[styles.input, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                  accessibilityLabel="Edit log bpm"
                />
                <Text style={[styles.sectionLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>Sleep</Text>
                <TextInput
                  value={editDraft.sleep != null ? String(editDraft.sleep) : ''}
                  onChangeText={(value) => updateDraft({ sleep: value.trim() ? Number(value) : undefined })}
                  keyboardType="number-pad"
                  style={[styles.input, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                  accessibilityLabel="Edit log sleep"
                />
                <Text style={[styles.sectionLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>Mood</Text>
                <TextInput
                  value={editDraft.mood != null ? String(editDraft.mood) : ''}
                  onChangeText={(value) => updateDraft({ mood: value.trim() ? Number(value) : undefined })}
                  keyboardType="number-pad"
                  style={[styles.input, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                  accessibilityLabel="Edit log mood"
                />
                <Text style={[styles.sectionLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>Fatigue</Text>
                <TextInput
                  value={editDraft.fatigue != null ? String(editDraft.fatigue) : ''}
                  onChangeText={(value) => updateDraft({ fatigue: value.trim() ? Number(value) : undefined })}
                  keyboardType="number-pad"
                  style={[styles.input, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}
                  accessibilityLabel="Edit log fatigue"
                />
                <Text style={[styles.sectionLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>Notes</Text>
                <TextInput
                  value={editDraft.notes ?? ''}
                  onChangeText={(value) => updateDraft({ notes: value })}
                  multiline
                  style={[styles.input, { color: theme.tokens.color.text, fontSize: theme.font(14), minHeight: 80 }]}
                  accessibilityLabel="Edit log notes"
                />
              </View>
            ) : (
              <View>
                <Text style={[styles.rowMeta, { color: theme.tokens.color.text, fontSize: theme.font(14), marginBottom: 8 }]}>
                  {selectedEntry?.flare ? `Flare ${selectedEntry.flare}` : 'Flare —'} · {selectedEntry?.bpm != null ? `BPM ${selectedEntry.bpm}` : 'BPM —'} ·{' '}
                  {selectedEntry?.sleep != null ? `Sleep ${selectedEntry.sleep}` : 'Sleep —'} ·{' '}
                  {selectedEntry?.mood != null ? `Mood ${selectedEntry.mood}` : 'Mood —'}
                </Text>
                <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(14), marginBottom: 6 }]}>
                  Symptoms: {listPreview(selectedEntry?.symptoms)}
                </Text>
                <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(14), marginBottom: 6 }]}>
                  Stressors: {listPreview(selectedEntry?.stressors)}
                </Text>
                <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(14), marginBottom: 6 }]}>
                  Pain locations: {selectedEntry?.painLocation || '—'}
                </Text>
                <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(14), marginBottom: 6 }]}>
                  Food: {selectedEntry ? foodPreview(selectedEntry) : '—'}
                </Text>
                <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(14), marginBottom: 6 }]}>
                  Exercise: {selectedEntry ? exercisePreview(selectedEntry) : '—'}
                </Text>
                {selectedEntry?.notes ? (
                  <Text style={[styles.text, { color: theme.tokens.color.text, fontSize: theme.font(14), marginBottom: 8 }]}>
                    Notes: {selectedEntry.notes}
                  </Text>
                ) : null}
              </View>
            )}
            <View style={styles.modalActions}>
              <Pressable style={styles.modalBtn} onPress={() => setSelectedEntry(null)} accessibilityRole="button">
                <Text style={styles.modalBtnText}>Close</Text>
              </Pressable>
              {isEditingEntry ? (
                <>
                  <Pressable style={styles.modalBtn} onPress={cancelEditing} accessibilityRole="button" accessibilityLabel="Cancel log edit">
                    <Text style={styles.modalBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.modalBtn} onPress={() => void saveEditedEntry()} accessibilityRole="button" accessibilityLabel="Save log edit">
                    <Text style={styles.modalBtnText}>Save</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable style={styles.modalBtn} onPress={startEditing} accessibilityRole="button" accessibilityLabel="Edit log entry">
                  <Text style={styles.modalBtnText}>Edit</Text>
                </Pressable>
              )}
              <Pressable
                style={styles.modalBtn}
                onPress={() => {
                  if (selectedEntry) void shareEntry(selectedEntry);
                }}
                accessibilityRole="button"
                accessibilityLabel="Share log entry"
              >
                <Text style={styles.modalBtnText}>Share</Text>
              </Pressable>
              <Pressable
                style={styles.modalBtn}
                onPress={() => {
                  if (selectedEntry) deleteEntry(selectedEntry);
                }}
                accessibilityRole="button"
                accessibilityLabel="Delete log entry"
              >
                <Text style={styles.modalBtnText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { borderRadius: 16, padding: 16, backgroundColor: 'rgba(0,0,0,0.18)', flex: 1 },
  title: { fontWeight: '700', marginBottom: 6 },
  lead: { opacity: 0.9, marginBottom: 12 },
  sectionLabel: { fontWeight: '600', marginBottom: 6, opacity: 0.85 },
  chipRow: { flexGrow: 0, marginBottom: 12 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  chipLabel: { fontWeight: '600' },
  sortRow: { marginBottom: 10 },
  sortBtns: { flexDirection: 'row' },
  sortChip: { marginRight: 8 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
  },
  devButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 8,
  },
  devButtonText: { color: '#aaa', fontWeight: '600' },
  countLine: { marginBottom: 8, opacity: 0.9 },
  text: { opacity: 0.95 },
  list: { flex: 1 },
  row: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  rowTitle: { fontWeight: '700' },
  rowMeta: { opacity: 0.85, marginTop: 2 },
  rowDetail: { opacity: 0.8, marginTop: 2 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: { borderRadius: 16, padding: 16, maxHeight: '85%' },
  modalTitle: { fontWeight: '800' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 6 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)' },
  modalBtnText: { color: '#fff', fontWeight: '700' },
});
