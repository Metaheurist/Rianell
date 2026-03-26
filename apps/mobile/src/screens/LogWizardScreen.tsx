import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeProvider';
import { addLogEntry, getFrequentLogItems, loadLogs, saveLogs, type LogEntry } from '../storage/logs';
import { normalizeLogEntry } from '@rianell/shared';
import { buildLogReviewSummary, parseMedicationNamesCsv } from '../log/buildLogReviewSummary';
import type { RootStackParamList } from '../navigation/RootNavigator';

/** Matches web `LOG_WIZARD_TOTAL_STEPS` (10 steps: Date…Review). */
const WIZARD_STEPS = 10;
type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

const SYMPTOM_GROUPS = [
  { id: 'digestive', label: 'Digestive' },
  { id: 'respiratory', label: 'Respiratory' },
  { id: 'neurological', label: 'Neurological' },
  { id: 'systemic', label: 'Systemic' },
  { id: 'skin', label: 'Skin & eyes' },
  { id: 'other', label: 'Other' },
] as const;

const SYMPTOM_OPTIONS: Array<{ value: string; label: string; group: (typeof SYMPTOM_GROUPS)[number]['id'] }> = [
  { value: 'Nausea', label: 'Nausea', group: 'digestive' },
  { value: 'Appetite loss', label: 'Appetite loss', group: 'digestive' },
  { value: 'Digestive issues', label: 'Digestive issues', group: 'digestive' },
  { value: 'Bloating', label: 'Bloating', group: 'digestive' },
  { value: 'Breathing difficulty', label: 'Breathing difficulty', group: 'respiratory' },
  { value: 'Cough', label: 'Cough', group: 'respiratory' },
  { value: 'Chest tightness', label: 'Chest tightness', group: 'respiratory' },
  { value: 'Dizziness', label: 'Dizziness', group: 'neurological' },
  { value: 'Headache', label: 'Headache', group: 'neurological' },
  { value: 'Tingling or numbness', label: 'Tingling or numbness', group: 'neurological' },
  { value: 'Migraine', label: 'Migraine', group: 'neurological' },
  { value: 'Fever', label: 'Fever', group: 'systemic' },
  { value: 'Chills', label: 'Chills', group: 'systemic' },
  { value: 'Night sweats', label: 'Night sweats', group: 'systemic' },
  { value: 'Body fatigue', label: 'Body fatigue', group: 'systemic' },
  { value: 'Skin rash', label: 'Skin rash', group: 'skin' },
  { value: 'Eye irritation', label: 'Eye irritation', group: 'skin' },
  { value: 'Dry skin', label: 'Dry skin', group: 'skin' },
  { value: 'Itching', label: 'Itching', group: 'skin' },
  { value: 'Muscle aches', label: 'Muscle aches', group: 'other' },
  { value: 'Other', label: 'Other', group: 'other' },
];

const ENERGY_CLARITY_OPTIONS = ['Very low', 'Low', 'Moderate', 'Good', 'Excellent'];
const SCORE_0_10_OPTIONS = ['0', '2', '4', '6', '8', '10'];
const SCORE_1_10_OPTIONS = ['1', '3', '5', '7', '9', '10'];
const STRESSOR_OPTIONS = [
  'Work deadline',
  'Financial stress',
  'Family conflict',
  'Relationship issue',
  'Social event',
  'Physical overexertion',
  'Sleep disruption',
  'Weather change',
  'Travel',
  'Emotional stress',
  'Health concern',
];

const FOOD_QUICK_BY_MEAL: Record<'breakfast' | 'lunch' | 'dinner' | 'snack', string[]> = {
  breakfast: ['Oatmeal', 'Yogurt', 'Eggs', 'Fruit smoothie'],
  lunch: ['Chicken salad', 'Soup', 'Rice bowl', 'Sandwich'],
  dinner: ['Salmon', 'Rice', 'Vegetables', 'Pasta'],
  snack: ['Apple', 'Nuts', 'Protein bar', 'Banana'],
};

const EXERCISE_QUICK_OPTIONS = ['Walking:30', 'Stretching:15', 'Yoga:20', 'Cycling:40', 'Swimming:25'];
const MEDICATION_QUICK_OPTIONS = ['Ibuprofen', 'Paracetamol', 'Vitamin D', 'Magnesium', 'Omega-3'];
const EXERCISE_CATEGORIES = [
  { id: 'cardio', label: 'Cardio' },
  { id: 'strength', label: 'Strength' },
  { id: 'flexibility', label: 'Flexibility' },
  { id: 'balance', label: 'Balance' },
  { id: 'recovery', label: 'Recovery' },
] as const;

const PREDEFINED_EXERCISES = [
  { name: 'Walking', defaultDuration: 30, category: 'cardio' },
  { name: 'Cycling', defaultDuration: 40, category: 'cardio' },
  { name: 'Swimming', defaultDuration: 25, category: 'cardio' },
  { name: 'Yoga', defaultDuration: 30, category: 'flexibility' },
  { name: 'Stretching', defaultDuration: 15, category: 'flexibility' },
  { name: 'Balance exercises', defaultDuration: 10, category: 'balance' },
  { name: 'Resistance band exercises', defaultDuration: 15, category: 'strength' },
  { name: 'Core exercises', defaultDuration: 15, category: 'strength' },
  { name: 'Meditation / relaxation', defaultDuration: 15, category: 'recovery' },
  { name: 'Gentle mobility flow', defaultDuration: 15, category: 'recovery' },
] as const;

