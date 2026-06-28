import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';
import {
  applyQuestionnaireAnswer,
  buildGuidedQuestionnaire,
  createGuidedOnboardingProgressSession,
  resolveNextGuidedCardIndex,
} from '@rianell/shared';

type GuidedCardId = Parameters<typeof applyQuestionnaireAnswer>[1];
import { getPolicyPack, getRegionLabels, suggestRegionForDevice } from '../privacy/helpers';
import { PolicyDocumentsModal } from '../privacy/PolicyDocumentsModal';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';
import type { Preferences } from '../storage/preferences';
import { upsertPrivacyProfile } from '../cloud/privacyProfile';
import { getSupabaseClient } from '../cloud/supabaseClient';
import { OnboardingIllustration } from './onboardingIllustrations';

type GuidedCard = ReturnType<typeof buildGuidedQuestionnaire>[number];

export function FirstRunWizard({
  prefs,
  onComplete,
}: {
  prefs: Preferences;
  onComplete: (next: Preferences) => void;
}) {
  const theme = useTheme();
  const { t } = useT();
  const supabase = getSupabaseClient();
  const [session, setSession] = useState<Session | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const pack = getPolicyPack();
  const regionLabels = useMemo(() => getRegionLabels(pack), [pack]);
  const suggestedRegion = useMemo(() => suggestRegionForDevice() || 'eea_uk', []);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  const platformCtx = useMemo(
    () => ({
      platform: 'rn' as const,
      cookieConsentAccepted: prefs.cookieConsent === true,
      installModalSeen: true,
      standalonePwa: false,
      tutorialSeenLegacy: prefs.tutorialSeen,
      isAuthenticated: !!session,
    }),
    [prefs.cookieConsent, prefs.tutorialSeen, session],
  );

  const [localPrefs, setLocalPrefs] = useState(prefs);
  const [cardIndex, setCardIndex] = useState(0);
  const [regionPickerOpen, setRegionPickerOpen] = useState(false);
  const [reminderTimePickerOpen, setReminderTimePickerOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(suggestedRegion);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [healthDeclinedHint, setHealthDeclinedHint] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const cards = useMemo(
    () => buildGuidedQuestionnaire(localPrefs as Record<string, unknown>, platformCtx),
    [localPrefs, platformCtx],
  );
  const card = cards[Math.min(cardIndex, Math.max(cards.length - 1, 0))] as GuidedCard | undefined;

  const progressSessionRef = useRef(
    createGuidedOnboardingProgressSession(localPrefs as Record<string, unknown>, platformCtx),
  );

  const progress = useMemo(() => {
    if (!card) return { current: 1, total: 1 };
    return progressSessionRef.current.resolve(
      localPrefs as Record<string, unknown>,
      platformCtx,
      cardIndex,
    );
  }, [localPrefs, platformCtx, cardIndex, card]);

  const animateCard = useCallback(() => {
    slideAnim.setValue(12);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
  }, [slideAnim]);

  const patchPrefs = useCallback((patch: Partial<Preferences>) => {
    setLocalPrefs((cur) => ({ ...cur, ...patch }));
  }, []);

  const advanceAfterAnswer = useCallback(
    (answeredCardId: GuidedCardId | undefined, nextPrefs: Preferences) => {
      const nextCards = buildGuidedQuestionnaire(nextPrefs as Record<string, unknown>, platformCtx);
      if (answeredCardId) {
        setCardIndex(resolveNextGuidedCardIndex(nextCards, answeredCardId));
      } else {
        setCardIndex((i) => Math.min(i + 1, Math.max(nextCards.length - 1, 0)));
      }
      animateCard();
    },
    [platformCtx, animateCard],
  );

  const applyChoice = useCallback(
    (cardId: GuidedCardId, choiceId: string, extra: Record<string, unknown> = {}) => {
      const next = applyQuestionnaireAnswer(
        localPrefs as Record<string, unknown>,
        cardId,
        choiceId,
        extra,
      ) as Preferences;
      setLocalPrefs(next);
      if (cardId === 'region') {
        void upsertPrivacyProfile(next);
      }
      if (cardId === 'healthConsent') {
        void upsertPrivacyProfile(next);
      }
      return next;
    },
    [localPrefs],
  );

  const handleChoice = useCallback(
    (choiceId: string) => {
      if (!card) return;
      if (card.id === 'signIn' && choiceId === 'setUpInstead') {
        const next = applyChoice('signIn', choiceId);
        advanceAfterAnswer('signIn', next);
        return;
      }
      if (card.id === 'accountSignUp' && choiceId === 'skip') {
        const next = applyChoice('accountSignUp', choiceId);
        advanceAfterAnswer('accountSignUp', next);
        return;
      }
      if (card.id === 'region') {
        if (choiceId === 'pickAnother') {
          setRegionPickerOpen(true);
          return;
        }
        if (choiceId === 'confirm') {
          const next = applyChoice('region', 'confirm', {
            regionId: selectedRegion,
            policyPackId: pack.policyPackId || 'v1.0.0',
          });
          setRegionPickerOpen(false);
          advanceAfterAnswer('region', next);
        }
        return;
      }
      if (card.id === 'dailyNudge' && choiceId === 'yes') {
        setReminderTimePickerOpen(true);
        return;
      }
      if (card.id === 'finish') {
        const done = applyChoice('finish', choiceId) as Preferences;
        onComplete(done);
        return;
      }
      if (card.id === 'healthConsent' && choiceId === 'notNow') {
        applyChoice('healthConsent', 'notNow');
        setHealthDeclinedHint(true);
        return;
      }
      const next = applyChoice(card.id as GuidedCardId, choiceId);
      setHealthDeclinedHint(false);
      advanceAfterAnswer(card.id as GuidedCardId, next);
    },
    [card, selectedRegion, pack.policyPackId, applyChoice, advanceAfterAnswer, onComplete],
  );

  const onAuthPrimary = useCallback(async () => {
    if (!card || card.kind !== 'auth' || !supabase) return;
    if (!authEmail.trim() || !authPassword) {
      Alert.alert(
        card.id === 'signIn' ? t('settings.cloud.signIn') : t('settings.cloud.signUp'),
        t('settings.cloud.enterCredentials'),
      );
      return;
    }
    setAuthBusy(true);
    try {
      if (card.id === 'signIn') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) {
          Alert.alert(t('settings.cloud.signIn'), error.message);
          return;
        }
        if (data.session) setSession(data.session);
        setAuthPassword('');
        const authCtx = { ...platformCtx, isAuthenticated: true };
        const nextCards = buildGuidedQuestionnaire(localPrefs as Record<string, unknown>, authCtx);
        setCardIndex(resolveNextGuidedCardIndex(nextCards, 'signIn'));
        animateCard();
      } else {
        const { error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) {
          Alert.alert(t('settings.cloud.signUp'), error.message);
          return;
        }
        setAuthPassword('');
        Alert.alert(t('settings.cloud.signUp'), t('settings.cloud.verifyEmail'));
        advanceAfterAnswer('accountSignUp', localPrefs);
      }
    } finally {
      setAuthBusy(false);
    }
  }, [card, supabase, authEmail, authPassword, t, advanceAfterAnswer, localPrefs, platformCtx, animateCard]);

  const onConfirmRegionPicker = useCallback(() => {
    const next = applyChoice('region', 'confirm', {
      regionId: selectedRegion,
      policyPackId: pack.policyPackId || 'v1.0.0',
    });
    setRegionPickerOpen(false);
    advanceAfterAnswer('region', next);
  }, [applyChoice, selectedRegion, pack.policyPackId, advanceAfterAnswer]);

  const onConfirmReminder = useCallback(() => {
    const next = applyChoice('dailyNudge', 'yes', { reminderTime });
    setReminderTimePickerOpen(false);
    advanceAfterAnswer('dailyNudge', next);
  }, [applyChoice, reminderTime, advanceAfterAnswer]);

  const onBack = useCallback(() => {
    if (regionPickerOpen) {
      setRegionPickerOpen(false);
      return;
    }
    if (reminderTimePickerOpen) {
      setReminderTimePickerOpen(false);
      return;
    }
    if (healthDeclinedHint) {
      setHealthDeclinedHint(false);
      return;
    }
    setCardIndex((i) => Math.max(0, i - 1));
    animateCard();
  }, [regionPickerOpen, reminderTimePickerOpen, healthDeclinedHint, animateCard]);

  const regionLabel = (id: string) => regionLabels.find((r) => r.id === id)?.label || id;

  const renderChoices = (c: GuidedCard) => (
    <View style={styles.choices}>
      {c.choices?.map((choice) => (
        <Pressable
          key={choice.id}
          accessibilityRole="button"
          style={[styles.choice, { borderColor: theme.tokens.color.border }]}
          onPress={() => handleChoice(choice.id)}
        >
          <Text style={[styles.choiceLabel, { color: theme.tokens.color.textPrimary }]}>
            {t(choice.labelKey)}
          </Text>
          {choice.hintKey ? (
            <Text style={[styles.choiceHint, { color: theme.tokens.color.textMuted }]}>
              {t(choice.hintKey)}
            </Text>
          ) : null}
        </Pressable>
      ))}
    </View>
  );

  const renderAuthBody = (c: GuidedCard) => (
    <>
      <Text style={[styles.lead, { color: theme.tokens.color.textSecondary }]}>{t(c.bodyKey)}</Text>
      <Text style={[styles.label, { color: theme.tokens.color.textPrimary }]}>
        {t('onboarding.questionnaire.auth.emailLabel')}
      </Text>
      <TextInput
        value={authEmail}
        onChangeText={setAuthEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        placeholderTextColor={theme.tokens.color.textMuted}
        style={[styles.input, { color: theme.tokens.color.textPrimary, borderColor: theme.tokens.color.border }]}
      />
      <Text style={[styles.label, { color: theme.tokens.color.textPrimary }]}>
        {t('onboarding.questionnaire.auth.passwordLabel')}
      </Text>
      <TextInput
        value={authPassword}
        onChangeText={setAuthPassword}
        secureTextEntry
        autoComplete={c.id === 'signIn' ? 'password' : 'new-password'}
        placeholderTextColor={theme.tokens.color.textMuted}
        style={[styles.input, { color: theme.tokens.color.textPrimary, borderColor: theme.tokens.color.border }]}
      />
      <Pressable
        accessibilityRole="button"
        disabled={authBusy}
        onPress={() => void onAuthPrimary()}
        style={[styles.primary, { backgroundColor: theme.tokens.color.accent, marginTop: 8 }]}
      >
        <Text style={styles.primaryText}>
          {c.id === 'signIn' ? t('settings.cloud.signIn') : t('settings.cloud.signUp')}
        </Text>
      </Pressable>
      {renderChoices(c)}
    </>
  );

  const renderBody = () => {
    if (!card) return null;

    if (card.kind === 'auth') {
      return renderAuthBody(card);
    }

    if (healthDeclinedHint && card.id === 'healthConsent') {
      return (
        <Text style={[styles.lead, { color: theme.tokens.color.textSecondary }]}>
          {t('onboarding.questionnaire.healthConsent.declineHint')}
        </Text>
      );
    }

    if (card.id === 'region' && regionPickerOpen) {
      return (
        <>
          <Text style={[styles.lead, { color: theme.tokens.color.textSecondary }]}>{t(card.bodyKey)}</Text>
          {regionLabels.map((r) => (
            <Pressable
              key={r.id}
              accessibilityRole="button"
              style={[styles.regionRow, selectedRegion === r.id && styles.regionRowSelected]}
              onPress={() => setSelectedRegion(r.id)}
            >
              <Text style={{ color: theme.tokens.color.textPrimary }}>{r.label}</Text>
            </Pressable>
          ))}
          <Pressable accessibilityRole="button" style={styles.linkBtn} onPress={() => setPolicyOpen(true)}>
            <Text style={{ color: theme.tokens.color.accent }}>{t('gate.viewPolicies')}</Text>
          </Pressable>
        </>
      );
    }

    if (card.id === 'region' && !regionPickerOpen) {
      return (
        <>
          <Text style={[styles.lead, { color: theme.tokens.color.textSecondary }]}>
            {t('onboarding.questionnaire.region.suggested', { region: regionLabel(selectedRegion) })}
          </Text>
          {renderChoices(card)}
        </>
      );
    }

    if (card.id === 'dailyNudge' && reminderTimePickerOpen) {
      return (
        <>
          <Text style={[styles.lead, { color: theme.tokens.color.textSecondary }]}>{t(card.bodyKey)}</Text>
          <Text style={[styles.label, { color: theme.tokens.color.textPrimary }]}>
            {t('onboarding.questionnaire.dailyNudge.timeLabel')}
          </Text>
          <TextInput
            value={reminderTime}
            onChangeText={setReminderTime}
            placeholder="09:00"
            placeholderTextColor={theme.tokens.color.textMuted}
            style={[styles.input, { color: theme.tokens.color.textPrimary, borderColor: theme.tokens.color.border }]}
          />
        </>
      );
    }

    return (
      <>
        <Text style={[styles.lead, { color: theme.tokens.color.textSecondary }]}>{t(card.bodyKey)}</Text>
        {card.choices ? renderChoices(card) : null}
      </>
    );
  };

  const showFooter =
    regionPickerOpen ||
    reminderTimePickerOpen ||
    healthDeclinedHint;
  const showBack =
    cardIndex > 0 || regionPickerOpen || reminderTimePickerOpen || healthDeclinedHint;
  const showDetails = card?.kind === 'consent' && !healthDeclinedHint && !regionPickerOpen;

  const onPrimary = () => {
    if (!card) return;
    if (regionPickerOpen) onConfirmRegionPicker();
    else if (reminderTimePickerOpen) onConfirmReminder();
    else if (healthDeclinedHint) {
      setHealthDeclinedHint(false);
      advanceAfterAnswer('healthConsent', localPrefs);
    }
  };

  const primaryLabel =
    regionPickerOpen
      ? t('gate.confirm')
      : t('onboarding.questionnaire.continue');

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={[styles.root, { backgroundColor: theme.tokens.color.background }]}>
        <View style={styles.dotsRow}>
          {Array.from({ length: progress.total }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: theme.tokens.color.border },
                i === cardIndex && { backgroundColor: theme.tokens.color.accent, transform: [{ scale: 1.25 }] },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.title, { color: theme.tokens.color.textPrimary }]}>
          {card ? t(card.titleKey) : t('onboarding.title')}
        </Text>
        <Text style={[styles.stepMeta, { color: theme.tokens.color.textMuted }]}>
          {t('onboarding.stepCounter', { current: progress.current, total: progress.total })}
        </Text>
        <ScrollView contentContainerStyle={styles.body}>
          <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
            {card ? <OnboardingIllustration name={card.illustration} color={theme.tokens.color.accent} /> : null}
            {renderBody()}
            {card?.settingsHintKey ? (
              <Text style={[styles.settingsHint, { color: theme.tokens.color.textMuted }]}>
                {t(card.settingsHintKey)}
              </Text>
            ) : null}
          </Animated.View>
        </ScrollView>
        {showFooter || showDetails ? (
          <View style={styles.footer}>
            {showDetails ? (
              <Pressable accessibilityRole="button" onPress={() => setPolicyOpen(true)} style={styles.footerBtn}>
                <Text style={{ color: theme.tokens.color.accent }}>{t('onboarding.questionnaire.seeDetails')}</Text>
              </Pressable>
            ) : (
              <View style={styles.footerBtn} />
            )}
            {showBack ? (
              <Pressable accessibilityRole="button" onPress={onBack} style={styles.footerBtn}>
                <Text style={{ color: theme.tokens.color.accent }}>{t('onboarding.questionnaire.back')}</Text>
              </Pressable>
            ) : (
              <View style={styles.footerBtn} />
            )}
            {showFooter ? (
              <Pressable
                accessibilityRole="button"
                onPress={onPrimary}
                style={[styles.primary, { backgroundColor: theme.tokens.color.accent }]}
              >
                <Text style={styles.primaryText}>{primaryLabel}</Text>
              </Pressable>
            ) : (
              <View style={styles.footerBtn} />
            )}
          </View>
        ) : null}
        <PolicyDocumentsModal
          visible={policyOpen}
          regionId={selectedRegion || localPrefs.privacyRegion || 'other'}
          onClose={() => setPolicyOpen(false)}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  stepMeta: { fontSize: 13, marginTop: 4, marginBottom: 12, textAlign: 'center' },
  body: { paddingBottom: 24, flexGrow: 1 },
  lead: { fontSize: 16, lineHeight: 24, textAlign: 'center', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  settingsHint: { fontSize: 13, textAlign: 'center', marginTop: 12 },
  choices: { gap: 10 },
  choice: {
    borderWidth: 2,
    borderRadius: 14,
    padding: 14,
    minHeight: 48,
  },
  choiceLabel: { fontSize: 16, fontWeight: '600' },
  choiceHint: { fontSize: 13, marginTop: 4 },
  regionRow: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    marginBottom: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  regionRowSelected: { borderColor: '#0d9488', backgroundColor: 'rgba(13,148,136,0.12)' },
  linkBtn: { paddingVertical: 12, minHeight: 44, justifyContent: 'center' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 8 },
  footerBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4, flex: 1 },
  primary: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, minHeight: 44, justifyContent: 'center', flex: 1.2 },
  primaryText: { color: '#fff', fontWeight: '600', fontSize: 16, textAlign: 'center' },
});
