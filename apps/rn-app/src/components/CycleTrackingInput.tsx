import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  CYCLE_DAY_MAX,
  CYCLE_DAY_SELECTOR_MAX,
  CYCLE_FLOW_LEVELS,
  CYCLE_PHASES,
  daysSincePeriodStart,
  isCycleDayLate,
  suggestCyclePhaseForDay,
} from '@rianell/shared';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';

export type CycleTrackingValue = {
  cycleDay: number | null;
  cyclePhase: string;
  cycleFlow: string;
  periodStart?: boolean;
};

type Props = {
  value: CycleTrackingValue;
  onChange: (next: CycleTrackingValue) => void;
  suggestHint?: string | null;
  logDateIso?: string;
  periodAnchorDate?: string | null;
};

const PHASE_TONE: Record<string, string> = {
  menstrual: '#e91e63',
  follicular: '#66bb6a',
  ovulation: '#ffc107',
  luteal: '#ab47bc',
};

function CyclePhaseIcon({ phaseId, color }: { phaseId: string; color: string }) {
  const props = { stroke: color, fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (phaseId) {
    case 'menstrual':
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24" accessibilityElementsHidden>
          <Path
            {...props}
            d="M12 4.5c-3.2 0-5.8 2.4-5.8 5.4 0 2.2 1.3 4.1 3.2 5v5.1h5.2v-5.1c1.9-.9 3.2-2.8 3.2-5 0-3-2.6-5.4-5.8-5.4Z"
          />
        </Svg>
      );
    case 'follicular':
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24" accessibilityElementsHidden>
          <Path {...props} d="M12 20V8.5M12 8.5C10.2 8.5 8.8 7 8.8 5.2S10.2 1.8 12 1.8 15.2 3.4 15.2 5.2 13.8 8.5 12 8.5Z" />
          <Path {...props} d="M9.5 14.5c.8 1.6 2.2 2.5 2.5 2.5s1.7-.9 2.5-2.5" />
        </Svg>
      );
    case 'ovulation':
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24" accessibilityElementsHidden>
          <Circle cx={12} cy={12} r={3.6} stroke={color} fill="none" strokeWidth={1.8} />
          <Path
            stroke={color}
            fill="none"
            strokeWidth={1.6}
            strokeLinecap="round"
            d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
          />
        </Svg>
      );
    case 'luteal':
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24" accessibilityElementsHidden>
          <Path
            {...props}
            d="M19 14.5A7.5 7.5 0 0 1 8.6 8.6 6.5 6.5 0 1 0 19 14.5Z"
          />
        </Svg>
      );
    default:
      return null;
  }
}

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

