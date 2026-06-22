import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FIRST_RUN_STEP_META,
  applyRegionDefaultLocale,
  buildFirstRunPlan,
  completeFirstRunWizard,
  getTutorialVisibleIndices,
  normalizeTrackingProfile,
  resolveUnifiedOnboardingProgress,
  TRACKING_PROFILE_FIELD_KEYS,
} from '@rianell/shared';
import { getPolicyPack, getRegionLabels, suggestRegionForDevice } from '../privacy/helpers';
import { PolicyDocumentsModal } from '../privacy/PolicyDocumentsModal';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/I18nProvider';
import type { Preferences, TrackingProfile } from '../storage/preferences';
import { upsertPrivacyProfile } from '../cloud/privacyProfile';

const SLIDE_BODIES: Partial<Record<number, string>> = {
  0: 'tutorial.slide0.body',
  1: 'tutorial.slide1.body',
  8: 'tutorial.slide8.body',
  2: 'tutorial.slide2.body',
  3: 'tutorial.slide3.body',
  4: 'tutorial.slide4.body',
  5: 'tutorial.slide5.body',
  6: 'tutorial.slide6.body',
  7: 'tutorial.slide7.body',
};

function visibleSlideIndices(aiEnabled: boolean): number[] {
  return getTutorialVisibleIndices(aiEnabled);
}

const TUTORIAL_SLIDE_TITLE_KEYS: Partial<Record<number, string>> = {
  0: 'tutorial.slide.enableAi',
  1: 'tutorial.slide1.title',
  8: 'tutorial.slide8.title',
  2: 'tutorial.slide2.title',
  3: 'tutorial.slide3.title',
  4: 'tutorial.slide4.title',
  5: 'tutorial.slide5.title',
  6: 'tutorial.slide6.title',
  7: 'tutorial.slide7.title',
};

