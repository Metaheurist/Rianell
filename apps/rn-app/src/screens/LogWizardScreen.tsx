import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import * as Haptics from 'expo-haptics';
import { CycleTrackingInput } from '../components/CycleTrackingInput';
import { VitalsLastValueHint } from '../components/VitalsLastValueHint';
import { FoodSearchInput } from '../components/FoodSearchInput';
import { requestOpenGoalsModal } from '../achievements/goalsModalBridge';
import { useT } from '../i18n/I18nProvider';
import { useTheme } from '../theme/ThemeProvider';
import { addLogEntry, getFrequentLogItems, loadLogs, type LogEntry } from '../storage/logs';
import { persistWizardLogEntry } from '../storage/wizardPersist';
import { getDefaultPreferences, type Preferences } from '../storage/preferences';
import { suggestLogNote } from '../ai/llm';
import { loadCachedBenchmark } from '../performance/benchmark';
import {
  normalizeLogEntry,
  getSymptomChipsForCondition,
  shouldShowWizardCategory,
  stampLogEntryForCaregiver,
  buildTodayMedDoseStatuses,
  formatIsoDate,
  suggestCycleForDate,
  CYCLE_PHASES,
  extractLogFieldsFromVoiceTranscript,
  painBodyStateToLocations,
  computeBmiKg,
  buildVitalSuggestions,
} from '@rianell/shared';
import { buildLogReviewSummary, parseMedicationNamesCsv } from '../log/buildLogReviewSummary';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { VoiceNotesButton } from '../voice/VoiceNotesButton';
import { useToast } from '../components/ui';
import {
  getUnlockBannerI18nKey,
  markUnlockBannerShown,
  runPostLogSaveEngagement,
  shouldShowUnlockBanner,
  type UnlockCategory,
} from '../utils/engagementGamification';

type VitalSuggestionsMap = Record<
  string,
  { fromDate: string; displayValue: string; values: Record<string, number | string> }
>;

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
  { id: 'walking', name: 'Walking', defaultDuration: 30, category: 'cardio' },
  { id: 'cycling', name: 'Cycling', defaultDuration: 40, category: 'cardio' },
  { id: 'swimming', name: 'Swimming', defaultDuration: 25, category: 'cardio' },
  { id: 'yoga', name: 'Yoga', defaultDuration: 30, category: 'flexibility' },
  { id: 'stretching', name: 'Stretching', defaultDuration: 15, category: 'flexibility' },
  { id: 'balance', name: 'Balance exercises', defaultDuration: 10, category: 'balance' },
  { id: 'resistance_bands', name: 'Resistance band exercises', defaultDuration: 15, category: 'strength' },
  { id: 'core', name: 'Core exercises', defaultDuration: 15, category: 'strength' },
  { id: 'meditation', name: 'Meditation / relaxation', defaultDuration: 15, category: 'recovery' },
  { id: 'gentle_mobility', name: 'Gentle mobility flow', defaultDuration: 15, category: 'recovery' },
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

function buildPainLocationTextFromState(
  state: Record<string, PainState>,
  regionLabel: (id: string, fallback: string) => string = (_, fb) => fb,
): string {
  const parts: string[] = [];
  PAIN_BODY_REGIONS.forEach((region) => {
    const v = state[region.id] ?? 0;
    const label = regionLabel(region.id, region.label);
    if (v === 1) parts.push(`${label} (mild)`);
    if (v === 2) parts.push(`${label} (pain)`);
  });
  return parts.join(', ');
}

