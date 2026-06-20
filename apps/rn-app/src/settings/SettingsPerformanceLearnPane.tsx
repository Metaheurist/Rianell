import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  getOnDeviceMoatBulletKeys,
  getProgressiveDisclosureMilestones,
} from '@rianell/shared';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';

export function SettingsPerformanceLearnPane() {
  const theme = useTheme();
  const { t } = useT();
  const [open, setOpen] = useState(false);

  const moatBullets = getOnDeviceMoatBulletKeys();
  const milestones = getProgressiveDisclosureMilestones();

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={[
          styles.summary,
          {
            borderColor: `${theme.tokens.color.accent}44`,
            backgroundColor: `${theme.tokens.color.text}08`,
          },
        ]}
      >
        <View style={styles.summaryRow}>
          <Ionicons name="school-outline" size={18} color={theme.tokens.color.accent} />
          <Text style={[styles.summaryTitle, { color: theme.tokens.color.textPrimary }]}>
            {t('settings.performance.learnMore')}
          </Text>
          <Ionicons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={theme.tokens.color.textMuted}
          />
        </View>
        <Text style={[styles.summaryHint, { color: theme.tokens.color.textMuted }]}>
          {t('settings.performance.learnMore.hint')}
        </Text>
      </Pressable>

      {open ? (
        <View
          style={[
            styles.body,
            {
              borderColor: `${theme.tokens.color.accent}33`,
              backgroundColor: `${theme.tokens.color.text}05`,
            },
          ]}
        >
          <Text style={[styles.heading, { color: theme.tokens.color.textPrimary }]}>
            {t('onDeviceMoat.title')}
          </Text>
          <Text style={[styles.hint, { color: theme.tokens.color.textMuted }]}>{t('onDeviceMoat.lead')}</Text>
          {moatBullets.map((key) => (
            <Text key={key} style={[styles.bullet, { color: theme.tokens.color.textMuted }]}>
              · {t(key)}
            </Text>
          ))}

          <Text style={[styles.heading, { color: theme.tokens.color.textPrimary, marginTop: 16 }]}>
            {t('progressiveDisclosure.title')}
          </Text>
          <Text style={[styles.hint, { color: theme.tokens.color.textMuted }]}>
            {t('progressiveDisclosure.lead')}
          </Text>
          {milestones.map((m) => (
            <Text key={m.id} style={[styles.bullet, { color: theme.tokens.color.textMuted }]}>
              · {t(m.i18n)}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16 },
  summary: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  summaryHint: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  body: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
  },
  heading: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  hint: { fontSize: 13, lineHeight: 18, marginBottom: 6 },
  bullet: { fontSize: 13, lineHeight: 18, marginTop: 4 },
});
