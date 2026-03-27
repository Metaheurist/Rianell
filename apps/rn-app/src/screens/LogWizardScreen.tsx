import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { addLogEntry, getFrequentLogItems, loadLogs, saveLogs, type LogEntry } from '../storage/logs';
import { getDefaultPreferences, type Preferences } from '../storage/preferences';
import { suggestLogNote } from '../ai/llm';
import { loadCachedBenchmark } from '../performance/benchmark';
import { normalizeLogEntry } from '@rianell/shared';
import { buildLogReviewSummary, parseMedicationNamesCsv } from '../log/buildLogReviewSummary';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { VoiceNotesButton } from '../voice/VoiceNotesButton';

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

const ENERGY_CLARITY_GROUPS = [
  { id: 'positive', label: 'Positive' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'negative', label: 'Negative' },
] as const;

type EnergyClarityGroupId = (typeof ENERGY_CLARITY_GROUPS)[number]['id'];

type EnergyClarityOption = { value: string; label: string; mood: EnergyClarityGroupId };

// Matches web ENERGY_CLARITY_OPTIONS for the tile picker (step "Energy & mental clarity").
const ENERGY_CLARITY_OPTIONS: EnergyClarityOption[] = [
  { value: 'High Energy', label: 'High Energy', mood: 'positive' },
  { value: 'Moderate Energy', label: 'Moderate Energy', mood: 'neutral' },
  { value: 'Low Energy', label: 'Low Energy', mood: 'negative' },
  { value: 'Mental Clarity', label: 'Mental Clarity', mood: 'positive' },
  { value: 'Brain Fog', label: 'Brain Fog', mood: 'negative' },
  { value: 'Good Concentration', label: 'Good Concentration', mood: 'positive' },
  { value: 'Poor Concentration', label: 'Poor Concentration', mood: 'negative' },
  { value: 'Mental Fatigue', label: 'Mental Fatigue', mood: 'negative' },
  { value: 'Focused', label: 'Focused', mood: 'positive' },
  { value: 'Distracted', label: 'Distracted', mood: 'negative' },
] as const;

const ENERGY_CLARITY_ICONS: Record<string, string> = {
  'High Energy': '⚡',
  'Moderate Energy': '⏳',
  'Low Energy': '🪫',
  'Mental Clarity': '✨',
  'Brain Fog': '🌫',
  'Good Concentration': '🎯',
  'Poor Concentration': '💤',
  'Mental Fatigue': '🧠',
  'Focused': '🔎',
  'Distracted': '🌀',
};
const SCORE_0_10_OPTIONS = ['0', '2', '4', '6', '8', '10'];
const SCORE_1_10_OPTIONS = ['1', '3', '5', '7', '9', '10'];
const STRESSOR_GROUPS = [
  { id: 'work', label: 'Work & demands' },
  { id: 'relationship', label: 'Relationships' },
  { id: 'physical', label: 'Physical' },
  { id: 'environment', label: 'Environment' },
  { id: 'emotional', label: 'Emotional & health' },
] as const;

type StressorGroupId = (typeof STRESSOR_GROUPS)[number]['id'];
type StressorOption = { value: string; label: string; group: StressorGroupId };