export function FirstRunWizard({
  prefs,
  onComplete,
}: {
  prefs: Preferences;
  onComplete: (next: Preferences) => void;
}) {
  const theme = useTheme();
  const { t } = useT();
  const pack = getPolicyPack();
  const regionLabels = useMemo(() => getRegionLabels(pack), [pack]);
  const suggestedRegion = useMemo(() => suggestRegionForDevice() || 'eea_uk', []);

  const platformCtx = useMemo(
    () => ({
      platform: 'rn' as const,
      cookieConsentAccepted: prefs.cookieConsent === true,
      installModalSeen: true,
      standalonePwa: false,
      tutorialSeenLegacy: prefs.tutorialSeen,
    }),
    [prefs.cookieConsent, prefs.tutorialSeen],
  );

  const [localPrefs, setLocalPrefs] = useState(prefs);
  const plan = useMemo(() => buildFirstRunPlan(localPrefs, platformCtx), [localPrefs, platformCtx]);
  const [stepIndex, setStepIndex] = useState(0);
  const step = plan[Math.min(stepIndex, plan.length - 1)];

  const [selectedRegion, setSelectedRegion] = useState(suggestedRegion);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [condition, setCondition] = useState(prefs.medicalCondition || '');
  const [fields, setFields] = useState(() => ({ ...normalizeTrackingProfile(prefs.trackingProfile).fields }));
  const [tutorialPos, setTutorialPos] = useState(0);
  const [aiEnabledLocal, setAiEnabledLocal] = useState(localPrefs.aiEnabled !== false);
  const [sessionRecordingLocal, setSessionRecordingLocal] = useState(localPrefs.sessionRecording !== false);

  const tutorialSlides = useMemo(() => visibleSlideIndices(aiEnabledLocal), [aiEnabledLocal]);
  const tutorialSlideIndex = tutorialSlides[Math.min(tutorialPos, tutorialSlides.length - 1)] ?? 0;
  const tutorialIsLast = tutorialPos >= tutorialSlides.length - 1;

  const unifiedProgress = useMemo(() => {
    if (!step) return { current: 1, total: 1 };
    return resolveUnifiedOnboardingProgress({
      prefs: localPrefs as Record<string, unknown>,
      ctx: platformCtx,
      wizardStepId: step.id,
      tutorialPos: step.id === 'tutorial' ? tutorialPos : undefined,
      tutorialSlideIndices: tutorialSlides,
    });
  }, [localPrefs, platformCtx, step, tutorialPos, tutorialSlides]);

  const patchPrefs = useCallback((patch: Partial<Preferences>) => {
    setLocalPrefs((cur) => ({ ...cur, ...patch }));
  }, []);

  const finishWizard = useCallback(() => {
    const done = completeFirstRunWizard({ ...localPrefs, tutorialSeen: true }) as Preferences;
    onComplete(done);
  }, [localPrefs, onComplete]);

  const goNext = useCallback(() => {
    if (stepIndex >= plan.length - 1) {
      finishWizard();
      return;
    }
    setStepIndex((i) => i + 1);
  }, [stepIndex, plan.length, finishWizard]);

  const goBack = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const confirmRegion = useCallback(() => {
    const now = new Date().toISOString();
    const base = applyRegionDefaultLocale(
      {
        ...localPrefs,
        privacyRegion: selectedRegion,
        privacyRegionSource: 'onboarding',
        privacyRegionUpdatedAt: now,
        policyAcknowledgedVersion: pack.policyPackId || 'v1.0.0',
        policyAcknowledgedAt: now,
        uiLocaleSource: 'onboarding',
      },
      selectedRegion,
      pack,
    ) as Preferences;
    setLocalPrefs(base);
    void upsertPrivacyProfile(base);
    setStepIndex((i) => i + 1);
  }, [localPrefs, selectedRegion, pack]);

  const acceptHealthConsent = useCallback(() => {
    const now = new Date().toISOString();
    const next = { ...localPrefs, healthDataConsent: true, healthDataConsentAt: now };
    setLocalPrefs(next);
    void upsertPrivacyProfile(next);
    goNext();
  }, [localPrefs, goNext]);

  const acceptCookies = useCallback(() => {
    const now = new Date().toISOString();
    patchPrefs({ cookieConsent: true, cookieConsentAt: now });
    goNext();
  }, [patchPrefs, goNext]);

  const confirmSessionRecording = useCallback(() => {
    const now = new Date().toISOString();
    const enabled = sessionRecordingLocal;
    patchPrefs({
      sessionRecording: enabled,
      sessionRecordingAt: enabled ? now : null,
      sessionRecordingDisclosureAt: now,
    });
    goNext();
  }, [sessionRecordingLocal, patchPrefs, goNext]);

  const saveTrackingProfile = useCallback(() => {
    const profile = normalizeTrackingProfile({
      condition: condition.trim(),
      fields,
      configuredAt: new Date().toISOString(),
    }) as TrackingProfile;
    patchPrefs({ trackingProfile: profile, medicalCondition: condition.trim() || localPrefs.medicalCondition });
    goNext();
  }, [condition, fields, localPrefs.medicalCondition, patchPrefs, goNext]);

  const handleAiDownload = useCallback(
    (grant: boolean) => {
      const now = new Date().toISOString();
      patchPrefs({
        aiModelDownloadConsent: grant ? 'granted' : 'deferred',
        aiModelDownloadConsentAt: grant ? now : localPrefs.aiModelDownloadConsentAt,
      });
      goNext();
    },
    [patchPrefs, goNext, localPrefs.aiModelDownloadConsentAt],
  );

  const stepTitle = (() => {
    if (!step) return t('onboarding.title');
    if (step.id === 'tutorial') {
      const key = TUTORIAL_SLIDE_TITLE_KEYS[tutorialSlideIndex];
      return key ? t(key) : t('onboarding.step.tutorial');
    }
    return FIRST_RUN_STEP_META[step.id as keyof typeof FIRST_RUN_STEP_META]
      ? t(FIRST_RUN_STEP_META[step.id as keyof typeof FIRST_RUN_STEP_META].titleKey)
      : t('onboarding.title');
  })();

  const renderStepBody = () => {
    if (!step) return null;
    switch (step.id) {
      case 'region':
        return (
          <>
            <Text style={[styles.lead, { color: theme.tokens.color.textSecondary }]}>{t('gate.lead')}</Text>
            <Text style={styles.hint}>{t('gate.hint')}</Text>
            <Text style={[styles.label, { color: theme.tokens.color.textPrimary }]}>{t('gate.regionLabel')}</Text>
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
      case 'healthConsent':
        return (
          <>
            <Text style={[styles.lead, { color: theme.tokens.color.textSecondary }]}>{t('common.consent.healthDataBody')}</Text>
            <Text style={[styles.lead, { color: theme.tokens.color.textSecondary, marginTop: 12 }]}>
              {t('common.consent.healthDataContact')}
            </Text>
          </>
        );
      case 'cookies':
        return (
          <Text style={[styles.lead, { color: theme.tokens.color.textSecondary }]}>{t('common.cookie.bannerText')}</Text>
        );
      case 'sessionRecording':
        return (
          <>
            <Text style={[styles.lead, { color: theme.tokens.color.textSecondary }]}>
              {t('onboarding.sessionRecording.body')}
            </Text>
            <View style={styles.toggleRow}>
              <Text style={{ color: theme.tokens.color.textSecondary, flex: 1 }}>
                {t('onboarding.sessionRecording.toggleLabel')}
              </Text>
              <Switch value={sessionRecordingLocal} onValueChange={setSessionRecordingLocal} />
            </View>
            <Text style={[styles.hint, { color: theme.tokens.color.textMuted, marginTop: 8 }]}>
              {t('settings.privacy.sessionRecording.hint')}
            </Text>
          </>
        );
      case 'trackingProfile':
        return (
          <>
            <Text style={[styles.lead, { color: theme.tokens.color.textSecondary }]}>{t('settings.trackingProfile.lead')}</Text>
            <Text style={[styles.lead, { color: theme.tokens.color.textSecondary, marginTop: 12 }]}>
              {t('progressiveDisclosure.lead')}
            </Text>
            <Text style={[styles.label, { color: theme.tokens.color.textPrimary, marginTop: 16 }]}>
              {t('common.medical.condition')}
            </Text>
            <TextInput
              value={condition}
              onChangeText={setCondition}
              placeholder={t('common.enter.your.condition')}
              placeholderTextColor={theme.tokens.color.textMuted}
              style={[styles.input, { color: theme.tokens.color.textPrimary, borderColor: theme.tokens.color.border }]}
            />
            <Text style={[styles.label, { color: theme.tokens.color.textPrimary, marginTop: 16 }]}>
              {t('settings.trackingProfile.fieldsLabel')}
            </Text>
            {TRACKING_PROFILE_FIELD_KEYS.map((key) => {
              const fieldKey = key as keyof typeof fields;
              return (
                <View key={key} style={styles.toggleRow}>
                  <Text style={{ color: theme.tokens.color.textSecondary, flex: 1 }}>
                    {t(`settings.trackingProfile.field.${key}`)}
                  </Text>
                  <Switch
                    value={fields[fieldKey]}
                    onValueChange={(v) => setFields((f) => ({ ...f, [fieldKey]: v }))}
                  />
                </View>
              );
            })}
          </>
        );
      case 'tutorial':
        return (
          <>
            <Text style={[styles.lead, { color: theme.tokens.color.textSecondary }]}>
              {t(SLIDE_BODIES[tutorialSlideIndex] || 'tutorial.slide1.body')}
            </Text>
            {tutorialSlideIndex === 0 ? (
              <View style={styles.row}>
                <Pressable
                  accessibilityRole="button"
                  style={[styles.outlineBtn, { borderColor: theme.tokens.color.accent }]}
                  onPress={() => {
                    setAiEnabledLocal(true);
                    patchPrefs({ aiEnabled: true });
                    setTutorialPos(1);
                  }}
                >
                  <Text style={{ color: theme.tokens.color.accent }}>{t('common.enable')}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  style={[styles.outlineBtn, { borderColor: theme.tokens.color.border }]}
                  onPress={() => {
                    setAiEnabledLocal(false);
                    patchPrefs({ aiEnabled: false });
                    setTutorialPos(1);
                  }}
                >
                  <Text style={{ color: theme.tokens.color.textSecondary }}>{t('common.skip.for.now')}</Text>
                </Pressable>
              </View>
            ) : null}
            {tutorialSlideIndex === 8 ? (
              <>
                <View style={[styles.toggleRow, { marginTop: 12 }]}>
                  <Text style={{ color: theme.tokens.color.textSecondary, flex: 1 }}>
                    {t('tutorial.slide8.toggleLabel')}
                  </Text>
                  <Switch
                    value={localPrefs.cycleModuleEnabled === true}
                    onValueChange={(v) => patchPrefs({ cycleModuleEnabled: v })}
                  />
                </View>
                <Text style={[styles.hint, { color: theme.tokens.color.textMuted, marginTop: 8 }]}>
                  {t('tutorial.slide8.hint')}
                </Text>
              </>
            ) : null}
          </>
        );
      case 'aiDownload':
        return (
          <>
            <Text style={[styles.lead, { color: theme.tokens.color.textSecondary }]}>{t('onboarding.aiDownload.body')}</Text>
            <Text style={[styles.hint, { color: theme.tokens.color.textMuted }]}>{t('onboarding.aiDownload.hint')}</Text>
          </>
        );
      default:
        return null;
    }
  };

  const onPrimary = () => {
    if (!step) return;
    switch (step.id) {
      case 'region':
        confirmRegion();
        break;
      case 'healthConsent':
        acceptHealthConsent();
        break;
      case 'cookies':
        acceptCookies();
        break;
      case 'sessionRecording':
        confirmSessionRecording();
        break;
      case 'trackingProfile':
        saveTrackingProfile();
        break;
      case 'tutorial':
        if (tutorialIsLast) goNext();
        else setTutorialPos((p) => Math.min(tutorialSlides.length - 1, p + 1));
        break;
      case 'aiDownload':
        handleAiDownload(true);
        break;
      default:
        goNext();
    }
  };

  const onSecondary = () => {
    if (!step) return;
    if (step.id === 'aiDownload') {
      handleAiDownload(false);
      return;
    }
    if (step.id === 'tutorial' && tutorialPos > 0) {
      setTutorialPos((p) => Math.max(0, p - 1));
      return;
    }
    goBack();
  };

  const primaryLabel = (() => {
    if (!step) return t('common.continue');
    if (step.id === 'region') return t('gate.confirm');
    if (step.id === 'healthConsent') return t('common.i.agree.continue');
    if (step.id === 'cookies') return t('common.accept');
    if (step.id === 'trackingProfile') return t('settings.trackingProfile.save');
    if (step.id === 'tutorial') return tutorialIsLast ? t('tutorial.done') : t('tutorial.next');
    if (step.id === 'aiDownload') return t('common.download.now');
    return t('common.continue');
  })();

  const showSecondary = Boolean(
    step &&
      (step.id === 'aiDownload' ||
        step.id === 'healthConsent' ||
        step.id === 'cookies' ||
        step.id === 'trackingProfile' ||
        (step.id === 'tutorial' && tutorialPos > 0)),
  );

  const secondaryLabel = step?.id === 'aiDownload' ? t('common.not.now') : t('common.back');

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={[styles.root, { backgroundColor: theme.tokens.color.background }]}>
        <Text style={[styles.title, { color: theme.tokens.color.textPrimary }]}>{stepTitle}</Text>
        <Text style={[styles.stepMeta, { color: theme.tokens.color.textMuted }]}>
          {t('onboarding.stepCounter', {
            current: unifiedProgress.current,
            total: unifiedProgress.total,
          })}
        </Text>
        <ScrollView contentContainerStyle={styles.body}>{renderStepBody()}</ScrollView>
        <View style={styles.footer}>
          {showSecondary ? (
            <Pressable accessibilityRole="button" onPress={onSecondary} style={styles.footerBtn}>
              <Text style={{ color: theme.tokens.color.accent }}>{secondaryLabel}</Text>
            </Pressable>
          ) : (
            <View style={styles.footerBtn} />
          )}
          <Pressable
            accessibilityRole="button"
            onPress={onPrimary}
            style={[styles.primary, { backgroundColor: theme.tokens.color.accent }]}
          >
            <Text style={styles.primaryText}>{primaryLabel}</Text>
          </Pressable>
        </View>
        <PolicyDocumentsModal visible={policyOpen} regionId={selectedRegion} onClose={() => setPolicyOpen(false)} />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: '700' },
  stepMeta: { fontSize: 13, marginTop: 4, marginBottom: 12 },
  body: { paddingBottom: 24, flexGrow: 1 },
  lead: { fontSize: 15, lineHeight: 22 },
  hint: { fontSize: 13, color: '#0284c7', marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
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
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, minHeight: 44 },
  row: { flexDirection: 'row', gap: 12, marginTop: 20, flexWrap: 'wrap' },
  outlineBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 8 },
  footerBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4, flex: 1 },
  primary: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20, minHeight: 44, justifyContent: 'center' },
  primaryText: { color: '#fff', fontWeight: '600', fontSize: 16, textAlign: 'center' },
});
