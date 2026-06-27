import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import {
  addLogFavorite,
  normalizeLogFavorites,
  normalizeMedSchedule,
  normalizeMedScheduleEntry,
  normalizeSymptomTemplates,
  upsertSymptomTemplate,
} from '@rianell/shared';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';
import type { Preferences } from '../storage/preferences';

type Props = {
  prefs: Preferences;
  onChangePrefs: (next: Preferences) => void;
};

export function SettingsLoggingPane({ prefs, onChangePrefs }: Props) {
  const theme = useTheme();
  const { t } = useT();
  const [symptomChipsDraft, setSymptomChipsDraft] = useState('');
  const [medDrug, setMedDrug] = useState('');
  const [medTimes, setMedTimes] = useState('');
  const [favMeal, setFavMeal] = useState('');
  const [favExercise, setFavExercise] = useState('');

  const condition = prefs.medicalCondition || prefs.trackingProfile?.condition || 'General';
  const templateChips = normalizeSymptomTemplates(prefs.symptomTemplates).find(
    (row) => row.condition.toLowerCase() === condition.toLowerCase(),
  )?.chips ?? [];

  return (
    <View style={styles.wrap}>
      <Text style={[styles.heading, { color: theme.tokens.color.textPrimary }]}>
        {t('settings.logging.title')}
      </Text>
      <Hint text={t('settings.logging.lead')} color={theme.tokens.color.textMuted} />

      <Row label={t('settings.logging.cycleModule')}>
        <Switch
          value={prefs.cycleModuleEnabled}
          onValueChange={(cycleModuleEnabled) => onChangePrefs({ ...prefs, cycleModuleEnabled })}
        />
      </Row>
      <Row label={t('settings.logging.barcodeFood')}>
        <Switch
          value={prefs.barcodeFoodLoggingEnabled}
          onValueChange={(barcodeFoodLoggingEnabled) => onChangePrefs({ ...prefs, barcodeFoodLoggingEnabled })}
        />
      </Row>

      <Text style={[styles.subheading, { color: theme.tokens.color.textPrimary }]}>
        {t('settings.logging.symptomTemplates')}
      </Text>
      <Hint text={t('settings.logging.symptomTemplatesHint', { condition })} color={theme.tokens.color.textMuted} />
      {templateChips.length > 0 ? (
        <Text style={{ color: theme.tokens.color.textMuted, fontSize: 13, marginBottom: 6 }}>
          {templateChips.join(' · ')}
        </Text>
      ) : null}
      <TextInput
        value={symptomChipsDraft}
        onChangeText={setSymptomChipsDraft}
        placeholder={t('settings.logging.symptomChipsPlaceholder')}
        placeholderTextColor={theme.tokens.color.textMuted}
        style={[styles.input, { color: theme.tokens.color.textPrimary, borderColor: theme.tokens.color.border }]}
      />
      <Pressable
        style={[styles.btn, { backgroundColor: theme.tokens.color.accent }]}
        onPress={() => {
          const chips = symptomChipsDraft.split(',').map((x) => x.trim()).filter(Boolean);
          onChangePrefs({
            ...prefs,
            symptomTemplates: upsertSymptomTemplate(prefs.symptomTemplates, condition, chips),
          });
          setSymptomChipsDraft('');
        }}
      >
        <Text style={styles.btnText}>{t('settings.logging.saveSymptomTemplates')}</Text>
      </Pressable>

      <Text style={[styles.subheading, { color: theme.tokens.color.textPrimary }]}>
        {t('settings.logging.favorites')}
      </Text>
      <TextInput
        value={favMeal}
        onChangeText={setFavMeal}
        placeholder={t('settings.logging.favoriteMealPlaceholder')}
        placeholderTextColor={theme.tokens.color.textMuted}
        style={[styles.input, { color: theme.tokens.color.textPrimary, borderColor: theme.tokens.color.border }]}
      />
      <Pressable
        style={[styles.btn, { backgroundColor: theme.tokens.color.accent }]}
        onPress={() => {
          onChangePrefs({ ...prefs, logFavorites: addLogFavorite(prefs.logFavorites, 'meals', favMeal) });
          setFavMeal('');
        }}
      >
        <Text style={styles.btnText}>{t('settings.logging.addFavoriteMeal')}</Text>
      </Pressable>
      <TextInput
        value={favExercise}
        onChangeText={setFavExercise}
        placeholder={t('settings.logging.favoriteExercisePlaceholder')}
        placeholderTextColor={theme.tokens.color.textMuted}
        style={[styles.input, { color: theme.tokens.color.textPrimary, borderColor: theme.tokens.color.border, marginTop: 8 }]}
      />
      <Pressable
        style={[styles.btn, { backgroundColor: theme.tokens.color.accent }]}
        onPress={() => {
          onChangePrefs({ ...prefs, logFavorites: addLogFavorite(prefs.logFavorites, 'exercises', favExercise) });
          setFavExercise('');
        }}
      >
        <Text style={styles.btnText}>{t('settings.logging.addFavoriteExercise')}</Text>
      </Pressable>
      {(normalizeLogFavorites(prefs.logFavorites).meals.length > 0 ||
        normalizeLogFavorites(prefs.logFavorites).exercises.length > 0) && (
        <Text style={{ color: theme.tokens.color.textMuted, fontSize: 13, marginTop: 8 }}>
          {[
            ...normalizeLogFavorites(prefs.logFavorites).meals.map((m) => `🍽 ${m}`),
            ...normalizeLogFavorites(prefs.logFavorites).exercises.map((e) => `🏃 ${e}`),
          ].join(' · ')}
        </Text>
      )}

      <Text style={[styles.subheading, { color: theme.tokens.color.textPrimary }]}>
        {t('settings.logging.medSchedule')}
      </Text>
      <Hint text={t('settings.logging.medScheduleHint')} color={theme.tokens.color.textMuted} />
      <TextInput
        value={medDrug}
        onChangeText={setMedDrug}
        placeholder={t('settings.logging.medDrugPlaceholder')}
        placeholderTextColor={theme.tokens.color.textMuted}
        style={[styles.input, { color: theme.tokens.color.textPrimary, borderColor: theme.tokens.color.border }]}
      />
      <TextInput
        value={medTimes}
        onChangeText={setMedTimes}
        placeholder={t('settings.logging.medTimesPlaceholder')}
        placeholderTextColor={theme.tokens.color.textMuted}
        style={[styles.input, { color: theme.tokens.color.textPrimary, borderColor: theme.tokens.color.border, marginTop: 8 }]}
      />
      <Pressable
        style={[styles.btn, { backgroundColor: theme.tokens.color.accent }]}
        onPress={() => {
          const entry = normalizeMedScheduleEntry({
            drug: medDrug,
            times: medTimes.split(',').map((x) => x.trim()),
          });
          if (!entry) return;
          onChangePrefs({
            ...prefs,
            medSchedule: normalizeMedSchedule([...(prefs.medSchedule || []), entry]),
          });
          setMedDrug('');
          setMedTimes('');
        }}
      >
        <Text style={styles.btnText}>{t('settings.logging.addMedSchedule')}</Text>
      </Pressable>
      {normalizeMedSchedule(prefs.medSchedule).map((row) => (
        <Text key={row.id} style={{ color: theme.tokens.color.textMuted, fontSize: 13, marginTop: 4 }}>
          {row.drug} · {row.times.join(', ')}
        </Text>
      ))}
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Hint({ text, color }: { text: string; color: string }) {
  return <Text style={[styles.hint, { color }]}>{text}</Text>;
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8, marginBottom: 16 },
  heading: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  subheading: { fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 4 },
  hint: { fontSize: 12, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 6 },
  rowLabel: { flex: 1, fontSize: 14, paddingRight: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14 },
  btn: { marginTop: 8, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
});