// Matches web STRESSOR_OPTIONS (grouped tile picker).
const STRESSOR_OPTIONS: StressorOption[] = [
  { value: 'Work deadline', label: 'Work deadline', group: 'work' },
  { value: 'Financial stress', label: 'Financial stress', group: 'work' },
  { value: 'Family conflict', label: 'Family conflict', group: 'relationship' },
  { value: 'Relationship issue', label: 'Relationship issue', group: 'relationship' },
  { value: 'Social event', label: 'Social event', group: 'relationship' },
  { value: 'Physical overexertion', label: 'Physical overexertion', group: 'physical' },
  { value: 'Sleep disruption', label: 'Sleep disruption', group: 'physical' },
  { value: 'Weather change', label: 'Weather change', group: 'environment' },
  { value: 'Travel', label: 'Travel', group: 'environment' },
  { value: 'Emotional stress', label: 'Emotional stress', group: 'emotional' },
  { value: 'Health concern', label: 'Health concern', group: 'emotional' },
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
  { id: 'left_upper_arm', label: 'Left upper arm' },
  { id: 'left_forearm', label: 'Left forearm' },
  { id: 'left_hand', label: 'Left hand' },
  { id: 'right_shoulder', label: 'Right shoulder' },
  { id: 'right_upper_arm', label: 'Right upper arm' },
  { id: 'right_forearm', label: 'Right forearm' },
  { id: 'right_hand', label: 'Right hand' },
  { id: 'left_elbow', label: 'Left elbow' },
  { id: 'right_elbow', label: 'Right elbow' },
  { id: 'left_wrist', label: 'Left wrist' },
  { id: 'right_wrist', label: 'Right wrist' },
  { id: 'left_hip', label: 'Left hip' },
  { id: 'left_thigh', label: 'Left thigh' },
  { id: 'right_hip', label: 'Right hip' },
  { id: 'right_thigh', label: 'Right thigh' },
  { id: 'left_knee', label: 'Left knee' },
  { id: 'left_lower_leg', label: 'Left lower leg' },
  { id: 'right_knee', label: 'Right knee' },
  { id: 'right_lower_leg', label: 'Right lower leg' },
  { id: 'left_ankle', label: 'Left ankle' },
  { id: 'left_foot', label: 'Left foot' },
  { id: 'right_ankle', label: 'Right ankle' },
  { id: 'right_foot', label: 'Right foot' },
] as const;

type PainState = 0 | 1 | 2;

function painStateText(value: PainState) {
  if (value === 1) return 'discomfort';
  if (value === 2) return 'pain';
  return 'good';
}

function painStateLabel(value: PainState) {
  if (value === 1) return 'Discomfort';
  if (value === 2) return 'Pain';
  return 'Good';
}

function painStateFill(value: PainState) {
  if (value === 1) return 'rgba(255,193,7,0.30)';
  if (value === 2) return 'rgba(244,67,54,0.28)';
  return 'rgba(76,175,80,0.18)';
}

function painStateStroke(value: PainState) {
  if (value === 1) return 'rgba(255,193,7,0.65)';
  if (value === 2) return 'rgba(244,67,54,0.65)';
  return 'rgba(76,175,80,0.55)';
}

/** Same path as web `index.html` `.pain-body-outline` (viewBox 0 0 140 280). */
const PAIN_BODY_OUTLINE_PATH =
  'M70 10 A26 28 0 0 1 70 66 Q58 70 50 78 Q42 90 44 108 Q46 138 48 168 Q50 198 48 238 Q46 268 52 278 L64 280 L76 280 L88 278 Q94 268 92 238 Q90 198 92 168 Q94 138 96 108 Q98 90 90 78 Q82 70 70 66 Z';