const PAIN_BODY_REGIONS = [
  { id: 'head', label: 'Head' },
  { id: 'neck', label: 'Neck' },
  { id: 'chest', label: 'Chest' },
  { id: 'abdomen', label: 'Abdomen' },
  { id: 'left_shoulder', label: 'Left shoulder' },
  { id: 'right_shoulder', label: 'Right shoulder' },
  { id: 'left_elbow', label: 'Left elbow' },
  { id: 'right_elbow', label: 'Right elbow' },
  { id: 'left_wrist', label: 'Left wrist' },
  { id: 'right_wrist', label: 'Right wrist' },
  { id: 'left_hip', label: 'Left hip' },
  { id: 'right_hip', label: 'Right hip' },
  { id: 'left_knee', label: 'Left knee' },
  { id: 'right_knee', label: 'Right knee' },
  { id: 'left_ankle', label: 'Left ankle' },
  { id: 'right_ankle', label: 'Right ankle' },
] as const;

type PainState = 0 | 1 | 2;

function painStateText(value: PainState) {
  if (value === 1) return 'mild';
  if (value === 2) return 'pain';
  return 'none';
}

function painStateLabel(value: PainState) {
  if (value === 1) return 'Mild';
  if (value === 2) return 'Pain';
  return 'None';
}

