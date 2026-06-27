import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TextInput,
  type LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';
import type { Preferences } from '../storage/preferences';
import { AchievementsPane } from './AchievementsPane';
import { MedalIcon, TargetBullseyeIcon } from './goalsModalIcons';
import { computeAchievementSnapshots, markAchievementSeen } from '@rianell/shared';

type Props = {
  visible: boolean;
  initialPane?: number;
  prefs: Preferences;
  onChangePrefs: (next: Preferences) => void;
  onClose: () => void;
};

const PANE_KEYS = ['common.goals.targets', 'achievements.title'] as const;
const MAX_CAROUSEL_HEIGHT = 420;

export function GoalsModal({ visible, initialPane = 0, prefs, onChangePrefs, onClose }: Props) {
  const theme = useTheme();
  const { t } = useT();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<{ scrollTo: (options: { x: number; animated?: boolean }) => void } | null>(
    null,
  );
  const [paneIndex, setPaneIndex] = useState(initialPane);
  const [carouselHeight, setCarouselHeight] = useState(280);
  const paneHeightsRef = useRef<number[]>([0, 0]);

  const syncCarouselHeight = useCallback((idx: number) => {
    const measured = paneHeightsRef.current[idx];
    if (measured > 0) setCarouselHeight(Math.min(measured, MAX_CAROUSEL_HEIGHT));
  }, []);

  const onPaneLayout = useCallback(
    (idx: number) => (event: LayoutChangeEvent) => {
      paneHeightsRef.current[idx] = event.nativeEvent.layout.height;
      if (idx === paneIndex) syncCarouselHeight(idx);
    },
    [paneIndex, syncCarouselHeight],
  );

  const paneTitles = PANE_KEYS.map((k) => t(k));

  const goPane = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(PANE_KEYS.length - 1, i));
      setPaneIndex(clamped);
      scrollRef.current?.scrollTo({ x: clamped * width, animated: true });
    },
    [width],
  );

  useEffect(() => {
    if (!visible) return;
    setPaneIndex(initialPane);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: initialPane * width, animated: false });
    });
  }, [visible, initialPane, width]);

  useEffect(() => {
    syncCarouselHeight(paneIndex);
  }, [paneIndex, prefs.goalsModalSeenCount, syncCarouselHeight]);

  useEffect(() => {
    if (!visible || paneIndex !== 1) return;
    const { snapshots } = computeAchievementSnapshots(prefs.trackingProfile, prefs.achievements);
    let next: Preferences['achievements'] = prefs.achievements;
    for (const s of snapshots) {
      if (s.unlocked && !s.seenAt) {
        next = markAchievementSeen(next, s.id) as Preferences['achievements'];
      }
    }
    if (next !== prefs.achievements) onChangePrefs({ ...prefs, achievements: next });
  }, [onChangePrefs, paneIndex, prefs, visible]);

  const onPaneScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / Math.max(width, 1));
    setPaneIndex(idx);
  };

  const updateGoal = (patch: Partial<Preferences['goals']>) => {
    onChangePrefs({ ...prefs, goals: { ...prefs.goals, ...patch } });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.tokens.color.background }]}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.tokens.color.text, fontSize: theme.font(18) }]}>
                {t('common.goals.targets')}
              </Text>
              <Text style={{ color: `${theme.tokens.color.text}99`, fontSize: theme.font(12) }}>
                {paneIndex + 1} / {PANE_KEYS.length} - {paneTitles[paneIndex]}
              </Text>
              <View style={styles.dots}>
                {paneTitles.map((_, i) => (
                  <Pressable
                    key={PANE_KEYS[i]}
                    onPress={() => goPane(i)}
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          i === paneIndex ? `${theme.tokens.color.accent}44` : `${theme.tokens.color.text}08`,
                        borderColor:
                          i === paneIndex ? theme.tokens.color.accent : `${theme.tokens.color.text}22`,
                      },
                    ]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: i === paneIndex }}
                  >
                    {i === 0 ? (
                      <TargetBullseyeIcon
                        color={i === paneIndex ? theme.tokens.color.accent : `${theme.tokens.color.text}88`}
                      />
                    ) : (
                      <MedalIcon
                        color={i === paneIndex ? theme.tokens.color.accent : `${theme.tokens.color.text}88`}
                      />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')}>
              <Ionicons name="close" size={24} color={theme.tokens.color.text} />
            </Pressable>
          </View>

          <View style={styles.navRow}>
            <Pressable onPress={() => goPane(paneIndex - 1)} disabled={paneIndex <= 0} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={22} color={theme.tokens.color.text} />
            </Pressable>
            <Pressable
              onPress={() => goPane(paneIndex + 1)}
              disabled={paneIndex >= PANE_KEYS.length - 1}
              style={styles.navBtn}
            >
              <Ionicons name="chevron-forward" size={22} color={theme.tokens.color.text} />
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onPaneScrollEnd}
            style={[styles.carousel, { height: carouselHeight, maxHeight: MAX_CAROUSEL_HEIGHT }]}
          >
            <ScrollView style={{ width }} contentContainerStyle={styles.pane} nestedScrollEnabled>
              <View onLayout={onPaneLayout(0)}>
              {!prefs.goalsModalSeenCount ? (
                <View style={[styles.orientationCard, { borderColor: theme.tokens.color.accent + '55', backgroundColor: theme.tokens.color.accent + '12' }]}>
                  <Text style={{ color: theme.tokens.color.text, fontSize: theme.font(14), lineHeight: 20 }}>
                    {t('goals.firstVisit.body')}
                  </Text>
                  <Pressable
                    onPress={() => onChangePrefs({ ...prefs, goalsModalSeenCount: 1 })}
                    style={{ marginTop: 10, minHeight: 44, justifyContent: 'center' }}
                    accessibilityRole="button"
                  >
                    <Text style={{ color: theme.tokens.color.accent, fontWeight: '600' }}>{t('goals.firstVisit.dismiss')}</Text>
                  </Pressable>
                </View>
              ) : null}
              <Text style={[styles.hint, { color: `${theme.tokens.color.text}BB`, fontSize: theme.font(13) }]}>
                {t('common.goals.hint')}
              </Text>
              <GoalField
                label={t('common.steps.per.day')}
                hint={t('goals.field.steps.hint')}
                value={String(prefs.goals.steps)}
                onChangeText={(v) => updateGoal({ steps: clampInt(v, 0, 100000) ?? prefs.goals.steps })}
                theme={theme}
              />
              <GoalField
                label={t('common.hydration.glasses.per.day')}
                hint={t('goals.field.hydration.hint')}
                value={String(prefs.goals.hydration)}
                onChangeText={(v) => updateGoal({ hydration: clampInt(v, 0, 30) ?? prefs.goals.hydration })}
                theme={theme}
              />
              <GoalField
                label={t('common.sleep.quality.score.1.10')}
                hint={t('goals.field.sleep.hint')}
                value={String(prefs.goals.sleepScore)}
                onChangeText={(v) => updateGoal({ sleepScore: clampInt(v, 0, 10) ?? prefs.goals.sleepScore })}
                theme={theme}
              />
              <GoalField
                label={t('common.good.days.per.week.no.flare.mood.6')}
                hint={t('goals.field.goodDays.hint')}
                value={String(prefs.goals.goodDaysPerWeek)}
                onChangeText={(v) => updateGoal({ goodDaysPerWeek: clampInt(v, 0, 7) ?? prefs.goals.goodDaysPerWeek })}
                theme={theme}
              />
              </View>
            </ScrollView>

            <ScrollView style={{ width }} contentContainerStyle={styles.pane} nestedScrollEnabled>
              <View onLayout={onPaneLayout(1)}>
              <Text style={[styles.hint, { color: `${theme.tokens.color.text}BB`, fontSize: theme.font(13) }]}>
                {t('achievements.subtitle')}
              </Text>
              <AchievementsPane trackingProfile={prefs.trackingProfile} achievementState={prefs.achievements} />
              </View>
            </ScrollView>
          </ScrollView>

          <Pressable
            style={[styles.saveBtn, { backgroundColor: theme.tokens.color.accent }]}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text style={[styles.saveText, { fontSize: theme.font(16) }]}>{t('common.save')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function clampInt(raw: string, min: number, max: number): number | undefined {
  const n = Number(raw.trim());
  if (!Number.isFinite(n)) return undefined;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function GoalField({
  label,
  hint,
  value,
  onChangeText,
  theme,
}: {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (v: string) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.sliderGroup}>
      <Text style={{ color: theme.tokens.color.text, fontWeight: '500', marginBottom: 4 }}>{label}</Text>
      {hint ? (
        <Text style={{ color: `${theme.tokens.color.text}99`, fontSize: theme.font(12), marginBottom: 6, lineHeight: 17 }}>
          {hint}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        style={[
          styles.goalInput,
          {
            color: theme.tokens.color.text,
            borderColor: `${theme.tokens.color.text}33`,
            fontSize: theme.font(14),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    borderRadius: 16,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 8,
    gap: 8,
  },
  title: { fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 8, marginTop: 8 },
  dot: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  navBtn: { padding: 8 },
  carousel: { flexGrow: 0 },
  pane: { padding: 16, paddingBottom: 24 },
  orientationCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  hint: { marginBottom: 12 },
  sliderGroup: { marginBottom: 16 },
  goalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  saveBtn: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: { color: '#111', fontWeight: '700' },
});