function energyTileSelectedBorder(tone: 'positive' | 'neutral' | 'negative' | 'default'): string {
  if (tone === 'positive') return 'rgba(129,199,132,0.95)';
  if (tone === 'negative') return 'rgba(239,154,154,0.95)';
  return 'rgba(255,255,255,0.5)';
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

function PainBodyDiagram(props: {
  states: Record<string, PainState>;
  onPressRegion: (regionId: string) => void;
}) {
  const { states, onPressRegion } = props;
  const strokeWidth = 2;

  // Front-view diagram: same vertical canvas as web (140×280) with outline path; regions are scaled to fill it.
  // Chips below remain the exhaustive fallback for all regions.
  return (
    <View
      accessibilityLabel="Pain body diagram"
      accessibilityHint="Tap a region to cycle good, discomfort, then pain"
      style={{ alignItems: 'center', marginVertical: 8 }}
    >
      <Svg width={220} height={440} viewBox="0 0 140 280">
        <Path
          d={PAIN_BODY_OUTLINE_PATH}
          fill="rgba(255,255,255,0.06)"
          stroke="rgba(76,175,80,0.25)"
          strokeWidth={0.5}
        />
        <G transform="scale(1, 1.4)">
        {/* Head */}
        <Circle
          cx={70}
          cy={22}
          r={16}
          fill={painStateFill(states.head ?? 0)}
          stroke={painStateStroke(states.head ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('head')}
          accessibilityLabel="Head region"
        />

        {/* Neck */}
        <Rect
          x={62}
          y={38}
          width={16}
          height={10}
          rx={6}
          fill={painStateFill(states.neck ?? 0)}
          stroke={painStateStroke(states.neck ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('neck')}
          accessibilityLabel="Neck region"
        />

        {/* Chest */}
        <Rect
          x={40}
          y={48}
          width={60}
          height={38}
          rx={16}
          fill={painStateFill(states.chest ?? 0)}
          stroke={painStateStroke(states.chest ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('chest')}
          accessibilityLabel="Chest region"
        />

        {/* Abdomen */}
        <Rect
          x={42}
          y={88}
          width={56}
          height={32}
          rx={14}
          fill={painStateFill(states.abdomen ?? 0)}
          stroke={painStateStroke(states.abdomen ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('abdomen')}
          accessibilityLabel="Abdomen region"
        />

        {/* Hips */}
        <Rect
          x={38}
          y={122}
          width={30}
          height={18}
          rx={10}
          fill={painStateFill(states.left_hip ?? 0)}
          stroke={painStateStroke(states.left_hip ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('left_hip')}
          accessibilityLabel="Left hip region"
        />
        <Rect
          x={72}
          y={122}
          width={30}
          height={18}
          rx={10}
          fill={painStateFill(states.right_hip ?? 0)}
          stroke={painStateStroke(states.right_hip ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('right_hip')}
          accessibilityLabel="Right hip region"
        />

        {/* Arms (simplified) */}
        <Rect
          x={16}
          y={55}
          width={20}
          height={18}
          rx={8}
          fill={painStateFill(states.left_shoulder ?? 0)}
          stroke={painStateStroke(states.left_shoulder ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('left_shoulder')}
          accessibilityLabel="Left shoulder region"
        />
        <Rect
          x={104}
          y={55}
          width={20}
          height={18}
          rx={8}
          fill={painStateFill(states.right_shoulder ?? 0)}
          stroke={painStateStroke(states.right_shoulder ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('right_shoulder')}
          accessibilityLabel="Right shoulder region"
        />
        <Rect
          x={6}
          y={76}
          width={18}
          height={36}
          rx={8}
          fill={painStateFill(states.left_upper_arm ?? 0)}
          stroke={painStateStroke(states.left_upper_arm ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('left_upper_arm')}
          accessibilityLabel="Left upper arm region"
        />
        <Rect
          x={116}
          y={76}
          width={18}
          height={36}
          rx={8}
          fill={painStateFill(states.right_upper_arm ?? 0)}
          stroke={painStateStroke(states.right_upper_arm ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('right_upper_arm')}
          accessibilityLabel="Right upper arm region"
        />
        <Rect
          x={6}
          y={114}
          width={18}
          height={30}
          rx={8}
          fill={painStateFill(states.left_forearm ?? 0)}
          stroke={painStateStroke(states.left_forearm ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('left_forearm')}
          accessibilityLabel="Left forearm region"
        />
        <Rect
          x={116}
          y={114}
          width={18}
          height={30}
          rx={8}
          fill={painStateFill(states.right_forearm ?? 0)}
          stroke={painStateStroke(states.right_forearm ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('right_forearm')}
          accessibilityLabel="Right forearm region"
        />
        <Circle
          cx={15}
          cy={112}
          r={6}
          fill={painStateFill(states.left_elbow ?? 0)}
          stroke={painStateStroke(states.left_elbow ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('left_elbow')}
          accessibilityLabel="Left elbow region"
        />
        <Circle
          cx={125}
          cy={112}
          r={6}
          fill={painStateFill(states.right_elbow ?? 0)}
          stroke={painStateStroke(states.right_elbow ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('right_elbow')}
          accessibilityLabel="Right elbow region"
        />
        <Circle
          cx={15}
          cy={146}
          r={5}
          fill={painStateFill(states.left_wrist ?? 0)}
          stroke={painStateStroke(states.left_wrist ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('left_wrist')}
          accessibilityLabel="Left wrist region"
        />
        <Circle
          cx={125}
          cy={146}
          r={5}
          fill={painStateFill(states.right_wrist ?? 0)}
          stroke={painStateStroke(states.right_wrist ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('right_wrist')}
          accessibilityLabel="Right wrist region"
        />
        <Rect
          x={4}
          y={146}
          width={22}
          height={14}
          rx={6}
          fill={painStateFill(states.left_hand ?? 0)}
          stroke={painStateStroke(states.left_hand ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('left_hand')}
          accessibilityLabel="Left hand region"
        />
        <Rect
          x={114}
          y={146}
          width={22}
          height={14}
          rx={6}
          fill={painStateFill(states.right_hand ?? 0)}
          stroke={painStateStroke(states.right_hand ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('right_hand')}
          accessibilityLabel="Right hand region"
        />

        {/* Legs */}
        <Rect
          x={44}
          y={142}
          width={22}
          height={28}
          rx={10}
          fill={painStateFill(states.left_thigh ?? 0)}
          stroke={painStateStroke(states.left_thigh ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('left_thigh')}
          accessibilityLabel="Left thigh region"
        />
        <Rect
          x={74}
          y={142}
          width={22}
          height={28}
          rx={10}
          fill={painStateFill(states.right_thigh ?? 0)}
          stroke={painStateStroke(states.right_thigh ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('right_thigh')}
          accessibilityLabel="Right thigh region"
        />
        <Circle
          cx={55}
          cy={172}
          r={7}
          fill={painStateFill(states.left_knee ?? 0)}
          stroke={painStateStroke(states.left_knee ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('left_knee')}
          accessibilityLabel="Left knee region"
        />
        <Circle
          cx={85}
          cy={172}
          r={7}
          fill={painStateFill(states.right_knee ?? 0)}
          stroke={painStateStroke(states.right_knee ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('right_knee')}
          accessibilityLabel="Right knee region"
        />
        <Rect
          x={48}
          y={180}
          width={16}
          height={16}
          rx={7}
          fill={painStateFill(states.left_foot ?? 0)}
          stroke={painStateStroke(states.left_foot ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('left_foot')}
          accessibilityLabel="Left foot region"
        />
        <Rect
          x={76}
          y={180}
          width={16}
          height={16}
          rx={7}
          fill={painStateFill(states.right_foot ?? 0)}
          stroke={painStateStroke(states.right_foot ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('right_foot')}
          accessibilityLabel="Right foot region"
        />

        {/* Lower legs */}
        <Rect
          x={48}
          y={178}
          width={16}
          height={18}
          rx={7}
          fill={painStateFill(states.left_lower_leg ?? 0)}
          stroke={painStateStroke(states.left_lower_leg ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('left_lower_leg')}
          accessibilityLabel="Left lower leg region"
        />
        <Rect
          x={76}
          y={178}
          width={16}
          height={18}
          rx={7}
          fill={painStateFill(states.right_lower_leg ?? 0)}
          stroke={painStateStroke(states.right_lower_leg ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('right_lower_leg')}
          accessibilityLabel="Right lower leg region"
        />
        <Circle
          cx={56}
          cy={195}
          r={5}
          fill={painStateFill(states.left_ankle ?? 0)}
          stroke={painStateStroke(states.left_ankle ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('left_ankle')}
          accessibilityLabel="Left ankle region"
        />
        <Circle
          cx={84}
          cy={195}
          r={5}
          fill={painStateFill(states.right_ankle ?? 0)}
          stroke={painStateStroke(states.right_ankle ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('right_ankle')}
          accessibilityLabel="Right ankle region"
        />
        </G>
      </Svg>
    </View>
  );
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

function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function parseNumberClamped(raw: string, min: number, max: number): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = Number(t);
  if (!Number.isFinite(n)) return undefined;
  return clampNumber(n, min, max);
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

type LogWizardScreenProps = { prefs?: Preferences };

export function LogWizardScreen({ prefs: prefsProp }: LogWizardScreenProps = {}) {
  const prefs = prefsProp ?? getDefaultPreferences();
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
  const [suggestNoteBusy, setSuggestNoteBusy] = useState(false);
  const [painLocation, setPainLocation] = useState('');
  const [painStates, setPainStates] = useState<Record<string, PainState>>({});
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [energyClarity, setEnergyClarity] = useState('');
  const [stressors, setStressors] = useState<string[]>([]);
  const [customStressor, setCustomStressor] = useState('');
  const [stressorSearch, setStressorSearch] = useState('');
  const [stressorPickerOpen, setStressorPickerOpen] = useState(true);
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
  const [energyClaritySearch, setEnergyClaritySearch] = useState('');
  const [energyPickerOpen, setEnergyPickerOpen] = useState(true);
  const [painRegionSearch, setPainRegionSearch] = useState('');

  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

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
    setStressorSearch('');
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

  function toggleEnergyPicker() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEnergyPickerOpen((v) => !v);
  }

  function toggleStressorPicker() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStressorPickerOpen((v) => !v);
  }

  function confirmClearAll(itemLabel: string, onYes: () => void) {
    Alert.alert('Clear selection', `Would you like to clear ${itemLabel}?`, [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', onPress: onYes },
    ]);
  }

  const painLocationFromBody = useMemo(() => buildPainLocationTextFromState(painStates), [painStates]);
  const filteredPainRegions = useMemo(() => {
    const q = painRegionSearch.trim().toLowerCase();
    if (!q) return PAIN_BODY_REGIONS;
    return PAIN_BODY_REGIONS.filter((region) => region.label.toLowerCase().includes(q));
  }, [painRegionSearch]);
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
      steps: parseNumberClamped(steps, 0, 50000),
      hydration: parseNumberClamped(hydration, 0, 20),
      notes: notes || undefined,
      painLocation: [painLocationFromBody, painLocation].filter(Boolean).join(', ') || undefined,
      symptoms: symptoms.length ? symptoms : undefined,
      energyClarity: energyClarity || undefined,
      stressors: stressors.length ? stressors : undefined,
      dailyFunction: parseNumberClamped(dailyFunction, 0, 10),
      irritability: parseNumberClamped(irritability, 0, 10),
      weatherSensitivity: parseNumberClamped(weatherSensitivity, 1, 10),
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

  async function onSuggestNote() {
    if (suggestNoteBusy || prefs.aiEnabled === false) return;
    setSuggestNoteBusy(true);
    try {
      const benchmark = await loadCachedBenchmark().catch(() => null);
      const text = await suggestLogNote(draft, prefs.performance.preferredLlmModelSize, benchmark);
      const cur = notes.trim();
      const next = (cur ? `${cur} ${text}` : text).trim();
      setNotes(next.slice(0, 500));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not suggest a note';
      Alert.alert('Suggest note', msg);
    } finally {
      setSuggestNoteBusy(false);
    }
  }

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

            {/* Sleep / mood / fatigue inputs are part of the Energy & mental clarity step (Step 3, web parity). */}

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
              Tap a region to cycle: good → discomfort → pain.
            </Text>
            <PainBodyDiagram states={painStates} onPressRegion={cyclePainRegion} />
            <View style={styles.painLegendRow}>
              <Text style={[styles.painLegendNone, { fontSize: theme.font(12) }]}>Good</Text>
              <Text style={[styles.painLegendMild, { fontSize: theme.font(12) }]}>Discomfort</Text>
              <Text style={[styles.painLegendPain, { fontSize: theme.font(12) }]}>Pain</Text>
            </View>
            <Text style={[styles.helper, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
              Selected: {painCounts.mild} mild, {painCounts.pain} pain
            </Text>
            {painLocationFromBody ? (
              <View style={{ marginTop: 6 }}>
                <Text style={[styles.helper, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>From diagram: {painLocationFromBody}</Text>
                <View style={{ marginTop: 6, alignItems: 'flex-start' }}>
                  <Pressable
                    onPress={() => setPainLocation(painLocationFromBody)}
                    style={styles.secondaryBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Use diagram pain text"
                  >
                    <Text style={[styles.btnText, { fontSize: theme.font(13) }]}>Use diagram text</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
            <TextInput
              value={painRegionSearch}
              onChangeText={setPainRegionSearch}
              style={[styles.input, { color: theme.tokens.color.text, marginTop: 8 }]}
              accessibilityLabel="Search pain body regions"
              placeholder="Search body regions"
              placeholderTextColor="rgba(255,255,255,0.6)"
            />
            <View style={styles.chips}>
              {filteredPainRegions.map((region) => {
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
            {filteredPainRegions.length === 0 ? (
              <Text style={[styles.helper, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                No body regions match that search.
              </Text>
            ) : null}
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
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Energy &amp; mental clarity</Text>
            <Text style={[styles.helper, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
              Enter fatigue, sleep, and mood scores, then pick one energy &amp; clarity tile (Positive / Neutral / Negative groups).
            </Text>

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Fatigue (1–10)</Text>
            <TextInput
              value={fatigue}
              onChangeText={setFatigue}
              style={[styles.input, { color: theme.tokens.color.text }]}
              keyboardType="number-pad"
              accessibilityLabel="Fatigue score 1 to 10"
            />

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Sleep (1–10)</Text>
            <TextInput
              value={sleep}
              onChangeText={setSleep}
              style={[styles.input, { color: theme.tokens.color.text }]}
              keyboardType="number-pad"
              accessibilityLabel="Sleep quality score 1 to 10"
            />

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Mood (1–10)</Text>
            <TextInput
              value={mood}
              onChangeText={setMood}
              style={[styles.input, { color: theme.tokens.color.text }]}
              keyboardType="number-pad"
              accessibilityLabel="Mood score 1 to 10"
            />

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Energy &amp; clarity</Text>
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.frequentLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                {energyClarity ? `Selected: ${energyClarity}` : 'None selected'}
              </Text>
              {energyClarity ? (
                <Pressable
                  onPress={() => setEnergyClarity('')}
                  style={[styles.secondaryBtn, { alignSelf: 'flex-start', marginTop: 6 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Clear energy and mental clarity"
                >
                  <Text style={[styles.btnText, { fontSize: theme.font(13) }]}>Clear selected</Text>
                </Pressable>
              ) : null}
            </View>

            <Pressable
              onPress={toggleEnergyPicker}
              style={[styles.secondaryBtn, { alignSelf: 'flex-start', marginTop: 10, marginBottom: 8 }]}
              accessibilityRole="button"
              accessibilityLabel="Toggle energy picker"
            >
              <Text style={[styles.btnText, { fontSize: theme.font(13) }]}>{energyPickerOpen ? 'Hide tiles' : 'Show tiles'}</Text>
            </Pressable>

            {energyPickerOpen ? (
              <View>
            <TextInput
              value={energyClaritySearch}
              onChangeText={setEnergyClaritySearch}
              style={[styles.input, { color: theme.tokens.color.text, marginBottom: 8 }]}
              accessibilityLabel="Filter energy and mental clarity options"
              placeholder="Filter options"
              placeholderTextColor="rgba(255,255,255,0.6)"
            />

            {ENERGY_CLARITY_GROUPS.map((grp) => {
              const opts = ENERGY_CLARITY_OPTIONS.filter((o) => o.mood === grp.id).filter((o) => {
                const s = energyClaritySearch.trim().toLowerCase();
                if (!s) return true;
                return (o.label + ' ' + o.value).toLowerCase().includes(s);
              });
              if (opts.length === 0) return null;
              return (
                <View key={grp.id} style={{ marginBottom: 10 }}>
                  <Text style={[styles.groupTitle, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{grp.label}</Text>
                  <View style={styles.chips}>
                    {opts.map((opt) => (
                      <Choice
                        key={opt.value}
                        label={opt.label}
                        selected={energyClarity === opt.value}
                        icon={ENERGY_CLARITY_ICONS[opt.value]}
                        variant="tile"
                        tone={grp.id}
                        onPress={() => setEnergyClarity(opt.value)}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
              </View>
            ) : null}
            {energyPickerOpen &&
            !ENERGY_CLARITY_OPTIONS.some((o) =>
              `${o.label} ${o.value}`.toLowerCase().includes(energyClaritySearch.trim().toLowerCase())
            ) ? (
              <Text style={[styles.helper, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                No energy options match that search.
              </Text>
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
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Stress & triggers</Text>
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

            {stressors.length ? (
              <View style={{ marginTop: 4, marginBottom: 8 }}>
                <Text style={[styles.frequentLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>Selected</Text>
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

            <Pressable
              onPress={toggleStressorPicker}
              style={[styles.secondaryBtn, { alignSelf: 'flex-start', marginBottom: 8 }]}
              accessibilityRole="button"
              accessibilityLabel="Toggle stressor picker"
            >
              <Text style={[styles.btnText, { fontSize: theme.font(13) }]}>{stressorPickerOpen ? 'Hide stressor picker' : 'Show stressor picker'}</Text>
            </Pressable>

            {stressorPickerOpen ? (
              <View style={{ marginBottom: 8 }}>
                <TextInput
                  value={stressorSearch}
                  onChangeText={setStressorSearch}
                  style={[styles.input, { color: theme.tokens.color.text }]}
                  placeholder="Search stressors"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  accessibilityLabel="Search stressors"
                />

                {frequentStressors.length > 0 ? (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={[styles.frequentLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>Frequent</Text>
                    <View style={styles.chips}>
                      {frequentStressors
                        .filter((s) => s.toLowerCase().includes(stressorSearch.trim().toLowerCase()))
                        .map((opt) => (
                          <Choice key={`freq-str-${opt}`} label={opt} selected={stressors.includes(opt)} onPress={() => toggleStressor(opt)} />
                        ))}
                    </View>
                  </View>
                ) : null}

                {STRESSOR_GROUPS.map((grp) => {
                  const opts = STRESSOR_OPTIONS.filter((o) => o.group === grp.id).filter((o) =>
                    `${o.label} ${o.value}`.toLowerCase().includes(stressorSearch.trim().toLowerCase())
                  );
                  if (!opts.length) return null;
                  return (
                    <View key={grp.id} style={{ marginBottom: 8 }}>
                      <Text style={[styles.frequentLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>{grp.label}</Text>
                      <View style={styles.chips}>
                        {opts.map((opt) => (
                          <Choice
                            key={`str-${opt.value}`}
                            label={opt.label}
                            selected={stressors.includes(opt.value)}
                            onPress={() => toggleStressor(opt.value)}
                          />
                        ))}
                      </View>
                    </View>
                  );
                })}
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
              accessibilityLabel="Daily function"
            />

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Steps (if tracked)</Text>
            <TextInput
              value={steps}
              onChangeText={setSteps}
              style={[styles.input, { color: theme.tokens.color.text }]}
              keyboardType="number-pad"
              accessibilityLabel="Steps"
            />

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Hydration (glasses)</Text>
            <TextInput
              value={hydration}
              onChangeText={setHydration}
              style={[styles.input, { color: theme.tokens.color.text }]}
              keyboardType="decimal-pad"
              accessibilityLabel="Hydration"
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
            <View style={{ marginTop: 6, marginBottom: 8, alignItems: 'flex-start' }}>
              <Pressable
                onPress={() => {
                  setBreakfastText('');
                  setLunchText('');
                  setDinnerText('');
                  setSnackText('');
                }}
                style={styles.secondaryBtn}
                accessibilityRole="button"
                accessibilityLabel="Clear all food"
              >
                <Text style={[styles.btnText, { fontSize: theme.font(13) }]}>Clear all food</Text>
              </Pressable>
            </View>
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
            <View style={{ marginTop: 6, marginBottom: 8, alignItems: 'flex-start' }}>
              <Pressable
                onPress={() => setExerciseText('')}
                style={styles.secondaryBtn}
                accessibilityRole="button"
                accessibilityLabel="Clear all exercise"
              >
                <Text style={[styles.btnText, { fontSize: theme.font(13) }]}>Clear all exercise</Text>
              </Pressable>
            </View>
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
            <View style={{ marginTop: 6, marginBottom: 8, alignItems: 'flex-start' }}>
              <Pressable
                onPress={() => setMedicationText('')}
                style={styles.secondaryBtn}
                accessibilityRole="button"
                accessibilityLabel="Clear all medications"
              >
                <Text style={[styles.btnText, { fontSize: theme.font(13) }]}>Clear all medications</Text>
              </Pressable>
            </View>
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

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>Notes (Optional)</Text>
            <Text style={[styles.helper, { color: theme.tokens.color.text, fontSize: theme.font(12), marginTop: 0 }]}>
              Notes {notes.length}/500
            </Text>
            <VoiceNotesButton
              value={notes}
              onChangeText={(t) => setNotes(t.slice(0, 500))}
              accent={theme.tokens.color.accent}
              textColor={theme.tokens.color.text}
            />
            <TextInput
              value={notes}
              onChangeText={(t) => setNotes(t.slice(0, 500))}
              style={[styles.input, { color: theme.tokens.color.text, height: 120, borderColor: theme.tokens.color.accent }]}
              multiline
              maxLength={500}
              accessibilityLabel="Log notes"
              placeholder="Tap here and use voice dictation to quickly add notes about your symptoms, triggers, or activities..."
              placeholderTextColor="rgba(255,255,255,0.6)"
            />
            {prefs.aiEnabled !== false ? (
              <Pressable
                onPress={() => void onSuggestNote()}
                disabled={suggestNoteBusy}
                style={({ pressed }) => [styles.suggestNoteBtn, pressed && { opacity: 0.75 }]}
                accessibilityRole="button"
                accessibilityLabel={suggestNoteBusy ? 'Generating suggest note' : 'Suggest note'}
                accessibilityState={{ disabled: suggestNoteBusy, busy: suggestNoteBusy }}
              >
                <Text style={{ color: theme.tokens.color.accent, fontSize: theme.font(15), fontWeight: '700' }}>
                  {suggestNoteBusy ? 'Generating…' : 'Suggest note'}
                </Text>
              </Pressable>
            ) : null}

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
  icon,
  variant = 'pill',
  tone = 'default',
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  count?: number;
  onCountPress?: () => void;
  icon?: string;
  variant?: 'pill' | 'tile';
  tone?: 'default' | 'positive' | 'neutral' | 'negative';
}) {
  const showCount = typeof count === 'number' && count > 0;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.choice,
        variant === 'tile' ? styles.choiceTile : null,
        variant === 'tile' && tone === 'positive' ? styles.choiceTilePositive : null,
        variant === 'tile' && tone === 'neutral' ? styles.choiceTileNeutral : null,
        variant === 'tile' && tone === 'negative' ? styles.choiceTileNegative : null,
        selected ? styles.choiceSelected : null,
        variant === 'tile' && selected && tone !== 'default'
          ? { borderWidth: 2, borderColor: energyTileSelectedBorder(tone) }
          : null,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.choiceInner}>
        {icon ? <Text style={styles.choiceIcon}>{icon}</Text> : null}
        <Text style={[styles.choiceText, selected ? styles.choiceTextSelected : null]}>{label}</Text>
      </View>
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
  choiceTile: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minWidth: 120,
  },
  choiceTilePositive: { borderWidth: 1, borderColor: 'rgba(76,175,80,0.55)' },
  choiceTileNeutral: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  choiceTileNegative: { borderWidth: 1, borderColor: 'rgba(244,67,54,0.42)' },
  choiceSelected: { backgroundColor: 'rgba(255,255,255,0.22)' },
  choiceMild: { backgroundColor: 'rgba(255,193,7,0.26)', borderWidth: 1, borderColor: 'rgba(255,193,7,0.6)' },
  choicePain: { backgroundColor: 'rgba(244,67,54,0.26)', borderWidth: 1, borderColor: 'rgba(244,67,54,0.6)' },
  choiceInner: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  choiceIcon: { color: '#fff', fontWeight: '900' },
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
  suggestNoteBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  inlineInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  inlineInput: { flex: 1, marginTop: 0 },
  painLegendRow: { flexDirection: 'row', gap: 8, marginBottom: 4, marginTop: 2 },
  painLegendNone: {
    backgroundColor: 'rgba(76,175,80,0.22)',
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