function PainBodyDiagram(props: {
  states: Record<string, PainState>;
  onPressRegion: (regionId: string) => void;
  diagramLabel: string;
  diagramHint: string;
  regionA11y: (region: string) => string;
}) {
  const { states, onPressRegion, diagramLabel, diagramHint, regionA11y } = props;
  const strokeWidth = 2;

  // Front-view diagram: same vertical canvas as web (140×280) with outline path; regions are scaled to fill it.
  // Chips below remain the exhaustive fallback for all regions.
  return (
    <View
      accessibilityLabel={diagramLabel}
      accessibilityHint={diagramHint}
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
          accessibilityLabel={regionA11y('Head')}
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
          accessibilityLabel={regionA11y('Neck')}
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
          accessibilityLabel={regionA11y('Chest')}
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
          accessibilityLabel={regionA11y('Abdomen')}
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
          accessibilityLabel={regionA11y('Left hip')}
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
          accessibilityLabel={regionA11y('Right hip')}
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
          accessibilityLabel={regionA11y('Left shoulder')}
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
          accessibilityLabel={regionA11y('Right shoulder')}
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
          accessibilityLabel={regionA11y('Left upper arm')}
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
          accessibilityLabel={regionA11y('Right upper arm')}
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
          accessibilityLabel={regionA11y('Left forearm')}
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
          accessibilityLabel={regionA11y('Right forearm')}
        />
        <Circle
          cx={15}
          cy={112}
          r={6}
          fill={painStateFill(states.left_elbow ?? 0)}
          stroke={painStateStroke(states.left_elbow ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('left_elbow')}
          accessibilityLabel={regionA11y('Left elbow')}
        />
        <Circle
          cx={125}
          cy={112}
          r={6}
          fill={painStateFill(states.right_elbow ?? 0)}
          stroke={painStateStroke(states.right_elbow ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('right_elbow')}
          accessibilityLabel={regionA11y('Right elbow')}
        />
        <Circle
          cx={15}
          cy={146}
          r={5}
          fill={painStateFill(states.left_wrist ?? 0)}
          stroke={painStateStroke(states.left_wrist ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('left_wrist')}
          accessibilityLabel={regionA11y('Left wrist')}
        />
        <Circle
          cx={125}
          cy={146}
          r={5}
          fill={painStateFill(states.right_wrist ?? 0)}
          stroke={painStateStroke(states.right_wrist ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('right_wrist')}
          accessibilityLabel={regionA11y('Right wrist')}
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
          accessibilityLabel={regionA11y('Left hand')}
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
          accessibilityLabel={regionA11y('Right hand')}
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
          accessibilityLabel={regionA11y('Left thigh')}
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
          accessibilityLabel={regionA11y('Right thigh')}
        />
        <Circle
          cx={55}
          cy={172}
          r={7}
          fill={painStateFill(states.left_knee ?? 0)}
          stroke={painStateStroke(states.left_knee ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('left_knee')}
          accessibilityLabel={regionA11y('Left knee')}
        />
        <Circle
          cx={85}
          cy={172}
          r={7}
          fill={painStateFill(states.right_knee ?? 0)}
          stroke={painStateStroke(states.right_knee ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('right_knee')}
          accessibilityLabel={regionA11y('Right knee')}
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
          accessibilityLabel={regionA11y('Left foot')}
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
          accessibilityLabel={regionA11y('Right foot')}
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
          accessibilityLabel={regionA11y('Left lower leg')}
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
          accessibilityLabel={regionA11y('Right lower leg')}
        />
        <Circle
          cx={56}
          cy={195}
          r={5}
          fill={painStateFill(states.left_ankle ?? 0)}
          stroke={painStateStroke(states.left_ankle ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('left_ankle')}
          accessibilityLabel={regionA11y('Left ankle')}
        />
        <Circle
          cx={84}
          cy={195}
          r={5}
          fill={painStateFill(states.right_ankle ?? 0)}
          stroke={painStateStroke(states.right_ankle ?? 0)}
          strokeWidth={strokeWidth}
          onPress={() => onPressRegion('right_ankle')}
          accessibilityLabel={regionA11y('Right ankle')}
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

function contentSlug(id: string) {
  return String(id).replace(/[^a-zA-Z0-9_]/g, '_');
}

export function LogWizardScreen({ prefs: prefsProp }: LogWizardScreenProps = {}) {
  const prefs = prefsProp ?? getDefaultPreferences();
  const theme = useTheme();
  const { t, locale, isRtl } = useT();
  const tContent = useCallback(
    (prefix: string, id: string, fallback: string) => {
      const key = `content.${prefix}.${contentSlug(id)}`;
      const val = t(key);
      return val !== key ? val : fallback;
    },
    [t],
  );
  const toast = useToast();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const bg =
    theme.tokens.color.background === 'linear-gradient(135deg, #a8e6cf 0%, #c8e6c9 25%, #e8f5e8 75%, #f1f8e9 100%)'
      ? '#ffffff'
      : theme.tokens.color.background;
  const rowDir = isRtl ? 'row-reverse' : 'row';

  const [step, setStep] = useState<Step>(0);

  const [date, setDate] = useState(today());
  const [flare, setFlare] = useState<'Yes' | 'No'>('No');

  const [bpm, setBpm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [bloodPressureSystolic, setBloodPressureSystolic] = useState('');
  const [bloodPressureDiastolic, setBloodPressureDiastolic] = useState('');
  const [bloodGlucose, setBloodGlucose] = useState('');
  const [spO2, setSpO2] = useState('');
  const [hrv, setHrv] = useState('');
  const [bodyWeight, setBodyWeight] = useState('');
  const [bristol, setBristol] = useState<number | null>(null);
  const [gratitude, setGratitude] = useState('');
  const [bbt, setBbt] = useState('');
  const [supplements, setSupplements] = useState<Array<{ name: string; dose?: string }>>([]);
  const [supplementName, setSupplementName] = useState('');
  const [supplementDose, setSupplementDose] = useState('');
  const [photoAttachments, setPhotoAttachments] = useState<Array<{ url: string; caption?: string }>>([]);
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
  const [subEntryPeriod, setSubEntryPeriod] = useState<'AM' | 'PM' | 'partial'>('partial');
  const [cycleDay, setCycleDay] = useState<number | null>(null);
  const [cyclePhase, setCyclePhase] = useState('');
  const [cycleFlow, setCycleFlow] = useState('');
  const [cyclePeriodStart, setCyclePeriodStart] = useState(false);
  const [cyclePeriodAnchorDate, setCyclePeriodAnchorDate] = useState<string | null>(null);
  const [cycleSuggestHint, setCycleSuggestHint] = useState<string | null>(null);
  const [vitalSuggestions, setVitalSuggestions] = useState<VitalSuggestionsMap>({});
  const cycleAutoFilledRef = useRef(false);
  const cycleSuggestedDateRef = useRef('');
  const cycleStateRef = useRef({
    cycleDay: null as number | null,
    cyclePhase: '',
    cycleFlow: '',
    cyclePeriodStart: false,
  });
  const [medDoseStatus, setMedDoseStatus] = useState<Record<string, 'taken' | 'skipped' | 'missed'>>({});
  const [unlockBanner, setUnlockBanner] = useState<UnlockCategory | null>(null);
  const unlockBannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    Alert.alert(t('wizard.alert.clearSelection.title'), t('wizard.alert.clearSelection.body', { item: itemLabel }), [
      { text: t('common.no'), style: 'cancel' },
      { text: t('common.yes'), onPress: onYes },
    ]);
  }

  const painLocationFromBody = useMemo(
    () => buildPainLocationTextFromState(painStates, (id, fb) => tContent('bodyRegion', id, fb)),
    [painStates, tContent],
  );
  const filteredPainRegions = useMemo(() => {
    const q = painRegionSearch.trim().toLowerCase();
    if (!q) return PAIN_BODY_REGIONS;
    return PAIN_BODY_REGIONS.filter((region) =>
      tContent('bodyRegion', region.id, region.label).toLowerCase().includes(q),
    );
  }, [painRegionSearch, tContent]);
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
  const symptomTemplateChips = useMemo(
    () => getSymptomChipsForCondition(prefs.symptomTemplates, prefs.medicalCondition || prefs.trackingProfile?.condition),
    [prefs.symptomTemplates, prefs.medicalCondition, prefs.trackingProfile],
  );
  const showFoodStep = shouldShowWizardCategory(prefs.trackingProfile, 'food');
  const showExerciseStep = shouldShowWizardCategory(prefs.trackingProfile, 'exercise');
  const showMedicationsStep = shouldShowWizardCategory(prefs.trackingProfile, 'medications');
  const favoriteMeals = prefs.logFavorites?.meals ?? [];
  const favoriteExercises = prefs.logFavorites?.exercises ?? [];
  const todayMedDoses = useMemo(
    () => buildTodayMedDoseStatuses(prefs.medSchedule, date),
    [prefs.medSchedule, date],
  );
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
    cycleStateRef.current = { cycleDay, cyclePhase, cycleFlow, cyclePeriodStart };
  }, [cycleDay, cyclePhase, cycleFlow, cyclePeriodStart]);

  useEffect(() => {
    if (!prefs.cycleModuleEnabled) {
      setCycleSuggestHint(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { cycleDay: d, cyclePhase: p, cycleFlow: f } = cycleStateRef.current;
      if (date !== cycleSuggestedDateRef.current && cycleAutoFilledRef.current) {
        setCycleDay(null);
        setCyclePhase('');
        setCycleFlow('');
        setCyclePeriodStart(false);
        setCyclePeriodAnchorDate(null);
        cycleAutoFilledRef.current = false;
        setCycleSuggestHint(null);
      } else if (d != null || p || f) {
        return;
      }
      if (cycleSuggestedDateRef.current === date) return;
      const loadedLogs = await loadLogs();
      if (cancelled) return;
      const suggestion = suggestCycleForDate(loadedLogs, date);
      if (!suggestion?.cycleDay) return;
      cycleAutoFilledRef.current = true;
      cycleSuggestedDateRef.current = date;
      setCycleDay(suggestion.cycleDay);
      setCyclePhase(suggestion.phase || '');
      setCyclePeriodAnchorDate(suggestion.periodStartDate || suggestion.fromDate || null);
      const phaseMeta = CYCLE_PHASES.find((phase) => phase.id === suggestion.phase);
      const phaseLabel = phaseMeta ? t(phaseMeta.i18n) : '';
      if (suggestion.periodStartDate) {
        setCycleSuggestHint(t('wizard.cycle.autoFromPeriodStart', { date: suggestion.periodStartDate }));
      } else {
        setCycleSuggestHint(
          t('wizard.cycle.suggestedFromLast', { day: String(suggestion.cycleDay), phase: phaseLabel }),
        );
      }
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [date, prefs.cycleModuleEnabled, t]);

  const vitalUnitPrefs = useMemo(
    () => ({
      weightUnit: prefs.weightUnit === 'lb' ? 'lb' : 'kg',
      glucoseUnit: prefs.glucoseUnit === 'mgdl' ? 'mgdl' : 'mmol',
      bodyWeightUnit: prefs.bodyWeightUnit === 'lbs' ? 'lbs' : 'kg',
    }),
    [prefs.bodyWeightUnit, prefs.glucoseUnit, prefs.weightUnit],
  );

  useEffect(() => {
    if (step !== 1) return;
    let cancelled = false;
    loadLogs()
      .then((loadedLogs) => {
        if (cancelled) return;
        setVitalSuggestions(
          buildVitalSuggestions(loadedLogs, date, { unitPrefs: vitalUnitPrefs }) as VitalSuggestionsMap,
        );
      })
      .catch(() => {
        if (!cancelled) setVitalSuggestions({});
      });
    return () => {
      cancelled = true;
    };
  }, [date, step, vitalUnitPrefs]);

  const renderVitalHint = useCallback(
    (fieldId: string, isEmpty: boolean, onApply: () => void) => {
      const row = vitalSuggestions[fieldId];
      if (!isEmpty || !row) return null;
      return (
        <VitalsLastValueHint
          label={t('wizard.vitals.useLastValue', {
            value: row.displayValue,
            date: formatIsoDate(row.fromDate, locale, { dateStyle: 'medium' }),
          })}
          onPress={onApply}
        />
      );
    },
    [locale, t, vitalSuggestions],
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
      bloodPressureSystolic: bloodPressureSystolic ? Number(bloodPressureSystolic) : undefined,
      bloodPressureDiastolic: bloodPressureDiastolic ? Number(bloodPressureDiastolic) : undefined,
      bloodGlucose: bloodGlucose ? Number(bloodGlucose) : undefined,
      bloodGlucoseUnit: prefs.glucoseUnit === 'mgdl' ? 'mgdl' : 'mmol',
      spO2: spO2 ? Number(spO2) : undefined,
      hrv: hrv ? Number(hrv) : undefined,
      bodyWeight: bodyWeight ? Number(bodyWeight) : undefined,
      bodyWeightUnit: prefs.bodyWeightUnit === 'lbs' ? 'lbs' : 'kg',
      bristol: bristol ?? undefined,
      gratitude: gratitude || undefined,
      bbt: bbt ? Number(bbt) : undefined,
      bbtUnit: prefs.temperatureUnit === 'fahrenheit' ? 'fahrenheit' : 'celsius',
      painLocations: painBodyStateToLocations(painStates),
      supplements: supplements.length ? supplements : undefined,
      photoAttachments: photoAttachments.length ? photoAttachments : undefined,
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
      subEntries:
        subEntryPeriod !== 'partial' || notes || mood || fatigue || sleep
          ? [
              {
                id: `${date}-${subEntryPeriod}`,
                period: subEntryPeriod,
                mood: mood ? Number(mood) : undefined,
                fatigue: fatigue ? Number(fatigue) : undefined,
                sleep: sleep ? Number(sleep) : undefined,
                notes: notes || undefined,
              },
            ]
          : undefined,
      cycle:
        prefs.cycleModuleEnabled && (cycleDay != null || cyclePhase || cycleFlow || cyclePeriodStart)
          ? {
              cycleDay: cycleDay ?? undefined,
              phase: cyclePhase || undefined,
              flow: cycleFlow || undefined,
              periodStart: cyclePeriodStart || undefined,
            }
          : undefined,
      medicationDoses: todayMedDoses.length
        ? todayMedDoses.map((d) => ({
            ...d,
            status: medDoseStatus[d.scheduledAt] || d.status,
          }))
        : undefined,
    };
    return stampLogEntryForCaregiver(normalizeLogEntry(base) as LogEntry, prefs);
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
    subEntryPeriod,
    cycleDay,
    cyclePhase,
    cycleFlow,
    cyclePeriodStart,
    prefs.cycleModuleEnabled,
    todayMedDoses,
    medDoseStatus,
    prefs.caregiverModeEnabled,
    prefs.caregiverDependentName,
    prefs.caregiverRelationship,
  ]);

  async function onSuggestNote() {
    if (suggestNoteBusy || prefs.aiEnabled === false) return;
    setSuggestNoteBusy(true);
    try {
      const benchmark = await loadCachedBenchmark().catch(() => null);
      const text = await suggestLogNote(draft, prefs.performance.preferredLlmModelSize, benchmark, locale);
      const cur = notes.trim();
      const next = (cur ? `${cur} ${text}` : text).trim();
      setNotes(next.slice(0, 500));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('wizard.alert.suggestNote.failed');
      Alert.alert(t('wizard.alert.suggestNote.title'), msg);
    } finally {
      setSuggestNoteBusy(false);
    }
  }

  function validateStep0() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      Alert.alert(t('common.validation.title'), t('common.validation.dateFormat'));
      return false;
    }
    return true;
  }

  function hapticLight() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }

  function dismissUnlockBanner() {
    if (unlockBannerTimerRef.current) {
      clearTimeout(unlockBannerTimerRef.current);
      unlockBannerTimerRef.current = null;
    }
    setUnlockBanner(null);
  }

  function showUnlockBanner(category: UnlockCategory) {
    dismissUnlockBanner();
    setUnlockBanner(category);
    void markUnlockBannerShown(category);
    unlockBannerTimerRef.current = setTimeout(() => {
      setUnlockBanner(null);
      unlockBannerTimerRef.current = null;
    }, 3000);
  }

  useEffect(() => {
    return () => {
      if (unlockBannerTimerRef.current) clearTimeout(unlockBannerTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (step === 6 && showFoodStep) {
      void shouldShowUnlockBanner(prefs.trackingProfile, 'food').then((show) => {
        if (show) showUnlockBanner('food');
      });
    } else if (step === 7 && showExerciseStep) {
      void shouldShowUnlockBanner(prefs.trackingProfile, 'exercise').then((show) => {
        if (show) showUnlockBanner('exercise');
      });
    } else if (step === 8 && showMedicationsStep) {
      void shouldShowUnlockBanner(prefs.trackingProfile, 'medications').then((show) => {
        if (show) showUnlockBanner('medications');
      });
    } else {
      dismissUnlockBanner();
    }
  }, [step, showFoodStep, showExerciseStep, showMedicationsStep, prefs.trackingProfile]);

  function renderUnlockBanner() {
    if (!unlockBanner) return null;
    return (
      <Pressable
        onPress={dismissUnlockBanner}
        style={[styles.unlockBanner, { borderColor: theme.tokens.color.accent + '55', backgroundColor: theme.tokens.color.accent + '14' }]}
        accessibilityRole="button"
        accessibilityLabel={t(getUnlockBannerI18nKey(unlockBanner))}
      >
        <Text style={{ color: theme.tokens.color.text, fontSize: theme.font(13) }}>{t(getUnlockBannerI18nKey(unlockBanner))}</Text>
      </Pressable>
    );
  }

  function goToStep(next: Step) {
    hapticLight();
    setStep(next);
  }

  const wizardTouchStart = useRef<{ x: number; y: number } | null>(null);

  function handleWizardNext() {
    if (step === 0 && !validateStep0()) return;
    if (step >= WIZARD_STEPS - 1) return;
    goToStep((step + 1) as Step);
  }

  function handleWizardBack() {
    if (step > 0) goToStep((step - 1) as Step);
    else navigation.goBack();
  }

  function handleWizardSkip() {
    if (step <= 0 || step >= WIZARD_STEPS - 1) return;
    goToStep((step + 1) as Step);
  }

  function onWizardTouchStart(e: { nativeEvent: { pageX: number; pageY: number } }) {
    wizardTouchStart.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
  }

  function onWizardTouchEnd(e: { nativeEvent: { pageX: number; pageY: number } }) {
    if (!wizardTouchStart.current) return;
    const dx = e.nativeEvent.pageX - wizardTouchStart.current.x;
    const dy = e.nativeEvent.pageY - wizardTouchStart.current.y;
    wizardTouchStart.current = null;
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    if (dx < 0) handleWizardNext();
    else handleWizardBack();
  }

  const canWizardSkip = step > 0 && step < WIZARD_STEPS - 1;
  const canWizardNext = step < WIZARD_STEPS - 1;

  function applyNotesFromVoice(nextNotes: string) {
    const raw = nextNotes.slice(0, 500);
    if (!prefs.guidedVoiceLogEnabled) {
      setNotes(raw);
      return;
    }
    const extracted = extractLogFieldsFromVoiceTranscript(raw) as {
      mood?: number;
      fatigue?: number;
      sleep?: number;
      jointPain?: number;
      flare?: 'Yes' | 'No';
      notes?: string;
    };
    const structuredKeys = ['mood', 'fatigue', 'sleep', 'jointPain', 'flare', 'notes'] as const;
    const hasStructured = structuredKeys.some((key) => extracted[key] !== undefined);
    if (!hasStructured) {
      setNotes(raw);
      return;
    }
    if (extracted.mood != null) setMood(String(extracted.mood));
    if (extracted.fatigue != null) setFatigue(String(extracted.fatigue));
    if (extracted.sleep != null) setSleep(String(extracted.sleep));
    if (extracted.flare === 'Yes' || extracted.flare === 'No') setFlare(extracted.flare);
    let nextNote = typeof extracted.notes === 'string' ? extracted.notes : raw;
    if (extracted.jointPain != null && !/pain\s*\d/i.test(nextNote)) {
      nextNote = `Pain ${extracted.jointPain}/10. ${nextNote}`.trim();
    }
    setNotes(nextNote.slice(0, 500));
  }

  async function saveQuickMinimal() {
    if (!validateStep0()) return;
    const dateValue = date.trim();
    try {
      const existing = await loadLogs();
      const prevCount = existing.length;
      if (existing.some((l) => l.date === dateValue)) {
        Alert.alert(t('wizard.alert.duplicate.title'), t('wizard.alert.duplicate.body', { date: formatIsoDate(dateValue, locale, { dateStyle: 'medium' }) }));
        return;
      }
      const minimal = stampLogEntryForCaregiver(
        normalizeLogEntry({
        date: dateValue,
        flare,
        fatigue: 5,
        stiffness: 5,
        sleep: 5,
        jointPain: 5,
        mobility: 5,
        dailyFunction: 5,
        swelling: 5,
        mood: 5,
        irritability: 5,
      }),
        prefs,
      );
      const next = await persistWizardLogEntry(existing, minimal);
      await runPostLogSaveEngagement({
        prevCount,
        logs: next,
        logDate: dateValue,
        goals: prefs.goals,
        showToast: toast.show,
        t,
      });
      hapticLight();
      toast.show(t('wizard.toast.minimalSaved', { date: formatIsoDate(dateValue, locale, { dateStyle: 'medium' }) }));
      navigation.goBack();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('wizard.alert.saveFailed');
      Alert.alert(t('common.error'), msg);
    }
  }

  async function save() {
    try {
      const existing = await loadLogs();
      const prevCount = existing.length;
      const next = await persistWizardLogEntry(existing, draft);
      await runPostLogSaveEngagement({
        prevCount,
        logs: next,
        logDate: draft.date,
        goals: prefs.goals,
        showToast: toast.show,
        t,
      });
      hapticLight();
      toast.show(t('wizard.toast.entrySaved'));
      navigation.goBack();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('wizard.alert.saveFailed');
      Alert.alert(t('common.error'), msg);
    }
  }

  const reviewText = useMemo(() => buildLogReviewSummary(draft, locale), [draft, locale]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View
        style={styles.card}
        onTouchStart={onWizardTouchStart}
        onTouchEnd={onWizardTouchEnd}
      >
        <Text style={[styles.title, { color: theme.tokens.color.accent, fontSize: theme.font(20) }]}>
          {t('wizard.header')}
        </Text>
        <Text style={[styles.sub, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
          {t('wizard.progress.stepOfTotal', { current: step + 1, total: WIZARD_STEPS })}
        </Text>
        <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: WIZARD_STEPS, now: step + 1 }}>
          <View style={[styles.progressFill, { width: `${((step + 1) / WIZARD_STEPS) * 100}%`, backgroundColor: theme.tokens.color.accent }]} />
        </View>
        <View style={[styles.stepDots, { flexDirection: rowDir }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {Array.from({ length: WIZARD_STEPS }, (_, i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                i === step && styles.stepDotActive,
                i < step && { backgroundColor: theme.tokens.color.accent + '88' },
                i >= step && { backgroundColor: theme.tokens.color.accent + '33' },
              ]}
            />
          ))}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
        {renderUnlockBanner()}
        {step === 0 ? (
          <View>
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.step.date')}</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              style={[styles.input, { color: theme.tokens.color.text }]}
              accessibilityLabel={t('wizard.aria.logDate')}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.flare')}</Text>
            <View style={styles.row}>
              <Choice label={t('common.no')} selected={flare === 'No'} onPress={() => setFlare('No')} />
              <Choice
                label={t('common.yes')}
                selected={flare === 'Yes'}
                onPress={() => {
                  setFlare('Yes');
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                }}
              />
            </View>

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.subEntry.period')}</Text>
            <View style={styles.row}>
              <Choice label="AM" selected={subEntryPeriod === 'AM'} onPress={() => setSubEntryPeriod('AM')} />
              <Choice label="PM" selected={subEntryPeriod === 'PM'} onPress={() => setSubEntryPeriod('PM')} />
              <Choice label={t('wizard.subEntry.fullDay')} selected={subEntryPeriod === 'partial'} onPress={() => setSubEntryPeriod('partial')} />
            </View>
            {prefs.cycleModuleEnabled ? (
              <CycleTrackingInput
                value={{ cycleDay, cyclePhase, cycleFlow, periodStart: cyclePeriodStart }}
                suggestHint={cycleSuggestHint}
                logDateIso={date}
                periodAnchorDate={cyclePeriodAnchorDate}
                onChange={({ cycleDay: nextDay, cyclePhase: nextPhase, cycleFlow: nextFlow, periodStart: nextPeriodStart }) => {
                  cycleAutoFilledRef.current = false;
                  cycleSuggestedDateRef.current = '';
                  setCycleSuggestHint(null);
                  setCycleDay(nextDay);
                  setCyclePhase(nextPhase);
                  setCycleFlow(nextFlow);
                  setCyclePeriodStart(!!nextPeriodStart);
                  if (nextPeriodStart && date) setCyclePeriodAnchorDate(date);
                  else if (!nextPeriodStart) setCyclePeriodAnchorDate(cyclePeriodAnchorDate);
                }}
              />
            ) : null}
            {prefs.cycleModuleEnabled ? (
              <>
                <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14), marginTop: 10 }]}>{t('wizard.cycle.bbt')}</Text>
                <TextInput value={bbt} onChangeText={setBbt} style={[styles.input, { color: theme.tokens.color.text }]} keyboardType="decimal-pad" />
              </>
            ) : null}

            <Pressable
              onPress={() => void saveQuickMinimal()}
              style={[styles.secondaryBtn, { marginTop: 12, alignSelf: 'stretch' }]}
              accessibilityRole="button"
              accessibilityLabel={t('wizard.aria.saveMinimal')}
            >
              <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('wizard.action.saveMinimal')}</Text>
            </Pressable>

            <View style={[styles.navRow, { flexDirection: rowDir }]}>
              <View style={{ flex: 1 }} />
              <Pressable
                onPress={() => {
                  if (!validateStep0()) return;
                  goToStep(1);
                }}
                style={styles.primaryBtn}
                accessibilityRole="button"
                accessibilityLabel={t('wizard.aria.nextStep')}
              >
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('common.next')}</Text>
              </Pressable>
            </View>
          </View>
        ) : step === 1 ? (
          <View>
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.bpm.30.120')}</Text>
            <TextInput value={bpm} onChangeText={setBpm} style={[styles.input, { color: theme.tokens.color.text }]} keyboardType="number-pad" />
            {renderVitalHint('bpm', !bpm.trim(), () => {
              const row = vitalSuggestions.bpm;
              if (row?.values.bpm != null) setBpm(String(row.values.bpm));
            })}

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.weight.kg')}</Text>
            <TextInput value={weightKg} onChangeText={setWeightKg} style={[styles.input, { color: theme.tokens.color.text }]} keyboardType="decimal-pad" />
            {renderVitalHint('weight', !weightKg.trim(), () => {
              const row = vitalSuggestions.weight;
              if (row?.values.weight != null) setWeightKg(String(row.values.weight));
            })}

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.vitals.bloodPressure')}</Text>
            <View style={[styles.row, { flexDirection: rowDir, gap: 8 }]}>
              <TextInput value={bloodPressureSystolic} onChangeText={setBloodPressureSystolic} style={[styles.input, { color: theme.tokens.color.text, flex: 1 }]} keyboardType="number-pad" placeholder={t('wizard.vitals.bp.systolic')} />
              <Text style={{ color: theme.tokens.color.text, alignSelf: 'center' }}>/</Text>
              <TextInput value={bloodPressureDiastolic} onChangeText={setBloodPressureDiastolic} style={[styles.input, { color: theme.tokens.color.text, flex: 1 }]} keyboardType="number-pad" placeholder={t('wizard.vitals.bp.diastolic')} />
            </View>
            {renderVitalHint('bloodPressure', !bloodPressureSystolic.trim() && !bloodPressureDiastolic.trim(), () => {
              const row = vitalSuggestions.bloodPressure;
              if (row?.values.bloodPressureSystolic != null) setBloodPressureSystolic(String(row.values.bloodPressureSystolic));
              if (row?.values.bloodPressureDiastolic != null) setBloodPressureDiastolic(String(row.values.bloodPressureDiastolic));
            })}

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.vitals.bloodGlucose')}</Text>
            <TextInput value={bloodGlucose} onChangeText={setBloodGlucose} style={[styles.input, { color: theme.tokens.color.text }]} keyboardType="decimal-pad" />
            {renderVitalHint('bloodGlucose', !bloodGlucose.trim(), () => {
              const row = vitalSuggestions.bloodGlucose;
              if (row?.values.bloodGlucose != null) setBloodGlucose(String(row.values.bloodGlucose));
            })}

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.vitals.spO2')}</Text>
            <TextInput value={spO2} onChangeText={setSpO2} style={[styles.input, { color: theme.tokens.color.text }]} keyboardType="number-pad" />
            {renderVitalHint('spO2', !spO2.trim(), () => {
              const row = vitalSuggestions.spO2;
              if (row?.values.spO2 != null) setSpO2(String(row.values.spO2));
            })}

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.vitals.hrv')}</Text>
            <TextInput value={hrv} onChangeText={setHrv} style={[styles.input, { color: theme.tokens.color.text }]} keyboardType="number-pad" />
            {renderVitalHint('hrv', !hrv.trim(), () => {
              const row = vitalSuggestions.hrv;
              if (row?.values.hrv != null) setHrv(String(row.values.hrv));
            })}

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.vitals.weight')}</Text>
            <TextInput value={bodyWeight} onChangeText={setBodyWeight} style={[styles.input, { color: theme.tokens.color.text }]} keyboardType="decimal-pad" />
            {renderVitalHint('bodyWeight', !bodyWeight.trim(), () => {
              const row = vitalSuggestions.bodyWeight;
              if (row?.values.bodyWeight != null) setBodyWeight(String(row.values.bodyWeight));
            })}
            {prefs.heightCm && bodyWeight ? (
              <Text style={[styles.helper, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                {t('wizard.vitals.bmi')}: {computeBmiKg(Number(bodyWeight), prefs.heightCm) ?? '—'}
              </Text>
            ) : null}

            {/* Sleep / mood / fatigue inputs are part of the Energy & mental clarity step (Step 3, web parity). */}

            <View style={[styles.navRow, { flexDirection: rowDir }]}>
              <Pressable
                onPress={() => goToStep(0)}
                style={styles.secondaryBtn}
                accessibilityRole="button"
                accessibilityLabel={t('wizard.aria.previousStep')}
              >
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('wizard.action.back')}</Text>
              </Pressable>
              <Pressable onPress={() => goToStep(2)} style={styles.primaryBtn} accessibilityRole="button" accessibilityLabel={t('wizard.aria.nextStep')}>
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('common.next')}</Text>
              </Pressable>
            </View>
          </View>
        ) : step === 2 ? (
          <View>
            {prefs.digestiveModuleEnabled ? (
              <View style={{ marginBottom: 12 }}>
                <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.digestion.bristol.title')}</Text>
                <View style={[styles.row, { flexWrap: 'wrap', gap: 6 }]}>
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <Choice key={n} label={String(n)} selected={bristol === n} onPress={() => setBristol(n)} />
                  ))}
                </View>
              </View>
            ) : null}
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.pain.locations')}</Text>
            <Text style={[styles.helper, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
              {t('wizard.pain.helper')}
            </Text>
            <PainBodyDiagram
              states={painStates}
              onPressRegion={cyclePainRegion}
              diagramLabel={t('wizard.aria.painBodyDiagram')}
              diagramHint={t('wizard.aria.painBodyDiagramHint')}
              regionA11y={(region) => t('wizard.aria.bodyRegion', { region })}
            />
            <View style={styles.painLegendRow}>
              <Text style={[styles.painLegendNone, { fontSize: theme.font(12) }]}>{t('common.good')}</Text>
              <Text style={[styles.painLegendMild, { fontSize: theme.font(12) }]}>{t('wizard.discomfort')}</Text>
              <Text style={[styles.painLegendPain, { fontSize: theme.font(12) }]}>{t('common.pain')}</Text>
            </View>
            <Text style={[styles.helper, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
              {t('wizard.pain.selectedCount', { mild: painCounts.mild, pain: painCounts.pain })}
            </Text>
            {painLocationFromBody ? (
              <View style={{ marginTop: 6 }}>
                <Text style={[styles.helper, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>{t('wizard.pain.fromDiagram', { text: painLocationFromBody })}</Text>
                <View style={{ marginTop: 6, alignItems: 'flex-start' }}>
                  <Pressable
                    onPress={() => setPainLocation(painLocationFromBody)}
                    style={styles.secondaryBtn}
                    accessibilityRole="button"
                    accessibilityLabel={t('wizard.aria.useDiagramPainText')}
                  >
                    <Text style={[styles.btnText, { fontSize: theme.font(13) }]}>{t('wizard.use.diagram.text')}</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
            <TextInput
              value={painRegionSearch}
              onChangeText={setPainRegionSearch}
              style={[styles.input, { color: theme.tokens.color.text, marginTop: 8 }]}
              accessibilityLabel={t('wizard.aria.searchPainRegions')}
              placeholder={t('wizard.search.body.regions')}
              placeholderTextColor="rgba(255,255,255,0.6)"
            />
            <View style={styles.chips}>
              {filteredPainRegions.map((region) => {
                const s = painStates[region.id] ?? 0;
                return (
                  <BodyRegionChoice
                    key={region.id}
                    label={tContent('bodyRegion', region.id, region.label)}
                    state={s}
                    onPress={() => cyclePainRegion(region.id)}
                  />
                );
              })}
            </View>
            {filteredPainRegions.length === 0 ? (
              <Text style={[styles.helper, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                {t('wizard.pain.noRegionsMatch')}
              </Text>
            ) : null}
            <View style={{ marginTop: 8, alignItems: 'flex-start' }}>
              <Pressable onPress={clearPainRegions} style={styles.secondaryBtn} accessibilityRole="button" accessibilityLabel={t('wizard.aria.clearPainRegions')}>
                <Text style={[styles.btnText, { fontSize: theme.font(13) }]}>{t('wizard.clear.body.selections')}</Text>
              </Pressable>
            </View>
            <TextInput
              value={painLocation}
              onChangeText={setPainLocation}
              style={[styles.input, { color: theme.tokens.color.text }]}
              accessibilityLabel={t('wizard.aria.painLocations')}
              placeholder={t('wizard.e.g.left.knee.mild.right.wrist.pain')}
              placeholderTextColor="rgba(255,255,255,0.6)"
            />

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.step.symptoms')}</Text>
            {frequentSymptoms.length > 0 ? (
              <View style={{ marginBottom: 8 }}>
                <Text style={[styles.frequentLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>{t('wizard.frequent.symptoms')}</Text>
                <View style={styles.chips}>
                  {frequentSymptoms.map((opt) => (
                    <Choice key={`freq-sym-${opt}`} label={opt} selected={symptoms.includes(opt)} onPress={() => toggleSymptom(opt)} />
                  ))}
                </View>
              </View>
            ) : null}
            {symptomTemplateChips.length > 0 ? (
              <View style={{ marginBottom: 8 }}>
                <Text style={[styles.frequentLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>{t('wizard.symptomTemplates')}</Text>
                <View style={styles.chips}>
                  {symptomTemplateChips.map((opt: string) => (
                    <Choice key={`tpl-sym-${opt}`} label={opt} selected={symptoms.includes(opt)} onPress={() => toggleSymptom(opt)} />
                  ))}
                </View>
              </View>
            ) : null}
            {SYMPTOM_GROUPS.map((grp) => {
              const opts = SYMPTOM_OPTIONS.filter((o) => o.group === grp.id);
              return (
                <View key={grp.id} style={{ marginBottom: 10 }}>
                  <Text style={[styles.groupTitle, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{tContent('symptomGroup', grp.id, grp.label)}</Text>
                  <View style={styles.chips}>
                    {opts.map((opt) => (
                      <Choice
                        key={opt.value}
                        label={tContent('symptom', opt.value, opt.label)}
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
                <Text style={[styles.frequentLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>{t('wizard.selected.symptoms')}</Text>
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
                    accessibilityLabel={t('wizard.aria.clearSymptoms')}
                  >
                    <Text style={[styles.btnText, { fontSize: theme.font(13) }]}>{t('wizard.clear.selected')}</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.add.custom.symptom')}</Text>
            <View style={styles.inlineInputRow}>
              <TextInput
                value={customSymptom}
                onChangeText={setCustomSymptom}
                style={[styles.input, styles.inlineInput, { color: theme.tokens.color.text }]}
                accessibilityLabel={t('wizard.aria.customSymptomInput')}
                placeholder={t('wizard.type.symptom')}
                placeholderTextColor="rgba(255,255,255,0.6)"
              />
              <Pressable onPress={addCustomSymptom} style={styles.secondaryBtn} accessibilityRole="button" accessibilityLabel={t('wizard.add.custom.symptom')}>
                <Text style={[styles.btnText, { fontSize: theme.font(13) }]}>{t('common.add')}</Text>
              </Pressable>
            </View>

            <View style={[styles.navRow, { flexDirection: rowDir }]}>
              <Pressable onPress={() => goToStep(1)} style={styles.secondaryBtn} accessibilityRole="button" accessibilityLabel={t('wizard.aria.previousStep')}>
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('wizard.action.back')}</Text>
              </Pressable>
              <Pressable onPress={() => goToStep(3)} style={styles.primaryBtn} accessibilityRole="button" accessibilityLabel={t('wizard.aria.nextStep')}>
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('common.next')}</Text>
              </Pressable>
            </View>
          </View>
        ) : step === 3 ? (
          <View>
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('common.energy.and.mental.clarity')}</Text>
            <Text style={[styles.helper, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
              {t('wizard.energy.instructions')}
            </Text>

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.fatigue.1.10')}</Text>
            <TextInput
              value={fatigue}
              onChangeText={setFatigue}
              style={[styles.input, { color: theme.tokens.color.text }]}
              keyboardType="number-pad"
              accessibilityLabel={t('wizard.aria.fatigueScore')}
            />

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.sleep.1.10')}</Text>
            <TextInput
              value={sleep}
              onChangeText={setSleep}
              style={[styles.input, { color: theme.tokens.color.text }]}
              keyboardType="number-pad"
              accessibilityLabel={t('wizard.aria.sleepScore')}
            />

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.mood.1.10')}</Text>
            <TextInput
              value={mood}
              onChangeText={setMood}
              style={[styles.input, { color: theme.tokens.color.text }]}
              keyboardType="number-pad"
              accessibilityLabel={t('wizard.aria.moodScore')}
            />

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.mood.gratitudeLabel')}</Text>
            <TextInput
              value={gratitude}
              onChangeText={(v) => setGratitude(v.slice(0, 500))}
              style={[styles.input, { color: theme.tokens.color.text, minHeight: 64 }]}
              multiline
              placeholder={t('wizard.mood.gratitude')}
              placeholderTextColor="rgba(255,255,255,0.6)"
            />
            <Text style={[styles.helper, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>{gratitude.length}/500</Text>

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('common.energy.amp.clarity')}</Text>
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.frequentLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                {energyClarity ? t('wizard.energy.selectedValue', { value: energyClarity }) : t('common.none.selected')}
              </Text>
              {energyClarity ? (
                <Pressable
                  onPress={() => setEnergyClarity('')}
                  style={[styles.secondaryBtn, { alignSelf: 'flex-start', marginTop: 6 }]}
                  accessibilityRole="button"
                  accessibilityLabel={t('wizard.aria.clearEnergy')}
                >
                  <Text style={[styles.btnText, { fontSize: theme.font(13) }]}>{t('wizard.clear.selected')}</Text>
                </Pressable>
              ) : null}
            </View>

            <Pressable
              onPress={toggleEnergyPicker}
              style={[styles.secondaryBtn, { alignSelf: 'flex-start', marginTop: 10, marginBottom: 8 }]}
              accessibilityRole="button"
              accessibilityLabel={t('wizard.aria.toggleEnergyPicker')}
            >
              <Text style={[styles.btnText, { fontSize: theme.font(13) }]}>{energyPickerOpen ? t('wizard.aria.hideTiles') : t('wizard.aria.showTiles')}</Text>
            </Pressable>

            {energyPickerOpen ? (
              <View>
            <TextInput
              value={energyClaritySearch}
              onChangeText={setEnergyClaritySearch}
              style={[styles.input, { color: theme.tokens.color.text, marginBottom: 8 }]}
              accessibilityLabel={t('wizard.aria.filterEnergy')}
              placeholder={t('wizard.filter.options')}
              placeholderTextColor="rgba(255,255,255,0.6)"
            />

            {ENERGY_CLARITY_GROUPS.map((grp) => {
              const opts = ENERGY_CLARITY_OPTIONS.filter((o) => o.mood === grp.id).filter((o) => {
                const s = energyClaritySearch.trim().toLowerCase();
                if (!s) return true;
                return (tContent('energy', o.value, o.label) + ' ' + o.value).toLowerCase().includes(s);
              });
              if (opts.length === 0) return null;
              return (
                <View key={grp.id} style={{ marginBottom: 10 }}>
                  <Text style={[styles.groupTitle, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{tContent('energyGroup', grp.id, grp.label)}</Text>
                  <View style={styles.chips}>
                    {opts.map((opt) => (
                      <Choice
                        key={opt.value}
                        label={tContent('energy', opt.value, opt.label)}
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
              `${tContent('energy', o.value, o.label)} ${o.value}`.toLowerCase().includes(energyClaritySearch.trim().toLowerCase())
            ) ? (
              <Text style={[styles.helper, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                {t('wizard.energy.noMatch')}
              </Text>
            ) : null}

            <View style={[styles.navRow, { flexDirection: rowDir }]}>
              <Pressable onPress={() => goToStep(2)} style={styles.secondaryBtn} accessibilityRole="button" accessibilityLabel={t('wizard.aria.previousStep')}>
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('wizard.action.back')}</Text>
              </Pressable>
              <Pressable onPress={() => goToStep(4)} style={styles.primaryBtn} accessibilityRole="button" accessibilityLabel={t('wizard.aria.nextStep')}>
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('common.next')}</Text>
              </Pressable>
            </View>
          </View>
        ) : step === 4 ? (
          <View>
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.stress.triggers')}</Text>
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('common.irritability.0.10')}</Text>
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

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.weather.sensitivity.1.10')}</Text>
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
                <Text style={[styles.frequentLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>{t('wizard.selected')}</Text>
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
                    accessibilityLabel={t('wizard.aria.clearStressors')}
                  >
                    <Text style={[styles.btnText, { fontSize: theme.font(13) }]}>{t('wizard.clear.selected')}</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            <Pressable
              onPress={toggleStressorPicker}
              style={[styles.secondaryBtn, { alignSelf: 'flex-start', marginBottom: 8 }]}
              accessibilityRole="button"
              accessibilityLabel={t('wizard.aria.toggleStressorPicker')}
            >
              <Text style={[styles.btnText, { fontSize: theme.font(13) }]}>{stressorPickerOpen ? t('wizard.aria.hideStressorPicker') : t('wizard.aria.showStressorPicker')}</Text>
            </Pressable>

            {stressorPickerOpen ? (
              <View style={{ marginBottom: 8 }}>
                <TextInput
                  value={stressorSearch}
                  onChangeText={setStressorSearch}
                  style={[styles.input, { color: theme.tokens.color.text }]}
                  placeholder={t('wizard.search.stressors')}
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  accessibilityLabel={t('wizard.search.stressors')}
                />

                {frequentStressors.length > 0 ? (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={[styles.frequentLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>{t('wizard.frequent')}</Text>
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
                    `${tContent('stressor', o.value, o.label)} ${o.value}`.toLowerCase().includes(stressorSearch.trim().toLowerCase())
                  );
                  if (!opts.length) return null;
                  return (
                    <View key={grp.id} style={{ marginBottom: 8 }}>
                      <Text style={[styles.frequentLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>{tContent('stressorGroup', grp.id, grp.label)}</Text>
                      <View style={styles.chips}>
                        {opts.map((opt) => (
                          <Choice
                            key={`str-${opt.value}`}
                            label={tContent('stressor', opt.value, opt.label)}
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
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.add.custom.stressor')}</Text>
            <View style={styles.inlineInputRow}>
              <TextInput
                value={customStressor}
                onChangeText={setCustomStressor}
                style={[styles.input, styles.inlineInput, { color: theme.tokens.color.text }]}
                accessibilityLabel={t('wizard.aria.customStressorInput')}
                placeholder={t('wizard.type.stressor')}
                placeholderTextColor="rgba(255,255,255,0.6)"
              />
              <Pressable onPress={addCustomStressor} style={styles.secondaryBtn} accessibilityRole="button" accessibilityLabel={t('wizard.add.custom.stressor')}>
                <Text style={[styles.btnText, { fontSize: theme.font(13) }]}>{t('common.add')}</Text>
              </Pressable>
            </View>

            <View style={[styles.navRow, { flexDirection: rowDir }]}>
              <Pressable onPress={() => goToStep(3)} style={styles.secondaryBtn} accessibilityRole="button" accessibilityLabel={t('wizard.aria.previousStep')}>
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('wizard.action.back')}</Text>
              </Pressable>
              <Pressable onPress={() => goToStep(5)} style={styles.primaryBtn} accessibilityRole="button" accessibilityLabel={t('wizard.aria.nextStep')}>
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('common.next')}</Text>
              </Pressable>
            </View>
          </View>
        ) : step === 5 ? (
          <View>
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.daily.function.0.10')}</Text>
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
              accessibilityLabel={t('wizard.aria.dailyFunction')}
            />

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('common.steps.if.tracked')}</Text>
            <TextInput
              value={steps}
              onChangeText={setSteps}
              style={[styles.input, { color: theme.tokens.color.text }]}
              keyboardType="number-pad"
              accessibilityLabel={t('wizard.aria.steps')}
            />

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.hydration.glasses')}</Text>
            <TextInput
              value={hydration}
              onChangeText={setHydration}
              style={[styles.input, { color: theme.tokens.color.text }]}
              keyboardType="decimal-pad"
              accessibilityLabel={t('wizard.aria.hydration')}
            />

            <View style={[styles.navRow, { flexDirection: rowDir }]}>
              <Pressable onPress={() => goToStep(4)} style={styles.secondaryBtn} accessibilityRole="button" accessibilityLabel={t('wizard.aria.previousStep')}>
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('wizard.action.back')}</Text>
              </Pressable>
              <Pressable onPress={() => goToStep(6)} style={styles.primaryBtn} accessibilityRole="button" accessibilityLabel={t('wizard.aria.nextStep')}>
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('common.next')}</Text>
              </Pressable>
            </View>
          </View>
        ) : step === 6 ? (
          <View>
            {!showFoodStep ? (
              <>
                <Text style={[styles.helper, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{t('wizard.progressive.foodLocked')}</Text>
                <Pressable onPress={() => requestOpenGoalsModal(1)} accessibilityRole="button">
                  <Text style={[styles.helper, { color: theme.tokens.color.accent, fontSize: theme.font(13), textDecorationLine: 'underline' }]}>
                    {t('achievements.viewInGoals')}
                  </Text>
                </Pressable>
                <View style={[styles.navRow, { flexDirection: rowDir }]}>
                  <Pressable onPress={() => goToStep(5)} style={styles.secondaryBtn} accessibilityRole="button">
                    <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('wizard.action.back')}</Text>
                  </Pressable>
                  <Pressable onPress={() => goToStep(7)} style={styles.primaryBtn} accessibilityRole="button">
                    <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('common.next')}</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
            <FoodSearchInput
              onSelect={(label) => setBreakfastText((prev) => addCsvItem(prev, label))}
            />
            {favoriteMeals.length > 0 ? (
              <View style={{ marginBottom: 8 }}>
                <Text style={[styles.frequentLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>{t('wizard.favoriteMeals')}</Text>
                <View style={styles.chips}>
                  {favoriteMeals.map((item) => (
                    <Choice key={`fav-meal-${item}`} label={item} selected={breakfastItems.includes(item)} onPress={() => setBreakfastText((prev) => addCsvItem(prev, item))} />
                  ))}
                </View>
              </View>
            ) : null}
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
                accessibilityLabel={t('wizard.clear.all.food')}
              >
                <Text style={[styles.btnText, { fontSize: theme.font(13) }]}>{t('wizard.clear.all.food')}</Text>
              </Pressable>
            </View>
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.breakfast.comma.separated')}</Text>
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
              accessibilityLabel={t('wizard.aria.breakfastItems')}
              placeholder={t('wizard.e.g.oatmeal.yogurt')}
              placeholderTextColor="rgba(255,255,255,0.6)"
            />
            <View style={styles.chips}>
              {breakfastItems.map((item) => (
                <Choice key={`bf-sel-${item}`} label={t('common.remove.item', { item })} selected={false} onPress={() => setBreakfastText((prev) => removeCsvItem(prev, item))} />
              ))}
            </View>

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.lunch.comma.separated')}</Text>
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
              accessibilityLabel={t('wizard.aria.lunchItems')}
              placeholder={t('wizard.e.g.chicken.salad')}
              placeholderTextColor="rgba(255,255,255,0.6)"
            />
            <View style={styles.chips}>
              {lunchItems.map((item) => (
                <Choice key={`lu-sel-${item}`} label={t('common.remove.item', { item })} selected={false} onPress={() => setLunchText((prev) => removeCsvItem(prev, item))} />
              ))}
            </View>

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.dinner.comma.separated')}</Text>
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
              accessibilityLabel={t('wizard.aria.dinnerItems')}
              placeholder={t('wizard.e.g.salmon.rice')}
              placeholderTextColor="rgba(255,255,255,0.6)"
            />
            <View style={styles.chips}>
              {dinnerItems.map((item) => (
                <Choice key={`di-sel-${item}`} label={t('common.remove.item', { item })} selected={false} onPress={() => setDinnerText((prev) => removeCsvItem(prev, item))} />
              ))}
            </View>

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.snack.comma.separated')}</Text>
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
              accessibilityLabel={t('wizard.aria.snackItems')}
              placeholder={t('wizard.e.g.apple.nuts')}
              placeholderTextColor="rgba(255,255,255,0.6)"
            />
            <View style={styles.chips}>
              {snackItems.map((item) => (
                <Choice key={`sn-sel-${item}`} label={t('common.remove.item', { item })} selected={false} onPress={() => setSnackText((prev) => removeCsvItem(prev, item))} />
              ))}
            </View>

            <View style={[styles.navRow, { flexDirection: rowDir }]}>
              <Pressable onPress={() => goToStep(5)} style={styles.secondaryBtn} accessibilityRole="button" accessibilityLabel={t('wizard.aria.previousStep')}>
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('wizard.action.back')}</Text>
              </Pressable>
              <Pressable onPress={() => goToStep(7)} style={styles.primaryBtn} accessibilityRole="button" accessibilityLabel={t('wizard.aria.nextStep')}>
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('common.next')}</Text>
              </Pressable>
            </View>
              </>
            )}
          </View>
        ) : step === 7 ? (
          <View>
            {!showExerciseStep ? (
              <>
                <Text style={[styles.helper, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{t('wizard.progressive.exerciseLocked')}</Text>
                <Pressable onPress={() => requestOpenGoalsModal(1)} accessibilityRole="button">
                  <Text style={[styles.helper, { color: theme.tokens.color.accent, fontSize: theme.font(13), textDecorationLine: 'underline' }]}>
                    {t('achievements.viewInGoals')}
                  </Text>
                </Pressable>
                <View style={[styles.navRow, { flexDirection: rowDir }]}>
                  <Pressable onPress={() => goToStep(6)} style={styles.secondaryBtn} accessibilityRole="button">
                    <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('wizard.action.back')}</Text>
                  </Pressable>
                  <Pressable onPress={() => goToStep(8)} style={styles.primaryBtn} accessibilityRole="button">
                    <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('common.next')}</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
            {favoriteExercises.length > 0 ? (
              <View style={{ marginBottom: 8 }}>
                <Text style={[styles.frequentLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>{t('wizard.favoriteExercises')}</Text>
                <View style={styles.chips}>
                  {favoriteExercises.map((item) => (
                    <Choice key={`fav-ex-${item}`} label={item} selected={exerciseText.includes(item)} onPress={() => setExerciseText((prev) => addCsvItem(prev, item))} />
                  ))}
                </View>
              </View>
            ) : null}
            <View style={{ marginTop: 6, marginBottom: 8, alignItems: 'flex-start' }}>
              <Pressable
                onPress={() => setExerciseText('')}
                style={styles.secondaryBtn}
                accessibilityRole="button"
                accessibilityLabel={t('wizard.clear.all.exercise')}
              >
                <Text style={[styles.btnText, { fontSize: theme.font(13) }]}>{t('wizard.clear.all.exercise')}</Text>
              </Pressable>
            </View>
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.exercise.by.category')}</Text>
            {EXERCISE_CATEGORIES.map((cat) => {
              const options = PREDEFINED_EXERCISES.filter((x) => x.category === cat.id);
              return (
                <View key={cat.id} style={{ marginBottom: 10 }}>
                  <Text style={[styles.groupTitle, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{tContent('exerciseCategory', cat.id, cat.label)}</Text>
                  <View style={styles.chips}>
                    {options.map((opt) => {
                      const exLabel = tContent('exercise', opt.id, opt.name);
                      const token = `${opt.name}:${opt.defaultDuration}`;
                      const count = countCsvItem(exerciseText, token);
                      const selected = count > 0;
                      return (
                        <Choice
                          key={`ex-${token}`}
                          label={`${exLabel}:${opt.defaultDuration}`}
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
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.exercise.quick.picks')}</Text>
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
              accessibilityLabel={t('wizard.aria.exerciseItems')}
              placeholder={t('wizard.e.g.walking.30.stretching.15')}
              placeholderTextColor="rgba(255,255,255,0.6)"
            />
            <View style={styles.chips}>
              {exerciseItems.map((item) => {
                const token = `${item.name}${item.duration ? `:${item.duration}` : ''}`;
                return <Choice key={`ex-sel-${token}`} label={t('common.remove.item', { item: token })} selected={false} onPress={() => setExerciseText((prev) => removeCsvItem(prev, token))} />;
              })}
            </View>

            <View style={[styles.navRow, { flexDirection: rowDir }]}>
              <Pressable onPress={() => goToStep(6)} style={styles.secondaryBtn} accessibilityRole="button" accessibilityLabel={t('wizard.aria.previousStep')}>
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('wizard.action.back')}</Text>
              </Pressable>
              <Pressable onPress={() => goToStep(8)} style={styles.primaryBtn} accessibilityRole="button" accessibilityLabel={t('wizard.aria.nextStep')}>
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('common.next')}</Text>
              </Pressable>
            </View>
              </>
            )}
          </View>
        ) : step === 8 ? (
          <View>
            {!showMedicationsStep ? (
              <>
                <Text style={[styles.helper, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>{t('wizard.progressive.medsLocked')}</Text>
                <Pressable onPress={() => requestOpenGoalsModal(1)} accessibilityRole="button">
                  <Text style={[styles.helper, { color: theme.tokens.color.accent, fontSize: theme.font(13), textDecorationLine: 'underline' }]}>
                    {t('achievements.viewInGoals')}
                  </Text>
                </Pressable>
                <View style={[styles.navRow, { flexDirection: rowDir }]}>
                  <Pressable onPress={() => goToStep(7)} style={styles.secondaryBtn} accessibilityRole="button">
                    <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('wizard.action.back')}</Text>
                  </Pressable>
                  <Pressable onPress={() => goToStep(9)} style={styles.primaryBtn} accessibilityRole="button">
                    <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('common.next')}</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.supplements.title')}</Text>
            {supplements.map((s, i) => (
              <Text key={`${s.name}-${i}`} style={{ color: theme.tokens.color.text, fontSize: theme.font(13) }}>
                {s.name}{s.dose ? ` — ${s.dose}` : ''}
              </Text>
            ))}
            <View style={[styles.row, { flexDirection: rowDir, gap: 8, marginBottom: 10 }]}>
              <TextInput value={supplementName} onChangeText={setSupplementName} style={[styles.input, { color: theme.tokens.color.text, flex: 1 }]} placeholder={t('wizard.supplements.namePlaceholder')} />
              <TextInput value={supplementDose} onChangeText={setSupplementDose} style={[styles.input, { color: theme.tokens.color.text, flex: 1 }]} placeholder={t('wizard.supplements.dosePlaceholder')} />
            </View>
            <Pressable
              onPress={() => {
                const name = supplementName.trim();
                if (!name) return;
                setSupplements((prev) => [...prev, { name, dose: supplementDose.trim() || undefined }]);
                setSupplementName('');
                setSupplementDose('');
              }}
              style={[styles.secondaryBtn, { alignSelf: 'flex-start', marginBottom: 12 }]}
            >
              <Text style={styles.btnText}>{t('wizard.supplements.addBtn')}</Text>
            </Pressable>
            {todayMedDoses.length > 0 ? (
              <View style={{ marginBottom: 10 }}>
                <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.medSchedule.today')}</Text>
                {todayMedDoses.map((dose) => (
                  <View key={dose.scheduledAt} style={[styles.row, { flexDirection: rowDir, marginBottom: 6 }]}>
                    <Text style={{ color: theme.tokens.color.text, flex: 1, fontSize: theme.font(13) }}>
                      {dose.drug} · {dose.scheduledAt.slice(11, 16)}
                    </Text>
                    <Choice label={t('wizard.med.taken')} selected={medDoseStatus[dose.scheduledAt] === 'taken'} onPress={() => setMedDoseStatus((p) => ({ ...p, [dose.scheduledAt]: 'taken' }))} />
                    <Choice label={t('wizard.med.skipped')} selected={medDoseStatus[dose.scheduledAt] === 'skipped'} onPress={() => setMedDoseStatus((p) => ({ ...p, [dose.scheduledAt]: 'skipped' }))} />
                  </View>
                ))}
              </View>
            ) : null}
            <View style={{ marginTop: 6, marginBottom: 8, alignItems: 'flex-start' }}>
              <Pressable
                onPress={() => setMedicationText('')}
                style={styles.secondaryBtn}
                accessibilityRole="button"
                accessibilityLabel={t('wizard.clear.all.medications')}
              >
                <Text style={[styles.btnText, { fontSize: theme.font(13) }]}>{t('wizard.clear.all.medications')}</Text>
              </Pressable>
            </View>
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.medications.comma.separated')}</Text>
            <Text style={[styles.helper, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
              {t('wizard.medications.helper')}
            </Text>

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('common.taken.today')}</Text>
            <View style={styles.row}>
              <Choice label={t('common.yes')} selected={medicationTaken} onPress={() => setMedicationTaken(true)} />
              <Choice label={t('common.no')} selected={!medicationTaken} onPress={() => setMedicationTaken(false)} />
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
              accessibilityLabel={t('wizard.aria.medicationNames')}
              placeholder={t('wizard.e.g.ibuprofen.vitamin.d')}
              placeholderTextColor="rgba(255,255,255,0.6)"
            />
            <View style={styles.chips}>
              {parseCsvList(medicationText).map((item) => (
                <Choice key={`med-sel-${item}`} label={t('common.remove.item', { item })} selected={false} onPress={() => setMedicationText((prev) => removeCsvItem(prev, item))} />
              ))}
            </View>

            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.notes.optional')}</Text>
            <Text style={[styles.helper, { color: theme.tokens.color.text, fontSize: theme.font(12), marginTop: 0 }]}>
              {t('wizard.notes.charCount', { count: notes.length })}
            </Text>
            <VoiceNotesButton
              value={notes}
              onChangeText={applyNotesFromVoice}
              accent={theme.tokens.color.accent}
              textColor={theme.tokens.color.text}
            />
            <TextInput
              value={notes}
              onChangeText={(t) => setNotes(t.slice(0, 500))}
              style={[styles.input, { color: theme.tokens.color.text, height: 120, borderColor: theme.tokens.color.accent }]}
              multiline
              maxLength={500}
              accessibilityLabel={t('wizard.aria.logNotes')}
              placeholder={t('wizard.notes.placeholder')}
              placeholderTextColor="rgba(255,255,255,0.6)"
            />
            {photoAttachments.length > 0 ? (
              <Text style={[styles.helper, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                {t('wizard.attachments.photoCount', { n: photoAttachments.length })}
              </Text>
            ) : null}
            {prefs.aiEnabled !== false ? (
              <Pressable
                onPress={() => void onSuggestNote()}
                disabled={suggestNoteBusy}
                style={({ pressed }) => [styles.suggestNoteBtn, pressed && { opacity: 0.75 }]}
                accessibilityRole="button"
                accessibilityLabel={suggestNoteBusy ? t('wizard.aria.generatingSuggestNote') : t('wizard.alert.suggestNote.title')}
                accessibilityState={{ disabled: suggestNoteBusy, busy: suggestNoteBusy }}
              >
                <Text style={{ color: theme.tokens.color.accent, fontSize: theme.font(15), fontWeight: '700' }}>
                  {suggestNoteBusy ? t('common.loading.generating') : t('wizard.alert.suggestNote.title')}
                </Text>
              </Pressable>
            ) : null}

            <View style={[styles.navRow, { flexDirection: rowDir }]}>
              <Pressable onPress={() => goToStep(7)} style={styles.secondaryBtn} accessibilityRole="button" accessibilityLabel={t('wizard.aria.previousStep')}>
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('wizard.action.back')}</Text>
              </Pressable>
              <Pressable onPress={() => goToStep(9)} style={styles.primaryBtn} accessibilityRole="button" accessibilityLabel={t('wizard.aria.nextStep')}>
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('common.next')}</Text>
              </Pressable>
            </View>
              </>
            )}
          </View>
        ) : (
          <View>
            <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(14) }]}>{t('wizard.step.review')}</Text>
            <Text style={[styles.helper, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
              {t('wizard.review.empty')}
            </Text>
            <Text
              style={[styles.reviewBlock, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}
              accessibilityLabel={t('wizard.aria.reviewSummary')}
            >
              {reviewText}
            </Text>

            <View style={[styles.navRow, { flexDirection: rowDir }]}>
              <Pressable onPress={() => goToStep(8)} style={styles.secondaryBtn} accessibilityRole="button" accessibilityLabel={t('wizard.aria.previousStep')}>
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('wizard.action.back')}</Text>
              </Pressable>
              <Pressable onPress={save} style={styles.primaryBtn} accessibilityRole="button" accessibilityLabel={t('wizard.aria.saveEntry')}>
                <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>{t('wizard.save')}</Text>
              </Pressable>
            </View>
          </View>
        )}
        </ScrollView>

        {step === WIZARD_STEPS - 1 ? (
          <Pressable
            onPress={() => void save()}
            style={[styles.mobileSaveBtn, { backgroundColor: theme.tokens.color.accent }]}
            accessibilityRole="button"
            accessibilityLabel={t('wizard.aria.saveEntry')}
          >
            <Text style={[styles.mobileSaveBtnText, { fontSize: theme.font(14) }]}>{t('wizard.save')}</Text>
          </Pressable>
        ) : null}

        <View style={[styles.mobileDock, { flexDirection: rowDir, borderTopColor: theme.tokens.color.accent + '33' }]}>
          <Pressable
            onPress={handleWizardBack}
            style={styles.mobileDockBtnSecondary}
            accessibilityRole="button"
            accessibilityLabel={step > 0 ? t('wizard.aria.previousStep') : t('wizard.aria.closeReturnHome')}
          >
            <Text style={[styles.btnText, { fontSize: theme.font(14) }]}>
              {step > 0 ? t('wizard.action.back') : t('common.close')}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleWizardSkip}
            style={[styles.mobileDockBtnSkip, !canWizardSkip && styles.mobileDockBtnHidden]}
            disabled={!canWizardSkip}
            accessibilityRole="button"
            accessibilityLabel={t('wizard.action.skip')}
          >
            <Text style={[styles.btnText, { fontSize: theme.font(14), opacity: canWizardSkip ? 1 : 0 }]}>
              {t('wizard.action.skip')}
            </Text>
          </Pressable>
        </View>

        {canWizardNext ? (
          <Pressable
            onPress={handleWizardNext}
            style={[
              styles.sideNextBtn,
              isRtl ? styles.sideNextBtnRtl : null,
              { backgroundColor: theme.tokens.color.accent, borderColor: theme.tokens.color.accent + '88' },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('wizard.aria.nextStep')}
          >
            <Text style={[styles.sideNextIcon, { fontSize: theme.font(28) }]}>{isRtl ? '‹' : '›'}</Text>
          </Pressable>
        ) : null}
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
  const { t } = useT();
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
          accessibilityLabel={t('common.clear.choice', { label })}
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
  card: { flex: 1, borderRadius: 16, padding: 16, paddingEnd: 52, backgroundColor: 'rgba(0,0,0,0.18)' },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 108 },
  unlockBanner: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  reviewBlock: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    fontFamily: 'monospace',
  },
  title: { fontWeight: '800' },
  sub: { opacity: 0.8, marginBottom: 8 },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: { height: '100%', borderRadius: 999 },
  stepDots: { flexDirection: 'row', gap: 6, marginBottom: 12, justifyContent: 'center' },
  stepDot: { width: 8, height: 8, borderRadius: 999 },
  stepDotActive: { width: 20 },
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
  navRow: { display: 'none' },
  mobileDock: {
    position: 'absolute',
    left: 0,
    right: 52,
    bottom: 0,
    gap: 8,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  mobileDockBtnSecondary: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileDockBtnSkip: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileDockBtnHidden: {
    opacity: 0,
  },
  mobileSaveBtn: {
    position: 'absolute',
    left: 0,
    right: 52,
    bottom: 62,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileSaveBtnText: { color: '#0a0c08', fontWeight: '900' },
  sideNextBtn: {
    position: 'absolute',
    right: 0,
    top: '38%',
    width: 44,
    height: 92,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    borderWidth: 1,
    borderRightWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: -2, height: 0 },
    elevation: 4,
  },
  sideNextBtnRtl: {
    right: undefined,
    left: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    borderRightWidth: 1,
    borderLeftWidth: 0,
  },
  sideNextIcon: { color: '#0a0c08', fontWeight: '900', lineHeight: 32 },
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