export function CycleTrackingInput({ value, onChange, suggestHint, logDateIso, periodAnchorDate }: Props) {
  const theme = useTheme();
  const { t } = useT();
  const phaseManualRef = useRef(false);
  const [longCycleExpanded, setLongCycleExpanded] = useState(
    value.cycleDay != null && value.cycleDay > CYCLE_DAY_SELECTOR_MAX,
  );

  const visibleDays = useMemo(() => {
    const max = longCycleExpanded ? CYCLE_DAY_MAX : CYCLE_DAY_SELECTOR_MAX;
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [longCycleExpanded]);

  const selectDay = useCallback(
    (day: number) => {
      const nextDay = value.cycleDay === day ? null : day;
      let nextPhase = value.cyclePhase;
      let nextPeriodStart = value.periodStart;
      if (nextDay != null && nextDay !== 1) nextPeriodStart = false;
      if (nextDay != null && !phaseManualRef.current) {
        nextPhase = suggestCyclePhaseForDay(nextDay) || '';
      }
      if (nextDay == null) {
        phaseManualRef.current = false;
        nextPeriodStart = false;
      }
      if (nextDay != null && nextDay > CYCLE_DAY_SELECTOR_MAX) setLongCycleExpanded(true);
      onChange({ ...value, cycleDay: nextDay, cyclePhase: nextPhase, periodStart: nextPeriodStart });
    },
    [onChange, value],
  );

  const markPeriodStartedToday = useCallback(() => {
    phaseManualRef.current = false;
    onChange({
      ...value,
      cycleDay: 1,
      cyclePhase: 'menstrual',
      periodStart: true,
    });
  }, [onChange, value]);

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
    setLongCycleExpanded(false);
    onChange({ cycleDay: null, cyclePhase: '', cycleFlow: '', periodStart: false });
  }, [onChange]);

  const dayReadout = useMemo(() => {
    if (value.cycleDay == null) return '';
    let hint = t('wizard.cycle.dayHint', { day: String(value.cycleDay) });
    if (value.cyclePhase && !phaseManualRef.current) {
      const phaseMeta = CYCLE_PHASES.find((p) => p.id === value.cyclePhase);
      if (phaseMeta) {
        hint += ` · ${t('wizard.cycle.suggestedPhase', { phase: t(phaseMeta.i18n) })}`;
      }
    }
    const anchor = value.periodStart && logDateIso ? logDateIso : periodAnchorDate;
    if (anchor && logDateIso) {
      const since = daysSincePeriodStart(anchor, logDateIso);
      if (since != null && since >= 0) {
        hint += ` · ${t('wizard.cycle.daysSincePeriod', { days: String(since) })}`;
      }
    }
    if (isCycleDayLate(value.cycleDay)) {
      hint += ` · ${t('wizard.cycle.lateHint')}`;
    }
    return hint;
  }, [logDateIso, periodAnchorDate, t, value.cycleDay, value.cyclePhase, value.periodStart]);

  const periodStartedActive = value.periodStart === true && value.cycleDay === 1;

  return (
    <View style={[styles.panel, { borderColor: `${theme.tokens.color.accent}44` }]}>
      <Text style={[styles.title, { color: theme.tokens.color.accent, fontSize: theme.font(15) }]}>
        {t('wizard.cycle.title')}
      </Text>
      <Text style={[styles.lead, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
        {t('wizard.cycle.lead')}
      </Text>
      {suggestHint ? (
        <Text style={[styles.suggestHint, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>
          {suggestHint}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: periodStartedActive }}
        onPress={markPeriodStartedToday}
        style={[
          styles.periodStartBtn,
          {
            borderColor: `${theme.tokens.color.accent}66`,
            backgroundColor: `${theme.tokens.color.accent}22`,
          },
          periodStartedActive
            ? {
                borderColor: theme.tokens.color.accent,
                backgroundColor: `${theme.tokens.color.accent}33`,
              }
            : null,
        ]}
      >
        <Text style={{ color: theme.tokens.color.text, fontWeight: '700', fontSize: theme.font(13) }}>
          {t('wizard.cycle.periodStartedToday')}
        </Text>
      </Pressable>

      <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(13) }]}>
        {t('wizard.cycle.day')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
        {visibleDays.map((day) => {
          const tone = suggestCyclePhaseForDay(day) || 'unknown';
          const selected = value.cycleDay === day;
          const late = isCycleDayLate(day);
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
                late && !selected ? styles.dayTone_late : null,
                selected ? { borderColor: theme.tokens.color.accent, transform: [{ scale: 1.06 }] } : null,
              ]}
            >
              <Text style={{ color: theme.tokens.color.text, fontWeight: '700', fontSize: theme.font(13) }}>{day}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {!longCycleExpanded ? (
        <Pressable accessibilityRole="button" onPress={() => setLongCycleExpanded(true)} style={styles.longToggle}>
          <Text style={{ color: theme.tokens.color.accent, fontSize: theme.font(12), textDecorationLine: 'underline' }}>
            {t('wizard.cycle.showLongCycle')}
          </Text>
        </Pressable>
      ) : null}
      {dayReadout ? (
        <Text style={[styles.hint, { color: theme.tokens.color.text, fontSize: theme.font(12) }]}>{dayReadout}</Text>
      ) : null}

      <Text style={[styles.label, { color: theme.tokens.color.text, fontSize: theme.font(13), marginTop: 10 }]}>
        {t('wizard.cycle.phase')}
      </Text>
      <View style={styles.phaseGrid}>
        {CYCLE_PHASES.map((phase) => {
          const selected = value.cyclePhase === phase.id;
          const toneColor = PHASE_TONE[phase.tone] || theme.tokens.color.accent;
          return (
            <Pressable
              key={phase.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => selectPhase(phase.id)}
              style={[
                styles.phaseTile,
                { borderColor: `${toneColor}66` },
                selected ? { borderColor: theme.tokens.color.accent, backgroundColor: `${theme.tokens.color.accent}22` } : null,
              ]}
            >
              <View style={styles.phaseIconWrap}>
                <CyclePhaseIcon phaseId={phase.id} color={toneColor} />
              </View>
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
  suggestHint: { opacity: 0.72, fontStyle: 'italic', marginBottom: 6 },
  periodStartBtn: {
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  label: { fontWeight: '600', marginBottom: 6 },
  hint: { opacity: 0.75, marginTop: 2 },
  longToggle: { alignSelf: 'flex-start', marginTop: 4, marginBottom: 2 },
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
  dayTone_late: { borderColor: 'rgba(255,183,77,0.55)', backgroundColor: 'rgba(255,183,77,0.14)' },
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
  phaseIconWrap: { marginBottom: 4, alignItems: 'center', justifyContent: 'center' },
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
