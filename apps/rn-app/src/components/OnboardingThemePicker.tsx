import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getTeamIds, getTokens } from '@rianell/tokens';
import { useT } from '../i18n/I18nProvider';

const THEMES = getTeamIds();

const THEME_LABEL_KEYS: Record<string, string> = {
  mint: 'common.mint',
  'red-black': 'common.red.black',
  mono: 'common.black.white',
  rainbow: 'common.rainbow',
};

type Props = {
  mode: 'light' | 'dark';
  themeId: string;
  onModeChange: (mode: 'light' | 'dark') => void;
  onThemeChange: (themeId: string) => void;
};

export function OnboardingThemePicker({ mode, themeId, onModeChange, onThemeChange }: Props) {
  const { t } = useT();
  const preview = useMemo(() => getTokens({ team: themeId, mode }).color, [themeId, mode]);
  const borderColor = mode === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.16)';
  const surfaceColor = mode === 'light' ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.06)';
  const mutedColor = mode === 'light' ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.55)';

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.preview,
          {
            backgroundColor: typeof preview.background === 'string' && preview.background.startsWith('linear')
              ? mode === 'light'
                ? '#e8f5e9'
                : '#070807'
              : preview.background,
            borderColor,
          },
        ]}
        accessibilityRole="image"
        accessibilityLabel={t('onboarding.questionnaire.appearance.previewLabel')}
      >
        <View style={[styles.previewHeader, { backgroundColor: preview.accent }]}>
          <View style={[styles.previewDot, { backgroundColor: preview.text, opacity: 0.35 }]} />
          <View style={[styles.previewDot, { backgroundColor: preview.text, opacity: 0.35 }]} />
        </View>
        <View style={[styles.previewCard, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={[styles.previewLine, { backgroundColor: preview.accent, width: '42%' }]} />
          <View style={[styles.previewLine, { backgroundColor: mutedColor, width: '68%' }]} />
          <View style={[styles.previewLine, { backgroundColor: mutedColor, width: '54%' }]} />
        </View>
        <View style={[styles.previewPill, { backgroundColor: preview.accent }]} />
      </View>

      <Text style={[styles.sectionLabel, { color: preview.text, opacity: 0.75 }]}>
        {t('onboarding.questionnaire.appearance.modeLabel')}
      </Text>
      <View style={styles.modeRow}>
        {(['light', 'dark'] as const).map((m) => {
          const active = mode === m;
          return (
            <Pressable
              key={m}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onModeChange(m)}
              style={[
                styles.modeBtn,
                { borderColor, backgroundColor: surfaceColor },
                active && { borderColor: preview.accent },
              ]}
            >
              <Text style={{ color: active ? preview.accent : preview.text, fontWeight: '600' }}>
                {t(m === 'light' ? 'onboarding.questionnaire.appearance.light' : 'onboarding.questionnaire.appearance.dark')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.sectionLabel, { color: preview.text, opacity: 0.75 }]}>
        {t('onboarding.questionnaire.appearance.themeLabel')}
      </Text>
      <View style={styles.themeGrid}>
        {THEMES.map((id) => {
          const active = themeId === id;
          const swatch = getTokens({ team: id, mode }).color.accent;
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onThemeChange(id)}
              style={[
                styles.themeBtn,
                { borderColor, backgroundColor: surfaceColor },
                active && { borderColor: preview.accent },
              ]}
            >
              <View style={[styles.swatch, { backgroundColor: swatch }]} />
              <Text style={[styles.themeLabel, { color: preview.text }]} numberOfLines={1}>
                {t(THEME_LABEL_KEYS[id] || 'common.mint')}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  preview: {
    alignSelf: 'center',
    width: '72%',
    maxWidth: 240,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  previewHeader: {
    height: 28,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    gap: 6,
  },
  previewDot: { width: 8, height: 8, borderRadius: 4 },
  previewCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 6,
  },
  previewLine: { height: 6, borderRadius: 3 },
  previewPill: { alignSelf: 'flex-start', width: 72, height: 10, borderRadius: 999 },
  sectionLabel: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  modeRow: { flexDirection: 'row', gap: 10 },
  modeBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  themeBtn: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  swatch: { width: 22, height: 22, borderRadius: 11 },
  themeLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
});