function buildPainLocationTextFromState(state: Record<string, PainState>): string {
  const parts: string[] = [];
  PAIN_BODY_REGIONS.forEach((region) => {
    const v = state[region.id] ?? 0;
    if (v === 1) parts.push(`${region.label} (mild)`);
    if (v === 2) parts.push(`${region.label} (pain)`);
  });
  return parts.join(', ');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function parseCsvList(value: string): string[] {
  return value
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function addCsvItem(current: string, item: string): string {
  const items = parseCsvList(current);
  return [...items, item].join(', ');
}

function removeCsvItem(current: string, item: string): string {
  const items = parseCsvList(current).filter((x) => x !== item);
  return items.join(', ');
}

function countCsvItem(current: string, item: string): number {
  return parseCsvList(current).filter((x) => x === item).length;
}

function parseExerciseItems(value: string): Array<{ name: string; duration?: number }> {
  return value
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .map((raw) => {
      const colonIdx = raw.lastIndexOf(':');
      if (colonIdx <= 0) return { name: raw };
      const name = raw.slice(0, colonIdx).trim();
      const durRaw = raw.slice(colonIdx + 1).trim().replace(/min$/i, '').trim();
      const dur = Number(durRaw);
      if (!name) return null;
      if (Number.isFinite(dur) && dur > 0) return { name, duration: dur };
      return { name: raw };
    })
    .filter((x): x is { name: string; duration?: number } => !!x);
}

export function LogWizardScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const bg =
    theme.tokens.color.background === 'linear-gradient(135deg, #a8e6cf 0%, #c8e6c9 25%, #e8f5e8 75%, #f1f8e9 100%)'
      ? '#ffffff'
      : theme.tokens.color.background;

  const [step, setStep] = useState<Step>(0);

  const [date, setDate] = useState(today());
  const [flare, setFlare] = useState<'Yes' | 'No'>('No');

  const [bpm, setBpm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [sleep, setSleep] = useState('');
  const [mood, setMood] = useState('');
  const [fatigue, setFatigue] = useState('');
  const [steps, setSteps] = useState('');
  const [hydration, setHydration] = useState('');
  const [notes, setNotes] = useState('');
  const [painLocation, setPainLocation] = useState('');
  const [painStates, setPainStates] = useState<Record<string, PainState>>({});
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [energyClarity, setEnergyClarity] = useState('');
  const [stressors, setStressors] = useState<string[]>([]);
  const [customStressor, setCustomStressor] = useState('');
  const [dailyFunction, setDailyFunction] = useState('');
  const [irritability, setIrritability] = useState('');
  const [weatherSensitivity, setWeatherSensitivity] = useState('');
  const [breakfastText, setBreakfastText] = useState('');
  const [lunchText, setLunchText] = useState('');
  const [dinnerText, setDinnerText] = useState('');
  const [snackText, setSnackText] = useState('');
  const [exerciseText, setExerciseText] = useState('');
  const [medicationText, setMedicationText] = useState('');
  const [medicationTaken, setMedicationTaken] = useState(true);
  const [frequentSymptoms, setFrequentSymptoms] = useState<string[]>([]);
  const [frequentStressors, setFrequentStressors] = useState<string[]>([]);

  function toggleSymptom(value: string) {
    setSymptoms((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
  }

  function addCustomSymptom() {
    const value = customSymptom.trim();
    if (!value) return;
    setSymptoms((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setCustomSymptom('');
  }

  function toggleStressor(value: string) {
    setStressors((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
  }

  function addCustomStressor() {
    const value = customStressor.trim();
    if (!value) return;
    setStressors((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setCustomStressor('');
  }

  function cyclePainRegion(regionId: string) {
    setPainStates((prev) => {
      const current = prev[regionId] ?? 0;
      const next = ((current + 1) % 3) as PainState;
      return { ...prev, [regionId]: next };
    });
  }

  function clearPainRegions() {
    setPainStates({});
  }

  function confirmClearAll(itemLabel: string, onYes: () => void) {
    Alert.alert('Clear selection', `Would you like to clear ${itemLabel}?`, [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', onPress: onYes },
    ]);
  }

  const painLocationFromBody = useMemo(() => buildPainLocationTextFromState(painStates), [painStates]);
  const painCounts = useMemo(() => {
    let mild = 0;
    let pain = 0;
    PAIN_BODY_REGIONS.forEach((r) => {
      const v = painStates[r.id] ?? 0;
      if (v === 1) mild += 1;
      if (v === 2) pain += 1;
    });
    return { mild, pain };
  }, [painStates]);
  const breakfastItems = useMemo(() => parseCsvList(breakfastText), [breakfastText]);
  const lunchItems = useMemo(() => parseCsvList(lunchText), [lunchText]);
  const dinnerItems = useMemo(() => parseCsvList(dinnerText), [dinnerText]);
  const snackItems = useMemo(() => parseCsvList(snackText), [snackText]);
  const exerciseItems = useMemo(() => parseExerciseItems(exerciseText), [exerciseText]);
  const medicationItems = useMemo(
    () => parseMedicationNamesCsv(medicationText, medicationTaken),
    [medicationText, medicationTaken]
  );

  useEffect(() => {
    loadLogs()
      .then((logs) => {
        setFrequentSymptoms(getFrequentLogItems(logs, 'symptoms', 6));
        setFrequentStressors(getFrequentLogItems(logs, 'stressors', 6));
      })
      .catch(() => {
        setFrequentSymptoms([]);
        setFrequentStressors([]);
      });
  }, []);

  const draft: LogEntry = useMemo(() => {
    const base: Partial<LogEntry> = {
      date,
      flare,
      bpm: bpm ? Number(bpm) : undefined,
      weight: weightKg ? String(Number(weightKg).toFixed(1)) : undefined,
      sleep: sleep ? Number(sleep) : undefined,
      mood: mood ? Number(mood) : undefined,
      fatigue: fatigue ? Number(fatigue) : undefined,
      steps: steps ? Number(steps) : undefined,
      hydration: hydration ? Number(hydration) : undefined,
      notes: notes || undefined,
      painLocation: [painLocationFromBody, painLocation].filter(Boolean).join(', ') || undefined,
      symptoms: symptoms.length ? symptoms : undefined,
      energyClarity: energyClarity || undefined,
      stressors: stressors.length ? stressors : undefined,
      dailyFunction: dailyFunction ? Number(dailyFunction) : undefined,
      irritability: irritability ? Number(irritability) : undefined,
      weatherSensitivity: weatherSensitivity ? Number(weatherSensitivity) : undefined,
      food: breakfastItems.length || lunchItems.length || dinnerItems.length || snackItems.length
        ? {
            breakfast: breakfastItems,
            lunch: lunchItems,
            dinner: dinnerItems,
            snack: snackItems,
          }
        : undefined,
      exercise: exerciseItems.length
        ? exerciseItems
        : undefined,
      medications: medicationItems.length ? medicationItems : undefined,
    };
    return normalizeLogEntry(base) as LogEntry;
  }, [
    date,
    flare,
    bpm,
    weightKg,
    sleep,
    mood,
    fatigue,
    steps,
    hydration,
    notes,
    painLocation,
    symptoms,
    energyClarity,
    stressors,
    dailyFunction,
    irritability,
    weatherSensitivity,
    breakfastItems,
    lunchItems,
    dinnerItems,
    snackItems,
    exerciseItems,
    medicationItems,
    painLocationFromBody,
  ]);

  function validateStep0() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      Alert.alert('Validation', 'Date must be YYYY-MM-DD');
      return false;
    }
    return true;
  }

  async function save() {
    try {
      const existing = await loadLogs();
      const next = addLogEntry(existing, draft);
      await saveLogs(next);
      Alert.alert('Saved', 'Entry saved successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not save entry';
      Alert.alert('Error', msg);
    }
  }

  const reviewText = useMemo(() => buildLogReviewSummary(draft), [draft]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.card}>
        <Text style={[styles.title, { color: theme.tokens.color.accent, fontSize: theme.font(20) }]}>
          Log today
        </Text>
        <Text style={[styles.sub, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
          Step {step + 1} of {WIZARD_STEPS}
        </Text>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
        {step === 0 ? (
          <View>
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Date (YYYY-MM-DD)</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              style={[styles.input, { color: theme.tokens.color.text }]}
              accessibilityLabel="Log date"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Flare</Text>
            <View style={styles.row}>
              <Choice label="No" selected={flare === 'No'} onPress={() => setFlare('No')} />
              <Choice label="Yes" selected={flare === 'Yes'} onPress={() => setFlare('Yes')} />
            </View>

            <View style={styles.navRow}>
              <View style={{ flex: 1 }} />
              <Pressable
                onPress={() => {
                  if (!validateStep0()) return;
                  setStep(1);
                }}
                style={styles.primaryBtn}
                accessibilityRole="button"
                accessibilityLabel="Next step"
              >
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>Next</Text>
              </Pressable>
            </View>
          </View>
        ) : step === 1 ? (
          <View>
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>BPM (30–120)</Text>
            <TextInput value={bpm} onChangeText={setBpm} style={[styles.input, { color: theme.tokens.color.text }]} keyboardType="number-pad" />

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Weight (kg)</Text>
            <TextInput value={weightKg} onChangeText={setWeightKg} style={[styles.input, { color: theme.tokens.color.text }]} keyboardType="decimal-pad" />

            <View style={styles.twoCol}>
              <View style={styles.twoColItem}>
                <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Sleep (0–10)</Text>
                <TextInput value={sleep} onChangeText={setSleep} style={[styles.input, { color: theme.tokens.color.text }]} keyboardType="number-pad" />
              </View>
              <View style={styles.twoColItem}>
                <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Mood (0–10)</Text>
                <TextInput value={mood} onChangeText={setMood} style={[styles.input, { color: theme.tokens.color.text }]} keyboardType="number-pad" />
              </View>
            </View>

            <View style={styles.twoCol}>
              <View style={styles.twoColItem}>
                <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Fatigue (0–10)</Text>
                <TextInput value={fatigue} onChangeText={setFatigue} style={[styles.input, { color: theme.tokens.color.text }]} keyboardType="number-pad" />
              </View>
            </View>

            <View style={styles.navRow}>
              <Pressable
                onPress={() => setStep(0)}
                style={styles.secondaryBtn}
                accessibilityRole="button"
                accessibilityLabel="Previous step"
              >
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>Back</Text>
              </Pressable>
              <Pressable onPress={() => setStep(2)} style={styles.primaryBtn} accessibilityRole="button" accessibilityLabel="Next step">
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>Next</Text>
              </Pressable>
            </View>
          </View>
        ) : step === 2 ? (
          <View>
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Pain locations</Text>
            <Text style={[styles.helper, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
              Tap a region to cycle: none → mild → pain.
            </Text>
            <View style={styles.painLegendRow}>
              <Text style={[styles.painLegendNone, { fontSize: theme.font(12) }]}>None</Text>
              <Text style={[styles.painLegendMild, { fontSize: theme.font(12) }]}>Mild</Text>
              <Text style={[styles.painLegendPain, { fontSize: theme.font(12) }]}>Pain</Text>
            </View>
            <Text style={[styles.helper, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
              Selected: {painCounts.mild} mild, {painCounts.pain} pain
            </Text>
            <View style={styles.chips}>
              {PAIN_BODY_REGIONS.map((region) => {
                const s = painStates[region.id] ?? 0;
                return (
                  <BodyRegionChoice
                    key={region.id}
                    label={region.label}
                    state={s}
                    onPress={() => cyclePainRegion(region.id)}
                  />
                );
              })}
            </View>
            <View style={{ marginTop: 8, alignItems: 'flex-start' }}>
              <Pressable onPress={clearPainRegions} style={styles.secondaryBtn} accessibilityRole="button" accessibilityLabel="Clear pain regions">
                <Text style={[styles.btnText, { fontSize: theme.font(13) }]}>Clear body selections</Text>
              </Pressable>
            </View>
            <TextInput
              value={painLocation}
              onChangeText={setPainLocation}
              style={[styles.input, { color: theme.tokens.color.text }]}
              accessibilityLabel="Pain locations"
              placeholder="e.g. Left knee (mild), Right wrist (pain)"
              placeholderTextColor="rgba(255,255,255,0.6)"
            />

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Symptoms</Text>
            {frequentSymptoms.length > 0 ? (
              <View style={{ marginBottom: 8 }}>
                <Text style={[styles.frequentLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>Frequent symptoms</Text>
                <View style={styles.chips}>
                  {frequentSymptoms.map((opt) => (
                    <Choice key={`freq-sym-${opt}`} label={opt} selected={symptoms.includes(opt)} onPress={() => toggleSymptom(opt)} />
                  ))}
                </View>
              </View>
            ) : null}
            {SYMPTOM_GROUPS.map((grp) => {
              const opts = SYMPTOM_OPTIONS.filter((o) => o.group === grp.id);
              return (
                <View key={grp.id} style={{ marginBottom: 10 }}>
                  <Text style={[styles.groupTitle, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{grp.label}</Text>
                  <View style={styles.chips}>
                    {opts.map((opt) => (
                      <Choice
                        key={opt.value}
                        label={opt.label}
                        selected={symptoms.includes(opt.value)}
                        onPress={() => toggleSymptom(opt.value)}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
            {symptoms.length ? (
              <View style={{ marginTop: 4 }}>
                <Text style={[styles.frequentLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>Selected symptoms</Text>
                <View style={styles.chips}>
                  {symptoms.map((item) => (
                    <Choice key={`sym-selected-${item}`} label={item} selected onPress={() => toggleSymptom(item)} />
                  ))}
                </View>

                <View style={{ marginTop: 8, alignItems: 'flex-start' }}>
                  <Pressable
                    onPress={() => setSymptoms([])}
                    style={styles.secondaryBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Clear selected symptoms"
                  >
                    <Text style={[styles.btnText, { fontSize: theme.font(13) }]}>Clear selected</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Add custom symptom</Text>
            <View style={styles.inlineInputRow}>
              <TextInput
                value={customSymptom}
                onChangeText={setCustomSymptom}
                style={[styles.input, styles.inlineInput, { color: theme.tokens.color.text }]}
                accessibilityLabel="Custom symptom input"
                placeholder="Type symptom"
                placeholderTextColor="rgba(255,255,255,0.6)"
              />
              <Pressable onPress={addCustomSymptom} style={styles.secondaryBtn} accessibilityRole="button" accessibilityLabel="Add custom symptom">
                <Text style={[styles.btnText, { fontSize: theme.font(13) }]}>Add</Text>
              </Pressable>
            </View>

            <View style={styles.navRow}>
              <Pressable onPress={() => setStep(1)} style={styles.secondaryBtn} accessibilityRole="button" accessibilityLabel="Previous step">
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>Back</Text>
              </Pressable>
              <Pressable onPress={() => setStep(3)} style={styles.primaryBtn} accessibilityRole="button" accessibilityLabel="Next step">
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>Next</Text>
              </Pressable>
            </View>
          </View>
        ) : step === 3 ? (
          <View>
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Energy / clarity</Text>
            <View style={styles.chips}>
              {ENERGY_CLARITY_OPTIONS.map((opt) => (
                <Choice key={opt} label={opt} selected={energyClarity === opt} onPress={() => setEnergyClarity(opt)} />
              ))}
            </View>

            {energyClarity ? (
              <View style={{ marginTop: 4 }}>
                <Text style={[styles.frequentLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>Selected energy & clarity</Text>
                <View style={styles.chips}>
                  <Choice label={energyClarity} selected onPress={() => setEnergyClarity('')} />
                </View>
              </View>
            ) : null}

            <View style={styles.navRow}>
              <Pressable onPress={() => setStep(2)} style={styles.secondaryBtn} accessibilityRole="button" accessibilityLabel="Previous step">
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>Back</Text>
              </Pressable>
              <Pressable onPress={() => setStep(4)} style={styles.primaryBtn} accessibilityRole="button" accessibilityLabel="Next step">
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>Next</Text>
              </Pressable>
            </View>
          </View>
        ) : step === 4 ? (
          <View>
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Stressors</Text>
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Irritability (0-10)</Text>
            <View style={styles.chips}>
              {SCORE_0_10_OPTIONS.map((v) => (
                <Choice key={`ir-${v}`} label={v} selected={irritability === v} onPress={() => setIrritability(v)} />
              ))}
            </View>
            <TextInput
              value={irritability}
              onChangeText={setIrritability}
              style={[styles.input, { color: theme.tokens.color.text }]}
              keyboardType="number-pad"
            />

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Weather sensitivity (1-10)</Text>
            <View style={styles.chips}>
              {SCORE_1_10_OPTIONS.map((v) => (
                <Choice key={`ws-${v}`} label={v} selected={weatherSensitivity === v} onPress={() => setWeatherSensitivity(v)} />
              ))}
            </View>
            <TextInput
              value={weatherSensitivity}
              onChangeText={setWeatherSensitivity}
              style={[styles.input, { color: theme.tokens.color.text }]}
              keyboardType="number-pad"
            />

            {frequentStressors.length > 0 ? (
              <View style={{ marginBottom: 8 }}>
                <Text style={[styles.frequentLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>Frequent stressors</Text>
                <View style={styles.chips}>
                  {frequentStressors.map((opt) => (
                    <Choice key={`freq-str-${opt}`} label={opt} selected={stressors.includes(opt)} onPress={() => toggleStressor(opt)} />
                  ))}
                </View>
              </View>
            ) : null}
            <View style={styles.chips}>
              {STRESSOR_OPTIONS.map((opt) => (
                <Choice key={opt} label={opt} selected={stressors.includes(opt)} onPress={() => toggleStressor(opt)} />
              ))}
            </View>
            {stressors.length ? (
              <View style={{ marginTop: 4 }}>
                <Text style={[styles.frequentLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>Selected stressors</Text>
                <View style={styles.chips}>
                  {stressors.map((item) => (
                    <Choice key={`str-selected-${item}`} label={item} selected onPress={() => toggleStressor(item)} />
                  ))}
                </View>

                <View style={{ marginTop: 8, alignItems: 'flex-start' }}>
                  <Pressable
                    onPress={() => setStressors([])}
                    style={styles.secondaryBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Clear selected stressors"
                  >
                    <Text style={[styles.btnText, { fontSize: theme.font(13) }]}>Clear selected</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Add custom stressor</Text>
            <View style={styles.inlineInputRow}>
              <TextInput
                value={customStressor}
                onChangeText={setCustomStressor}
                style={[styles.input, styles.inlineInput, { color: theme.tokens.color.text }]}
                accessibilityLabel="Custom stressor input"
                placeholder="Type stressor"
                placeholderTextColor="rgba(255,255,255,0.6)"
              />
              <Pressable onPress={addCustomStressor} style={styles.secondaryBtn} accessibilityRole="button" accessibilityLabel="Add custom stressor">
                <Text style={[styles.btnText, { fontSize: theme.font(13) }]}>Add</Text>
              </Pressable>
            </View>

            <View style={styles.navRow}>
              <Pressable onPress={() => setStep(3)} style={styles.secondaryBtn} accessibilityRole="button" accessibilityLabel="Previous step">
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>Back</Text>
              </Pressable>
              <Pressable onPress={() => setStep(5)} style={styles.primaryBtn} accessibilityRole="button" accessibilityLabel="Next step">
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>Next</Text>
              </Pressable>
            </View>
          </View>
        ) : step === 5 ? (
          <View>
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Daily function (0-10)</Text>
            <View style={styles.chips}>
              {SCORE_0_10_OPTIONS.map((v) => (
                <Choice key={`df-${v}`} label={v} selected={dailyFunction === v} onPress={() => setDailyFunction(v)} />
              ))}
            </View>
            <TextInput
              value={dailyFunction}
              onChangeText={setDailyFunction}
              style={[styles.input, { color: theme.tokens.color.text }]}
              keyboardType="number-pad"
            />

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Steps (if tracked)</Text>
            <TextInput
              value={steps}
              onChangeText={setSteps}
              style={[styles.input, { color: theme.tokens.color.text }]}
              keyboardType="number-pad"
            />

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Hydration (glasses)</Text>
            <TextInput
              value={hydration}
              onChangeText={setHydration}
              style={[styles.input, { color: theme.tokens.color.text }]}
              keyboardType="decimal-pad"
            />

            <View style={styles.navRow}>
              <Pressable onPress={() => setStep(4)} style={styles.secondaryBtn} accessibilityRole="button" accessibilityLabel="Previous step">
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>Back</Text>
              </Pressable>
              <Pressable onPress={() => setStep(6)} style={styles.primaryBtn} accessibilityRole="button" accessibilityLabel="Next step">
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>Next</Text>
              </Pressable>
            </View>
          </View>
        ) : step === 6 ? (
          <View>
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Breakfast (comma separated)</Text>
            <View style={styles.chips}>
              {FOOD_QUICK_BY_MEAL.breakfast.map((item) => (
                <Choice
                  key={`bf-${item}`}
                  label={item}
                  selected={breakfastItems.includes(item)}
                  count={countCsvItem(breakfastText, item)}
                  onCountPress={() => confirmClearAll(item, () => setBreakfastText((prev) => removeCsvItem(prev, item)))}
                  onPress={() => setBreakfastText((prev) => addCsvItem(prev, item))}
                />
              ))}
            </View>
            <TextInput
              value={breakfastText}
              onChangeText={setBreakfastText}
              style={[styles.input, { color: theme.tokens.color.text, height: 90 }]}
              multiline
              accessibilityLabel="Breakfast items"
              placeholder="e.g. Oatmeal, Yogurt"
              placeholderTextColor="rgba(255,255,255,0.6)"
            />
            <View style={styles.chips}>
              {breakfastItems.map((item) => (
                <Choice key={`bf-sel-${item}`} label={`Remove ${item}`} selected={false} onPress={() => setBreakfastText((prev) => removeCsvItem(prev, item))} />
              ))}
            </View>

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Lunch (comma separated)</Text>
            <View style={styles.chips}>
              {FOOD_QUICK_BY_MEAL.lunch.map((item) => (
                <Choice
                  key={`lu-${item}`}
                  label={item}
                  selected={lunchItems.includes(item)}
                  count={countCsvItem(lunchText, item)}
                  onCountPress={() => confirmClearAll(item, () => setLunchText((prev) => removeCsvItem(prev, item)))}
                  onPress={() => setLunchText((prev) => addCsvItem(prev, item))}
                />
              ))}
            </View>
            <TextInput
              value={lunchText}
              onChangeText={setLunchText}
              style={[styles.input, { color: theme.tokens.color.text, height: 90 }]}
              multiline
              accessibilityLabel="Lunch items"
              placeholder="e.g. Chicken salad"
              placeholderTextColor="rgba(255,255,255,0.6)"
            />
            <View style={styles.chips}>
              {lunchItems.map((item) => (
                <Choice key={`lu-sel-${item}`} label={`Remove ${item}`} selected={false} onPress={() => setLunchText((prev) => removeCsvItem(prev, item))} />
              ))}
            </View>

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Dinner (comma separated)</Text>
            <View style={styles.chips}>
              {FOOD_QUICK_BY_MEAL.dinner.map((item) => (
                <Choice
                  key={`di-${item}`}
                  label={item}
                  selected={dinnerItems.includes(item)}
                  count={countCsvItem(dinnerText, item)}
                  onCountPress={() => confirmClearAll(item, () => setDinnerText((prev) => removeCsvItem(prev, item)))}
                  onPress={() => setDinnerText((prev) => addCsvItem(prev, item))}
                />
              ))}
            </View>
            <TextInput
              value={dinnerText}
              onChangeText={setDinnerText}
              style={[styles.input, { color: theme.tokens.color.text, height: 90 }]}
              multiline
              accessibilityLabel="Dinner items"
              placeholder="e.g. Salmon, Rice"
              placeholderTextColor="rgba(255,255,255,0.6)"
            />
            <View style={styles.chips}>
              {dinnerItems.map((item) => (
                <Choice key={`di-sel-${item}`} label={`Remove ${item}`} selected={false} onPress={() => setDinnerText((prev) => removeCsvItem(prev, item))} />
              ))}
            </View>

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Snack (comma separated)</Text>
            <View style={styles.chips}>
              {FOOD_QUICK_BY_MEAL.snack.map((item) => (
                <Choice
                  key={`sn-${item}`}
                  label={item}
                  selected={snackItems.includes(item)}
                  count={countCsvItem(snackText, item)}
                  onCountPress={() => confirmClearAll(item, () => setSnackText((prev) => removeCsvItem(prev, item)))}
                  onPress={() => setSnackText((prev) => addCsvItem(prev, item))}
                />
              ))}
            </View>
            <TextInput
              value={snackText}
              onChangeText={setSnackText}
              style={[styles.input, { color: theme.tokens.color.text, height: 90 }]}
              multiline
              accessibilityLabel="Snack items"
              placeholder="e.g. Apple, Nuts"
              placeholderTextColor="rgba(255,255,255,0.6)"
            />
            <View style={styles.chips}>
              {snackItems.map((item) => (
                <Choice key={`sn-sel-${item}`} label={`Remove ${item}`} selected={false} onPress={() => setSnackText((prev) => removeCsvItem(prev, item))} />
              ))}
            </View>

            <View style={styles.navRow}>
              <Pressable onPress={() => setStep(5)} style={styles.secondaryBtn} accessibilityRole="button" accessibilityLabel="Previous step">
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>Back</Text>
              </Pressable>
              <Pressable onPress={() => setStep(7)} style={styles.primaryBtn} accessibilityRole="button" accessibilityLabel="Next step">
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>Next</Text>
              </Pressable>
            </View>
          </View>
        ) : step === 7 ? (
          <View>
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Exercise by category</Text>
            {EXERCISE_CATEGORIES.map((cat) => {
              const options = PREDEFINED_EXERCISES.filter((x) => x.category === cat.id);
              return (
                <View key={cat.id} style={{ marginBottom: 10 }}>
                  <Text style={[styles.groupTitle, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{cat.label}</Text>
                  <View style={styles.chips}>
                    {options.map((opt) => {
                      const token = `${opt.name}:${opt.defaultDuration}`;
                      const count = countCsvItem(exerciseText, token);
                      const selected = count > 0;
                      return (
                        <Choice
                          key={`ex-${token}`}
                          label={token}
                          selected={selected}
                          count={count}
                          onCountPress={() => confirmClearAll(token, () => setExerciseText((prev) => removeCsvItem(prev, token)))}
                          onPress={() => setExerciseText((prev) => addCsvItem(prev, token))}
                        />
                      );
                    })}
                  </View>
                </View>
              );
            })}
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Exercise quick picks</Text>
            <View style={styles.chips}>
              {EXERCISE_QUICK_OPTIONS.map((item) => {
                const count = countCsvItem(exerciseText, item);
                const selected = count > 0;
                return (
                  <Choice
                    key={`ex-q-${item}`}
                    label={item}
                    selected={selected}
                    count={count}
                    onCountPress={() => confirmClearAll(item, () => setExerciseText((prev) => removeCsvItem(prev, item)))}
                    onPress={() => setExerciseText((prev) => addCsvItem(prev, item))}
                  />
                );
              })}
            </View>
            <TextInput
              value={exerciseText}
              onChangeText={setExerciseText}
              style={[styles.input, { color: theme.tokens.color.text, height: 90 }]}
              multiline
              accessibilityLabel="Exercise items"
              placeholder="e.g. Walking:30, Stretching:15"
              placeholderTextColor="rgba(255,255,255,0.6)"
            />
            <View style={styles.chips}>
              {exerciseItems.map((item) => {
                const token = `${item.name}${item.duration ? `:${item.duration}` : ''}`;
                return <Choice key={`ex-sel-${token}`} label={`Remove ${token}`} selected={false} onPress={() => setExerciseText((prev) => removeCsvItem(prev, token))} />;
              })}
            </View>

            <View style={styles.navRow}>
              <Pressable onPress={() => setStep(6)} style={styles.secondaryBtn} accessibilityRole="button" accessibilityLabel="Previous step">
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>Back</Text>
              </Pressable>
              <Pressable onPress={() => setStep(8)} style={styles.primaryBtn} accessibilityRole="button" accessibilityLabel="Next step">
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>Next</Text>
              </Pressable>
            </View>
          </View>
        ) : step === 8 ? (
          <View>
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Medications (comma separated)</Text>
            <Text style={[styles.helper, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
              Enter medication names; times can be added in a future update.
            </Text>

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Taken today?</Text>
            <View style={styles.row}>
              <Choice label="Yes" selected={medicationTaken} onPress={() => setMedicationTaken(true)} />
              <Choice label="No" selected={!medicationTaken} onPress={() => setMedicationTaken(false)} />
            </View>

            <View style={styles.chips}>
              {MEDICATION_QUICK_OPTIONS.map((item) => (
                <Choice
                  key={`med-${item}`}
                  label={item}
                  selected={parseCsvList(medicationText).includes(item)}
                  count={countCsvItem(medicationText, item)}
                  onCountPress={() => confirmClearAll(item, () => setMedicationText((prev) => removeCsvItem(prev, item)))}
                  onPress={() => setMedicationText((prev) => addCsvItem(prev, item))}
                />
              ))}
            </View>
            <TextInput
              value={medicationText}
              onChangeText={setMedicationText}
              style={[styles.input, { color: theme.tokens.color.text }]}
              accessibilityLabel="Medication names"
              placeholder="e.g. Ibuprofen, Vitamin D"
              placeholderTextColor="rgba(255,255,255,0.6)"
            />
            <View style={styles.chips}>
              {parseCsvList(medicationText).map((item) => (
                <Choice key={`med-sel-${item}`} label={`Remove ${item}`} selected={false} onPress={() => setMedicationText((prev) => removeCsvItem(prev, item))} />
              ))}
            </View>

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              style={[styles.input, { color: theme.tokens.color.text, height: 120 }]}
              multiline
              accessibilityLabel="Log notes"
              placeholder="Anything else to remember"
              placeholderTextColor="rgba(255,255,255,0.6)"
            />

            <View style={styles.navRow}>
              <Pressable onPress={() => setStep(7)} style={styles.secondaryBtn} accessibilityRole="button" accessibilityLabel="Previous step">
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>Back</Text>
              </Pressable>
              <Pressable onPress={() => setStep(9)} style={styles.primaryBtn} accessibilityRole="button" accessibilityLabel="Next step">
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>Next</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View>
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Review</Text>
            <Text style={[styles.helper, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
              Confirm details before saving.
            </Text>
            <Text
              style={[styles.reviewBlock, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}
              accessibilityLabel="Log review summary"
            >
              {reviewText}
            </Text>

            <View style={styles.navRow}>
              <Pressable onPress={() => setStep(8)} style={styles.secondaryBtn} accessibilityRole="button" accessibilityLabel="Previous step">
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>Back</Text>
              </Pressable>
              <Pressable onPress={save} style={styles.primaryBtn} accessibilityRole="button" accessibilityLabel="Save entry">
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Choice({
  label,
  selected,
  onPress,
  count,
  onCountPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  count?: number;
  onCountPress?: () => void;
}) {
  const showCount = typeof count === 'number' && count > 1;
  return (
    <Pressable onPress={onPress} style={[styles.choice, selected ? styles.choiceSelected : null]} accessibilityRole="button">
      <Text style={[styles.choiceText, selected ? styles.choiceTextSelected : null]}>{label}</Text>
      {showCount ? (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onCountPress?.();
          }}
          style={styles.choiceCount}
          accessibilityRole="button"
          accessibilityLabel={`Clear ${label}`}
        >
          <Text style={styles.choiceCountText}>{count}</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

function BodyRegionChoice({
  label,
  state,
  onPress,
}: {
  label: string;
  state: PainState;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.choice,
        state === 1 ? styles.choiceMild : null,
        state === 2 ? styles.choicePain : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${painStateLabel(state)}`}
    >
      <Text style={styles.choiceText}>{`${label}: ${painStateText(state)}`}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { flex: 1, borderRadius: 16, padding: 16, backgroundColor: 'rgba(0,0,0,0.18)' },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 24 },
  reviewBlock: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    fontFamily: 'monospace',
  },
  title: { fontWeight: '800' },
  sub: { opacity: 0.8, marginBottom: 12 },
  label: { marginTop: 10, marginBottom: 6, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  row: { flexDirection: 'row', gap: 10 },
  choice: {
    position: 'relative',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  choiceSelected: { backgroundColor: 'rgba(255,255,255,0.22)' },
  choiceMild: { backgroundColor: 'rgba(255,193,7,0.26)', borderWidth: 1, borderColor: 'rgba(255,193,7,0.6)' },
  choicePain: { backgroundColor: 'rgba(244,67,54,0.26)', borderWidth: 1, borderColor: 'rgba(244,67,54,0.6)' },
  choiceText: { color: '#fff', fontWeight: '800' },
  choiceTextSelected: { color: '#fff' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 10 },
  primaryBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.22)' },
  secondaryBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)' },
  btnText: { color: '#fff', fontWeight: '900' },
  twoCol: { flexDirection: 'row', gap: 10 },
  twoColItem: { flex: 1 },
  groupTitle: { fontWeight: '900', opacity: 0.85, marginBottom: 6 },
  frequentLabel: { opacity: 0.75, marginBottom: 6, fontWeight: '700' },
  helper: { opacity: 0.75, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  inlineInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  inlineInput: { flex: 1, marginTop: 0 },
  painLegendRow: { flexDirection: 'row', gap: 8, marginBottom: 4, marginTop: 2 },
  painLegendNone: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#fff',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  painLegendMild: {
    backgroundColor: 'rgba(255,193,7,0.26)',
    color: '#fff',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  painLegendPain: {
    backgroundColor: 'rgba(244,67,54,0.26)',
    color: '#fff',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  choiceCount: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(76,175,80,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  choiceCountText: { color: '#fff', fontWeight: '900', fontSize: 11 },
});

