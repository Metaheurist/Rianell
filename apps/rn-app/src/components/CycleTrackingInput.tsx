import React, { useCallback, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  CYCLE_DAY_MAX,
  CYCLE_FLOW_LEVELS,
  CYCLE_PHASES,
  suggestCyclePhaseForDay,
} from '@rianell/shared';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';

export type CycleTrackingValue = {
  cycleDay: number | null;
  cyclePhase: string;
  cycleFlow: string;
};

type Props = {
  value: CycleTrackingValue;
  onChange: (next: CycleTrackingValue) => void;
};

const PHASE_ICON: Record<string, string> = {
  menstrual: '🩸',
  follicular: '🌱',
  ovulation: '✨',
  luteal: '🌙',
};

function FlowDrops({ count, accent }: { count: number; accent: string }) {
  return (
    <View style={styles.flowDrops}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[
            styles.flowDrop,
            i < count ? { backgroundColor: accent, shadowColor: accent } : { backgroundColor: 'rgba(255,255,255,0.18)' },
          ]}
        />
      ))}
    </View>
  );
}

export function CycleTrackingInput({ value, onChange }: Props) {
  const theme = useTheme();
  const { t } = useT();
  const phaseManualRef = useRef(false);

  const selectDay = useCallback(
    (day: number) => {
      const nextDay = value.cycleDay === day ? null : day;
      let nextPhase = value.cyclePhase;
      if (nextDay != null && !phaseManualRef.current) {
        nextPhase = suggestCyclePhaseForDay(nextDay) || '';
      }
      if (nextDay == null) phaseManualRef.current = false;
      onChange({ ...value, cycleDay: nextDay, cyclePhase: nextPhase });
    },
    [onChange, value],
  );

  const selectPhase = useCallback(
    (phaseId: string) => {
      const next = value.cyclePhase === phaseId ? '' : phaseId;
      phaseManualRef.current = !!next;
      onChange({ ...value, cyclePhase: next });
    },
    [onChange, value],
  );

  const selectFlow = useCallback(
    (flowId: string) => {
      const next = value.cycleFlow === flowId ? '' : flowId;
      onChange({ ...value, cycleFlow: next });
    },
    [onChange, value],
  );

  const clearAll = useCallback(() => {
    phaseManualRef.current = false;
    onChange({ cycleDay: null, cyclePhase: '', cycleFlow: '' });
  }, [onChange]);

  return (
    <View style={[styles.panel, { borderColor: `${theme.tokens.color.accent}44` }]}>
      <Text style={[styles.title, { color: theme.tokens.color.accent, fontSize: theme.font(15) }]}>
        {t('wizard.cycle.title')}
      </Text>
      <Text style={[styles.lead, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
        {t('wizard.cycle.lead')}
      </Text>

      <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
        {t('wizard.cycle.day')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
        {Array.from({ length: CYCLE_DAY_MAX }, (_, i) => i + 1).map((day) => {
          const tone = suggestCyclePhaseForDay(day) || 'unknown';
          const selected = value.cycleDay === day;
          return (
            <Pressable
              key={day}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${t('wizard.cycle.day')} ${day}`}
              onPress={() => selectDay(day)}
              style={[
                styles.dayPill,
                DAY_TONE_STYLE[tone as keyof typeof DAY_TONE_STYLE] ?? styles.dayTone_unknown,
                selected ? { borderColor: theme.tokens.color.accent, transform: [{ scale: 1.06 }] } : null,
              ]}
            >
              <Text style={{ color: theme.tokens.color.text, fontWeight: '700', fontSize: theme.font(13) }}>{day}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {value.cycleDay != null ? (
        <Text style={[styles.hint, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
          {t('wizard.cycle.dayHint', { day: String(value.cycleDay) })}
        </Text>
      ) : null}

      <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(13), marginTop: 10 }]}>
        {t('wizard.cycle.phase')}
      </Text>
      <View style={styles.phaseGrid}>
        {CYCLE_PHASES.map((phase) => {
          const selected = value.cyclePhase === phase.id;
          return (
            <Pressable
              key={phase.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => selectPhase(phase.id)}
              style={[
                styles.phaseTile,
                selected ? { borderColor: theme.tokens.color.accent, backgroundColor: `${theme.tokens.color.accent}22` } : null,
              ]}
            >
              <Text style={styles.phaseIcon}>{PHASE_ICON[phase.id] || '•'}</Text>
              <Text style={[styles.phaseLabel, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
                {t(phase.i18n)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(13), marginTop: 10 }]}>
        {t('wizard.cycle.flow')}
      </Text>
      <View style={styles.flowRow}>
        {CYCLE_FLOW_LEVELS.map((flow) => {
          const selected = value.cycleFlow === flow.id;
          return (
            <Pressable
              key={flow.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => selectFlow(flow.id)}
              style={[
                styles.flowBtn,
                selected ? { borderColor: '#e91e63', backgroundColor: 'rgba(233,30,99,0.14)' } : null,
              ]}
            >
              <FlowDrops count={flow.drops} accent="#e91e63" />
              <Text style={[styles.flowLabel, { color: theme.tokens.color.text, fontSize: theme.font(11) }]}>
                {t(flow.i18n)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable accessibilityRole="button" onPress={clearAll} style={styles.clearBtn}>
        <Text style={{ color: theme.tokens.color.text, opacity: 0.7, fontSize: theme.font(12), fontWeight: '600' }}>
          {t('wizard.cycle.clear')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.16)',
    gap: 4,
  },
  title: { fontWeight: '700' },
  lead: { opacity: 0.82, marginBottom: 6 },
  label: { fontWeight: '600', marginBottom: 6 },
  hint: { opacity: 0.75, marginTop: 2 },
  dayRow: { gap: 6, paddingVertical: 4 },
  dayPill: {
    width: 38,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dayTone_menstrual: { backgroundColor: 'rgba(233,30,99,0.22)', borderColor: 'rgba(233,30,99,0.45)' },
  dayTone_follicular: { backgroundColor: 'rgba(76,175,80,0.18)', borderColor: 'rgba(76,175,80,0.42)' },
  dayTone_ovulation: { backgroundColor: 'rgba(255,193,7,0.2)', borderColor: 'rgba(255,193,7,0.48)' },
  dayTone_luteal: { backgroundColor: 'rgba(156,39,176,0.2)', borderColor: 'rgba(156,39,176,0.42)' },
  dayTone_unknown: {},
  phaseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  phaseTile: {
    width: '48%',
    minHeight: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  phaseIcon: { fontSize: 20, marginBottom: 4 },
  phaseLabel: { textAlign: 'center', fontWeight: '600' },
  flowRow: { flexDirection: 'row', gap: 8 },
  flowBtn: {
    flex: 1,
    minHeight: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  flowDrops: { flexDirection: 'column-reverse', alignItems: 'center', gap: 3, minHeight: 28 },
  flowDrop: {
    width: 10,
    height: 10,
    borderRadius: 999,
    transform: [{ rotate: '45deg' }],
  },
  flowLabel: { marginTop: 4, fontWeight: '600', textAlign: 'center' },
  clearBtn: { alignSelf: 'flex-start', marginTop: 6, paddingVertical: 4 },
});

const DAY_TONE_STYLE = {
  menstrual: styles.dayTone_menstrual,
  follicular: styles.dayTone_follicular,
  ovulation: styles.dayTone_ovulation,
  luteal: styles.dayTone_luteal,
  unknown: styles.dayTone_unknown,
} as const;
