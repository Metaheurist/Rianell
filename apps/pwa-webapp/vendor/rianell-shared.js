var RianellShared = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/shared/src/index.mjs
  var index_exports = {};
  __export(index_exports, {
    ACHIEVEMENTS_STORAGE_KEY: () => ACHIEVEMENTS_STORAGE_KEY,
    ALLOWED_LLM_MODEL_HOSTS: () => ALLOWED_LLM_MODEL_HOSTS,
    ALL_ACHIEVEMENTS: () => ALL_ACHIEVEMENTS,
    ANON_POOL_EXCLUDED_FIELDS: () => ANON_POOL_EXCLUDED_FIELDS,
    ANON_POOL_INCLUDED_FIELDS: () => ANON_POOL_INCLUDED_FIELDS,
    APPOINTMENT_COUNTDOWN_DAYS: () => APPOINTMENT_COUNTDOWN_DAYS,
    APPOINTMENT_DISCLAIMER: () => APPOINTMENT_DISCLAIMER,
    APPOINTMENT_RANGE_DAYS: () => APPOINTMENT_RANGE_DAYS,
    BLOCKED_COMMERCIAL_LLM_HOST_PATTERNS: () => BLOCKED_COMMERCIAL_LLM_HOST_PATTERNS,
    CAREGIVER_RELATIONSHIPS: () => CAREGIVER_RELATIONSHIPS,
    COHORT_MIN_K: () => COHORT_MIN_K,
    COMMON_SUPPLEMENTS: () => COMMON_SUPPLEMENTS,
    COMMUNITY_TIP_CATEGORIES: () => COMMUNITY_TIP_CATEGORIES,
    CONNECTOR_PROVIDERS: () => CONNECTOR_PROVIDERS,
    CONNECTOR_PROVIDER_SPECS: () => CONNECTOR_PROVIDER_SPECS,
    CONTRIBUTION_EXPORT_FORMAT: () => CONTRIBUTION_EXPORT_FORMAT,
    CYCLE_DAY_MAX: () => CYCLE_DAY_MAX,
    CYCLE_DAY_MIN: () => CYCLE_DAY_MIN,
    CYCLE_DAY_NORMAL_MAX: () => CYCLE_DAY_NORMAL_MAX,
    CYCLE_DAY_SELECTOR_MAX: () => CYCLE_DAY_SELECTOR_MAX,
    CYCLE_DAY_TYPICAL_MAX: () => CYCLE_DAY_TYPICAL_MAX,
    CYCLE_FLOW_LEVELS: () => CYCLE_FLOW_LEVELS,
    CYCLE_PHASES: () => CYCLE_PHASES,
    CYCLE_PHASE_RANGES: () => CYCLE_PHASE_RANGES,
    DEFAULT_API_SCOPES: () => DEFAULT_API_SCOPES,
    DEFAULT_GOALS: () => DEFAULT_GOALS,
    DEFAULT_LOCALE: () => DEFAULT_LOCALE,
    DEFAULT_PRIVACY_REGION: () => DEFAULT_PRIVACY_REGION,
    DEFAULT_SHEET_COLUMN_MAP: () => DEFAULT_SHEET_COLUMN_MAP,
    ENCRYPTED_EXPORT_FORMAT: () => ENCRYPTED_EXPORT_FORMAT,
    ENCRYPTED_EXPORT_KDF_ITERATIONS: () => ENCRYPTED_EXPORT_KDF_ITERATIONS,
    ENCRYPTED_EXPORT_MIN_LENGTH: () => ENCRYPTED_EXPORT_MIN_LENGTH,
    ENGAGEMENT_ACHIEVEMENTS: () => ENGAGEMENT_ACHIEVEMENTS,
    FIRST_RUN_STEP_IDS: () => FIRST_RUN_STEP_IDS,
    FIRST_RUN_STEP_META: () => FIRST_RUN_STEP_META,
    FODMAP_CATEGORIES: () => FODMAP_CATEGORIES,
    GAD2_MAX_SCORE: () => GAD2_MAX_SCORE,
    GAD2_QUESTIONS: () => GAD2_QUESTIONS,
    GAD7_FOLLOWUP_QUESTIONS: () => GAD7_FOLLOWUP_QUESTIONS,
    GAD7_MAX_SCORE: () => GAD7_MAX_SCORE,
    GAD7_QUESTIONS: () => GAD7_QUESTIONS,
    GOALS_STORAGE_KEY: () => GOALS_STORAGE_KEY,
    GOLDEN_LLM_INTENTS: () => GOLDEN_LLM_INTENTS,
    GOLDEN_LLM_LOCALES: () => GOLDEN_LLM_LOCALES,
    GUIDED_CARD_META: () => GUIDED_CARD_META,
    GUIDED_QUESTIONNAIRE_CARD_IDS: () => GUIDED_QUESTIONNAIRE_CARD_IDS,
    HOME_CHECKIN_PERIODS: () => HOME_CHECKIN_PERIODS,
    HOME_SUGGESTIONS_MAX_CHIPS: () => HOME_SUGGESTIONS_MAX_CHIPS,
    HOME_SUGGESTIONS_MIN_DAYS: () => HOME_SUGGESTIONS_MIN_DAYS,
    HOME_SUGGESTIONS_RANGE_DAYS: () => HOME_SUGGESTIONS_RANGE_DAYS,
    LEGACY_BODY_REGION_TO_PAIN_LOCATION: () => LEGACY_BODY_REGION_TO_PAIN_LOCATION,
    LLM_COACH_PERSONAS: () => LLM_COACH_PERSONAS,
    LOCAL_ONLY_NETWORK_FEATURES: () => LOCAL_ONLY_NETWORK_FEATURES,
    LOGGING_ACHIEVEMENTS: () => LOGGING_ACHIEVEMENTS,
    LOGS_BACKUP_KEY: () => LOGS_BACKUP_KEY,
    LOGS_STORAGE_KEY_MOBILE_LEGACY: () => LOGS_STORAGE_KEY_MOBILE_LEGACY,
    LOGS_STORAGE_KEY_V1: () => LOGS_STORAGE_KEY_V1,
    LOG_CSV_ENGLISH_HEADERS: () => LOG_CSV_ENGLISH_HEADERS,
    LOG_CSV_FIELD_IDS: () => LOG_CSV_FIELD_IDS,
    LOG_CSV_I18N_KEYS: () => LOG_CSV_I18N_KEYS,
    LOG_CSV_LEGACY_HEADER_ALIASES: () => LOG_CSV_LEGACY_HEADER_ALIASES,
    LOINC_MAP: () => LOINC_MAP,
    LOINC_TO_FIELD: () => LOINC_TO_FIELD,
    MAX_HOME_QUESTION_ANSWERS_PER_DAY: () => MAX_HOME_QUESTION_ANSWERS_PER_DAY,
    MAX_WEEK_CHAT_TURNS: () => MAX_WEEK_CHAT_TURNS,
    MEAL_PHOTO_ACCEPT: () => MEAL_PHOTO_ACCEPT,
    MEAL_PHOTO_BUCKET: () => MEAL_PHOTO_BUCKET,
    MEAL_PHOTO_CATEGORY: () => MEAL_PHOTO_CATEGORY,
    MEDICAL_CONDITION_POOL_SALT: () => MEDICAL_CONDITION_POOL_SALT,
    MED_DOSE_FIRE_WINDOW_MS: () => MED_DOSE_FIRE_WINDOW_MS,
    MED_DOSE_SNOOZE_MINUTES: () => MED_DOSE_SNOOZE_MINUTES,
    MENTAL_HEALTH_DISCLAIMER_I18N: () => MENTAL_HEALTH_DISCLAIMER_I18N,
    METRICS_HIGHER_IS_BETTER: () => METRICS_HIGHER_IS_BETTER,
    METRIC_SLIDER_FIELDS: () => METRIC_SLIDER_FIELDS,
    MIGRATION_ADAPTERS: () => MIGRATION_ADAPTERS,
    MIGRATION_COPY: () => MIGRATION_COPY,
    MIGRATION_SOURCES: () => MIGRATION_SOURCES,
    MILESTONE_ACHIEVEMENTS: () => MILESTONE_ACHIEVEMENTS,
    MIN_TOUCH_TARGET_PX: () => MIN_TOUCH_TARGET_PX,
    MOOD_CHECKIN_PERIODS: () => MOOD_CHECKIN_PERIODS,
    OAUTH2_SCOPES: () => OAUTH2_SCOPES,
    OAUTH_CONNECTOR_IDS: () => OAUTH_CONNECTOR_IDS,
    OFFLINE_QUEUE_KEY: () => OFFLINE_QUEUE_KEY,
    ON_DEVICE_MOAT_BULLET_KEYS: () => ON_DEVICE_MOAT_BULLET_KEYS,
    PAIN_REGIONS: () => PAIN_REGIONS,
    PBKDF2_ITERATIONS: () => PBKDF2_ITERATIONS,
    PHQ2_MAX_SCORE: () => PHQ2_MAX_SCORE,
    PHQ2_QUESTIONS: () => PHQ2_QUESTIONS,
    PHQ9_FOLLOWUP_QUESTIONS: () => PHQ9_FOLLOWUP_QUESTIONS,
    PHQ9_ITEM9_ID: () => PHQ9_ITEM9_ID,
    PHQ9_MAX_SCORE: () => PHQ9_MAX_SCORE,
    PHQ9_QUESTIONS: () => PHQ9_QUESTIONS,
    POLICY_BODIES: () => POLICY_BODIES,
    POLICY_SUMMARIES: () => POLICY_SUMMARIES,
    POOL_CONTRIBUTION_MIN_DAYS: () => POOL_CONTRIBUTION_MIN_DAYS,
    POOL_INSIGHT_MIN_K: () => POOL_INSIGHT_MIN_K,
    PREDICTION_STATE_KEY: () => PREDICTION_STATE_KEY,
    PREFS_STORAGE_KEY_MOBILE: () => PREFS_STORAGE_KEY_MOBILE,
    PRIMARY_ACTION_MIN_HEIGHT_PX: () => PRIMARY_ACTION_MIN_HEIGHT_PX,
    PRIVACY_REGIONS: () => PRIVACY_REGIONS,
    PROCESSING_ACTIVITY_LOG_KEY: () => PROCESSING_ACTIVITY_LOG_KEY,
    PROCESSING_ACTIVITY_LOG_MAX: () => PROCESSING_ACTIVITY_LOG_MAX,
    PROFILE_AVATAR_IDS: () => PROFILE_AVATAR_IDS,
    PROGRESSIVE_CATEGORIES: () => PROGRESSIVE_CATEGORIES,
    PROGRESSIVE_DISCLOSURE_MILESTONES: () => PROGRESSIVE_DISCLOSURE_MILESTONES,
    QR_HANDOFF_DEFAULT_TTL_MINUTES: () => QR_HANDOFF_DEFAULT_TTL_MINUTES,
    QR_HANDOFF_FORMAT: () => QR_HANDOFF_FORMAT,
    QR_HANDOFF_MAX_CHARS: () => QR_HANDOFF_MAX_CHARS,
    RE_ENGAGEMENT_IDLE_DAYS: () => RE_ENGAGEMENT_IDLE_DAYS,
    SCORE_LABELS: () => SCORE_LABELS,
    SCREENING_RESPONSE_OPTIONS: () => SCREENING_RESPONSE_OPTIONS,
    SENSITIVE_STORAGE_KEYS: () => SENSITIVE_STORAGE_KEYS,
    SETTINGS_PROFILE_EXPORT_VERSION: () => SETTINGS_PROFILE_EXPORT_VERSION,
    SETTINGS_STORAGE_KEY: () => SETTINGS_STORAGE_KEY,
    SHARE_LINK_FORMAT: () => SHARE_LINK_FORMAT,
    SHARE_LINK_KDF_ITERATIONS: () => SHARE_LINK_KDF_ITERATIONS,
    SHIPPED_LOCALES: () => SHIPPED_LOCALES,
    SMARTLOOK_PROJECT_KEY: () => SMARTLOOK_PROJECT_KEY,
    SMARTLOOK_REGION: () => SMARTLOOK_REGION,
    SMARTLOOK_SDK_URL: () => SMARTLOOK_SDK_URL,
    SMART_REMINDER_GRACE_MINUTES: () => SMART_REMINDER_GRACE_MINUTES,
    SMART_REMINDER_MIN_SAMPLES: () => SMART_REMINDER_MIN_SAMPLES,
    SMART_REMINDER_WINDOW_DAYS: () => SMART_REMINDER_WINDOW_DAYS,
    STREAK_REMINDER_MIN_STREAK: () => STREAK_REMINDER_MIN_STREAK,
    TRACKING_PROFILE_FIELD_KEYS: () => TRACKING_PROFILE_FIELD_KEYS,
    TUTORIAL_SLIDE_ORDER_AI_OFF: () => TUTORIAL_SLIDE_ORDER_AI_OFF,
    TUTORIAL_SLIDE_ORDER_AI_ON: () => TUTORIAL_SLIDE_ORDER_AI_ON,
    UNLOCK_DAYS: () => UNLOCK_DAYS,
    UNSET_PRIVACY_REGION: () => UNSET_PRIVACY_REGION,
    USER_VIBE_IDS: () => USER_VIBE_IDS,
    VITAL_SUGGESTION_FIELD_IDS: () => VITAL_SUGGESTION_FIELD_IDS,
    VITAL_SUGGESTION_LOOKBACK_DAYS: () => VITAL_SUGGESTION_LOOKBACK_DAYS,
    WCAG_BODY_TEXT_MIN_CONTRAST: () => WCAG_BODY_TEXT_MIN_CONTRAST,
    WCAG_LARGE_TEXT_MIN_CONTRAST: () => WCAG_LARGE_TEXT_MIN_CONTRAST,
    WCAG_UI_COMPONENT_MIN_CONTRAST: () => WCAG_UI_COMPONENT_MIN_CONTRAST,
    WEATHER_CACHE_MS: () => WEATHER_CACHE_MS,
    WEBHOOK_EVENTS: () => WEBHOOK_EVENTS,
    WEEKLY_REVIEW_MIN_LOG_DAYS: () => WEEKLY_REVIEW_MIN_LOG_DAYS,
    WEEKLY_REVIEW_STEPS: () => WEEKLY_REVIEW_STEPS,
    addLogFavorite: () => addLogFavorite,
    addMinutesToHHMM: () => addMinutesToHHMM,
    aggregateDailyMacros: () => aggregateDailyMacros,
    analysisSnapshotFromSummary: () => analysisSnapshotFromSummary,
    apiKeyDisplayPrefix: () => apiKeyDisplayPrefix,
    appendProcessingActivity: () => appendProcessingActivity,
    applyLocaleDefaultsToPrefs: () => applyLocaleDefaultsToPrefs,
    applyMicroCheckin: () => applyMicroCheckin,
    applyMigrationPendingFlag: () => applyMigrationPendingFlag,
    applyPrivacyProfileToLocal: () => applyPrivacyProfileToLocal,
    applyQuestionnaireAnswer: () => applyQuestionnaireAnswer,
    applyRegionDefaultLocale: () => applyRegionDefaultLocale,
    applyRegionDowngradeToggles: () => applyRegionDowngradeToggles,
    appointmentCountdownLabelKey: () => appointmentCountdownLabelKey,
    auditGoldenPrompt: () => auditGoldenPrompt,
    barcodeProductToFoodItem: () => barcodeProductToFoodItem,
    base64ToSalt: () => base64ToSalt,
    base64ToWrappedDek: () => base64ToWrappedDek,
    buildAchievementUnlockNotificationContent: () => buildAchievementUnlockNotificationContent,
    buildAirQualityUrl: () => buildAirQualityUrl,
    buildAnonymizedInsertRow: () => buildAnonymizedInsertRow,
    buildAnonymizedLogPayload: () => buildAnonymizedLogPayload,
    buildAppointmentChartRows: () => buildAppointmentChartRows,
    buildAppointmentReportHtml: () => buildAppointmentReportHtml,
    buildAppointmentReportModel: () => buildAppointmentReportModel,
    buildAuthorizeUrl: () => buildAuthorizeUrl,
    buildClinicianBriefContext: () => buildClinicianBriefContext,
    buildClinicianBriefFallback: () => buildClinicianBriefFallback,
    buildClinicianBriefPrompt: () => buildClinicianBriefPrompt,
    buildCohortBenchmarkCard: () => buildCohortBenchmarkCard,
    buildConsentAuditPayload: () => buildConsentAuditPayload,
    buildConsentDashboardEntries: () => buildConsentDashboardEntries,
    buildDoctorQuestionsContext: () => buildDoctorQuestionsContext,
    buildDoctorQuestionsFallback: () => buildDoctorQuestionsFallback,
    buildDoctorQuestionsPrompt: () => buildDoctorQuestionsPrompt,
    buildEncryptedBackupBlob: () => buildEncryptedBackupBlob,
    buildExplainChartContext: () => buildExplainChartContext,
    buildExplainChartFallback: () => buildExplainChartFallback,
    buildExplainChartPrompt: () => buildExplainChartPrompt,
    buildFhirObservation: () => buildFhirObservation,
    buildFirstRunPlan: () => buildFirstRunPlan,
    buildFlareRiskNotificationContent: () => buildFlareRiskNotificationContent,
    buildFocusScrollMargin: () => buildFocusScrollMargin,
    buildGuidedOnboardingProgressSteps: () => buildGuidedOnboardingProgressSteps,
    buildGuidedQuestionnaire: () => buildGuidedQuestionnaire,
    buildHomeQuestionContext: () => buildHomeQuestionContext,
    buildHomeQuestionFallback: () => buildHomeQuestionFallback,
    buildHomeQuestionPrompt: () => buildHomeQuestionPrompt,
    buildInductionProgressSteps: () => buildInductionProgressSteps,
    buildLlmRequestPayload: () => buildLlmRequestPayload,
    buildMealPhotoMetadata: () => buildMealPhotoMetadata,
    buildMedDoseNotificationContent: () => buildMedDoseNotificationContent,
    buildMedicationTimeline: () => buildMedicationTimeline,
    buildMotdPrompt: () => buildMotdPrompt,
    buildNotificationContent: () => buildNotificationContent,
    buildProxyLogMetadata: () => buildProxyLogMetadata,
    buildQrHandoffLogsSubset: () => buildQrHandoffLogsSubset,
    buildReEngagementNotificationContent: () => buildReEngagementNotificationContent,
    buildResearchFacetsFromLog: () => buildResearchFacetsFromLog,
    buildSettingsProfileExport: () => buildSettingsProfileExport,
    buildShareSnapshot: () => buildShareSnapshot,
    buildSleepFlareInsight: () => buildSleepFlareInsight,
    buildStreakReminderNotificationContent: () => buildStreakReminderNotificationContent,
    buildStructuredSummaryPrompt: () => buildStructuredSummaryPrompt,
    buildSuggestPrompt: () => buildSuggestPrompt,
    buildSummaryPrompt: () => buildSummaryPrompt,
    buildTimelineSvg: () => buildTimelineSvg,
    buildTodayMedDoseStatuses: () => buildTodayMedDoseStatuses,
    buildUnifiedOnboardingSteps: () => buildUnifiedOnboardingSteps,
    buildUserCohortsFromFacets: () => buildUserCohortsFromFacets,
    buildVitalSuggestions: () => buildVitalSuggestions,
    buildWeatherDisplayMetrics: () => buildWeatherDisplayMetrics,
    buildWeatherForecastUrl: () => buildWeatherForecastUrl,
    buildWebhookInvokePayload: () => buildWebhookInvokePayload,
    buildWeekChatContext: () => buildWeekChatContext,
    buildWeekChatFallback: () => buildWeekChatFallback,
    buildWeekChatPrompt: () => buildWeekChatPrompt,
    buildWeekChatUserPayload: () => buildWeekChatUserPayload,
    calculateMacrosForServing: () => calculateMacrosForServing,
    canAnswerHomeQuestionToday: () => canAnswerHomeQuestionToday,
    canChooseDataResidency: () => canChooseDataResidency,
    canExportContributionHistory: () => canExportContributionHistory,
    canOfferWebPush: () => canOfferWebPush,
    canOfferWeeklyReview: () => canOfferWeeklyReview,
    canSendWeekChatTurn: () => canSendWeekChatTurn,
    canViewPoolInsights: () => canViewPoolInsights,
    checkPasswordStrength: () => checkPasswordStrength,
    checkPolicyDrift: () => checkPolicyDrift,
    checkPolicyDriftSync: () => checkPolicyDriftSync,
    classifyWellnessSlider: () => classifyWellnessSlider,
    clearMigrationPending: () => clearMigrationPending,
    coachPersonaPromptKey: () => coachPersonaPromptKey,
    collectFlareCalendarEntries: () => collectFlareCalendarEntries,
    collectMedicationList: () => collectMedicationList,
    collectMoodReadings: () => collectMoodReadings,
    completeFirstRunWizard: () => completeFirstRunWizard,
    completedCheckinPeriods: () => completedCheckinPeriods,
    computeAchievementSnapshots: () => computeAchievementSnapshots,
    computeBmiKg: () => computeBmiKg,
    computeCycleDayFromPeriodStart: () => computeCycleDayFromPeriodStart,
    computeFlareFreeDays: () => computeFlareFreeDays,
    computeGoodDayStreak: () => computeGoodDayStreak,
    computeHomeAnalysisSnapshot: () => computeHomeAnalysisSnapshot,
    computeHomeCardContext: () => computeHomeCardContext,
    computeHomeStreakSnapshot: () => computeHomeStreakSnapshot,
    computeMedianLogTimeMinutes: () => computeMedianLogTimeMinutes,
    computePersonalBests: () => computePersonalBests,
    computePoolInsightsFromFacets: () => computePoolInsightsFromFacets,
    configureSecureStorageBackend: () => configureSecureStorageBackend,
    contrastRatioPasses: () => contrastRatioPasses,
    countDistinctLogDays: () => countDistinctLogDays,
    countHighFodmapDays: () => countHighFodmapDays,
    createGuidedOnboardingProgressSession: () => createGuidedOnboardingProgressSession,
    createOAuthState: () => createOAuthState,
    createOnboardingProgressSession: () => createOnboardingProgressSession,
    createQrHandoffPayload: () => createQrHandoffPayload,
    createReadOnlyShareEnvelope: () => createReadOnlyShareEnvelope,
    createSampleLogEntry: () => createSampleLogEntry,
    createTranslator: () => createTranslator,
    customMetricFieldKey: () => customMetricFieldKey,
    customMetricIdFromField: () => customMetricIdFromField,
    cyclePhaseRangeForDay: () => cyclePhaseRangeForDay,
    daysBetweenIsoDates: () => daysBetweenIsoDates,
    daysSinceIso: () => daysSinceIso,
    daysSincePeriodStart: () => daysSincePeriodStart,
    daysSinceTrackingProfileStart: () => daysSinceTrackingProfileStart,
    daysUntilAppointment: () => daysUntilAppointment,
    decryptData: () => decryptData,
    decryptExportWithPassphrase: () => decryptExportWithPassphrase,
    decryptQrHandoffToken: () => decryptQrHandoffToken,
    defaultCycleDayForPhase: () => defaultCycleDayForPhase,
    deriveCodeChallenge: () => deriveCodeChallenge,
    deriveDateFormatFromLocale: () => deriveDateFormatFromLocale,
    deriveFirstDayOfWeekFromLocale: () => deriveFirstDayOfWeekFromLocale,
    deriveWeightUnitFromLocale: () => deriveWeightUnitFromLocale,
    deriveWrappingKey: () => deriveWrappingKey,
    detectHomeLoggingGaps: () => detectHomeLoggingGaps,
    detectImportConflicts: () => detectImportConflicts,
    detectNewlyUnlocked: () => detectNewlyUnlocked,
    encryptData: () => encryptData,
    encryptExportWithPassphrase: () => encryptExportWithPassphrase,
    enqueueAchievementToast: () => enqueueAchievementToast,
    evaluateFatigueWeekAnomaly: () => evaluateFatigueWeekAnomaly,
    existsSync: () => existsSync,
    extractMedDoseTakenMap: () => extractMedDoseTakenMap,
    fetchHomeWeatherSnapshot: () => fetchHomeWeatherSnapshot,
    fetchOpenFoodFactsProduct: () => fetchOpenFoodFactsProduct,
    fetchShareLink: () => fetchShareLink,
    fieldForLoinc: () => fieldForLoinc,
    filterLogsByDays: () => filterLogsByDays,
    filterLogsForAppointment: () => filterLogsForAppointment,
    filterLogsForHomeSuggestions: () => filterLogsForHomeSuggestions,
    findLatestCycleAnchor: () => findLatestCycleAnchor,
    findLatestPeriodStart: () => findLatestPeriodStart,
    findLatestVitalSuggestion: () => findLatestVitalSuggestion,
    findLogSyncConflicts: () => findLogSyncConflicts,
    flareToBit: () => flareToBit,
    formatActivityTypeLabel: () => formatActivityTypeLabel,
    formatBarcodeFoodLabel: () => formatBarcodeFoodLabel,
    formatCommunityTip: () => formatCommunityTip,
    formatContributionExport: () => formatContributionExport,
    formatDate: () => formatDate,
    formatIsoDate: () => formatIsoDate,
    formatNumber: () => formatNumber,
    formatRelativeDay: () => formatRelativeDay,
    formatStructuredLlmOutput: () => formatStructuredLlmOutput,
    formatVitalSuggestionDisplay: () => formatVitalSuggestionDisplay,
    formatWeekChatHistory: () => formatWeekChatHistory,
    generateCodeVerifier: () => generateCodeVerifier,
    generateDek: () => generateDek,
    generateRawApiKey: () => generateRawApiKey,
    generateSalt: () => generateSalt,
    generateShareCode: () => generateShareCode,
    getAchievementToastQueueLength: () => getAchievementToastQueueLength,
    getBrainFogFontScale: () => getBrainFogFontScale,
    getCommunityTriggers: () => getCommunityTriggers,
    getConnectorProvider: () => getConnectorProvider,
    getConsentBlockReason: () => getConsentBlockReason,
    getCrisisResourcesForRegion: () => getCrisisResourcesForRegion,
    getDefaultAccessibilitySettings: () => getDefaultAccessibilitySettings,
    getDefaultAppSettingsFields: () => getDefaultAppSettingsFields,
    getDefaultLocaleForRegion: () => getDefaultLocaleForRegion,
    getDefaultTrackingProfileFields: () => getDefaultTrackingProfileFields,
    getFeatureAvailability: () => getFeatureAvailability,
    getFodmapStatus: () => getFodmapStatus,
    getFodmapWarning: () => getFodmapWarning,
    getLlmCapability: () => getLlmCapability,
    getMotionDurationMs: () => getMotionDurationMs,
    getOnDeviceMoatBulletKeys: () => getOnDeviceMoatBulletKeys,
    getPolicyBodyParagraphs: () => getPolicyBodyParagraphs,
    getPolicyDocumentsForRegion: () => getPolicyDocumentsForRegion,
    getPolicyDocumentsForRegionI18n: () => getPolicyDocumentsForRegionI18n,
    getPolicyPack: () => getPolicyPack,
    getProgressiveDisclosureMilestones: () => getProgressiveDisclosureMilestones,
    getRegionLabels: () => getRegionLabels,
    getRequiredDaysForAchievement: () => getRequiredDaysForAchievement,
    getResidencyChooserOptions: () => getResidencyChooserOptions,
    getResidencyConfigFromEnv: () => getResidencyConfigFromEnv,
    getResidencyDisplayLabel: () => getResidencyDisplayLabel,
    getResidencyRegistry: () => getResidencyRegistry,
    getSupportedLocalesForRegion: () => getSupportedLocalesForRegion,
    getSymptomChipsForCondition: () => getSymptomChipsForCondition,
    getTutorialVisibleIndices: () => getTutorialVisibleIndices,
    getUnlockDaysForCategory: () => getUnlockDaysForCategory,
    getUnlockedLogCategories: () => getUnlockedLogCategories,
    getVisibleTrackingFields: () => getVisibleTrackingFields,
    hasActiveGoals: () => hasActiveGoals,
    hasEnabledMedSchedule: () => hasEnabledMedSchedule,
    hasLoggedToday: () => hasLoggedToday,
    hashApiKey: () => hashApiKey,
    hashMedicalConditionLabel: () => hashMedicalConditionLabel,
    identity: () => identity,
    inferTreatmentStartsFromLogs: () => inferTreatmentStartsFromLogs,
    interpretGad2Score: () => interpretGad2Score,
    interpretGad7Score: () => interpretGad7Score,
    interpretPhq2Score: () => interpretPhq2Score,
    interpretPhq9Score: () => interpretPhq9Score,
    invokeDeliverWebhook: () => invokeDeliverWebhook,
    isAchievementToastShowing: () => isAchievementToastShowing,
    isAllowedAppearanceMode: () => isAllowedAppearanceMode,
    isCloudSyncBlockedByMigration: () => isCloudSyncBlockedByMigration,
    isConfiguredVapidPublicKey: () => isConfiguredVapidPublicKey,
    isCustomMetricField: () => isCustomMetricField,
    isCycleDayLate: () => isCycleDayLate,
    isFirstRunWizardComplete: () => isFirstRunWizardComplete,
    isGoodDayLog: () => isGoodDayLog,
    isGuidedOnboardingAuthenticated: () => isGuidedOnboardingAuthenticated,
    isHealthLoggingUnlocked: () => isHealthLoggingUnlocked,
    isKnownAchievementId: () => isKnownAchievementId,
    isLlmInferenceAllowed: () => isLlmInferenceAllowed,
    isLocalOnlyModeEnabled: () => isLocalOnlyModeEnabled,
    isLogCategoryUnlocked: () => isLogCategoryUnlocked,
    isLoggingStreakBroken: () => isLoggingStreakBroken,
    isMealPhoto: () => isMealPhoto,
    isMedDoseSnoozed: () => isMedDoseSnoozed,
    isMetricHigherIsBetter: () => isMetricHigherIsBetter,
    isPhq9SuicideItemPositive: () => isPhq9SuicideItemPositive,
    isPrivacyRegionConfigured: () => isPrivacyRegionConfigured,
    isPwaOnDeviceLlmOnly: () => isPwaOnDeviceLlmOnly,
    isQrHandoffExpired: () => isQrHandoffExpired,
    isRtlLocale: () => isRtlLocale,
    isSundayReviewDay: () => isSundayReviewDay,
    isTrackingProfileConfigured: () => isTrackingProfileConfigured,
    isValidCycleFlow: () => isValidCycleFlow,
    isValidCyclePhase: () => isValidCyclePhase,
    isValidLocaleId: () => isValidLocaleId,
    isValidMedicalConditionForPool: () => isValidMedicalConditionForPool,
    isValidPrivacyRegion: () => isValidPrivacyRegion,
    isValidWebhookUrl: () => isValidWebhookUrl,
    isWeakPin: () => isWeakPin,
    isWeatherCacheFresh: () => isWeatherCacheFresh,
    isoWeekKey: () => isoWeekKey,
    isoWeekMondayKey: () => isoWeekMondayKey,
    kgToLbs: () => kgToLbs,
    languageNameForLocale: () => languageNameForLocale,
    lbsToKg: () => lbsToKg,
    listConnectorsForPlatform: () => listConnectorsForPlatform,
    listMigrationAdapters: () => listMigrationAdapters,
    listMigrationSources: () => listMigrationSources,
    listOAuthConnectors: () => listOAuthConnectors,
    listTodayMedDoseReminders: () => listTodayMedDoseReminders,
    loadPolicyPackFromDisk: () => loadPolicyPackFromDisk,
    loadPromptPack: () => loadPromptPack,
    localDateStrFromNow: () => localDateStrFromNow,
    localOnlyBlockReason: () => localOnlyBlockReason,
    localeFallbackChain: () => localeFallbackChain,
    localeLabel: () => localeLabel,
    logToFhirObservations: () => logToFhirObservations,
    logsToCsv: () => logsToCsv,
    logsToFhirBundle: () => logsToFhirBundle,
    loincForField: () => loincForField,
    lookupBarcode: () => lookupBarcode,
    macroPercentages: () => macroPercentages,
    mapLabResultsToLogFields: () => mapLabResultsToLogFields,
    mapStravaActivitiesToPartialLogs: () => mapStravaActivitiesToPartialLogs,
    mapWithingsActivityToPartialLogs: () => mapWithingsActivityToPartialLogs,
    mapWithingsMeasuresToPartialLogs: () => mapWithingsMeasuresToPartialLogs,
    markAchievementNotified: () => markAchievementNotified,
    markAchievementSeen: () => markAchievementSeen,
    markAchievementToastDismissed: () => markAchievementToastDismissed,
    medDoseReminderNotificationId: () => medDoseReminderNotificationId,
    medicalConditionForPoolStorage: () => medicalConditionForPoolStorage,
    mergeAchievementState: () => mergeAchievementState,
    mergeGad7Responses: () => mergeGad7Responses,
    mergeGuidedSessionCards: () => mergeGuidedSessionCards,
    mergeHealthLogs: () => mergeHealthLogs,
    mergeHealthLogsWithConflictPolicy: () => mergeHealthLogsWithConflictPolicy,
    mergeInductionSessionSteps: () => mergeInductionSessionSteps,
    mergeLogEntriesForDate: () => mergeLogEntriesForDate,
    mergePhq9Responses: () => mergePhq9Responses,
    mergeSheetRoundTrip: () => mergeSheetRoundTrip,
    mergeWithingsPartialLogs: () => mergeWithingsPartialLogs,
    mgdlToMmol: () => mgdlToMmol,
    migrateFirstRunWizardPrefs: () => migrateFirstRunWizardPrefs,
    minutesToHHMM: () => minutesToHHMM,
    mmolToMgdl: () => mmolToMgdl,
    moodQualitativeKey: () => moodQualitativeKey,
    needsDataResidencyMigration: () => needsDataResidencyMigration,
    nextHomeQuestionAnswerState: () => nextHomeQuestionAnswerState,
    normalizeAccessibilitySettings: () => normalizeAccessibilitySettings,
    normalizeAchievementState: () => normalizeAchievementState,
    normalizeActivityEntry: () => normalizeActivityEntry,
    normalizeBloodGlucose: () => normalizeBloodGlucose,
    normalizeBodyWeight: () => normalizeBodyWeight,
    normalizeCaregiverSettings: () => normalizeCaregiverSettings,
    normalizeCustomChartMetric: () => normalizeCustomChartMetric,
    normalizeCustomChartMetrics: () => normalizeCustomChartMetrics,
    normalizeCustomMetricValues: () => normalizeCustomMetricValues,
    normalizeCycleFields: () => normalizeCycleFields,
    normalizeDisplayNameTheme: () => normalizeDisplayNameTheme,
    normalizeGoals: () => normalizeGoals,
    normalizeHomeDashboardPrefs: () => normalizeHomeDashboardPrefs,
    normalizeHomeGapQuestionCache: () => normalizeHomeGapQuestionCache,
    normalizeHomeQuestionAnswerState: () => normalizeHomeQuestionAnswerState,
    normalizeLlmCoachPersona: () => normalizeLlmCoachPersona,
    normalizeLogEntry: () => normalizeLogEntry,
    normalizeLogFavorites: () => normalizeLogFavorites,
    normalizeMedSchedule: () => normalizeMedSchedule,
    normalizeMedScheduleEntry: () => normalizeMedScheduleEntry,
    normalizeMedicationDose: () => normalizeMedicationDose,
    normalizeMedicationDoses: () => normalizeMedicationDoses,
    normalizePainLocation: () => normalizePainLocation,
    normalizePainLocations: () => normalizePainLocations,
    normalizePhotoAttachment: () => normalizePhotoAttachment,
    normalizePhotoAttachments: () => normalizePhotoAttachments,
    normalizePoolInsightsRpcResult: () => normalizePoolInsightsRpcResult,
    normalizePreferencesPartial: () => normalizePreferencesPartial,
    normalizeProfileAvatar: () => normalizeProfileAvatar,
    normalizeSubEntries: () => normalizeSubEntries,
    normalizeSubEntry: () => normalizeSubEntry,
    normalizeSupplementEntry: () => normalizeSupplementEntry,
    normalizeSupplements: () => normalizeSupplements,
    normalizeSymptomTemplates: () => normalizeSymptomTemplates,
    normalizeTrackingProfile: () => normalizeTrackingProfile,
    normalizeTreatmentStarts: () => normalizeTreatmentStarts,
    normalizeTriggerRow: () => normalizeTriggerRow,
    normalizeUserVibe: () => normalizeUserVibe,
    normalizeVitalMetrics: () => normalizeVitalMetrics,
    normalizeWeatherCoords: () => normalizeWeatherCoords,
    painBodyStateToLocations: () => painBodyStateToLocations,
    parseAppointmentDate: () => parseAppointmentDate,
    parseDoctorQuestionsResponse: () => parseDoctorQuestionsResponse,
    parseGoogleSheetId: () => parseGoogleSheetId,
    parseIsoDateLocal: () => parseIsoDateLocal,
    parseLogsCsv: () => parseLogsCsv,
    parseMigrationCsv: () => parseMigrationCsv,
    parseMigrationFile: () => parseMigrationFile,
    parseORU: () => parseORU,
    parseQrHandoffToken: () => parseQrHandoffToken,
    parseSettingsProfileImport: () => parseSettingsProfileImport,
    parseStructuredLlmOutput: () => parseStructuredLlmOutput,
    parseWeatherApiResponse: () => parseWeatherApiResponse,
    partialLogsToRows: () => partialLogsToRows,
    periodForHour: () => periodForHour,
    pickDailyHomeGapQuestion: () => pickDailyHomeGapQuestion,
    pickHomeAiSuggestionBundle: () => pickHomeAiSuggestionBundle,
    pickHomeAiSuggestions: () => pickHomeAiSuggestions,
    pickPersonalBestHighlight: () => pickPersonalBestHighlight,
    prefersReducedMotion: () => prefersReducedMotion,
    prefsToConsents: () => prefsToConsents,
    privacyProfileFromLocal: () => privacyProfileFromLocal,
    putWebDavEncryptedBackup: () => putWebDavEncryptedBackup,
    rawToWellnessSlider: () => rawToWellnessSlider,
    readCustomMetricRadarValue: () => readCustomMetricRadarValue,
    readProcessingActivity: () => readProcessingActivity,
    readTextFileSync: () => readTextFileSync,
    rebuildFirstRunPlanFromStep: () => rebuildFirstRunPlanFromStep,
    registerAchievementToastPresenter: () => registerAchievementToastPresenter,
    resetAchievementToastQueue: () => resetAchievementToastQueue,
    resolveActiveLocale: () => resolveActiveLocale,
    resolveAqiIconId: () => resolveAqiIconId,
    resolveAuthResidencyCode: () => resolveAuthResidencyCode,
    resolveConditionIconId: () => resolveConditionIconId,
    resolveDataResidency: () => resolveDataResidency,
    resolveGuidedCardIndex: () => resolveGuidedCardIndex,
    resolveGuidedCardProgress: () => resolveGuidedCardProgress,
    resolveHomeCardOrder: () => resolveHomeCardOrder,
    resolveMissedLogNudgeTimeHHMM: () => resolveMissedLogNudgeTimeHHMM,
    resolveNextGuidedCardIndex: () => resolveNextGuidedCardIndex,
    resolveNextStepIndexAfterComplete: () => resolveNextStepIndexAfterComplete,
    resolvePolicyPack: () => resolvePolicyPack,
    resolvePressureIconId: () => resolvePressureIconId,
    resolveProgressFromSessionSteps: () => resolveProgressFromSessionSteps,
    resolveSmartReminderTime: () => resolveSmartReminderTime,
    resolveSmartlookProjectKey: () => resolveSmartlookProjectKey,
    resolveSmartlookRegion: () => resolveSmartlookRegion,
    resolveTempIconId: () => resolveTempIconId,
    resolveUnifiedOnboardingProgress: () => resolveUnifiedOnboardingProgress,
    resolveWeatherIconTone: () => resolveWeatherIconTone,
    roundWeatherCoord: () => roundWeatherCoord,
    rowsToPartialLogs: () => rowsToPartialLogs,
    runGoldenPromptAudit: () => runGoldenPromptAudit,
    saltToBase64: () => saltToBase64,
    sanitizeCustomMetricLabel: () => sanitizeCustomMetricLabel,
    scoreGad7FromResponses: () => scoreGad7FromResponses,
    scorePhq9FromResponses: () => scorePhq9FromResponses,
    scoreScreeningResponses: () => scoreScreeningResponses,
    searchFood: () => searchFood,
    secureStore: () => secureStore,
    setPolicyPack: () => setPolicyPack,
    shareEnvelopeToPortableJson: () => shareEnvelopeToPortableJson,
    shareRowToEnvelope: () => shareRowToEnvelope,
    shouldActivateSessionRecording: () => shouldActivateSessionRecording,
    shouldAllowNetworkOperation: () => shouldAllowNetworkOperation,
    shouldFireAchievementUnlockNotification: () => shouldFireAchievementUnlockNotification,
    shouldFireFlareRiskNudge: () => shouldFireFlareRiskNudge,
    shouldFireMedDoseReminder: () => shouldFireMedDoseReminder,
    shouldFireMissedLogNudge: () => shouldFireMissedLogNudge,
    shouldFireReEngagementNudge: () => shouldFireReEngagementNudge,
    shouldFireStreakReminderNudge: () => shouldFireStreakReminderNudge,
    shouldOfferGad7FollowUp: () => shouldOfferGad7FollowUp,
    shouldOfferPhq9FollowUp: () => shouldOfferPhq9FollowUp,
    shouldShowAppointmentCard: () => shouldShowAppointmentCard,
    shouldShowWizardCategory: () => shouldShowWizardCategory,
    shouldSkipFirstRunStep: () => shouldSkipFirstRunStep,
    shouldSkipGuidedCard: () => shouldSkipGuidedCard,
    shouldSuppressFirstRunLoggingPrompt: () => shouldSuppressFirstRunLoggingPrompt,
    stampLogEntryForCaregiver: () => stampLogEntryForCaregiver,
    stampLogSavedAtForSave: () => stampLogSavedAtForSave,
    suggestCycleForDate: () => suggestCycleForDate,
    suggestCyclePhaseForDay: () => suggestCyclePhaseForDay,
    suggestPrivacyRegionFromHint: () => suggestPrivacyRegionFromHint,
    summarizeCorrelationStep: () => summarizeCorrelationStep,
    summarizeDigestStep: () => summarizeDigestStep,
    summarizeMoodMetrics: () => summarizeMoodMetrics,
    t: () => t,
    textDirection: () => textDirection,
    touchLastActiveAt: () => touchLastActiveAt,
    unwrapDek: () => unwrapDek,
    uploadShareLink: () => uploadShareLink,
    upsertSymptomTemplate: () => upsertSymptomTemplate,
    validateRemoteLlmEndpoint: () => validateRemoteLlmEndpoint,
    validateResearchFacets: () => validateResearchFacets,
    validateTipSubmission: () => validateTipSubmission,
    verifyOAuthState: () => verifyOAuthState,
    wellnessSliderFillColor: () => wellnessSliderFillColor,
    wellnessSliderFillPercent: () => wellnessSliderFillPercent,
    wellnessSliderToRaw: () => wellnessSliderToRaw,
    wrapDek: () => wrapDek,
    wrappedDekToBase64: () => wrappedDekToBase64
  });

  // packages/shared/src/logging/cycleTracking.mjs
  var CYCLE_DAY_MIN = 1;
  var CYCLE_DAY_TYPICAL_MAX = 28;
  var CYCLE_DAY_NORMAL_MAX = 35;
  var CYCLE_DAY_SELECTOR_MAX = 35;
  var CYCLE_DAY_MAX = 45;
  var CYCLE_PHASES = [
    { id: "menstrual", i18n: "wizard.cycle.phase.menstrual", tone: "menstrual", icon: "cycle-menstrual" },
    { id: "follicular", i18n: "wizard.cycle.phase.follicular", tone: "follicular", icon: "cycle-follicular" },
    { id: "ovulation", i18n: "wizard.cycle.phase.ovulation", tone: "ovulation", icon: "cycle-ovulation" },
    { id: "luteal", i18n: "wizard.cycle.phase.luteal", tone: "luteal", icon: "cycle-luteal" }
  ];
  var CYCLE_PHASE_RANGES = [
    { id: "menstrual", start: 1, end: 5, defaultDay: 1 },
    { id: "follicular", start: 6, end: 13, defaultDay: 9 },
    { id: "ovulation", start: 14, end: 16, defaultDay: 15 },
    { id: "luteal", start: 17, end: CYCLE_DAY_MAX, defaultDay: 22 }
  ];
  var CYCLE_FLOW_LEVELS = [
    { id: "none", i18n: "wizard.cycle.flow.none", drops: 0 },
    { id: "light", i18n: "wizard.cycle.flow.light", drops: 1 },
    { id: "medium", i18n: "wizard.cycle.flow.medium", drops: 2 },
    { id: "heavy", i18n: "wizard.cycle.flow.heavy", drops: 3 }
  ];
  var PHASE_IDS = new Set(CYCLE_PHASES.map((p) => p.id));
  var FLOW_IDS = new Set(CYCLE_FLOW_LEVELS.map((f) => f.id));
  var PERIOD_FLOW_IDS = /* @__PURE__ */ new Set(["light", "medium", "heavy"]);
  function parseCycleDay(raw) {
    const day = typeof raw === "number" ? raw : typeof raw === "string" ? parseInt(raw, 10) : NaN;
    if (!Number.isFinite(day) || day < CYCLE_DAY_MIN) return void 0;
    return day;
  }
  function isBackwardCompatPeriodStart(cycle) {
    if (!cycle || typeof cycle !== "object") return false;
    if (cycle.periodStart === true) return true;
    const day = parseCycleDay(cycle.cycleDay);
    if (day !== 1) return false;
    if (cycle.phase === "menstrual") return true;
    return PERIOD_FLOW_IDS.has(cycle.flow);
  }
  function suggestCyclePhaseForDay(day) {
    const n = typeof day === "number" ? day : typeof day === "string" ? parseInt(day, 10) : NaN;
    if (!Number.isFinite(n) || n < CYCLE_DAY_MIN) return void 0;
    if (n <= 5) return "menstrual";
    if (n <= 13) return "follicular";
    if (n <= 16) return "ovulation";
    return "luteal";
  }
  function defaultCycleDayForPhase(phaseId) {
    const row = CYCLE_PHASE_RANGES.find((r) => r.id === phaseId);
    return row ? row.defaultDay : void 0;
  }
  function cyclePhaseRangeForDay(day) {
    const n = typeof day === "number" ? day : typeof day === "string" ? parseInt(day, 10) : NaN;
    if (!Number.isFinite(n)) return void 0;
    return CYCLE_PHASE_RANGES.find((r) => n >= r.start && n <= r.end);
  }
  function daysBetweenIsoDates(fromDate, toDate3) {
    if (typeof fromDate !== "string" || typeof toDate3 !== "string") return NaN;
    const a = /* @__PURE__ */ new Date(fromDate + "T12:00:00");
    const b = /* @__PURE__ */ new Date(toDate3 + "T12:00:00");
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return NaN;
    return Math.round((b.getTime() - a.getTime()) / 864e5);
  }
  function daysSincePeriodStart(periodStartDate, targetDateIso) {
    const delta = daysBetweenIsoDates(periodStartDate, targetDateIso);
    if (!Number.isFinite(delta) || delta < 0) return null;
    return delta;
  }
  function computeCycleDayFromPeriodStart(periodStartDate, targetDateIso) {
    const delta = daysBetweenIsoDates(periodStartDate, targetDateIso);
    if (!Number.isFinite(delta) || delta < 0) return null;
    return delta + 1;
  }
  function isCycleDayLate(cycleDay) {
    const n = typeof cycleDay === "number" ? cycleDay : typeof cycleDay === "string" ? parseInt(cycleDay, 10) : NaN;
    if (!Number.isFinite(n)) return false;
    return n > CYCLE_DAY_NORMAL_MAX;
  }
  function findLatestCycleAnchor(logs) {
    const list = Array.isArray(logs) ? logs : [];
    let best = null;
    for (const log of list) {
      if (!log || typeof log !== "object") continue;
      const c = log.cycle;
      if (!c || typeof c !== "object") continue;
      const day = parseCycleDay(c.cycleDay);
      if (day == null) continue;
      const date = typeof log.date === "string" ? log.date : "";
      if (!date) continue;
      if (!best || date > best.date) {
        best = { date, cycleDay: day, phase: typeof c.phase === "string" ? c.phase : "" };
      }
    }
    return best;
  }
  function findLatestPeriodStart(logs) {
    const list = Array.isArray(logs) ? logs : [];
    let best = null;
    for (const log of list) {
      if (!log || typeof log !== "object") continue;
      const c = log.cycle;
      if (!c || typeof c !== "object") continue;
      if (!isBackwardCompatPeriodStart(c)) continue;
      const date = typeof log.date === "string" ? log.date : "";
      if (!date) continue;
      if (!best || date > best.date) {
        best = {
          date,
          explicit: c.periodStart === true,
          phase: typeof c.phase === "string" ? c.phase : ""
        };
      }
    }
    return best;
  }
  function suggestCycleForDate(logs, targetDateIso) {
    if (typeof targetDateIso !== "string" || !targetDateIso) return null;
    const periodStart = findLatestPeriodStart(logs);
    if (periodStart) {
      let cycleDay2 = computeCycleDayFromPeriodStart(periodStart.date, targetDateIso);
      if (cycleDay2 == null) return null;
      if (cycleDay2 > CYCLE_DAY_MAX) cycleDay2 = CYCLE_DAY_MAX;
      const phase2 = suggestCyclePhaseForDay(cycleDay2) || "";
      return {
        cycleDay: cycleDay2,
        phase: phase2,
        fromDate: periodStart.date,
        periodStartDate: periodStart.date,
        late: isCycleDayLate(cycleDay2),
        suggested: true
      };
    }
    const anchor = findLatestCycleAnchor(logs);
    if (!anchor) return null;
    const delta = daysBetweenIsoDates(anchor.date, targetDateIso);
    if (!Number.isFinite(delta) || delta < 0) return null;
    let cycleDay = anchor.cycleDay + delta;
    if (cycleDay > CYCLE_DAY_MAX) cycleDay = CYCLE_DAY_MAX;
    const phase = suggestCyclePhaseForDay(cycleDay) || "";
    return {
      cycleDay,
      phase,
      fromDate: anchor.date,
      late: isCycleDayLate(cycleDay),
      suggested: true
    };
  }
  function isValidCyclePhase(id) {
    return PHASE_IDS.has(id);
  }
  function isValidCycleFlow(id) {
    return FLOW_IDS.has(id);
  }

  // packages/shared/src/logging/logSchema.mjs
  var SUB_ENTRY_PERIODS = /* @__PURE__ */ new Set(["AM", "midday", "PM", "partial"]);
  var PAIN_REGIONS = /* @__PURE__ */ new Set([
    "head",
    "neck",
    "shoulders-L",
    "shoulders-R",
    "chest",
    "upper-back",
    "lower-back",
    "abdomen",
    "hips",
    "knees-L",
    "knees-R",
    "ankles-L",
    "ankles-R",
    "hands-L",
    "hands-R"
  ]);
  var COMMON_SUPPLEMENTS = /* @__PURE__ */ new Set([
    "Vitamin D",
    "Magnesium",
    "Omega-3",
    "Zinc",
    "B12",
    "Iron",
    "Melatonin",
    "Probiotics",
    "Ashwagandha",
    "CoQ10"
  ]);
  function clampInt(raw, min, max) {
    const n = typeof raw === "number" ? raw : typeof raw === "string" ? parseInt(raw, 10) : NaN;
    if (!Number.isFinite(n)) return void 0;
    return Math.max(min, Math.min(max, Math.round(n)));
  }
  function clampFloat(raw, min, max, decimals = 1) {
    const n = typeof raw === "number" ? raw : typeof raw === "string" ? parseFloat(raw) : NaN;
    if (!Number.isFinite(n)) return void 0;
    const clamped = Math.max(min, Math.min(max, n));
    return Number(clamped.toFixed(decimals));
  }
  function normalizeString(raw, maxLen) {
    if (typeof raw !== "string") return void 0;
    const s = raw.trim();
    if (!s) return void 0;
    if (typeof maxLen === "number") return s.slice(0, maxLen);
    return s;
  }
  function mmolToMgdl(mmol) {
    return Number((mmol * 18.02).toFixed(1));
  }
  function mgdlToMmol(mgdl) {
    return Number((mgdl / 18.02).toFixed(2));
  }
  function lbsToKg(lbs) {
    return Number((lbs * 0.453592).toFixed(2));
  }
  function kgToLbs(kg) {
    return Number((kg / 0.453592).toFixed(1));
  }
  function computeBmiKg(weightKg, heightCm) {
    if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm) || heightCm <= 0) return void 0;
    const heightM = heightCm / 100;
    return Number((weightKg / (heightM * heightM)).toFixed(1));
  }
  function normalizePainLocation(value) {
    const v = value && typeof value === "object" ? value : {};
    const region = typeof v.region === "string" && PAIN_REGIONS.has(v.region) ? v.region : void 0;
    const intensity = clampInt(v.intensity, 0, 10);
    if (!region) return void 0;
    return { region, intensity: intensity ?? 0 };
  }
  function normalizePainLocations(raw) {
    if (!Array.isArray(raw)) return void 0;
    const items = raw.map((x) => normalizePainLocation(x)).filter(Boolean);
    return items.length ? items.slice(0, 15) : void 0;
  }
  function normalizeSupplementEntry(value) {
    const v = value && typeof value === "object" ? value : {};
    const name = normalizeString(v.name, 120);
    if (!name) return void 0;
    return {
      name,
      dose: normalizeString(v.dose, 40),
      unit: normalizeString(v.unit, 20),
      brand: normalizeString(v.brand, 80)
    };
  }
  function normalizeSupplements(raw) {
    if (!Array.isArray(raw)) return void 0;
    const items = raw.map((x) => normalizeSupplementEntry(x)).filter(Boolean);
    return items.length ? items.slice(0, 20) : void 0;
  }
  function normalizePhotoAttachment(value) {
    const v = value && typeof value === "object" ? value : {};
    const url = normalizeString(v.url, 500);
    if (!url || !/^https?:\/\//i.test(url) && !/^health-photos\//i.test(url)) return void 0;
    return { url, caption: normalizeString(v.caption, 200) };
  }
  function normalizePhotoAttachments(raw) {
    if (!Array.isArray(raw)) return void 0;
    const items = raw.map((x) => normalizePhotoAttachment(x)).filter(Boolean);
    return items.length ? items.slice(0, 6) : void 0;
  }
  function normalizeBloodGlucose(value, unitPref) {
    const v = value && typeof value === "object" ? value : { value };
    const raw = typeof v === "number" ? v : v.value ?? v.bloodGlucose;
    const unit = v.unit === "mgdl" || v.bloodGlucoseUnit === "mgdl" || unitPref === "mgdl" ? "mgdl" : "mmol";
    const n = typeof raw === "number" ? raw : parseFloat(String(raw || ""));
    if (!Number.isFinite(n)) return void 0;
    const mmol = unit === "mgdl" ? mgdlToMmol(n) : clampFloat(n, 1, 35, 2);
    if (mmol === void 0) return void 0;
    return { bloodGlucose: mmol, bloodGlucoseUnit: "mmol" };
  }
  function normalizeBodyWeight(value, unitPref) {
    const v = value && typeof value === "object" ? value : { value };
    const raw = typeof v === "number" ? v : v.value ?? v.bodyWeight;
    const unit = v.unit === "lbs" || v.bodyWeightUnit === "lbs" || unitPref === "lbs" ? "lbs" : "kg";
    const n = typeof raw === "number" ? raw : parseFloat(String(raw || ""));
    if (!Number.isFinite(n)) return void 0;
    const kg = unit === "lbs" ? lbsToKg(n) : clampFloat(n, 20, 300, 2);
    if (kg === void 0) return void 0;
    return { bodyWeight: kg, bodyWeightUnit: "kg" };
  }
  var LEGACY_BODY_REGION_TO_PAIN_LOCATION = {
    head: "head",
    neck: "neck",
    left_shoulder: "shoulders-L",
    right_shoulder: "shoulders-R",
    chest: "chest",
    abdomen: "abdomen",
    left_hip: "hips",
    right_hip: "hips",
    left_knee: "knees-L",
    right_knee: "knees-R",
    left_ankle: "ankles-L",
    right_ankle: "ankles-R",
    left_hand: "hands-L",
    right_hand: "hands-R",
    left_upper_arm: "upper-back",
    right_upper_arm: "upper-back",
    left_lower_leg: "lower-back",
    right_lower_leg: "lower-back"
  };
  function painBodyStateToLocations(state, intensityMap = { 1: 4, 2: 8 }) {
    if (!state || typeof state !== "object") return void 0;
    const items = [];
    Object.keys(state).forEach((legacyId) => {
      const level = state[legacyId];
      if (!level) return;
      const region = LEGACY_BODY_REGION_TO_PAIN_LOCATION[legacyId];
      if (!region) return;
      const intensity = intensityMap[level] ?? clampInt(level, 0, 10) ?? 0;
      const existing = items.find((x) => x.region === region);
      if (existing) existing.intensity = Math.max(existing.intensity, intensity);
      else items.push({ region, intensity });
    });
    return normalizePainLocations(items);
  }
  function normalizeBbtCelsius(raw, unitPref) {
    const n = typeof raw === "number" ? raw : parseFloat(String(raw ?? ""));
    if (!Number.isFinite(n)) return void 0;
    const celsius = unitPref === "fahrenheit" ? (n - 32) * 5 / 9 : n;
    return clampFloat(celsius, 35, 38.5, 2);
  }
  function normalizeVitalMetrics(value, options = {}) {
    const v = value && typeof value === "object" ? value : {};
    const glucose = normalizeBloodGlucose(
      { value: v.bloodGlucose, unit: v.bloodGlucoseUnit },
      options.glucoseUnit
    );
    const weight = normalizeBodyWeight(
      {
        value: v.bodyWeight ?? (v.weight != null ? parseFloat(String(v.weight)) : void 0),
        unit: v.bodyWeightUnit
      },
      options.weightUnit
    );
    const bristolRaw = typeof v.bristol === "number" ? v.bristol : parseInt(String(v.bristol ?? ""), 10);
    const bristol = Number.isFinite(bristolRaw) && bristolRaw >= 1 && bristolRaw <= 7 ? bristolRaw : void 0;
    const tempUnit = v.bbtUnit === "fahrenheit" || options.temperatureUnit === "fahrenheit" ? "fahrenheit" : "celsius";
    const out = {
      bloodPressureSystolic: clampInt(v.bloodPressureSystolic, 60, 250),
      bloodPressureDiastolic: clampInt(v.bloodPressureDiastolic, 40, 150),
      bloodGlucose: glucose?.bloodGlucose,
      bloodGlucoseUnit: glucose?.bloodGlucoseUnit,
      spO2: clampInt(v.spO2, 70, 100),
      hrv: clampInt(v.hrv, 0, 300),
      bodyWeight: weight?.bodyWeight,
      bodyWeightUnit: weight?.bodyWeightUnit,
      bristol,
      painLocations: normalizePainLocations(v.painLocations),
      gratitude: normalizeString(v.gratitude, 500),
      bbt: normalizeBbtCelsius(v.bbt, tempUnit),
      photoAttachments: normalizePhotoAttachments(v.photoAttachments),
      supplements: normalizeSupplements(v.supplements)
    };
    Object.keys(out).forEach((k) => {
      if (out[k] === void 0 || Array.isArray(out[k]) && out[k].length === 0) delete out[k];
    });
    return Object.keys(out).length ? out : void 0;
  }
  function normalizeCycleFields(value) {
    const v = value && typeof value === "object" ? value : {};
    const phase = v.phase === "menstrual" || v.phase === "follicular" || v.phase === "ovulation" || v.phase === "luteal" ? v.phase : void 0;
    const flow = v.flow === "none" || v.flow === "light" || v.flow === "medium" || v.flow === "heavy" ? v.flow : void 0;
    const cycleDay = clampInt(v.cycleDay, 1, CYCLE_DAY_MAX);
    const periodStart = v.periodStart === true ? true : void 0;
    const pmsSymptoms = Array.isArray(v.pmsSymptoms) ? v.pmsSymptoms.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim()).slice(0, 20) : void 0;
    const out = { cycleDay, periodStart, phase, flow, pmsSymptoms };
    Object.keys(out).forEach((k) => {
      if (out[k] === void 0 || Array.isArray(out[k]) && out[k].length === 0) delete out[k];
    });
    return Object.keys(out).length ? out : void 0;
  }
  function normalizeSubEntry(value) {
    const v = value && typeof value === "object" ? value : {};
    const period = SUB_ENTRY_PERIODS.has(v.period) ? v.period : "partial";
    const id = typeof v.id === "string" && v.id.trim() ? v.id.trim().slice(0, 40) : `${period}-${Date.now()}`;
    const entry = {
      id,
      period,
      mood: clampInt(v.mood, 0, 10),
      fatigue: clampInt(v.fatigue, 0, 10),
      sleep: clampInt(v.sleep, 0, 10),
      jointPain: clampInt(v.jointPain, 0, 10),
      notes: normalizeString(v.notes, 500),
      savedAt: typeof v.savedAt === "string" ? v.savedAt : (/* @__PURE__ */ new Date()).toISOString()
    };
    Object.keys(entry).forEach((k) => {
      if (entry[k] === void 0) delete entry[k];
    });
    return entry;
  }
  function normalizeSubEntries(raw) {
    if (!Array.isArray(raw)) return void 0;
    const items = raw.map((x) => normalizeSubEntry(x)).filter((x) => Object.keys(x).length > 1);
    return items.length ? items.slice(0, 8) : void 0;
  }
  function normalizeMedicationDose(value) {
    const v = value && typeof value === "object" ? value : {};
    const status = v.status === "taken" || v.status === "skipped" || v.status === "missed" ? v.status : void 0;
    const drug = normalizeString(v.drug, 120);
    const scheduledAt = typeof v.scheduledAt === "string" ? v.scheduledAt.slice(0, 40) : void 0;
    if (!drug && !status) return void 0;
    return { drug: drug || "Medication", status: status || "taken", scheduledAt };
  }
  function normalizeMedicationDoses(raw) {
    if (!Array.isArray(raw)) return void 0;
    const items = raw.map((x) => normalizeMedicationDose(x)).filter(Boolean);
    return items.length ? items.slice(0, 24) : void 0;
  }
  function mergeLogEntriesForDate(existing, incoming) {
    const base = { ...existing, ...incoming, date: existing.date || incoming.date };
    const subA = normalizeSubEntries(existing.subEntries) || [];
    const subB = normalizeSubEntries(incoming.subEntries) || [];
    if (subA.length || subB.length) {
      const byId = /* @__PURE__ */ new Map();
      [...subA, ...subB].forEach((s) => byId.set(s.id, s));
      base.subEntries = [...byId.values()];
    }
    if (incoming.cycle) base.cycle = normalizeCycleFields(incoming.cycle) || base.cycle;
    if (incoming.medicationDoses) {
      const doses = normalizeMedicationDoses([...normalizeMedicationDoses(existing.medicationDoses) || [], ...normalizeMedicationDoses(incoming.medicationDoses) || []]);
      if (doses) base.medicationDoses = doses;
    }
    return base;
  }

  // packages/shared/src/charts/customMetrics.mjs
  var MAX_CUSTOM = 8;
  var LABEL_MAX = 40;
  function sanitizeCustomMetricLabel(raw) {
    if (typeof raw !== "string") return "";
    return raw.replace(/<[^>]*>/g, "").replace(/[<>"'&`]/g, "").trim().slice(0, LABEL_MAX);
  }
  function customMetricFieldKey(id) {
    return `custom_${id}`;
  }
  function isCustomMetricField(field) {
    return typeof field === "string" && field.startsWith("custom_");
  }
  function customMetricIdFromField(field) {
    if (!isCustomMetricField(field)) return null;
    return field.slice(7);
  }
  function normalizeCustomChartMetric(raw) {
    const v = raw && typeof raw === "object" ? raw : {};
    const id = typeof v.id === "string" && /^[a-z0-9_-]{1,24}$/i.test(v.id) ? v.id.toLowerCase() : void 0;
    const label = sanitizeCustomMetricLabel(v.label);
    const type = v.type === "boolean" ? "boolean" : "scale";
    const color = typeof v.color === "string" && /^#[0-9a-fA-F]{6}$/.test(v.color) ? v.color : "#78909c";
    if (!id || !label) return null;
    return { id, label, type, color };
  }
  function normalizeCustomChartMetrics(raw) {
    if (!Array.isArray(raw)) return [];
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    for (const item of raw) {
      const m = normalizeCustomChartMetric(item);
      if (!m || seen.has(m.id)) continue;
      seen.add(m.id);
      out.push(m);
      if (out.length >= MAX_CUSTOM) break;
    }
    return out;
  }
  function normalizeCustomMetricValues(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return void 0;
    const out = {};
    for (const [k, val] of Object.entries(raw)) {
      if (!/^[a-z0-9_-]{1,24}$/i.test(k)) continue;
      if (typeof val === "boolean") out[k.toLowerCase()] = val;
      else if (typeof val === "number" && Number.isFinite(val)) {
        out[k.toLowerCase()] = Math.max(0, Math.min(10, val));
      } else if (val === "Yes") out[k.toLowerCase()] = true;
      else if (val === "No") out[k.toLowerCase()] = false;
    }
    return Object.keys(out).length ? out : void 0;
  }
  function readCustomMetricRadarValue(log, def) {
    const bag = log?.customMetrics;
    if (!bag || typeof bag !== "object") return null;
    const raw = bag[def.id];
    if (def.type === "boolean") {
      if (typeof raw === "boolean") return raw ? 10 : 0;
      if (raw === "Yes") return 10;
      if (raw === "No") return 0;
      return null;
    }
    if (typeof raw === "number" && Number.isFinite(raw)) return Math.max(0, Math.min(10, raw));
    return null;
  }

  // packages/shared/src/privacy/regions.mjs
  var PRIVACY_REGIONS = ["eea_uk", "us_ca", "us_other", "au", "br", "other"];
  var UNSET_PRIVACY_REGION = "";
  function isValidPrivacyRegion(id) {
    return typeof id === "string" && PRIVACY_REGIONS.includes(id);
  }
  function getRegionLabels(pack) {
    const regions = pack?.regions ?? {};
    return PRIVACY_REGIONS.map((id) => ({
      id,
      label: regions[id]?.label ?? id
    }));
  }
  function suggestPrivacyRegionFromHint(locale, timeZone) {
    const loc = (locale || "").toLowerCase();
    const tz = (timeZone || "").toLowerCase();
    if (/^(en-gb|cy-gb|ga-gb)/.test(loc) || /europe\/london|europe\/dublin/.test(tz)) return "eea_uk";
    if (loc.startsWith("en-us") || loc.startsWith("es-us")) {
      if (/california|los_angeles|america\/los_angeles/.test(tz)) return "us_ca";
      return "us_other";
    }
    if (loc.startsWith("pt-br") || loc.startsWith("pt_br")) return "br";
    if (loc.startsWith("en-au") || /australia/.test(tz)) return "au";
    if (/^([a-z]{2}-)?(at|be|bg|hr|cy|cz|dk|ee|fi|fr|de|gr|hu|ie|it|lv|lt|lu|mt|nl|pl|pt|ro|sk|si|es|se|is|li|no|ch|gb)/.test(loc)) {
      return "eea_uk";
    }
    if (/^europe\//.test(tz)) return "eea_uk";
    if (/^america\//.test(tz)) return "us_other";
    return "other";
  }

  // packages/shared/src/privacy/policy-summaries.mjs
  var POLICY_SUMMARIES = {
    "global-baseline": {
      id: "global-baseline",
      title: "Global privacy baseline",
      summary: "Rianell stores health logs on your device by default. Cloud backup, anonymised research contribution, and on-device AI are optional and require separate consent. You can export or delete your data at any time."
    },
    "eu-gdpr": {
      id: "eu-gdpr",
      title: "EEA & UK - GDPR",
      summary: "Health data is special-category data under GDPR Art. 9. We rely on your explicit consent to process it locally and for optional cloud, research, and AI features. You have rights of access, rectification, erasure, restriction, portability, and objection."
    },
    "data-subject-rights": {
      id: "data-subject-rights",
      title: "Your data rights",
      summary: "You may download a copy of your health logs, request correction, withdraw consent, or delete local and cloud data from Settings. Contact the operator for formal data-subject requests."
    },
    "other-jurisdictions-us-ca": {
      id: "other-jurisdictions-us-ca",
      title: "California (CCPA/CPRA)",
      summary: "We do not sell personal information. California residents have rights to know, delete, and correct personal information. Health logs are consumer wellness data, not HIPAA-covered provider records unless you use Rianell under a healthcare BAA."
    },
    "other-jurisdictions-us": {
      id: "other-jurisdictions-us",
      title: "United States - other states",
      summary: "Consumer wellness self-tracking is generally outside HIPAA unless you are a covered entity or business associate. State privacy laws may grant access and deletion rights similar to our global baseline."
    },
    "other-jurisdictions-au": {
      id: "other-jurisdictions-au",
      title: "Australia - APPs",
      summary: "Australian Privacy Principles apply to personal information we hold. You may access and correct your data. Notifiable data breach rules apply to serious incidents affecting your information."
    },
    "other-jurisdictions-br": {
      id: "other-jurisdictions-br",
      title: "Brazil - LGPD",
      summary: "LGPD grants rights of confirmation, access, correction, anonymisation, portability, and deletion. Consent is the primary legal basis for health-related processing in the app."
    }
  };

  // packages/shared/src/privacy/policyPackData.mjs
  var POLICY_PACK_V1 = {
    "version": "1.0.0",
    "policyPackId": "v1.0.0",
    "regions": {
      "eea_uk": {
        "label": "EEA & United Kingdom",
        "defaultLocale": "en-GB",
        "supportedLocales": [
          "en-GB",
          "fr-FR",
          "de-DE",
          "es-ES",
          "it-IT",
          "pl-PL",
          "nl-NL",
          "pt-PT"
        ],
        "requiredDataResidency": "default",
        "policyDocuments": [
          "global-baseline",
          "eu-gdpr",
          "data-subject-rights"
        ],
        "features": {
          "localHealthLogging": {
            "enabled": true,
            "requiredConsents": [
              "healthData"
            ]
          },
          "cloudEncryptedBackup": {
            "enabled": true,
            "requiredConsents": [
              "healthData",
              "cloudSync"
            ]
          },
          "anonymizedResearchPool": {
            "enabled": true,
            "requiredConsents": [
              "healthData",
              "anonContribution"
            ]
          },
          "onDeviceLlmDownload": {
            "enabled": true,
            "requiredConsents": [
              "healthData",
              "aiModel"
            ]
          },
          "openDataPoolForAi": {
            "enabled": true,
            "requiredConsents": [
              "healthData"
            ]
          },
          "bugReports": {
            "enabled": true,
            "requiredConsents": []
          },
          "ePrivacyStorageBanner": {
            "enabled": true,
            "requiredConsents": []
          },
          "sessionRecording": {
            "enabled": true,
            "requiredConsents": [
              "healthData",
              "sessionRecording"
            ]
          }
        }
      },
      "us_ca": {
        "label": "United States - California",
        "defaultLocale": "en-US",
        "supportedLocales": [
          "en-US"
        ],
        "requiredDataResidency": "default",
        "policyDocuments": [
          "global-baseline",
          "other-jurisdictions-us-ca",
          "data-subject-rights"
        ],
        "features": {
          "localHealthLogging": {
            "enabled": true,
            "requiredConsents": [
              "healthData"
            ]
          },
          "cloudEncryptedBackup": {
            "enabled": true,
            "requiredConsents": [
              "healthData",
              "cloudSync"
            ]
          },
          "anonymizedResearchPool": {
            "enabled": true,
            "requiredConsents": [
              "healthData",
              "anonContribution"
            ]
          },
          "onDeviceLlmDownload": {
            "enabled": true,
            "requiredConsents": [
              "healthData",
              "aiModel"
            ]
          },
          "openDataPoolForAi": {
            "enabled": true,
            "requiredConsents": [
              "healthData"
            ]
          },
          "bugReports": {
            "enabled": true,
            "requiredConsents": []
          },
          "ePrivacyStorageBanner": {
            "enabled": false,
            "requiredConsents": []
          },
          "sessionRecording": {
            "enabled": true,
            "requiredConsents": [
              "healthData",
              "sessionRecording"
            ]
          }
        }
      },
      "us_other": {
        "label": "United States - other states",
        "defaultLocale": "en-US",
        "supportedLocales": [
          "en-US"
        ],
        "requiredDataResidency": "default",
        "policyDocuments": [
          "global-baseline",
          "other-jurisdictions-us",
          "data-subject-rights"
        ],
        "features": {
          "localHealthLogging": {
            "enabled": true,
            "requiredConsents": [
              "healthData"
            ]
          },
          "cloudEncryptedBackup": {
            "enabled": true,
            "requiredConsents": [
              "healthData",
              "cloudSync"
            ]
          },
          "anonymizedResearchPool": {
            "enabled": true,
            "requiredConsents": [
              "healthData",
              "anonContribution"
            ]
          },
          "onDeviceLlmDownload": {
            "enabled": true,
            "requiredConsents": [
              "healthData",
              "aiModel"
            ]
          },
          "openDataPoolForAi": {
            "enabled": true,
            "requiredConsents": [
              "healthData"
            ]
          },
          "bugReports": {
            "enabled": true,
            "requiredConsents": []
          },
          "ePrivacyStorageBanner": {
            "enabled": false,
            "requiredConsents": []
          },
          "sessionRecording": {
            "enabled": true,
            "requiredConsents": [
              "healthData",
              "sessionRecording"
            ]
          }
        }
      },
      "au": {
        "label": "Australia",
        "defaultLocale": "en-AU",
        "supportedLocales": [
          "en-AU"
        ],
        "requiredDataResidency": "default",
        "policyDocuments": [
          "global-baseline",
          "other-jurisdictions-au",
          "data-subject-rights"
        ],
        "features": {
          "localHealthLogging": {
            "enabled": true,
            "requiredConsents": [
              "healthData"
            ]
          },
          "cloudEncryptedBackup": {
            "enabled": true,
            "requiredConsents": [
              "healthData",
              "cloudSync"
            ]
          },
          "anonymizedResearchPool": {
            "enabled": true,
            "requiredConsents": [
              "healthData",
              "anonContribution"
            ]
          },
          "onDeviceLlmDownload": {
            "enabled": true,
            "requiredConsents": [
              "healthData",
              "aiModel"
            ]
          },
          "openDataPoolForAi": {
            "enabled": true,
            "requiredConsents": [
              "healthData"
            ]
          },
          "bugReports": {
            "enabled": true,
            "requiredConsents": []
          },
          "ePrivacyStorageBanner": {
            "enabled": false,
            "requiredConsents": []
          },
          "sessionRecording": {
            "enabled": true,
            "requiredConsents": [
              "healthData",
              "sessionRecording"
            ]
          }
        }
      },
      "br": {
        "label": "Brazil",
        "defaultLocale": "pt-BR",
        "supportedLocales": [
          "pt-BR"
        ],
        "requiredDataResidency": "default",
        "policyDocuments": [
          "global-baseline",
          "other-jurisdictions-br",
          "data-subject-rights"
        ],
        "features": {
          "localHealthLogging": {
            "enabled": true,
            "requiredConsents": [
              "healthData"
            ]
          },
          "cloudEncryptedBackup": {
            "enabled": true,
            "requiredConsents": [
              "healthData",
              "cloudSync"
            ]
          },
          "anonymizedResearchPool": {
            "enabled": true,
            "requiredConsents": [
              "healthData",
              "anonContribution"
            ]
          },
          "onDeviceLlmDownload": {
            "enabled": true,
            "requiredConsents": [
              "healthData",
              "aiModel"
            ]
          },
          "openDataPoolForAi": {
            "enabled": true,
            "requiredConsents": [
              "healthData"
            ]
          },
          "bugReports": {
            "enabled": true,
            "requiredConsents": []
          },
          "ePrivacyStorageBanner": {
            "enabled": false,
            "requiredConsents": []
          },
          "sessionRecording": {
            "enabled": true,
            "requiredConsents": [
              "healthData",
              "sessionRecording"
            ]
          }
        }
      },
      "other": {
        "label": "Rest of world",
        "defaultLocale": "en-GB",
        "supportedLocales": [
          "en-GB",
          "en-US",
          "en-AU",
          "pt-BR",
          "fr-FR",
          "de-DE",
          "es-ES",
          "it-IT",
          "pl-PL",
          "nl-NL",
          "pt-PT"
        ],
        "requiredDataResidency": "default",
        "policyDocuments": [
          "global-baseline",
          "data-subject-rights"
        ],
        "features": {
          "localHealthLogging": {
            "enabled": true,
            "requiredConsents": [
              "healthData"
            ]
          },
          "cloudEncryptedBackup": {
            "enabled": true,
            "requiredConsents": [
              "healthData",
              "cloudSync"
            ]
          },
          "anonymizedResearchPool": {
            "enabled": false,
            "requiredConsents": [
              "healthData",
              "anonContribution"
            ]
          },
          "onDeviceLlmDownload": {
            "enabled": true,
            "requiredConsents": [
              "healthData",
              "aiModel"
            ]
          },
          "openDataPoolForAi": {
            "enabled": true,
            "requiredConsents": [
              "healthData"
            ]
          },
          "bugReports": {
            "enabled": true,
            "requiredConsents": []
          },
          "ePrivacyStorageBanner": {
            "enabled": false,
            "requiredConsents": []
          },
          "sessionRecording": {
            "enabled": true,
            "requiredConsents": [
              "healthData",
              "sessionRecording"
            ]
          }
        }
      }
    }
  };

  // packages/shared/src/privacy/resolvePolicyPack.mjs
  var cachedPack = null;
  function loadPolicyPackFromDisk() {
    return getPolicyPack();
  }
  function setPolicyPack(pack) {
    cachedPack = pack;
  }
  function getPolicyPack() {
    if (cachedPack) return cachedPack;
    cachedPack = POLICY_PACK_V1;
    return cachedPack;
  }
  function resolvePolicyPack(regionId, pack = getPolicyPack()) {
    const id = pack?.regions?.[regionId] ? regionId : "other";
    const region = pack.regions[id];
    return {
      policyPackId: pack.policyPackId ?? pack.version ?? "v1.0.0",
      regionId: id,
      label: region.label,
      requiredDataResidency: region.requiredDataResidency ?? "default",
      policyDocuments: region.policyDocuments ?? [],
      features: region.features ?? {}
    };
  }

  // packages/shared/src/privacy/policyBodies.mjs
  var POLICY_BODIES = {
    "global-baseline": [
      "Rianell is a personal wellness tracker. Your health logs are stored on your device unless you turn on optional cloud backup.",
      "Optional features (encrypted cloud backup, anonymised research contribution, on-device AI, and optional session recording) each need separate consent. You can change or withdraw consent in Settings.",
      "Session recording (Smartlook) is on by default after onboarding. You are notified during setup and can opt out immediately or later in Settings. When enabled, anonymised session data is used only for heatmaps and error tracking in the EU-not for reviewing your health screens. You can turn it off at any time under Settings \u2192 Privacy.",
      "You can export your data or delete local and cloud copies at any time from Settings \u2192 Data options."
    ],
    "eu-gdpr": [
      "Under GDPR Article 9, health-related data is special-category data. We rely on your explicit consent to process logs on your device and for any optional cloud, research, or AI features.",
      "You have the right to access, rectify, erase, restrict, port, and object to processing. Withdraw consent in Settings; this does not affect lawfulness of processing before withdrawal.",
      "Our operator acts as controller for account and cloud data. Sub-processors are listed in the privacy pack hosted with the app."
    ],
    "data-subject-rights": [
      "Download a copy of your logs via Settings \u2192 Export. Correct entries in the log wizard or View logs.",
      "Delete local data from Settings \u2192 Clear all data. Delete cloud backup separately via Delete cloud data when signed in.",
      "For formal data-subject requests beyond in-app tools, contact the operator using the details in SECURITY.md."
    ],
    "other-jurisdictions-us-ca": [
      "We do not sell personal information. California residents may request to know, delete, and correct personal information we hold.",
      "Rianell is consumer wellness self-tracking, not a HIPAA-covered medical record unless used under a healthcare business associate agreement."
    ],
    "other-jurisdictions-us": [
      "State privacy laws may grant access and deletion rights similar to our global baseline. Health logs stay on your device by default."
    ],
    "other-jurisdictions-au": [
      "Australian Privacy Principles apply to personal information we hold. You may access and correct your data through in-app export and edit tools.",
      "Notifiable data breach rules apply to serious incidents affecting your information held by the operator."
    ],
    "other-jurisdictions-br": [
      "LGPD grants confirmation, access, correction, anonymisation, portability, and deletion rights. Consent is the primary basis for health-related processing in the app."
    ]
  };
  function getPolicyBodyParagraphs(docId) {
    const rows = POLICY_BODIES[docId];
    return Array.isArray(rows) ? rows.slice() : [];
  }

  // packages/shared/src/privacy/getPolicyDocuments.mjs
  function getPolicyDocumentsForRegion(regionId, pack) {
    const resolved = resolvePolicyPack(regionId, pack);
    return (resolved.policyDocuments || []).map((docId) => {
      const summary = POLICY_SUMMARIES[docId];
      if (!summary) return null;
      return { ...summary, body: getPolicyBodyParagraphs(docId) };
    }).filter(Boolean);
  }

  // packages/shared/src/i18n/locales.mjs
  var SHIPPED_LOCALES = [
    "en-GB",
    "en-US",
    "en-AU",
    "pt-BR",
    "fr-FR",
    "de-DE",
    "es-ES",
    "it-IT",
    "pl-PL",
    "nl-NL",
    "pt-PT",
    "ar",
    "he",
    "ga"
  ];
  var DEFAULT_LOCALE = "en-GB";
  var DEFAULT_PRIVACY_REGION = "eea_uk";
  function isValidLocaleId(id) {
    if (typeof id !== "string") return false;
    if (SHIPPED_LOCALES.includes(id)) return true;
    return id === "ar" || id === "he" || id === "ga" || id.startsWith("ar-") || id.startsWith("he-") || id.startsWith("ga-");
  }
  function localeFallbackChain(localeId) {
    const chain = [];
    if (localeId && typeof localeId === "string") chain.push(localeId);
    const lang = localeId?.split("-")[0];
    if (lang && lang !== localeId) chain.push(lang);
    if (!chain.includes(DEFAULT_LOCALE)) chain.push(DEFAULT_LOCALE);
    return chain;
  }
  function localeLabel(localeId) {
    const labels = {
      "en-GB": "English (UK)",
      "en-US": "English (US)",
      "en-AU": "English (Australia)",
      "pt-BR": "Portugu\xEAs (Brasil)",
      "fr-FR": "Fran\xE7ais",
      "de-DE": "Deutsch",
      "es-ES": "Espa\xF1ol",
      "it-IT": "Italiano",
      "pl-PL": "Polski",
      "nl-NL": "Nederlands",
      "pt-PT": "Portugu\xEAs (Portugal)",
      ar: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629",
      he: "\u05E2\u05D1\u05E8\u05D9\u05EA",
      ga: "Gaeilge"
    };
    return labels[localeId] || localeId;
  }

  // packages/shared/src/i18n/translate.mjs
  function getNested(obj, key) {
    if (!obj || !key) return void 0;
    if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key];
    const parts = key.split(".");
    let cur = obj;
    for (const p of parts) {
      if (cur == null || typeof cur !== "object") return void 0;
      cur = cur[p];
    }
    return cur;
  }
  function interpolate(template, params) {
    if (!params || typeof template !== "string") return template;
    return template.replace(/\{(\w+)\}/g, (_, name) => {
      const v = params[name];
      return v != null ? String(v) : `{${name}}`;
    });
  }
  function t(key, localeId, catalogs, params) {
    const chain = localeFallbackChain(localeId || DEFAULT_LOCALE);
    for (const loc of chain) {
      const cat = catalogs?.[loc];
      const strings = cat?.strings ?? cat;
      const val = getNested(strings, key);
      if (typeof val === "string") return interpolate(val, params);
    }
    return key;
  }
  function createTranslator(catalogs, localeId) {
    return (key, params) => t(key, localeId, catalogs, params);
  }

  // packages/shared/src/privacy/getPolicyDocumentsI18n.mjs
  function getPolicyDocumentsForRegionI18n(regionId, pack, localeId, catalogs) {
    const docs = getPolicyDocumentsForRegion(regionId, pack);
    if (!catalogs || !localeId) return docs;
    return docs.map((d) => {
      const titleKey = `policy.${d.id}.title`;
      const summaryKey = `policy.${d.id}.summary`;
      const title = t(titleKey, localeId, catalogs);
      const summary = t(summaryKey, localeId, catalogs);
      return {
        ...d,
        title: title !== titleKey ? title : d.title,
        summary: summary !== summaryKey ? summary : d.summary
      };
    });
  }

  // packages/shared/src/privacy/getFeatureAvailability.mjs
  function consentOk(consents, key) {
    if (!key) return true;
    const c = consents && typeof consents === "object" ? consents : {};
    if (key === "healthData") return c.healthData === true || c.healthDataConsent === true;
    if (key === "cloudSync") return c.cloudSync === true || c.backup === true;
    if (key === "anonContribution") return c.anonContribution === true || c.contributeAnonData === true;
    if (key === "aiModel") return c.aiModel === true || c.aiEnabled === true || c.aiModelDownloadConsent === "granted";
    if (key === "sessionRecording") return c.sessionRecording === true;
    return c[key] === true;
  }
  function getFeatureAvailability(regionId, featureKey, consents, pack) {
    const resolved = resolvePolicyPack(regionId, pack);
    const feat = resolved.features?.[featureKey];
    if (!feat || feat.enabled === false) {
      return { available: false, reason: "disabled_for_region", regionId: resolved.regionId };
    }
    const required = Array.isArray(feat.requiredConsents) ? feat.requiredConsents : [];
    for (const key of required) {
      if (!consentOk(consents, key)) {
        return { available: false, reason: "missing_consent", missing: key, regionId: resolved.regionId };
      }
    }
    return { available: true, regionId: resolved.regionId };
  }
  function applyRegionDowngradeToggles(prefs, oldRegionId, newRegionId, pack) {
    const next = { ...prefs };
    const consents = prefsToConsents(next);
    const checks = [
      ["backup", "cloudEncryptedBackup"],
      ["contributeAnonData", "anonymizedResearchPool"],
      ["useOpenData", "openDataPoolForAi"],
      ["aiEnabled", "onDeviceLlmDownload"],
      ["sessionRecording", "sessionRecording"]
    ];
    for (const [field, featureKey] of checks) {
      const avail = getFeatureAvailability(newRegionId, featureKey, consents, pack);
      if (!avail.available && next[field]) next[field] = false;
    }
    return next;
  }
  function prefsToConsents(prefs) {
    const p = prefs && typeof prefs === "object" ? prefs : {};
    return {
      healthData: p.healthDataConsent === true,
      healthDataConsent: p.healthDataConsent === true,
      cloudSync: p.backup === true,
      backup: p.backup === true,
      anonContribution: p.contributeAnonData === true,
      contributeAnonData: p.contributeAnonData === true,
      aiModel: p.aiEnabled !== false && (p.aiModelDownloadConsent === "granted" || p.aiEnabled === true),
      aiEnabled: p.aiEnabled !== false,
      aiModelDownloadConsent: p.aiModelDownloadConsent,
      sessionRecording: p.sessionRecording === true
    };
  }

  // packages/shared/src/privacy/residency.mjs
  var DEFAULT_RESIDENCY = {
    code: "default",
    label: "Operator default region",
    regionLabel: "See subprocessors documentation",
    projectUrl: ""
  };
  function getResidencyConfigFromEnv(env = {}) {
    const code = env.RIANELL_DATA_RESIDENCY_CODE || env.DATA_RESIDENCY_CODE || "default";
    const label = env.RIANELL_DATA_RESIDENCY_LABEL || env.DATA_RESIDENCY_LABEL || DEFAULT_RESIDENCY.label;
    const regionLabel = env.RIANELL_DATA_RESIDENCY_REGION || env.DATA_RESIDENCY_REGION || DEFAULT_RESIDENCY.regionLabel;
    const projectUrl = env.SUPABASE_URL || env.RIANELL_SUPABASE_URL || "";
    return { code, label, regionLabel, projectUrl };
  }
  function getResidencyDisplayLabel(config) {
    const c = config || DEFAULT_RESIDENCY;
    if (c.regionLabel && c.regionLabel !== DEFAULT_RESIDENCY.regionLabel) {
      return `${c.label} (${c.regionLabel})`;
    }
    return c.label;
  }

  // packages/shared/src/privacy/residency-registry.mjs
  function getResidencyRegistry(config = {}) {
    const eu = config.eu || {};
    const us = config.us || {};
    return {
      eu: {
        code: "eu",
        label: eu.label || "EU",
        regionLabel: eu.regionLabel || "Frankfurt",
        supabaseUrl: eu.supabaseUrl || "",
        anonKey: eu.anonKey || ""
      },
      us: {
        code: "us",
        label: us.label || "US",
        regionLabel: us.regionLabel || "East",
        supabaseUrl: us.supabaseUrl || "",
        anonKey: us.anonKey || ""
      },
      default: {
        code: "default",
        label: config.default?.label || "Default",
        regionLabel: config.default?.regionLabel || "",
        supabaseUrl: config.default?.supabaseUrl || config.supabaseUrl || "",
        anonKey: config.default?.anonKey || config.anonKey || ""
      }
    };
  }
  function resolveDataResidency(privacyRegion, userPreference, pack, registry) {
    const resolved = resolvePolicyPack(privacyRegion, pack);
    const required = resolved.requiredDataResidency || "default";
    const reg = registry || getResidencyRegistry();
    if (required === "eu" && reg.eu?.supabaseUrl) return reg.eu;
    if (required === "us" && reg.us?.supabaseUrl) return reg.us;
    if (userPreference === "eu" && reg.eu?.supabaseUrl) return reg.eu;
    if (userPreference === "us" && reg.us?.supabaseUrl) return reg.us;
    return reg.default;
  }
  function getResidencyChooserOptions() {
    return [];
  }
  function canChooseDataResidency() {
    return false;
  }

  // packages/shared/src/privacy/profileSync.mjs
  function isPrivacyRegionConfigured(prefs) {
    const id = prefs?.privacyRegion;
    return typeof id === "string" && id.length > 0 && getPolicyPack().regions?.[id] != null;
  }
  function applyPrivacyProfileToLocal(prefs, profile) {
    const base = prefs && typeof prefs === "object" ? { ...prefs } : {};
    if (!profile || typeof profile !== "object") return base;
    if (typeof profile.privacy_region === "string") base.privacyRegion = profile.privacy_region;
    if (typeof profile.privacy_region_source === "string") base.privacyRegionSource = profile.privacy_region_source;
    if (profile.privacy_region_updated_at) base.privacyRegionUpdatedAt = profile.privacy_region_updated_at;
    if (typeof profile.ui_locale === "string") base.uiLocale = profile.ui_locale;
    if (typeof profile.ui_locale_source === "string") base.uiLocaleSource = profile.ui_locale_source;
    if (profile.ui_locale_updated_at) base.uiLocaleUpdatedAt = profile.ui_locale_updated_at;
    if (typeof profile.data_residency_code === "string") base.dataResidencyCode = profile.data_residency_code;
    if (typeof profile.data_residency_project_url === "string") base.dataResidencyProjectUrl = profile.data_residency_project_url;
    if (typeof profile.policy_acknowledged_version === "string") base.policyAcknowledgedVersion = profile.policy_acknowledged_version;
    if (profile.policy_acknowledged_at) base.policyAcknowledgedAt = profile.policy_acknowledged_at;
    if (profile.consents && typeof profile.consents === "object") {
      if (profile.consents.healthDataConsent === true) base.healthDataConsent = true;
      if (profile.consents.healthDataConsentAt) base.healthDataConsentAt = profile.consents.healthDataConsentAt;
      if (profile.consents.backup === false) base.backup = false;
      if (profile.consents.contributeAnonData === false) base.contributeAnonData = false;
    }
    return base;
  }
  function privacyProfileFromLocal(prefs, userId) {
    return {
      user_id: userId,
      privacy_region: prefs.privacyRegion || "other",
      privacy_region_source: prefs.privacyRegionSource || "user",
      privacy_region_updated_at: prefs.privacyRegionUpdatedAt || (/* @__PURE__ */ new Date()).toISOString(),
      ui_locale: prefs.uiLocale || "en-GB",
      ui_locale_source: prefs.uiLocaleSource || "user",
      ui_locale_updated_at: prefs.uiLocaleUpdatedAt || (/* @__PURE__ */ new Date()).toISOString(),
      data_residency_code: "default",
      data_residency_project_url: prefs.dataResidencyProjectUrl || "",
      policy_pack_id: "v1.0.0",
      policy_acknowledged_at: prefs.policyAcknowledgedAt || null,
      policy_acknowledged_version: prefs.policyAcknowledgedVersion || null,
      consents: {
        healthDataConsent: prefs.healthDataConsent === true,
        healthDataConsentAt: prefs.healthDataConsentAt || null,
        backup: prefs.backup !== false,
        contributeAnonData: prefs.contributeAnonData === true,
        aiEnabled: prefs.aiEnabled !== false
      },
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
  }

  // packages/shared/src/settings/trackingProfile.mjs
  var TRACKING_PROFILE_FIELD_KEYS = ["mood", "pain", "notes", "sleep", "fatigue"];
  function getDefaultTrackingProfileFields() {
    return {
      mood: true,
      pain: true,
      notes: true,
      sleep: false,
      fatigue: false
    };
  }
  function normalizeTrackingProfile(value) {
    const d = {
      condition: "",
      fields: getDefaultTrackingProfileFields(),
      configuredAt: null
    };
    const v = value && typeof value === "object" ? value : {};
    const fieldsIn = v.fields && typeof v.fields === "object" ? v.fields : {};
    const fields = { ...d.fields };
    for (const key of TRACKING_PROFILE_FIELD_KEYS) {
      if (typeof fieldsIn[key] === "boolean") fields[key] = fieldsIn[key];
    }
    return {
      condition: typeof v.condition === "string" ? v.condition.slice(0, 200) : d.condition,
      fields,
      configuredAt: typeof v.configuredAt === "string" ? v.configuredAt : d.configuredAt
    };
  }
  function isTrackingProfileConfigured(profile) {
    const p = normalizeTrackingProfile(profile);
    return !!p.configuredAt;
  }

  // packages/shared/src/onboarding/firstRunSteps.mjs
  var FIRST_RUN_STEP_IDS = [
    "region",
    "healthConsent",
    "cookies",
    "sessionRecording",
    "trackingProfile",
    "tutorial",
    "aiDownload",
    "install"
  ];
  var FIRST_RUN_STEP_META = {
    region: { titleKey: "onboarding.step.region" },
    healthConsent: { titleKey: "onboarding.step.healthConsent" },
    cookies: { titleKey: "onboarding.step.cookies" },
    sessionRecording: { titleKey: "onboarding.step.sessionRecording" },
    trackingProfile: { titleKey: "onboarding.step.trackingProfile" },
    tutorial: { titleKey: "onboarding.step.tutorial" },
    aiDownload: { titleKey: "onboarding.step.aiDownload" },
    install: { titleKey: "onboarding.step.install" }
  };
  function shouldSkipFirstRunStep(stepId, prefs, ctx) {
    const p = prefs && typeof prefs === "object" ? prefs : {};
    const c = ctx && typeof ctx === "object" ? ctx : { platform: "pwa" };
    switch (stepId) {
      case "region":
        return isPrivacyRegionConfigured(p);
      case "healthConsent":
        return p.privacyRegion !== "eea_uk" || p.healthDataConsent === true;
      case "cookies":
        if (p.cookieConsent === true) return true;
        if (c.cookieConsentAccepted === true) return true;
        return false;
      case "sessionRecording":
        if (typeof p.sessionRecordingDisclosureAt === "string" && p.sessionRecordingDisclosureAt.length > 0) {
          return true;
        }
        {
          const regionId = typeof p.privacyRegion === "string" && p.privacyRegion ? p.privacyRegion : "other";
          const resolved = resolvePolicyPack(regionId);
          const feat = resolved.features?.sessionRecording;
          if (!feat || feat.enabled === false) return true;
        }
        return false;
      case "trackingProfile":
        return true;
      case "tutorial":
        return p.tutorialSeen === true || c.tutorialSeenLegacy === true;
      case "aiDownload":
        if (p.aiEnabled === false) return true;
        if (p.aiModelDownloadConsent === "granted" || p.aiModelDownloadConsent === "deferred") return true;
        return false;
      case "install":
        if (c.platform !== "pwa") return true;
        if (c.installModalSeen === true) return true;
        if (c.standalonePwa === true) return true;
        return false;
      default:
        return true;
    }
  }

  // packages/shared/src/onboarding/firstRunOrchestrator.mjs
  function resolveNextIndexInPlan(plan, completedStepId) {
    if (!plan.length) return 0;
    const completedIdx = plan.findIndex((s) => s.id === completedStepId);
    if (completedIdx >= 0 && completedIdx < plan.length - 1) return completedIdx + 1;
    if (completedIdx < 0) {
      const completedOrder = FIRST_RUN_STEP_IDS.indexOf(completedStepId);
      if (completedOrder >= 0) {
        for (let i = completedOrder + 1; i < FIRST_RUN_STEP_IDS.length; i += 1) {
          const idx = plan.findIndex((s) => s.id === FIRST_RUN_STEP_IDS[i]);
          if (idx >= 0) return idx;
        }
      }
    }
    return 0;
  }
  function buildFirstRunPlan(prefs, ctx) {
    return FIRST_RUN_STEP_IDS.filter((id) => !shouldSkipFirstRunStep(id, prefs, ctx)).map((id) => ({ id }));
  }
  function resolveNextStepIndexAfterComplete(prefs, ctx, completedStepId) {
    const plan = buildFirstRunPlan(prefs, ctx);
    return resolveNextIndexInPlan(plan, completedStepId);
  }
  function isFirstRunWizardComplete(prefs, ctx) {
    const p = prefs && typeof prefs === "object" ? prefs : {};
    const c = ctx && typeof ctx === "object" ? ctx : {};
    if (typeof p.firstRunWizardCompletedAt === "string" && p.firstRunWizardCompletedAt.length > 0) {
      return true;
    }
    const tutorialDone = p.tutorialSeen === true || c.tutorialSeenLegacy === true;
    if (isPrivacyRegionConfigured(p) && tutorialDone) {
      const remaining = buildFirstRunPlan(p, c);
      if (remaining.length === 0) return true;
    }
    return false;
  }
  function migrateFirstRunWizardPrefs(prefs, ctx) {
    const p = prefs && typeof prefs === "object" ? { ...prefs } : {};
    if (p.firstRunWizardCompletedAt) return p;
    if (!isFirstRunWizardComplete(p, ctx)) return p;
    const migratedAt = typeof p.tutorialSeenAt === "string" && p.tutorialSeenAt || typeof p.policyAcknowledgedAt === "string" && p.policyAcknowledgedAt || (/* @__PURE__ */ new Date()).toISOString();
    return {
      ...p,
      firstRunWizardCompletedAt: migratedAt,
      tutorialSeen: p.tutorialSeen !== false
    };
  }
  function completeFirstRunWizard(prefs) {
    const p = prefs && typeof prefs === "object" ? { ...prefs } : {};
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (!isTrackingProfileConfigured(p.trackingProfile)) {
      const condition = typeof p.medicalCondition === "string" ? p.medicalCondition : "";
      p.trackingProfile = normalizeTrackingProfile({
        condition,
        configuredAt: now
      });
    }
    return {
      ...p,
      firstRunWizardCompletedAt: now,
      tutorialSeen: true
    };
  }
  function rebuildFirstRunPlanFromStep(prefs, ctx, currentStepId) {
    const plan = buildFirstRunPlan(prefs, ctx);
    if (!currentStepId) return plan;
    const idx = plan.findIndex((s) => s.id === currentStepId);
    if (idx < 0) return plan;
    return plan.slice(idx);
  }

  // packages/shared/src/privacy/consentGate.mjs
  function getConsentBlockReason(prefs, ctx, opts = {}) {
    const p = prefs && typeof prefs === "object" ? prefs : {};
    const requireFirstRun = opts.requireFirstRun !== false;
    if (!isPrivacyRegionConfigured(p)) return "region-unconfigured";
    if (p.privacyRegion === "eea_uk" && p.healthDataConsent !== true) {
      return "missing-health-consent";
    }
    const health = getFeatureAvailability(
      String(p.privacyRegion || "other"),
      "localHealthLogging",
      prefsToConsents(p)
    );
    if (!health.available) {
      if (p.privacyRegion !== "eea_uk" && isPrivacyRegionConfigured(p)) {
      } else if (health.reason === "missing_consent") {
        return "missing-health-consent";
      } else {
        return "health-logging-unavailable";
      }
    }
    if (requireFirstRun && !isFirstRunWizardComplete(p, ctx)) {
      return "first-run-incomplete";
    }
    return null;
  }
  function isHealthLoggingUnlocked(prefs, ctx) {
    return getConsentBlockReason(prefs, ctx) === null;
  }

  // packages/shared/src/privacy/checkPolicyDrift.mjs
  async function checkPolicyDrift(localAckVersion, fetchImpl = globalThis.fetch) {
    const embedded = getPolicyPack().policyPackId ?? getPolicyPack().version ?? "1.0.0";
    const local = localAckVersion || embedded;
    try {
      const url = typeof window !== "undefined" && window.POLICY_MANIFEST_URL ? window.POLICY_MANIFEST_URL : "/policy-manifest.json";
      const res = await fetchImpl(url, { cache: "no-store" });
      if (!res.ok) return { drift: false, embedded };
      const remote = await res.json();
      const remoteVersion = remote.version || remote.policyPackId;
      if (!remoteVersion) return { drift: false, embedded };
      const drift = remoteVersion !== local;
      return {
        drift,
        requiresReconsent: drift && remote.requiresReconsent === true,
        remoteVersion,
        embedded,
        changelog: remote.changelog || "",
        affectedRegions: remote.affectedRegions || []
      };
    } catch {
      return { drift: false, embedded };
    }
  }
  function checkPolicyDriftSync(localAckVersion) {
    const embedded = getPolicyPack().policyPackId ?? "1.0.0";
    return { drift: false, embedded, local: localAckVersion || embedded };
  }

  // packages/shared/src/privacy/residencyRouting.mjs
  function needsDataResidencyMigration(privacyRegion, activeResidencyCode, pack, registry) {
    const resolved = resolvePolicyPack(privacyRegion, pack);
    const required = resolved.requiredDataResidency || "default";
    if (required === "default") return false;
    const active = activeResidencyCode || "default";
    if (required === active) return false;
    const reg = registry || getResidencyRegistry();
    const target = resolveDataResidency(privacyRegion, null, pack, reg);
    return !!(target?.supabaseUrl && target.code !== active);
  }
  function resolveAuthResidencyCode(privacyRegion, pack, registry, userPreference) {
    const reg = registry || getResidencyRegistry();
    const bucket = resolveDataResidency(privacyRegion, userPreference || null, pack, reg);
    return bucket?.code || "default";
  }
  var MIGRATION_COPY = {
    title: "Move your cloud data",
    lead: "Your privacy region requires encrypted backups in a different data region. Export from this project, sign in on the target region, then import.",
    stepExport: "Export encrypted backup from current project",
    stepTarget: "Sign in or register on the target Supabase project",
    stepImport: "Import backup on the target project",
    stepDelete: "Delete data on the source project when import is verified",
    blockedSync: "Cloud sync is paused until data residency migration completes."
  };

  // packages/shared/src/privacy/migrationState.mjs
  function applyMigrationPendingFlag(prefs) {
    return { ...prefs, migrationPending: false };
  }
  function isCloudSyncBlockedByMigration() {
    return false;
  }
  function clearMigrationPending(prefs, _code, _url) {
    return { ...prefs, migrationPending: false };
  }

  // packages/shared/src/privacy/localOnlyMode.mjs
  var LOCAL_ONLY_NETWORK_FEATURES = [
    { id: "cloudSync", labelKey: "settings.privacy.localOnly.cloudSync" },
    { id: "anonymizedSync", labelKey: "settings.privacy.localOnly.anonymizedSync" },
    { id: "modelDownload", labelKey: "settings.privacy.localOnly.modelDownload" },
    { id: "barcodeFood", labelKey: "settings.privacy.localOnly.barcodeFood" },
    { id: "bugReport", labelKey: "settings.privacy.localOnly.bugReport" },
    { id: "remoteLlm", labelKey: "settings.privacy.localOnly.remoteLlm" },
    { id: "sessionRecording", labelKey: "settings.privacy.localOnly.sessionRecording" }
  ];
  function isLocalOnlyModeEnabled(prefs) {
    const p = prefs && typeof prefs === "object" ? prefs : {};
    return p.localOnlyMode === true;
  }
  function shouldAllowNetworkOperation(prefs, featureId) {
    if (!isLocalOnlyModeEnabled(prefs)) return true;
    const blocked = new Set(LOCAL_ONLY_NETWORK_FEATURES.map((f) => f.id));
    return !blocked.has(featureId);
  }
  function localOnlyBlockReason(featureId) {
    return { blocked: true, featureId, reason: "local_only_mode" };
  }

  // packages/shared/src/privacy/processingActivityLog.mjs
  var PROCESSING_ACTIVITY_LOG_KEY = "rianellProcessingActivityLog";
  var PROCESSING_ACTIVITY_LOG_MAX = 500;
  var VALID_TYPES = /* @__PURE__ */ new Set(["cloud_sync", "anon_sync", "model_download", "export", "encrypted_export"]);
  function normalizeActivityEntry(raw) {
    const v = raw && typeof raw === "object" ? raw : {};
    const type = VALID_TYPES.has(v.type) ? v.type : "export";
    const at = typeof v.at === "string" ? v.at : (/* @__PURE__ */ new Date()).toISOString();
    const detail = typeof v.detail === "string" ? v.detail.slice(0, 200) : void 0;
    const out = { type, at };
    if (detail) out.detail = detail;
    return out;
  }
  function appendProcessingActivity(existing, entry) {
    const list = Array.isArray(existing) ? existing.map(normalizeActivityEntry) : [];
    list.unshift(normalizeActivityEntry(entry));
    return list.slice(0, PROCESSING_ACTIVITY_LOG_MAX);
  }
  function readProcessingActivity(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map(normalizeActivityEntry).slice(0, PROCESSING_ACTIVITY_LOG_MAX);
  }
  function formatActivityTypeLabel(type) {
    switch (type) {
      case "cloud_sync":
        return "settings.privacy.activity.cloudSync";
      case "anon_sync":
        return "settings.privacy.activity.anonSync";
      case "model_download":
        return "settings.privacy.activity.modelDownload";
      case "encrypted_export":
        return "settings.privacy.activity.encryptedExport";
      default:
        return "settings.privacy.activity.export";
    }
  }

  // packages/shared/src/privacy/anonPoolFieldManifest.mjs
  var ANON_POOL_INCLUDED_FIELDS = [
    { id: "date", labelKey: "settings.privacy.anonPool.field.date" },
    { id: "vitals", labelKey: "settings.privacy.anonPool.field.vitals" },
    { id: "scores", labelKey: "settings.privacy.anonPool.field.scores" },
    { id: "flare", labelKey: "settings.privacy.anonPool.field.flare" },
    { id: "foodNames", labelKey: "settings.privacy.anonPool.field.foodNames" },
    { id: "exercise", labelKey: "settings.privacy.anonPool.field.exercise" },
    { id: "stepsHydration", labelKey: "settings.privacy.anonPool.field.stepsHydration" },
    { id: "energyClarity", labelKey: "settings.privacy.anonPool.field.energyClarity" }
  ];
  var ANON_POOL_EXCLUDED_FIELDS = [
    { id: "notes", labelKey: "settings.privacy.anonPool.field.notes" },
    { id: "symptoms", labelKey: "settings.privacy.anonPool.field.symptoms" },
    { id: "stressors", labelKey: "settings.privacy.anonPool.field.stressors" },
    { id: "painLocation", labelKey: "settings.privacy.anonPool.field.painLocation" },
    { id: "userName", labelKey: "settings.privacy.anonPool.field.userName" },
    { id: "medicalCondition", labelKey: "settings.privacy.anonPool.field.medicalCondition" }
  ];

  // packages/shared/src/privacy/encryptedExport.mjs
  var ENCRYPTED_EXPORT_FORMAT = "rianell-encrypted-export-v1";
  var ENCRYPTED_EXPORT_KDF_ITERATIONS = 12e4;
  var ENCRYPTED_EXPORT_MIN_LENGTH = 12;
  function getSubtle(subtle) {
    const s = subtle || typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.subtle;
    if (!s) throw new Error("Web Crypto subtle not available");
    return s;
  }
  function randomBytes(n) {
    const arr = new Uint8Array(n);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(arr);
    else throw new Error("crypto.getRandomValues not available");
    return arr;
  }
  function bytesToBase64(bytes) {
    if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
    let binary = "";
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary);
  }
  function base64ToBytes(b64) {
    if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(b64, "base64"));
    const binary = atob(b64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  }
  async function deriveExportKey(passphrase, salt, subtle, iterations) {
    const enc = new TextEncoder();
    const cryptoSubtle = getSubtle(subtle);
    const iters = iterations || ENCRYPTED_EXPORT_KDF_ITERATIONS;
    const keyMaterial = await cryptoSubtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
    return cryptoSubtle.deriveKey(
      { name: "PBKDF2", salt, iterations: iters, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }
  async function encryptExportWithPassphrase(payload, passphrase, subtle, opts) {
    const options = opts && typeof opts === "object" ? opts : {};
    const iterations = options.iterations || ENCRYPTED_EXPORT_KDF_ITERATIONS;
    const minLen = typeof options.minPassphraseLength === "number" ? Math.max(1, Math.floor(options.minPassphraseLength)) : ENCRYPTED_EXPORT_MIN_LENGTH;
    if (typeof passphrase !== "string" || passphrase.length < minLen) {
      throw new Error(`Passphrase must be at least ${minLen} characters`);
    }
    const cryptoSubtle = getSubtle(subtle);
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const key = await deriveExportKey(passphrase, salt, cryptoSubtle, iterations);
    const encoded = new TextEncoder().encode(JSON.stringify(payload));
    const cipher = await cryptoSubtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
    return {
      format: ENCRYPTED_EXPORT_FORMAT,
      kdf: "PBKDF2",
      iterations,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
      ciphertext: bytesToBase64(new Uint8Array(cipher))
    };
  }
  async function decryptExportWithPassphrase(envelope, passphrase, subtle) {
    if (!envelope || envelope.format !== ENCRYPTED_EXPORT_FORMAT) {
      throw new Error("Unsupported encrypted export format");
    }
    if (typeof passphrase !== "string" || !passphrase) throw new Error("Passphrase required");
    const cryptoSubtle = getSubtle(subtle);
    const salt = base64ToBytes(envelope.salt);
    const iv = base64ToBytes(envelope.iv);
    const cipher = base64ToBytes(envelope.ciphertext);
    const iterations = envelope.iterations || ENCRYPTED_EXPORT_KDF_ITERATIONS;
    const key = await deriveExportKey(passphrase, salt, cryptoSubtle, iterations);
    const plain = await cryptoSubtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
    return JSON.parse(new TextDecoder().decode(plain));
  }

  // packages/shared/src/privacy/passwordStrength.mjs
  var SCORE_LABELS = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
  var COMMON = ["password", "123456", "qwerty", "letmein", "welcome", "monkey"];
  var WALKS = ["qwerty", "asdfgh", "zxcvbn", "12345678"];
  function checkPasswordStrength(pw) {
    if (!pw) {
      return { score: 0, label: SCORE_LABELS[0], feedback: ["Enter a password"] };
    }
    let score = 0;
    const feedback = [];
    if (pw.length >= 12) score++;
    else feedback.push("Use at least 12 characters");
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    else feedback.push("Mix upper and lower case");
    if (/\d/.test(pw)) score++;
    else feedback.push("Add a number");
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    else feedback.push("Add a special character");
    const low = pw.toLowerCase();
    if (COMMON.some((c) => low.includes(c)) || WALKS.some((w) => low.includes(w))) {
      score = Math.max(0, score - 1);
      feedback.push("Avoid common patterns");
    }
    const capped = Math.min(4, Math.max(0, score));
    return {
      score: capped,
      label: SCORE_LABELS[capped],
      feedback
    };
  }
  function isWeakPin(pin) {
    if (!pin || pin.length < 4) return true;
    if (!/^\d+$/.test(pin)) return true;
    if (/^(\d)\1+$/.test(pin)) return true;
    const digits = pin.split("").map(Number);
    const asc = digits.every((d, i) => i === 0 || d === digits[i - 1] + 1);
    const desc = digits.every((d, i) => i === 0 || d === digits[i - 1] - 1);
    return asc || desc;
  }

  // packages/shared/src/privacy/caregiverMode.mjs
  var CAREGIVER_RELATIONSHIPS = ["parent", "guardian", "other"];
  function normalizeCaregiverSettings(prefs) {
    const p = prefs && typeof prefs === "object" ? prefs : {};
    const relationship = CAREGIVER_RELATIONSHIPS.includes(p.caregiverRelationship) ? p.caregiverRelationship : "parent";
    const enabled = p.caregiverModeEnabled === true;
    return {
      caregiverModeEnabled: enabled,
      caregiverDependentName: enabled && typeof p.caregiverDependentName === "string" ? p.caregiverDependentName.trim() : "",
      caregiverRelationship: relationship
    };
  }
  function buildProxyLogMetadata(prefs) {
    const c = normalizeCaregiverSettings(prefs);
    if (!c.caregiverModeEnabled) return {};
    return {
      proxyLoggedBy: "caregiver",
      proxyRelationship: c.caregiverRelationship,
      dependentLabel: c.caregiverDependentName || "dependent"
    };
  }
  function stampLogEntryForCaregiver(entry, prefs) {
    const meta = buildProxyLogMetadata(prefs);
    if (!meta.proxyLoggedBy) return entry;
    return { ...entry, ...meta };
  }

  // packages/shared/src/i18n/resolveLocale.mjs
  function regionConfig(regionId, pack) {
    const p = pack || getPolicyPack();
    const regions = p?.regions;
    if (!regions) return void 0;
    const id = regions[regionId] ? regionId : "other";
    return regions[id];
  }
  function getDefaultLocaleForRegion(regionId, pack) {
    const region = regionConfig(regionId || DEFAULT_PRIVACY_REGION, pack);
    const locale = region?.defaultLocale;
    return isValidLocaleId(locale) ? locale : DEFAULT_LOCALE;
  }
  function getSupportedLocalesForRegion(regionId, pack) {
    const region = regionConfig(regionId || DEFAULT_PRIVACY_REGION, pack);
    const list = Array.isArray(region?.supportedLocales) ? region.supportedLocales : [DEFAULT_LOCALE];
    return list.filter(isValidLocaleId);
  }
  function resolveActiveLocale(prefs, pack) {
    const explicit = prefs?.uiLocale;
    if (isValidLocaleId(explicit)) return explicit;
    const region = prefs?.privacyRegion;
    if (region) return getDefaultLocaleForRegion(region, pack);
    return DEFAULT_LOCALE;
  }
  function applyRegionDefaultLocale(prefs, regionId, pack) {
    const next = { ...prefs && typeof prefs === "object" ? prefs : {} };
    next.privacyRegion = regionId;
    if (!next.uiLocale || next.uiLocaleSource === "onboarding" || next.uiLocaleSource === "region") {
      next.uiLocale = getDefaultLocaleForRegion(regionId, pack);
      next.uiLocaleSource = "region";
    }
    return next;
  }

  // packages/shared/src/i18n/format.mjs
  var GRANULAR_DATE_KEYS = [
    "weekday",
    "era",
    "year",
    "month",
    "day",
    "hour",
    "minute",
    "second",
    "timeZoneName",
    "fractionalSecondDigits"
  ];
  function hasGranularDateOptions(opts) {
    return GRANULAR_DATE_KEYS.some((k) => opts[k] !== void 0);
  }
  var ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  function parseIsoDateLocal(iso) {
    const raw = typeof iso === "string" ? iso.trim() : "";
    if (!ISO_DATE_RE.test(raw)) return null;
    const d = /* @__PURE__ */ new Date(`${raw}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  function coerceDateValue(value) {
    if (value instanceof Date) return value;
    const local = parseIsoDateLocal(value);
    if (local) return local;
    return new Date(value);
  }
  function formatIsoDate(iso, locale, opts = {}) {
    const d = parseIsoDateLocal(iso);
    if (!d) return typeof iso === "string" ? iso : "";
    return formatDate(d, locale, opts);
  }
  function formatDate(value, locale, opts = {}) {
    const d = coerceDateValue(value);
    if (Number.isNaN(d.getTime())) return "";
    const { dateStyle, timeStyle, ...rest } = opts;
    const intlOpts = { ...rest };
    const granular = hasGranularDateOptions(intlOpts);
    if (!granular) {
      intlOpts.dateStyle = dateStyle ?? "medium";
    } else if (dateStyle !== void 0) {
      intlOpts.dateStyle = dateStyle;
    }
    if (timeStyle !== void 0 && !granular) {
      intlOpts.timeStyle = timeStyle;
    }
    try {
      return new Intl.DateTimeFormat(locale || "en-GB", intlOpts).format(d);
    } catch {
      return d.toLocaleDateString(locale || "en-GB", intlOpts);
    }
  }
  function formatNumber(value, locale, opts = {}) {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return "";
    return new Intl.NumberFormat(locale || "en-GB", opts).format(n);
  }
  function formatRelativeDay(iso, locale) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(d);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target - today) / 864e5);
    if (diffDays === 0) return "Today";
    if (diffDays === -1) return "Yesterday";
    if (diffDays === 1) return "Tomorrow";
    return formatDate(d, locale, { dateStyle: "medium" });
  }
  function languageNameForLocale(localeId, displayLocale = "en-GB") {
    try {
      const dn = new Intl.DisplayNames([displayLocale], { type: "language" });
      const [lang] = String(localeId || "").split("-");
      return dn.of(lang) || localeId;
    } catch {
      return localeId;
    }
  }

  // packages/shared/src/i18n/rtl.mjs
  function isRtlLocale(localeId) {
    const id = String(localeId || "").toLowerCase();
    return id === "ar" || id.startsWith("ar-") || id === "he" || id.startsWith("he-");
  }
  function textDirection(localeId) {
    return isRtlLocale(localeId) ? "rtl" : "ltr";
  }

  // packages/shared/src/i18n/promptPackData.mjs
  var PROMPT_PACKS_V1 = {
    "ar": {
      "locale": "ar",
      "label": "\u0627\u0644\u0639\u0631\u0628\u064A\u0629",
      "llmCapability": "ui-only",
      "strings": {
        "motd.system": "You write one short, simple quote about healthy living for a health tracking app. Topics: sleep, water, gentle movement, rest, fresh air, balanced food, or stress relief. Use plain everyday words. Max 18 words. No names. No medical advice. No quotation marks. Reply with only the quote sentence.",
        "motd.user": "Write one healthy-lifestyle quote.",
        "summary.system": "You summarise health tracking data for the patient in exactly 2 short sentences. Use only the data provided. Mention 1-2 specific findings. Be clear and encouraging. Reply with only the summary text.",
        "suggest.system": "You write one short sentence for a daily health log note. Compare today to the recent average. Use only the data provided. Reply with only the note sentence.",
        "context.improving": "Improving: {metrics}.",
        "context.worsening": "Worsening: {metrics}.",
        "context.stable": "Stable: {metrics}.",
        "context.dataLine": "{dayCount} day(s) of data.",
        "context.flares": "Flares: {count} day(s).",
        "context.topStressor": "Top stressor: {name}{pct}."
      }
    },
    "de-DE": {
      "locale": "de-DE",
      "label": "Deutsch",
      "llmCapability": "full",
      "strings": {
        "motd.system": "Du schreibst ein kurzes, einfaches Zitat \xFCber gesundes Leben f\xFCr eine Gesundheits-App. Themen: Schlaf, Wasser, sanfte Bewegung, Ruhe, frische Luft, ausgewogene Ern\xE4hrung oder Stressabbau. Alltagssprache. Max. 18 W\xF6rter. Keine Namen. Keine medizinischen Ratschl\xE4ge. Keine Anf\xFChrungszeichen. Antworte nur mit dem Zitat.",
        "motd.user": "Schreibe ein Zitat zu einem gesunden Lebensstil.",
        "summary.system": "Du fasst Gesundheitsdaten f\xFCr den Nutzer in genau 2 kurzen S\xE4tzen zusammen. Nutze nur die bereitgestellten Daten. Nenne 1-2 konkrete Befunde. Sei klar und ermutigend. Antworte nur mit dem Text.",
        "suggest.system": "Du schreibst einen kurzen Satz f\xFCr eine Tagesnotiz. Vergleiche heute mit dem j\xFCngsten Durchschnitt. Nutze nur die bereitgestellten Daten. Antworte nur mit dem Satz.",
        "homeQuestion.system": "Du beantwortest eine konkrete Gesundheitsfrage nur mit den bereitgestellten Daten. Schreibe 3-5 kurze S\xE4tze in einfacher Sprache. Keine Diagnose oder medizinischen Anweisungen. Sei ermutigend. Antworte nur mit der Antwort.",
        "context.improving": "Verbesserung: {metrics}.",
        "context.worsening": "Verschlechterung: {metrics}.",
        "context.stable": "Stabil: {metrics}.",
        "context.dataLine": "{dayCount} Tag(e) mit Daten.",
        "context.flares": "Sch\xFCbe: {count} Tag(e).",
        "context.topStressor": "Hauptstressfaktor: {name}{pct}."
      }
    },
    "en-AU": {
      "locale": "en-AU",
      "label": "English (UK)",
      "llmCapability": "full",
      "strings": {
        "motd.system": "You write one short, simple quote about healthy living for a health tracking app. Topics: sleep, water, gentle movement, rest, fresh air, balanced food, or stress relief. Use plain everyday words. Max 18 words. No names. No medical advice. No quotation marks. Reply with only the quote sentence.",
        "motd.user": "Write one healthy-lifestyle quote.",
        "summary.system": "You summarise health tracking data for the patient in exactly 2 short sentences. Use only the data provided. Mention 1-2 specific findings. Be clear and encouraging. Reply with only the summary text.",
        "suggest.system": "You write one short sentence for a daily health log note. Compare today to the recent average. Use only the data provided. Reply with only the note sentence.",
        "context.improving": "Improving: {metrics}.",
        "context.worsening": "Worsening: {metrics}.",
        "context.stable": "Stable: {metrics}.",
        "context.dataLine": "{dayCount} day(s) of data.",
        "context.flares": "Flares: {count} day(s).",
        "context.topStressor": "Top stressor: {name}{pct}."
      }
    },
    "en-GB": {
      "locale": "en-GB",
      "label": "English (UK)",
      "llmCapability": "full",
      "strings": {
        "motd.system": "You write one short, simple quote about healthy living for a health tracking app. Topics: sleep, water, gentle movement, rest, fresh air, balanced food, or stress relief. Use plain everyday words. Max 18 words. No names. No medical advice. No quotation marks. Reply with only the quote sentence.",
        "motd.user": "Write one healthy-lifestyle quote.",
        "summary.system": "You write a coaching summary from health tracking data in 2-3 short sentences. Lead with the single most important finding. Reference the user's actual date range when provided (e.g. Over the last 30 days). End with one concrete suggestion tied to a specific tracked metric. Use active voice. No medical disclaimers or diagnosis language. Reply with only the summary text.",
        "suggest.system": "You write one short sentence for a daily health log note. Compare today to the recent average. Use only the data provided. Reply with only the note sentence.",
        "homeQuestion.system": "You answer one specific health-tracking question using only the data provided. Write 3-5 short sentences in plain language. No diagnosis or medical orders. Be encouraging. Reply with only the answer text.",
        "clinicianBrief.system": "You write a one-page clinician visit prep brief from health-tracking data. Use only the data provided. Structure: key patterns, symptom/stressor highlights, questions to ask the clinician. Plain language. No diagnosis or treatment orders. Max 180 words. Reply with only the brief text.",
        "doctorQuestions.system": "You suggest exactly three short questions a patient could ask their clinician at an upcoming visit. Use only the wellness tracking data provided. Wellness framing only, not medical advice or diagnosis. Reply as a numbered list (1-3), one question per line, no extra commentary.",
        "explainChart.system": "You explain a health chart range in plain language for the patient. Use only the metrics provided. Mention trends and one practical observation. No diagnosis. Max 4 short sentences. Reply with only the narration text.",
        "structured.system": 'You analyse health-tracking data and reply with JSON only: {"insights":["..."],"actions":["..."],"confidence":0.0}. insights: up to 3 short pattern observations. actions: up to 2 gentle self-care ideas. confidence: 0-1 number. Use only provided data. No diagnosis or prescriptions.',
        "weekChat.system": "You are a wellness diary coach. Answer using only the health log context provided. Max 4 short sentences. No diagnosis, prescriptions, or tool use. Stay within the conversation scope. Reply with only your answer text.",
        "persona.encouraging": "Use a warm, encouraging tone.",
        "persona.clinical": "Use a neutral, factual tone without hype.",
        "persona.minimal": "Use the fewest words possible; one short sentence when enough.",
        "context.improving": "Improving: {metrics}.",
        "context.worsening": "Worsening: {metrics}.",
        "context.stable": "Stable: {metrics}.",
        "context.dataLine": "{dayCount} day(s) of data.",
        "context.flares": "Flares: {count} day(s).",
        "context.topStressor": "Top stressor: {name}{pct}.",
        "summary.system.plain": "You write a coaching summary from health tracking data in 2-3 short sentences using plain B1 English. Lead with the most important finding. Reference the date range when given. End with one actionable suggestion tied to a metric. Active voice only. No disclaimers. Reply with only the summary text."
      }
    },
    "en-US": {
      "locale": "en-US",
      "label": "English (UK)",
      "llmCapability": "full",
      "strings": {
        "motd.system": "You write one short, simple quote about healthy living for a health tracking app. Topics: sleep, water, gentle movement, rest, fresh air, balanced food, or stress relief. Use plain everyday words. Max 18 words. No names. No medical advice. No quotation marks. Reply with only the quote sentence.",
        "motd.user": "Write one healthy-lifestyle quote.",
        "summary.system": "You write a coaching summary from health tracking data in 2-3 short sentences. Lead with the single most important finding. Reference the user's actual date range when provided (e.g. Over the last 30 days). End with one concrete suggestion tied to a specific tracked metric. Use active voice. No medical disclaimers or diagnosis language. Reply with only the summary text.",
        "suggest.system": "You write one short sentence for a daily health log note. Compare today to the recent average. Use only the data provided. Reply with only the note sentence.",
        "context.improving": "Improving: {metrics}.",
        "context.worsening": "Worsening: {metrics}.",
        "context.stable": "Stable: {metrics}.",
        "context.dataLine": "{dayCount} day(s) of data.",
        "context.flares": "Flares: {count} day(s).",
        "context.topStressor": "Top stressor: {name}{pct}.",
        "summary.system.plain": "You write a coaching summary from health tracking data in 2-3 short sentences using plain B1 English. Lead with the most important finding. Reference the date range when given. End with one actionable suggestion tied to a metric. Active voice only. No disclaimers. Reply with only the summary text."
      }
    },
    "es-ES": {
      "locale": "es-ES",
      "label": "Espa\xF1ol",
      "llmCapability": "full",
      "strings": {
        "motd.system": "Escribes una cita breve y sencilla sobre vida saludable para una app de seguimiento. Temas: sue\xF1o, agua, movimiento suave, descanso, aire fresco, comida equilibrada o alivio del estr\xE9s. Palabras cotidianas. M\xE1x. 18 palabras. Sin nombres. Sin consejo m\xE9dico. Sin comillas. Responde solo con la frase.",
        "motd.user": "Escribe una cita sobre estilo de vida saludable.",
        "summary.system": "Resumes datos de salud para el usuario en exactamente 2 frases cortas. Usa solo los datos proporcionados. Menciona 1-2 hallazgos concretos. S\xE9 claro y alentador. Responde solo con el resumen.",
        "suggest.system": "Escribes una frase corta para una nota diaria. Compara hoy con el promedio reciente. Usa solo los datos proporcionados. Responde solo con la frase.",
        "homeQuestion.system": "Respondes una pregunta concreta de salud usando solo los datos proporcionados. Escribe 3-5 frases cortas en lenguaje sencillo. Sin diagn\xF3stico ni \xF3rdenes m\xE9dicas. S\xE9 alentador. Responde solo con la respuesta.",
        "context.improving": "Mejorando: {metrics}.",
        "context.worsening": "Empeorando: {metrics}.",
        "context.stable": "Estable: {metrics}.",
        "context.dataLine": "{dayCount} d\xEDa(s) de datos.",
        "context.flares": "Brotes: {count} d\xEDa(s).",
        "context.topStressor": "Factor de estr\xE9s principal: {name}{pct}."
      }
    },
    "fr-FR": {
      "locale": "fr-FR",
      "label": "Fran\xE7ais",
      "llmCapability": "full",
      "strings": {
        "motd.system": "Tu \xE9cris une courte citation simple sur la vie saine pour une appli de suivi sant\xE9. Sujets : sommeil, eau, mouvement doux, repos, air frais, alimentation \xE9quilibr\xE9e ou gestion du stress. Mots courants. Max 18 mots. Pas de noms. Pas de conseil m\xE9dical. Pas de guillemets. R\xE9ponds uniquement par la phrase.",
        "motd.user": "\xC9cris une citation sur un mode de vie sain.",
        "summary.system": "Tu r\xE9sumes les donn\xE9es de suivi sant\xE9 pour le patient en exactement 2 phrases courtes. Utilise uniquement les donn\xE9es fournies. Mentionne 1 \xE0 2 constats pr\xE9cis. Sois clair et encourageant. R\xE9ponds uniquement par le r\xE9sum\xE9.",
        "suggest.system": "Tu \xE9cris une courte phrase pour une note de journal quotidien. Compare aujourd\u2019hui \xE0 la moyenne r\xE9cente. Utilise uniquement les donn\xE9es fournies. R\xE9ponds uniquement par la phrase.",
        "homeQuestion.system": "Tu r\xE9ponds \xE0 une question pr\xE9cise de suivi sant\xE9 en utilisant uniquement les donn\xE9es fournies. \xC9cris 3 \xE0 5 phrases courtes en langage simple. Pas de diagnostic ni d\u2019ordre m\xE9dical. Sois encourageant. R\xE9ponds uniquement par la r\xE9ponse.",
        "context.improving": "En am\xE9lioration : {metrics}.",
        "context.worsening": "En d\xE9gradation : {metrics}.",
        "context.stable": "Stable : {metrics}.",
        "context.dataLine": "{dayCount} jour(s) de donn\xE9es.",
        "context.flares": "Pouss\xE9es : {count} jour(s).",
        "context.topStressor": "Facteur de stress principal : {name}{pct}."
      }
    },
    "ga": {
      "locale": "ga",
      "label": "Gaeilge",
      "llmCapability": "ui-only",
      "strings": {
        "motd.system": "You write one short, simple quote about healthy living for a health tracking app. Topics: sleep, water, gentle movement, rest, fresh air, balanced food, or stress relief. Use plain everyday words. Max 18 words. No names. No medical advice. No quotation marks. Reply with only the quote sentence.",
        "motd.user": "Write one healthy-lifestyle quote.",
        "summary.system": "You summarise health tracking data for the patient in exactly 2 short sentences. Use only the data provided. Mention 1-2 specific findings. Be clear and encouraging. Reply with only the summary text.",
        "suggest.system": "You write one short sentence for a daily health log note. Compare today to the recent average. Use only the data provided. Reply with only the note sentence.",
        "homeQuestion.system": "You answer one specific health-tracking question using only the data provided. Write 3-5 short sentences in plain language. No diagnosis or medical orders. Be encouraging. Reply with only the answer text.",
        "context.improving": "Improving: {metrics}.",
        "context.worsening": "Worsening: {metrics}.",
        "context.stable": "Stable: {metrics}.",
        "context.dataLine": "{dayCount} day(s) of data.",
        "context.flares": "Flares: {count} day(s).",
        "context.topStressor": "Top stressor: {name}{pct}."
      }
    },
    "he": {
      "locale": "he",
      "label": "\u05E2\u05D1\u05E8\u05D9\u05EA",
      "llmCapability": "ui-only",
      "strings": {
        "motd.system": "You write one short, simple quote about healthy living for a health tracking app. Topics: sleep, water, gentle movement, rest, fresh air, balanced food, or stress relief. Use plain everyday words. Max 18 words. No names. No medical advice. No quotation marks. Reply with only the quote sentence.",
        "motd.user": "Write one healthy-lifestyle quote.",
        "summary.system": "You summarise health tracking data for the patient in exactly 2 short sentences. Use only the data provided. Mention 1-2 specific findings. Be clear and encouraging. Reply with only the summary text.",
        "suggest.system": "You write one short sentence for a daily health log note. Compare today to the recent average. Use only the data provided. Reply with only the note sentence.",
        "context.improving": "Improving: {metrics}.",
        "context.worsening": "Worsening: {metrics}.",
        "context.stable": "Stable: {metrics}.",
        "context.dataLine": "{dayCount} day(s) of data.",
        "context.flares": "Flares: {count} day(s).",
        "context.topStressor": "Top stressor: {name}{pct}."
      }
    },
    "it-IT": {
      "locale": "it-IT",
      "label": "Italiano",
      "llmCapability": "full",
      "strings": {
        "motd.system": "Scrivi una breve citazione semplice sulla vita sana per un\u2019app di monitoraggio. Argomenti: sonno, acqua, movimento leggero, riposo, aria fresca, cibo equilibrato o sollievo dallo stress. Parole quotidiane. Max 18 parole. Niente nomi. Niente consigli medici. Niente virgolette. Rispondi solo con la frase.",
        "motd.user": "Scrivi una citazione su uno stile di vita sano.",
        "summary.system": "Riassumi i dati di salute per l\u2019utente in esattamente 2 frasi brevi. Usa solo i dati forniti. Menziona 1-2 risultati specifici. Sii chiaro e incoraggiante. Rispondi solo con il riepilogo.",
        "suggest.system": "Scrivi una frase breve per una nota giornaliera. Confronta oggi con la media recente. Usa solo i dati forniti. Rispondi solo con la frase.",
        "homeQuestion.system": "Rispondi a una domanda specifica usando solo i dati forniti. Scrivi 3-5 frasi brevi in linguaggio semplice. Niente diagnosi o ordini medici. Sii incoraggiante. Rispondi solo con la risposta.",
        "context.improving": "In miglioramento: {metrics}.",
        "context.worsening": "In peggioramento: {metrics}.",
        "context.stable": "Stabile: {metrics}.",
        "context.dataLine": "{dayCount} giorno/i di dati.",
        "context.flares": "Riaccutizzazioni: {count} giorno/i.",
        "context.topStressor": "Fattore di stress principale: {name}{pct}."
      }
    },
    "nl-NL": {
      "locale": "nl-NL",
      "label": "Nederlands",
      "llmCapability": "full",
      "strings": {
        "motd.system": "Je schrijft \xE9\xE9n kort, eenvoudig citaat over gezond leven voor een gezondheidsapp. Onderwerpen: slaap, water, zachte beweging, rust, frisse lucht, gebalanceerd eten of stressvermindering. Alledaagse woorden. Max. 18 woorden. Geen namen. Geen medisch advies. Geen aanhalingstekens. Antwoord alleen met de zin.",
        "motd.user": "Schrijf een citaat over een gezonde levensstijl.",
        "summary.system": "Je vat gezondheidsgegevens samen in precies 2 korte zinnen. Gebruik alleen de verstrekte data. Noem 1-2 specifieke bevindingen. Wees duidelijk en bemoedigend. Antwoord alleen met de samenvatting.",
        "suggest.system": "Je schrijft \xE9\xE9n korte zin voor een dagelijkse lognotitie. Vergelijk vandaag met het recente gemiddelde. Gebruik alleen de verstrekte data. Antwoord alleen met de zin.",
        "homeQuestion.system": "Je beantwoordt \xE9\xE9n specifieke gezondheidsvraag met alleen de verstrekte data. Schrijf 3-5 korte zinnen in eenvoudige taal. Geen diagnose of medische orders. Wees bemoedigend. Antwoord alleen met het antwoord.",
        "context.improving": "Verbetering: {metrics}.",
        "context.worsening": "Verslechtering: {metrics}.",
        "context.stable": "Stabiel: {metrics}.",
        "context.dataLine": "{dayCount} dag(en) met gegevens.",
        "context.flares": "Opflakkeringen: {count} dag(en).",
        "context.topStressor": "Belangrijkste stressfactor: {name}{pct}."
      }
    },
    "pl-PL": {
      "locale": "pl-PL",
      "label": "Polski",
      "llmCapability": "full",
      "strings": {
        "motd.system": "Piszesz jedno kr\xF3tkie, proste zdanie o zdrowym stylu \u017Cycia dla aplikacji zdrowotnej. Tematy: sen, woda, delikatny ruch, odpoczynek, \u015Bwie\u017Ce powietrze, zbilansowane jedzenie lub ulga w stresie. Proste s\u0142owa. Maks. 18 s\u0142\xF3w. Bez imion. Bez porad medycznych. Bez cudzys\u0142ow\xF3w. Odpowiedz tylko zdaniem.",
        "motd.user": "Napisz cytat o zdrowym stylu \u017Cycia.",
        "summary.system": "Streszczasz dane zdrowotne w dok\u0142adnie 2 kr\xF3tkich zdaniach. U\u017Cywaj tylko podanych danych. Wspomnij 1-2 konkretne ustalenia. B\u0105d\u017A jasny i zach\u0119caj\u0105cy. Odpowiedz tylko podsumowaniem.",
        "suggest.system": "Piszesz jedno kr\xF3tkie zdanie do notatki dziennika. Por\xF3wnaj dzi\u015B ze \u015Bredni\u0105 z ostatnich dni. U\u017Cywaj tylko podanych danych. Odpowiedz tylko zdaniem.",
        "homeQuestion.system": "Odpowiadasz na jedno konkretne pytanie zdrowotne, u\u017Cywaj\u0105c tylko podanych danych. Napisz 3-5 kr\xF3tkich zda\u0144 prostym j\u0119zykiem. Bez diagnozy ani zalece\u0144 medycznych. B\u0105d\u017A zach\u0119caj\u0105cy. Odpowiedz tylko odpowiedzi\u0105.",
        "context.improving": "Poprawa: {metrics}.",
        "context.worsening": "Pogorszenie: {metrics}.",
        "context.stable": "Stabilnie: {metrics}.",
        "context.dataLine": "{dayCount} dzie\u0144/dni danych.",
        "context.flares": "Zaostrzenia: {count} dzie\u0144/dni.",
        "context.topStressor": "G\u0142\xF3wny stresor: {name}{pct}."
      }
    },
    "pt-BR": {
      "locale": "pt-BR",
      "label": "Portugu\xEAs (Brasil)",
      "llmCapability": "full",
      "strings": {
        "motd.system": "Voc\xEA escreve uma cita\xE7\xE3o curta e simples sobre vida saud\xE1vel para um app de sa\xFAde. Temas: sono, \xE1gua, movimento leve, descanso, ar fresco, alimenta\xE7\xE3o equilibrada ou al\xEDvio do estresse. Palavras do dia a dia. M\xE1x. 18 palavras. Sem nomes. Sem conselho m\xE9dico. Sem aspas. Responda apenas com a frase.",
        "motd.user": "Escreva uma cita\xE7\xE3o sobre estilo de vida saud\xE1vel.",
        "summary.system": "Voc\xEA resume dados de sa\xFAde em exatamente 2 frases curtas. Use apenas os dados fornecidos. Mencione 1-2 achados espec\xEDficos. Seja claro e encorajador. Responda apenas com o resumo.",
        "suggest.system": "Voc\xEA escreve uma frase curta para uma nota di\xE1ria. Compare hoje com a m\xE9dia recente. Use apenas os dados fornecidos. Responda apenas com a frase.",
        "homeQuestion.system": "Voc\xEA responde uma pergunta espec\xEDfica de sa\xFAde usando apenas os dados fornecidos. Escreva 3-5 frases curtas em linguagem simples. Sem diagn\xF3stico nem ordens m\xE9dicas. Seja encorajador. Responda apenas com a resposta.",
        "context.improving": "Melhorando: {metrics}.",
        "context.worsening": "Piorando: {metrics}.",
        "context.stable": "Est\xE1vel: {metrics}.",
        "context.dataLine": "{dayCount} dia(s) de dados.",
        "context.flares": "Crises: {count} dia(s).",
        "context.topStressor": "Principal fator de estresse: {name}{pct}."
      }
    },
    "pt-PT": {
      "locale": "pt-PT",
      "label": "Portugu\xEAs (Portugal)",
      "llmCapability": "full",
      "strings": {
        "motd.system": "Escreves uma cita\xE7\xE3o curta e simples sobre vida saud\xE1vel para uma app de sa\xFAde. Temas: sono, \xE1gua, movimento suave, descanso, ar fresco, alimenta\xE7\xE3o equilibrada ou al\xEDvio do stress. Palavras do dia a dia. M\xE1x. 18 palavras. Sem nomes. Sem conselho m\xE9dico. Sem aspas. Responde apenas com a frase.",
        "motd.user": "Escreve uma cita\xE7\xE3o sobre estilo de vida saud\xE1vel.",
        "summary.system": "Resumes dados de sa\xFAde em exatamente 2 frases curtas. Usa apenas os dados fornecidos. Menciona 1-2 achados espec\xEDficos. S\xEA claro e encorajador. Responde apenas com o resumo.",
        "suggest.system": "Escreves uma frase curta para uma nota di\xE1ria. Compara hoje com a m\xE9dia recente. Usa apenas os dados fornecidos. Responde apenas com a frase.",
        "homeQuestion.system": "Respondes a uma pergunta espec\xEDfica de sa\xFAde usando apenas os dados fornecidos. Escreve 3-5 frases curtas em linguagem simples. Sem diagn\xF3stico nem ordens m\xE9dicas. S\xEA encorajador. Responde apenas com a resposta.",
        "context.improving": "A melhorar: {metrics}.",
        "context.worsening": "A piorar: {metrics}.",
        "context.stable": "Est\xE1vel: {metrics}.",
        "context.dataLine": "{dayCount} dia(s) de dados.",
        "context.flares": "Surto: {count} dia(s).",
        "context.topStressor": "Principal fator de stress: {name}{pct}."
      }
    }
  };

  // packages/shared/src/ai/llmCoachPersona.mjs
  var LLM_COACH_PERSONAS = ["encouraging", "clinical", "minimal"];
  function normalizeLlmCoachPersona(value) {
    return LLM_COACH_PERSONAS.includes(value) ? value : "encouraging";
  }
  function coachPersonaPromptKey(persona) {
    return `persona.${normalizeLlmCoachPersona(persona)}`;
  }

  // packages/shared/src/i18n/promptPack.mjs
  function loadPromptPack(locale, preloaded) {
    const chain = localeFallbackChain(isValidLocaleId(locale) ? locale : DEFAULT_LOCALE);
    for (const loc of chain) {
      if (preloaded?.[loc]) return preloaded[loc];
      if (PROMPT_PACKS_V1[loc]) return PROMPT_PACKS_V1[loc];
    }
    return PROMPT_PACKS_V1[DEFAULT_LOCALE] || { locale: DEFAULT_LOCALE, strings: {} };
  }
  function promptString(pack, key, fallback) {
    const val = pack?.strings?.[key];
    return typeof val === "string" ? val : fallback;
  }
  function applyCoachPersona(system, pack, persona) {
    if (!persona) return system;
    const suffix = promptString(pack, coachPersonaPromptKey(persona), "");
    return suffix ? `${system} ${suffix}` : system;
  }
  function buildMotdPrompt(locale, theme, options = {}) {
    const pack = loadPromptPack(locale, options.packs);
    const system = applyCoachPersona(
      promptString(
        pack,
        "motd.system",
        "You write one short, simple quote about healthy living for a health tracking app. Topics: sleep, water, gentle movement, rest, fresh air, balanced food, or stress relief. Use plain everyday words. Max 18 words. No names. No medical advice. No quotation marks. Reply with only the quote sentence."
      ),
      pack,
      options.persona
    );
    const userBase = promptString(pack, "motd.user", "Write one healthy-lifestyle quote.");
    const user = theme ? `${userBase} Theme: ${theme}.` : userBase;
    return { system, user };
  }
  function buildSummaryPrompt(locale, context, options = {}) {
    const pack = loadPromptPack(locale, options.packs);
    const plain = options.plainLanguage === true;
    const system = applyCoachPersona(
      promptString(
        pack,
        plain ? "summary.system.plain" : "summary.system",
        plain ? "You summarise health tracking data in exactly 2 short sentences using plain B1 English (simple words, short clauses). Use only the data provided. Mention 1-2 findings. Be encouraging. Reply with only the summary text." : "You summarise health tracking data for the patient in exactly 2 short sentences. Use only the data provided. Mention 1-2 specific findings. Be clear and encouraging. Reply with only the summary text."
      ),
      pack,
      options.persona
    );
    return { system, user: `Data: ${context}` };
  }
  function buildSuggestPrompt(locale, context, options = {}) {
    const pack = loadPromptPack(locale, options.packs);
    const system = applyCoachPersona(
      promptString(
        pack,
        "suggest.system",
        "You write one short sentence for a daily health log note. Compare today to the recent average. Use only the data provided. Reply with only the note sentence."
      ),
      pack,
      options.persona
    );
    return { system, user: `Data: ${context}` };
  }
  function buildHomeQuestionPrompt(locale, context, options = {}) {
    const pack = loadPromptPack(locale, options.packs);
    const system = applyCoachPersona(
      promptString(
        pack,
        "homeQuestion.system",
        "You answer one specific health-tracking question using only the data provided. Write 3-5 short sentences in plain language. No diagnosis or medical orders. Be encouraging. Reply with only the answer text."
      ),
      pack,
      options.persona
    );
    return { system, user: context };
  }
  function buildClinicianBriefPrompt(locale, context, options = {}) {
    const pack = loadPromptPack(locale, options.packs);
    const system = applyCoachPersona(
      promptString(
        pack,
        "clinicianBrief.system",
        "You write a one-page clinician visit prep brief from health-tracking data. Use only the data provided. Structure: key patterns, symptom/stressor highlights, questions to ask the clinician. Plain language. No diagnosis or treatment orders. Max 180 words. Reply with only the brief text."
      ),
      pack,
      options.persona
    );
    return { system, user: `Patient data: ${context}` };
  }
  function buildDoctorQuestionsPrompt(locale, context, options = {}) {
    const pack = loadPromptPack(locale, options.packs);
    const system = applyCoachPersona(
      promptString(
        pack,
        "doctorQuestions.system",
        "You suggest exactly three short questions a patient could ask their clinician at an upcoming visit. Use only the wellness tracking data provided. Wellness framing only, not medical advice or diagnosis. Reply as a numbered list (1-3), one question per line, no extra commentary."
      ),
      pack,
      options.persona
    );
    return { system, user: `Recent trends: ${context}` };
  }
  function buildExplainChartPrompt(locale, context, options = {}) {
    const pack = loadPromptPack(locale, options.packs);
    const system = applyCoachPersona(
      promptString(
        pack,
        "explainChart.system",
        "You explain a health chart range in plain language for the patient. Use only the metrics provided. Mention trends and one practical observation. No diagnosis. Max 4 short sentences. Reply with only the narration text."
      ),
      pack,
      options.persona
    );
    return { system, user: `Chart data: ${context}` };
  }
  function buildStructuredSummaryPrompt(locale, context, options = {}) {
    const pack = loadPromptPack(locale, options.packs);
    const system = applyCoachPersona(
      promptString(
        pack,
        "structured.system",
        'You analyse health-tracking data and reply with JSON only: {"insights":["..."],"actions":["..."],"confidence":0.0}. insights: up to 3 short pattern observations. actions: up to 2 gentle self-care ideas. confidence: 0-1 number. Use only provided data. No diagnosis or prescriptions.'
      ),
      pack,
      options.persona
    );
    return { system, user: `Data: ${context}` };
  }
  function buildWeekChatPrompt(locale, userPayload, options = {}) {
    const pack = loadPromptPack(locale, options.packs);
    const system = applyCoachPersona(
      promptString(
        pack,
        "weekChat.system",
        "You are a wellness diary coach. Answer using only the health log context provided. Max 4 short sentences. No diagnosis, prescriptions, or tool use. Stay within the conversation scope. Reply with only your answer text."
      ),
      pack,
      options.persona
    );
    return { system, user: userPayload };
  }
  function buildLlmRequestPayload({ feature, model, modelSize, context, locale }) {
    return {
      feature,
      model,
      modelSize,
      context,
      locale: isValidLocaleId(locale) ? locale : DEFAULT_LOCALE
    };
  }

  // packages/shared/src/ai/homeGapDetection.mjs
  var HOME_GAP_IDS = ["gap-meds", "gap-sleep", "gap-food"];
  var MAX_HOME_QUESTION_ANSWERS_PER_DAY = 3;
  function toDate(value) {
    if (!value || typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const d = /* @__PURE__ */ new Date(`${value}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  function toDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  function yesterdayOf(todayStr) {
    const d = toDate(todayStr);
    if (!d) return null;
    d.setDate(d.getDate() - 1);
    return toDateStr(d);
  }
  function logByDate(logs, dateStr) {
    if (!Array.isArray(logs) || !dateStr) return null;
    return logs.find((l) => l && l.date === dateStr) || null;
  }
  function isFoodEmpty(log) {
    if (!log) return true;
    const f = log.food;
    if (!f) return true;
    if (Array.isArray(f)) return f.length === 0;
    if (typeof f === "object") {
      return !["breakfast", "lunch", "dinner", "snack"].some(
        (k) => Array.isArray(f[k]) && f[k].length > 0
      );
    }
    return true;
  }
  function isSleepMissing(log) {
    return !log || typeof log.sleep !== "number";
  }
  function hasMissedMeds(log) {
    if (!log) return false;
    if (Array.isArray(log.medicationDoses)) {
      return log.medicationDoses.some((d) => d && (d.status === "missed" || d.status === "skipped"));
    }
    if (Array.isArray(log.medications)) {
      return log.medications.some((m) => m && m.taken === false);
    }
    return false;
  }
  function isMedsUnlogged(log) {
    if (!log) return true;
    const doses = Array.isArray(log.medicationDoses) ? log.medicationDoses.length : 0;
    const meds = Array.isArray(log.medications) ? log.medications.length : 0;
    return doses === 0 && meds === 0;
  }
  function recentLogsBefore(logs, beforeDateStr, windowDays = 7) {
    const end = toDate(beforeDateStr);
    if (!end) return [];
    const start = new Date(end);
    start.setDate(start.getDate() - windowDays);
    return (logs || []).filter((log) => {
      const d = toDate(log?.date);
      return d && d >= start && d < end;
    });
  }
  function userTracksFood(logs, beforeDateStr, windowDays = 7) {
    const recent = recentLogsBefore(logs, beforeDateStr, windowDays);
    return recent.filter((l) => !isFoodEmpty(l)).length >= 2;
  }
  function userTracksSleep(logs, windowDays = 14, todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)) {
    const end = toDate(todayStr);
    if (!end) return false;
    const start = new Date(end);
    start.setDate(start.getDate() - (windowDays - 1));
    const recent = (logs || []).filter((log) => {
      const d = toDate(log?.date);
      return d && d >= start && d <= end;
    });
    return recent.filter((l) => typeof l.sleep === "number").length >= 3;
  }
  function userTracksMeds(logs, medSchedule, windowDays = 14, todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)) {
    if (Array.isArray(medSchedule) && medSchedule.length > 0) return true;
    const end = toDate(todayStr);
    if (!end) return false;
    const start = new Date(end);
    start.setDate(start.getDate() - (windowDays - 1));
    let count = 0;
    for (const log of logs || []) {
      const d = toDate(log?.date);
      if (!d || d < start || d > end) continue;
      const doses = Array.isArray(log.medicationDoses) ? log.medicationDoses.length : 0;
      const meds = Array.isArray(log.medications) ? log.medications.length : 0;
      if (doses > 0 || meds > 0) count += 1;
    }
    return count >= 2;
  }
  function detectHomeLoggingGaps(logs, options = {}) {
    const {
      todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      medSchedule = []
    } = options;
    const yStr = yesterdayOf(todayStr);
    if (!yStr) return [];
    const yesterday = logByDate(logs, yStr);
    const gaps = [];
    if (userTracksMeds(logs, medSchedule, 14, todayStr)) {
      if (!yesterday) {
        gaps.push({ id: "gap-meds", reason: "no_log" });
      } else if (hasMissedMeds(yesterday)) {
        gaps.push({ id: "gap-meds", reason: "missed" });
      } else if (isMedsUnlogged(yesterday)) {
        gaps.push({ id: "gap-meds", reason: "unlogged" });
      }
    }
    if (userTracksSleep(logs, 14, todayStr)) {
      if (yesterday && isSleepMissing(yesterday) && (typeof yesterday.fatigue === "number" || typeof yesterday.mood === "number" || typeof yesterday.jointPain === "number")) {
        gaps.push({ id: "gap-sleep", reason: "missing" });
      }
    }
    if (userTracksFood(logs, todayStr)) {
      if (yesterday && isFoodEmpty(yesterday)) {
        gaps.push({ id: "gap-food", reason: "empty" });
      }
    }
    return gaps.sort(
      (a, b) => HOME_GAP_IDS.indexOf(a.id) - HOME_GAP_IDS.indexOf(b.id)
    );
  }
  var GAP_LABEL_KEYS = {
    "gap-meds": "home.questions.gapMeds",
    "gap-sleep": "home.questions.gapSleep",
    "gap-food": "home.questions.gapFood"
  };
  function gapToHomeQuestionChip(gap) {
    if (!gap?.id || !GAP_LABEL_KEYS[gap.id]) return null;
    return { id: gap.id, labelKey: GAP_LABEL_KEYS[gap.id], labelParams: {} };
  }
  function normalizeHomeGapQuestionCache(raw) {
    const v = raw && typeof raw === "object" ? raw : {};
    const date = typeof v.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.date) ? v.date : null;
    const gapId = typeof v.gapId === "string" && HOME_GAP_IDS.includes(v.gapId) ? v.gapId : null;
    if (!date || !gapId) return null;
    return { date, gapId };
  }
  function normalizeHomeQuestionAnswerState(raw, todayStr) {
    const v = raw && typeof raw === "object" ? raw : {};
    const date = typeof v.date === "string" ? v.date : null;
    const count = typeof v.count === "number" && v.count >= 0 ? Math.floor(v.count) : 0;
    if (date !== todayStr) return { date: todayStr, count: 0 };
    return { date: todayStr, count };
  }
  function canAnswerHomeQuestionToday(state, todayStr) {
    const normalized = normalizeHomeQuestionAnswerState(state, todayStr);
    return normalized.count < MAX_HOME_QUESTION_ANSWERS_PER_DAY;
  }
  function nextHomeQuestionAnswerState(state, todayStr) {
    const normalized = normalizeHomeQuestionAnswerState(state, todayStr);
    return { date: todayStr, count: normalized.count + 1 };
  }
  function pickDailyHomeGapQuestion(logs, options = {}) {
    const {
      todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      homeGapQuestionCache = null,
      medSchedule = []
    } = options;
    const gaps = detectHomeLoggingGaps(logs, { todayStr, medSchedule });
    if (!gaps.length) return { chip: null, cacheUpdate: null };
    const cache = normalizeHomeGapQuestionCache(homeGapQuestionCache);
    if (cache?.date === todayStr) {
      const cachedGap = gaps.find((g) => g.id === cache.gapId);
      if (cachedGap) {
        return { chip: gapToHomeQuestionChip(cachedGap), cacheUpdate: null };
      }
    }
    const top = gaps[0];
    return {
      chip: gapToHomeQuestionChip(top),
      cacheUpdate: { date: todayStr, gapId: top.id }
    };
  }

  // packages/shared/src/ai/homeSuggestions.mjs
  var HOME_SUGGESTIONS_RANGE_DAYS = 14;
  var HOME_SUGGESTIONS_MIN_DAYS = 3;
  var HOME_SUGGESTIONS_MAX_CHIPS = 3;
  var SYMPTOM_FREQ_THRESHOLD = 3;
  var FLARE_DAYS_THRESHOLD = 2;
  var CORRELATION_THRESHOLD = 0.35;
  function toDate2(value) {
    if (!value || typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const d = /* @__PURE__ */ new Date(`${value}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  function filterLogsForHomeSuggestions(logs, rangeDays = HOME_SUGGESTIONS_RANGE_DAYS) {
    if (!Array.isArray(logs)) return [];
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - (rangeDays - 1));
    return logs.filter((log) => {
      const d = toDate2(log?.date);
      return !!d && d >= start && d <= today;
    });
  }
  function mean(values) {
    if (!values.length) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  function pearson(xs, ys) {
    if (xs.length !== ys.length || xs.length < 3) return null;
    const n = xs.length;
    const avgX = xs.reduce((a, b) => a + b, 0) / n;
    const avgY = ys.reduce((a, b) => a + b, 0) / n;
    let num2 = 0;
    let denX = 0;
    let denY = 0;
    for (let i = 0; i < n; i++) {
      const dx = xs[i] - avgX;
      const dy = ys[i] - avgY;
      num2 += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }
    if (denX === 0 || denY === 0) return null;
    return num2 / Math.sqrt(denX * denY);
  }
  function topSymptomName(logs) {
    const counts = /* @__PURE__ */ new Map();
    logs.forEach((log) => {
      const list = log?.symptoms;
      if (!Array.isArray(list)) return;
      list.forEach((x) => {
        const item = String(x || "").trim();
        if (!item) return;
        counts.set(item, (counts.get(item) ?? 0) + 1);
      });
    });
    let best = null;
    let bestCount = 0;
    for (const [name, count] of counts) {
      if (count > bestCount) {
        best = name;
        bestCount = count;
      }
    }
    return bestCount >= SYMPTOM_FREQ_THRESHOLD ? { name: best, count: bestCount } : null;
  }
  function topStressorName(logs) {
    const counts = /* @__PURE__ */ new Map();
    logs.forEach((log) => {
      const list = log?.stressors;
      if (!Array.isArray(list)) return;
      list.forEach((x) => {
        const item = String(x || "").trim();
        if (!item) return;
        counts.set(item, (counts.get(item) ?? 0) + 1);
      });
    });
    let best = null;
    let bestCount = 0;
    for (const [name, count] of counts) {
      if (count > bestCount) {
        best = name;
        bestCount = count;
      }
    }
    return bestCount >= 2 ? { name: best, count: bestCount } : null;
  }
  function parseTopListItem(item) {
    const raw = String(item || "").trim();
    const m = raw.match(/^(.+?)\s*\((\d+)\)$/);
    return m ? { name: m[1].trim(), count: Number(m[2]) } : { name: raw, count: 0 };
  }
  function metricTrend(logs, field) {
    const sorted = [...logs].sort((a2, b2) => String(a2.date).localeCompare(String(b2.date)));
    const mid = Math.floor(sorted.length / 2);
    const first = sorted.slice(0, mid);
    const second = sorted.slice(mid);
    const a = mean(first.map((l) => l[field]).filter((v) => typeof v === "number"));
    const b = mean(second.map((l) => l[field]).filter((v) => typeof v === "number"));
    if (a == null || b == null) return null;
    const delta = b - a;
    if (Math.abs(delta) < 1.2) return null;
    return { metric: field, direction: delta > 0 ? "up" : "down", delta };
  }
  function weekCompare(logs) {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 13);
    const thisWeek = logs.filter((l) => {
      const d = toDate2(l.date);
      return d && d >= weekAgo && d <= today;
    });
    const lastWeek = logs.filter((l) => {
      const d = toDate2(l.date);
      return d && d >= twoWeeksAgo && d < weekAgo;
    });
    if (thisWeek.length < 2 || lastWeek.length < 2) return null;
    for (const field of ["fatigue", "sleep", "mood"]) {
      const cur = mean(thisWeek.map((l) => l[field]).filter((v) => typeof v === "number"));
      const prev = mean(lastWeek.map((l) => l[field]).filter((v) => typeof v === "number"));
      if (cur != null && prev != null && Math.abs(cur - prev) >= 1) {
        return { field, cur, prev };
      }
    }
    return { comparable: true };
  }
  function findCorrelationPair(logs) {
    const moodSleep = logs.filter((x) => x.mood != null && x.sleep != null);
    const c1 = pearson(
      moodSleep.map((x) => x.mood),
      moodSleep.map((x) => x.sleep)
    );
    if (c1 != null && Math.abs(c1) >= CORRELATION_THRESHOLD) {
      return { a: "mood", b: "sleep", r: c1 };
    }
    const sleepFatigue = logs.filter((x) => x.sleep != null && x.fatigue != null);
    const c2 = pearson(
      sleepFatigue.map((x) => x.sleep),
      sleepFatigue.map((x) => x.fatigue)
    );
    if (c2 != null && Math.abs(c2) >= CORRELATION_THRESHOLD) {
      return { a: "sleep", b: "fatigue", r: c2 };
    }
    return null;
  }
  function computeHomeAnalysisSnapshot(logs, rangeDays = HOME_SUGGESTIONS_RANGE_DAYS) {
    const selected = filterLogsForHomeSuggestions(logs, rangeDays);
    const mood = selected.map((x) => x.mood).filter((x) => typeof x === "number");
    const sleep = selected.map((x) => x.sleep).filter((x) => typeof x === "number");
    const fatigue = selected.map((x) => x.fatigue).filter((x) => typeof x === "number");
    return {
      totalLogs: selected.length,
      flareDays: selected.filter((x) => x.flare === "Yes").length,
      avgMood: mean(mood),
      avgSleep: mean(sleep),
      avgFatigue: mean(fatigue),
      topSymptoms: topSymptomName(selected) ? [topSymptomName(selected).name] : [],
      topStressors: topStressorName(selected) ? [topStressorName(selected).name] : [],
      _logs: selected
    };
  }
  function analysisSnapshotFromSummary(summary, logs) {
    const selected = filterLogsForHomeSuggestions(logs || []);
    const topSym = summary?.topSymptoms?.[0] ? parseTopListItem(summary.topSymptoms[0]) : null;
    const topStr = summary?.topStressors?.[0] ? parseTopListItem(summary.topStressors[0]) : null;
    return {
      totalLogs: summary?.totalLogs ?? selected.length,
      flareDays: summary?.flareDays ?? 0,
      avgMood: summary?.avgMood ?? null,
      avgSleep: summary?.avgSleep ?? null,
      avgFatigue: summary?.avgFatigue ?? null,
      topSymptoms: topSym?.name ? [topSym.name] : [],
      topStressors: topStr?.name ? [topStr.name] : [],
      correlations: summary?.correlations || [],
      _logs: selected
    };
  }
  var METRIC_LABELS = {
    fatigue: "fatigue",
    sleep: "sleep",
    mood: "mood"
  };
  function pickHomeAiSuggestionBundle(logs, analysis, options = {}) {
    const {
      aiEnabled = true,
      loggedToday = false,
      rangeDays = HOME_SUGGESTIONS_RANGE_DAYS,
      minDays = HOME_SUGGESTIONS_MIN_DAYS,
      maxChips = HOME_SUGGESTIONS_MAX_CHIPS,
      todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      homeGapQuestionCache = null,
      medSchedule = [],
      homeQuestionAnswerState = null
    } = options;
    const picked = [];
    const used = /* @__PURE__ */ new Set();
    let gapCacheUpdate = null;
    if (!aiEnabled) {
      return { chips: [], gapCacheUpdate: null };
    }
    function add(id, labelKey, labelParams) {
      if (picked.length >= maxChips || used.has(id)) return;
      used.add(id);
      picked.push({ id, labelKey, labelParams: labelParams || {} });
    }
    if (canAnswerHomeQuestionToday(homeQuestionAnswerState, todayStr)) {
      const gapPick = pickDailyHomeGapQuestion(logs, {
        todayStr,
        homeGapQuestionCache,
        medSchedule
      });
      if (gapPick.chip) {
        gapCacheUpdate = gapPick.cacheUpdate;
        add(gapPick.chip.id, gapPick.chip.labelKey, gapPick.chip.labelParams);
      }
    }
    if (!loggedToday) {
      return { chips: picked.slice(0, maxChips), gapCacheUpdate };
    }
    const recent = filterLogsForHomeSuggestions(logs, rangeDays);
    if (recent.length < minDays) {
      return { chips: picked.slice(0, maxChips), gapCacheUpdate };
    }
    const snapshot2 = analysis || computeHomeAnalysisSnapshot(logs, rangeDays);
    const workLogs = snapshot2._logs || recent;
    const sym = topSymptomName(workLogs);
    if (sym) add("symptom", "home.questions.symptom", { symptom: sym.name });
    const flareDays = snapshot2.flareDays ?? workLogs.filter((l) => l.flare === "Yes").length;
    if (flareDays >= FLARE_DAYS_THRESHOLD) add("flare", "home.questions.flare", {});
    for (const field of ["fatigue", "sleep", "mood"]) {
      const trend = metricTrend(workLogs, field);
      if (!trend) continue;
      const worsening = field === "fatigue" && trend.direction === "up" || field === "sleep" && trend.direction === "down" || field === "mood" && trend.direction === "down";
      if (worsening) {
        add(`trend-${field}`, "home.questions.trend", {
          metric: METRIC_LABELS[field] || field,
          direction: trend.direction
        });
        break;
      }
    }
    const stressor = snapshot2.topStressors?.[0] || (topStressorName(workLogs)?.name ?? null);
    if (stressor) add("stressor", "home.questions.stressor", { stressor: String(stressor) });
    const corr = findCorrelationPair(workLogs);
    if (corr) {
      add("correlation", "home.questions.correlation", {
        a: METRIC_LABELS[corr.a] || corr.a,
        b: METRIC_LABELS[corr.b] || corr.b
      });
    }
    if (weekCompare(workLogs)) add("compare", "home.questions.compare", {});
    return { chips: picked.slice(0, maxChips), gapCacheUpdate };
  }
  function pickHomeAiSuggestions(logs, analysis, options = {}) {
    return pickHomeAiSuggestionBundle(logs, analysis, options).chips;
  }
  function buildHomeQuestionFallback(suggestion, analysis) {
    const snap = analysis || {};
    const id = suggestion?.id || "";
    if (id === "symptom" && suggestion.labelParams?.symptom) {
      return `${suggestion.labelParams.symptom} appears often in your recent logs - track triggers and rest on high-symptom days.`;
    }
    if (id === "flare" && snap.flareDays != null) {
      return `You logged ${snap.flareDays} flare day(s) recently. Note sleep, stress, and activity around those dates.`;
    }
    if (id.startsWith("trend-") && snap.avgFatigue != null) {
      return `Recent averages - fatigue ${snap.avgFatigue.toFixed(1)}, sleep ${snap.avgSleep != null ? snap.avgSleep.toFixed(1) : "-"}, mood ${snap.avgMood != null ? snap.avgMood.toFixed(1) : "-"} (1-10).`;
    }
    if (id === "stressor" && suggestion.labelParams?.stressor) {
      return `${suggestion.labelParams.stressor} shows up in your stress logs - consider pacing and recovery after high-stress days.`;
    }
    if (id === "compare") {
      return "Compare this week\u2019s scores to last week in Charts to spot gradual shifts.";
    }
    if (id === "gap-meds") {
      return "Yesterday\u2019s medication log looks incomplete or includes missed doses. Note what happened and any side effects.";
    }
    if (id === "gap-sleep") {
      return "Sleep was not logged yesterday even though you tracked other scores. A quick sleep rating helps link rest to symptoms.";
    }
    if (id === "gap-food") {
      return "No food was logged yesterday. Even a light note about meals can reveal triggers alongside symptoms.";
    }
    return "Keep logging daily - patterns become clearer with more entries.";
  }

  // packages/shared/src/ai/homeCardRegistry.mjs
  var HOME_CARDS = [
    { id: "weeklyReview", basePriority: 68 },
    { id: "streak", basePriority: 38 },
    { id: "hero", basePriority: 100 },
    { id: "goals", basePriority: 60 }
  ];
  function toDateStr2(d) {
    return d.toISOString().slice(0, 10);
  }
  function yesterdayOf2(todayStr) {
    const d = /^\d{4}-\d{2}-\d{2}$/.test(todayStr) ? /* @__PURE__ */ new Date(`${todayStr}T12:00:00`) : /* @__PURE__ */ new Date();
    d.setDate(d.getDate() - 1);
    return toDateStr2(d);
  }
  function isLoggingStreakBroken(logs, todayStr) {
    if (!Array.isArray(logs) || !todayStr) return false;
    const dates = new Set(logs.map((l) => l?.date).filter(Boolean));
    if (dates.has(todayStr)) return false;
    return dates.has(yesterdayOf2(todayStr));
  }
  function isLoggingStreakGrace(logs, todayStr) {
    if (!Array.isArray(logs) || !todayStr) return false;
    const dates = new Set(logs.map((l) => l?.date).filter(Boolean));
    const yday = yesterdayOf2(todayStr);
    const dayBefore = yesterdayOf2(yday);
    return !dates.has(todayStr) && !dates.has(yday) && dates.has(dayBefore);
  }
  function computeHomeCardContext(logs, todayStr, options = {}) {
    const {
      aiEnabled = true,
      simpleMode = false,
      showGoals = true,
      showCheckin = true,
      showStreak = false,
      showWeather = false,
      showWeeklyReview = false
    } = options;
    const loggedToday = Array.isArray(logs) && logs.some((l) => l?.date === todayStr);
    const streakBroken = isLoggingStreakBroken(logs, todayStr);
    const streakGrace = isLoggingStreakGrace(logs, todayStr);
    const showAiQuestions = aiEnabled && !simpleMode && loggedToday;
    return {
      loggedToday,
      streakBroken,
      streakGrace,
      aiEnabled: aiEnabled !== false,
      simpleMode: simpleMode === true,
      showGoals: showGoals !== false && aiEnabled !== false,
      showAiQuestions,
      showCheckin: showCheckin !== false && simpleMode !== true,
      showStreak: showStreak === true,
      showWeather: showWeather === true,
      showWeeklyReview: showWeeklyReview === true
    };
  }
  function resolveHomeCardOrder(context) {
    const ctx = context || {};
    const scored = [];
    for (const card of HOME_CARDS) {
      if (card.id === "goals" && !ctx.showGoals) continue;
      if (card.id === "streak" && !ctx.showStreak) continue;
      if (card.id === "weeklyReview" && !ctx.showWeeklyReview) continue;
      let priority = card.basePriority;
      if (ctx.loggedToday && card.id === "goals") priority += 50;
      if (!ctx.loggedToday && card.id === "hero") priority += 30;
      if (ctx.streakBroken && !ctx.loggedToday && card.id === "hero") priority += 80;
      if (ctx.showWeeklyReview && card.id === "weeklyReview") priority += 40;
      scored.push({ id: card.id, priority });
    }
    return scored.sort((a, b) => b.priority - a.priority).map((c) => c.id);
  }

  // packages/shared/src/ai/homeQuestionContext.mjs
  var MAX_CONTEXT_CHARS = 720;
  function wrapUserNote(note) {
    const raw = String(note || "").trim();
    if (!raw) return "";
    return `---USER_NOTE---
${raw}
---END_USER_NOTE---`;
  }
  function buildHomeQuestionContext({
    questionText,
    questionId,
    labelParams = {},
    analysis = {},
    logs = [],
    rangeDays = HOME_SUGGESTIONS_RANGE_DAYS
  }) {
    const parts = [];
    const q = String(questionText || "").trim();
    if (q) parts.push(`Question: ${q}`);
    parts.push(`Range: last ${rangeDays} days.`);
    const total = analysis.totalLogs ?? (Array.isArray(logs) ? logs.length : 0);
    parts.push(`${total} logged day(s).`);
    if (analysis.flareDays != null && analysis.flareDays > 0) {
      parts.push(`Flares: ${analysis.flareDays} day(s).`);
    }
    if (analysis.avgFatigue != null) parts.push(`Fatigue avg: ${analysis.avgFatigue.toFixed(1)}/10.`);
    if (analysis.avgSleep != null) parts.push(`Sleep avg: ${analysis.avgSleep.toFixed(1)}/10.`);
    if (analysis.avgMood != null) parts.push(`Mood avg: ${analysis.avgMood.toFixed(1)}/10.`);
    if (analysis.topSymptoms?.length) {
      parts.push(`Top symptoms: ${analysis.topSymptoms.slice(0, 3).join(", ")}.`);
    }
    if (analysis.topStressors?.length) {
      parts.push(`Top stressors: ${analysis.topStressors.slice(0, 3).join(", ")}.`);
    }
    if (questionId === "correlation" && labelParams.a && labelParams.b) {
      parts.push(`Focus: link between ${labelParams.a} and ${labelParams.b}.`);
    }
    if (questionId === "gap-meds") {
      parts.push("Focus: yesterday medication adherence gap.");
    }
    if (questionId === "gap-sleep") {
      parts.push("Focus: missing sleep score yesterday.");
    }
    if (questionId === "gap-food") {
      parts.push("Focus: empty food log yesterday.");
    }
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const yStr = yesterdayOf(todayStr);
    if (yStr && questionId && String(questionId).startsWith("gap-")) {
      parts.push(`Yesterday (${yStr}) logging gap.`);
    }
    const recentNotes = (logs || []).map((l) => l && l.notes ? String(l.notes).trim() : "").filter(Boolean);
    if (recentNotes.length) parts.push(wrapUserNote(recentNotes[recentNotes.length - 1]));
    const text = parts.join(" ");
    return text.length > MAX_CONTEXT_CHARS ? text.slice(0, MAX_CONTEXT_CHARS) : text;
  }

  // packages/shared/src/ai/clinicianBriefContext.mjs
  var MAX_CONTEXT_CHARS2 = 900;
  function wrapUserNote2(note) {
    const raw = String(note || "").trim();
    if (!raw) return "";
    return `---USER_NOTE---
${raw}
---END_USER_NOTE---`;
  }
  function buildClinicianBriefContext({
    analysis = {},
    logs = [],
    rangeLabel = "",
    goals = null
  } = {}) {
    const parts = [];
    if (rangeLabel) parts.push(`Range: ${rangeLabel}.`);
    const total = analysis.totalLogs ?? (Array.isArray(logs) ? logs.length : 0);
    parts.push(`${total} logged day(s).`);
    if (analysis.flareDays != null && analysis.flareDays > 0) {
      parts.push(`Flare days: ${analysis.flareDays}.`);
    }
    if (analysis.avgMood != null) parts.push(`Mood avg: ${Number(analysis.avgMood).toFixed(1)}/10.`);
    if (analysis.avgSleep != null) parts.push(`Sleep avg: ${Number(analysis.avgSleep).toFixed(1)}/10.`);
    if (analysis.avgFatigue != null) parts.push(`Fatigue avg: ${Number(analysis.avgFatigue).toFixed(1)}/10.`);
    if (analysis.topSymptoms?.length) {
      parts.push(`Top symptoms: ${analysis.topSymptoms.slice(0, 4).join(", ")}.`);
    }
    if (analysis.topStressors?.length) {
      parts.push(`Top stressors: ${analysis.topStressors.slice(0, 4).join(", ")}.`);
    }
    if (analysis.correlations?.length) {
      parts.push(`Patterns: ${analysis.correlations.slice(0, 2).join(" ")}`);
    }
    if (analysis.thingsToWatch?.length) {
      parts.push(`Watch: ${analysis.thingsToWatch.slice(0, 2).join(" ")}`);
    }
    if (goals && typeof goals === "object") {
      const goalBits = [];
      if (goals.sleep != null) goalBits.push(`sleep goal ${goals.sleep}/10`);
      if (goals.steps != null) goalBits.push(`steps goal ${goals.steps}`);
      if (goalBits.length) parts.push(`Goals: ${goalBits.join(", ")}.`);
    }
    const recentNotes = (logs || []).map((l) => l && l.notes ? String(l.notes).trim() : "").filter(Boolean);
    if (recentNotes.length) parts.push(wrapUserNote2(recentNotes[recentNotes.length - 1]));
    const text = parts.join(" ");
    return text.length > MAX_CONTEXT_CHARS2 ? text.slice(0, MAX_CONTEXT_CHARS2) : text;
  }
  function buildClinicianBriefFallback(analysis = {}) {
    const lines = [];
    if (analysis.rangeLabel) lines.push(`Period: ${analysis.rangeLabel}.`);
    if (analysis.totalLogs != null) lines.push(`${analysis.totalLogs} logged days.`);
    if (analysis.flareDays) lines.push(`${analysis.flareDays} flare day(s) in range.`);
    if (analysis.avgFatigue != null) lines.push(`Average fatigue ${Number(analysis.avgFatigue).toFixed(1)}/10.`);
    if (analysis.topSymptoms?.length) lines.push(`Frequent symptoms: ${analysis.topSymptoms.slice(0, 3).join(", ")}.`);
    if (!lines.length) return "Add more logs to generate a visit prep summary.";
    return lines.join(" ");
  }

  // packages/shared/src/ai/doctorQuestionsContext.mjs
  var MAX_CONTEXT_CHARS3 = 800;
  function buildDoctorQuestionsContext({ analysis = {}, logs = [], rangeLabel = "" } = {}) {
    const parts = [];
    if (rangeLabel) parts.push(`Range: ${rangeLabel}.`);
    if (analysis.avgMood != null) parts.push(`Mood avg ${Number(analysis.avgMood).toFixed(1)}/10.`);
    if (analysis.avgSleep != null) parts.push(`Sleep avg ${Number(analysis.avgSleep).toFixed(1)}/10.`);
    if (analysis.avgFatigue != null) parts.push(`Fatigue avg ${Number(analysis.avgFatigue).toFixed(1)}/10.`);
    if (analysis.flareDays != null) parts.push(`Flare days: ${analysis.flareDays}.`);
    if (analysis.topSymptoms?.length) parts.push(`Symptoms: ${analysis.topSymptoms.slice(0, 3).join(", ")}.`);
    if (analysis.thingsToWatch?.length) parts.push(`Watch: ${analysis.thingsToWatch.slice(0, 2).join(" ")}`);
    const text = parts.join(" ");
    return text.length > MAX_CONTEXT_CHARS3 ? text.slice(0, MAX_CONTEXT_CHARS3) : text;
  }
  function buildDoctorQuestionsFallback(analysis = {}) {
    const q = [
      "What patterns in my recent logs are worth discussing at this visit?",
      "Could changes in sleep or fatigue relate to what I have been tracking?",
      "What should I keep monitoring after this appointment?"
    ];
    if (analysis.flareDays > 0) {
      q[1] = `I had ${analysis.flareDays} flare day(s) recently. What might be useful to review together?`;
    }
    return q;
  }
  function parseDoctorQuestionsResponse(text) {
    const raw = String(text || "").trim();
    if (!raw) return [];
    const lines = raw.split(/\n+/).map((l) => l.replace(/^\s*[\d•\-*.]+\s*/, "").trim()).filter((l) => l.length > 8);
    const unique = [];
    for (const line of lines) {
      if (!unique.includes(line)) unique.push(line);
      if (unique.length >= 3) break;
    }
    return unique.slice(0, 3);
  }

  // packages/shared/src/ai/explainChartContext.mjs
  var MAX_CONTEXT_CHARS4 = 720;
  function buildExplainChartContext({
    rangeLabel = "",
    viewMode = "combined",
    trends = [],
    totalLogs = 0,
    flareDays = 0
  } = {}) {
    const parts = [];
    if (rangeLabel) parts.push(`Chart range: ${rangeLabel}.`);
    parts.push(`View: ${viewMode}.`);
    parts.push(`${totalLogs} logged day(s).`);
    if (flareDays > 0) parts.push(`Flare days: ${flareDays}.`);
    for (const trend of (trends || []).slice(0, 6)) {
      if (!trend || !trend.label) continue;
      const avg = trend.average != null && Number.isFinite(trend.average) ? trend.average.toFixed(1) : "-";
      const cur = trend.current != null && Number.isFinite(trend.current) ? trend.current.toFixed(1) : "-";
      const delta = trend.delta != null && Number.isFinite(trend.delta) ? `${trend.delta >= 0 ? "+" : ""}${trend.delta.toFixed(1)}` : "-";
      parts.push(`${trend.label}: avg ${avg}, latest ${cur}, change ${delta} (${trend.points || 0} points).`);
    }
    const text = parts.join(" ");
    return text.length > MAX_CONTEXT_CHARS4 ? text.slice(0, MAX_CONTEXT_CHARS4) : text;
  }
  function buildExplainChartFallback(chartSummary = {}) {
    const trend = chartSummary.trends?.[0];
    if (!trend) return "Not enough chart data to narrate this range yet.";
    const label = trend.label || trend.key || "Metric";
    const avg = trend.average != null ? Number(trend.average).toFixed(1) : "-";
    return `${label} averaged ${avg} over ${chartSummary.rangeLabel || "this range"}.`;
  }

  // packages/shared/src/ai/llmCapability.mjs
  function getLlmCapability(locale, options = {}) {
    const loc = isValidLocaleId(locale) ? locale : DEFAULT_LOCALE;
    const pack = loadPromptPack(loc, options.packs);
    return pack?.llmCapability === "ui-only" ? "ui-only" : "full";
  }
  function isLlmInferenceAllowed(locale, options = {}) {
    return getLlmCapability(locale, options) !== "ui-only";
  }

  // packages/shared/src/ai/structuredLlmOutput.mjs
  function parseStructuredLlmOutput(raw) {
    if (!raw || typeof raw !== "string") return null;
    let parsed;
    try {
      const trimmed = raw.trim();
      const match = trimmed.match(/\{[\s\S]*\}/);
      const jsonStr = match ? match[0] : trimmed;
      parsed = JSON.parse(jsonStr);
    } catch {
      return null;
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const insights = Array.isArray(parsed.insights) ? parsed.insights.filter((x) => typeof x === "string").map((x) => x.trim()).filter(Boolean).slice(0, 8) : [];
    const actions = Array.isArray(parsed.actions) ? parsed.actions.filter((x) => typeof x === "string").map((x) => x.trim()).filter(Boolean).slice(0, 6) : [];
    let confidence = parsed.confidence;
    if (typeof confidence === "string") confidence = parseFloat(confidence);
    if (!Number.isFinite(confidence)) confidence = insights.length ? 0.65 : 0.45;
    confidence = Math.max(0, Math.min(1, confidence));
    if (!insights.length && !actions.length) return null;
    return { insights, actions, confidence };
  }
  function formatStructuredLlmOutput(structured) {
    if (!structured) return "";
    const lines = [];
    if (structured.insights?.length) {
      lines.push("Insights:");
      structured.insights.forEach((line) => lines.push(`\u2022 ${line}`));
    }
    if (structured.actions?.length) {
      lines.push("Actions:");
      structured.actions.forEach((line) => lines.push(`\u2022 ${line}`));
    }
    if (structured.confidence != null) {
      lines.push(`Confidence: ${Math.round(structured.confidence * 100)}%`);
    }
    return lines.join("\n");
  }

  // packages/shared/src/ai/weekChat.mjs
  var MAX_CONTEXT_CHARS5 = 720;
  var MAX_WEEK_CHAT_TURNS = 5;
  function wrapUserNote3(note) {
    const raw = String(note || "").trim();
    if (!raw) return "";
    return `---USER_NOTE---
${raw}
---END_USER_NOTE---`;
  }
  function canSendWeekChatTurn(turnCount) {
    return turnCount < MAX_WEEK_CHAT_TURNS;
  }
  function buildWeekChatContext({
    analysis = {},
    logs = [],
    rangeLabel = "Last 14 days",
    rangeDays = 14
  }) {
    const parts = [];
    parts.push(`Week scope: ${rangeLabel} (${rangeDays} days).`);
    const total = analysis.totalLogs ?? (Array.isArray(logs) ? logs.length : 0);
    parts.push(`${total} logged day(s).`);
    if (analysis.flareDays != null && analysis.flareDays > 0) {
      parts.push(`Flares: ${analysis.flareDays} day(s).`);
    }
    if (analysis.avgFatigue != null) parts.push(`Fatigue avg: ${analysis.avgFatigue.toFixed(1)}/10.`);
    if (analysis.avgSleep != null) parts.push(`Sleep avg: ${analysis.avgSleep.toFixed(1)}/10.`);
    if (analysis.avgMood != null) parts.push(`Mood avg: ${analysis.avgMood.toFixed(1)}/10.`);
    if (analysis.topSymptoms?.length) {
      parts.push(`Top symptoms: ${analysis.topSymptoms.slice(0, 3).join(", ")}.`);
    }
    if (analysis.topStressors?.length) {
      parts.push(`Top stressors: ${analysis.topStressors.slice(0, 3).join(", ")}.`);
    }
    const recentNotes = (logs || []).map((l) => l && l.notes ? String(l.notes).trim() : "").filter(Boolean);
    if (recentNotes.length) parts.push(wrapUserNote3(recentNotes[recentNotes.length - 1]));
    const text = parts.join(" ");
    return text.length > MAX_CONTEXT_CHARS5 ? text.slice(0, MAX_CONTEXT_CHARS5) : text;
  }
  function formatWeekChatHistory(turns) {
    if (!Array.isArray(turns) || !turns.length) return "";
    return turns.map((t2, i) => `Turn ${i + 1}:
User: ${String(t2.user || "").trim()}
Assistant: ${String(t2.assistant || "").trim()}`).join("\n\n");
  }
  function buildWeekChatUserPayload({ baseContext, history, userMessage }) {
    const parts = [String(baseContext || "").trim()];
    const hist = String(history || "").trim();
    if (hist) parts.push(`Conversation:
${hist}`);
    parts.push(`User: ${String(userMessage || "").trim()}`);
    return parts.filter(Boolean).join("\n\n");
  }
  function buildWeekChatFallback(analysis = {}) {
    const total = analysis.totalLogs ?? 0;
    if (total < 3) {
      return "Log a few more days this week and I can spot patterns more clearly.";
    }
    const flare = analysis.flareDays ?? 0;
    if (flare > 0) {
      return `You logged ${total} days with ${flare} flare day(s). Rest and steady routines may help this week.`;
    }
    return `You logged ${total} days this period. Keep noting what helps; patterns build with steady logging.`;
  }

  // packages/shared/src/ai/llmOnDevicePolicy.mjs
  var BLOCKED_COMMERCIAL_LLM_HOST_PATTERNS = [
    /api\.openai\.com/i,
    /api\.anthropic\.com/i,
    /generativelanguage\.googleapis\.com/i,
    /api\.cohere\.ai/i,
    /api\.mistral\.ai/i,
    /api\.groq\.com/i,
    /api\.together\.xyz/i,
    /openrouter\.ai/i,
    /api\.perplexity\.ai/i
  ];
  var ALLOWED_LLM_MODEL_HOSTS = [
    "huggingface.co",
    "cdn.jsdelivr.net"
  ];
  function validateRemoteLlmEndpoint(endpoint) {
    const raw = String(endpoint || "").trim();
    if (!raw) return { allowed: true, ok: true };
    let host = "";
    try {
      host = new URL(raw).hostname.toLowerCase();
    } catch {
      return { allowed: false, ok: false, reason: "invalid_url" };
    }
    if (BLOCKED_COMMERCIAL_LLM_HOST_PATTERNS.some((re) => re.test(host))) {
      return { allowed: false, ok: false, reason: "commercial_api_blocked" };
    }
    return { allowed: true, ok: true };
  }
  function isPwaOnDeviceLlmOnly() {
    return true;
  }

  // packages/shared/src/ai/llmGoldenPrompts.mjs
  var GOLDEN_LLM_LOCALES = SHIPPED_LOCALES;
  var SAMPLE_CONTEXT = {
    summary: '{"totalLogs":7,"flareDays":1,"avgSleep":6.5}',
    suggest: '{"sleep":7,"fatigue":4,"mood":6}',
    homeQuestion: "Question: How is my sleep?\nRange: last 14 days.\n7 logged day(s).",
    clinicianBrief: "Range: Last 14 days. 7 logged day(s). Flare days: 1.",
    doctorQuestions: "Range: Last 14 days. Mood avg 6.2/10. Fatigue avg 5.1/10. Flare days: 1.",
    explainChart: "Chart range: Last 7 days. Mood avg 6.2.",
    structuredSummary: '{"totalLogs":7,"flareDays":0}',
    weekChat: "Week scope: Last 14 days.\nUser: What patterns do you see?"
  };
  var WELLNESS_GUARDRAIL_RES = [
    /no diagnosis|no medical|wellness|only the data|no prescription|no tool|reply with only/i,
    /keine diagnose|keine medizinisch|nur die|antworte nur|bereitgestellten/i,
    /sin diagnóstico|sin consejo médico|solo los datos|responde solo/i,
    /pas de diagnostic|pas de conseil médical|uniquement les données|réponds uniquement/i,
    /niente diagnosi|niente consigli medici|solo i dati|rispondi solo/i,
    /geen diagnose|geen medisch|alleen de verstrekte|antwoord alleen/i,
    /bez diagnozy|bez porad medycznych|tylko podanych|odpowiedz tylko/i,
    /sem diagnóstico|sem conselho médico|apenas os dados|responda apenas|responde apenas/i
  ];
  function hasWellnessGuardrail(system) {
    const sys = String(system || "");
    return WELLNESS_GUARDRAIL_RES.some((re) => re.test(sys));
  }
  var GOLDEN_LLM_INTENTS = (
    /** @type {GoldenIntent[]} */
    [
      { id: "motd", build: (locale) => buildMotdPrompt(locale, "water") },
      { id: "summary", build: (locale) => buildSummaryPrompt(locale, SAMPLE_CONTEXT.summary) },
      { id: "suggestNote", build: (locale) => buildSuggestPrompt(locale, SAMPLE_CONTEXT.suggest) },
      { id: "homeQuestion", build: (locale) => buildHomeQuestionPrompt(locale, SAMPLE_CONTEXT.homeQuestion) },
      { id: "clinicianBrief", build: (locale) => buildClinicianBriefPrompt(locale, SAMPLE_CONTEXT.clinicianBrief) },
      { id: "doctorQuestions", build: (locale) => buildDoctorQuestionsPrompt(locale, SAMPLE_CONTEXT.doctorQuestions) },
      { id: "explainChart", build: (locale) => buildExplainChartPrompt(locale, SAMPLE_CONTEXT.explainChart) },
      { id: "structuredSummary", build: (locale) => buildStructuredSummaryPrompt(locale, SAMPLE_CONTEXT.structuredSummary) },
      { id: "weekChat", build: (locale) => buildWeekChatPrompt(locale, SAMPLE_CONTEXT.weekChat) }
    ]
  );
  function auditGoldenPrompt(intentId, system, user) {
    const errors = [];
    const sys = String(system || "").trim();
    const usr = String(user || "").trim();
    if (sys.length < 16) errors.push(`${intentId}: system prompt too short`);
    if (usr.length < 3) errors.push(`${intentId}: user prompt too short`);
    if (!hasWellnessGuardrail(sys)) {
      errors.push(`${intentId}: missing wellness guardrail in system prompt`);
    }
    if (intentId === "structuredSummary" && !/json/i.test(sys)) {
      errors.push(`${intentId}: structured intent must mention JSON`);
    }
    if (intentId === "weekChat" && !/coach|conversation|scope/i.test(sys)) {
      errors.push(`${intentId}: week chat system prompt missing scope guardrail`);
    }
    return errors;
  }
  function runGoldenPromptAudit(locales = GOLDEN_LLM_LOCALES) {
    const errors = [];
    let checked = 0;
    for (const locale of locales) {
      for (const intent of GOLDEN_LLM_INTENTS) {
        checked += 1;
        const { system, user } = intent.build(locale);
        errors.push(...auditGoldenPrompt(intent.id, system, user));
        if (!isLlmInferenceAllowed(locale) && ["ar", "he", "ga"].includes(locale)) {
          continue;
        }
      }
    }
    return { errors, checked };
  }

  // packages/shared/src/settings/localeDefaults.mjs
  var LB_LOCALES = /* @__PURE__ */ new Set(["en-US", "en-us"]);
  function deriveWeightUnitFromLocale(locale) {
    const tag = typeof locale === "string" ? locale.trim() : "";
    if (LB_LOCALES.has(tag) || tag.endsWith("-US")) return "lb";
    return "kg";
  }
  function deriveFirstDayOfWeekFromLocale(locale) {
    try {
      const loc = typeof locale === "string" && locale ? locale : "en-GB";
      const parts = new Intl.Locale(loc).weekInfo;
      if (parts && (parts.firstDay === 0 || parts.firstDay === 1 || parts.firstDay === 6)) {
        return parts.firstDay;
      }
    } catch (_) {
    }
    const tag = (typeof locale === "string" ? locale : "en-GB").toLowerCase();
    if (tag.startsWith("en-us")) return 0;
    return 1;
  }
  function deriveDateFormatFromLocale(locale) {
    const tag = (typeof locale === "string" ? locale : "en-GB").toLowerCase();
    if (tag.startsWith("en-us")) return "MDY";
    if (tag.startsWith("ja") || tag.startsWith("zh") || tag.startsWith("ko")) return "YMD";
    return "DMY";
  }
  function applyLocaleDefaultsToPrefs(prefs, locale) {
    const next = { ...prefs && typeof prefs === "object" ? prefs : {} };
    const loc = typeof locale === "string" && locale ? locale : next.uiLocale || "en-GB";
    if (!next.localeDefaultsApplied) {
      if (!next.weightUnitSource || next.weightUnitSource === "default") {
        next.weightUnit = deriveWeightUnitFromLocale(loc);
        next.weightUnitSource = "locale";
      }
      if (!next.dateFormat || next.dateFormat === "DMY") {
        next.dateFormat = "locale";
      }
      next.firstDayOfWeek = typeof next.firstDayOfWeek === "number" ? next.firstDayOfWeek : deriveFirstDayOfWeekFromLocale(loc);
      next.localeDefaultsApplied = true;
    }
    return next;
  }

  // packages/shared/src/settings/avatars.mjs
  var PROFILE_AVATAR_IDS = [
    "voidorb",
    "tidewarden",
    "leafcircuit",
    "prismcore",
    "moonthread",
    "emberveil",
    "riftecho",
    "stonebloom",
    "glasswave",
    "ashspiral",
    "coralnode",
    "starlace",
    "mistveil",
    "thornloop",
    "sunwarden",
    "duskmantle",
    "ironbloom",
    "vortexseed",
    "lumenshard",
    "driftmoss"
  ];
  var LEGACY_AVATAR_MAP = {
    leaf: "leafcircuit",
    heart: "voidorb",
    star: "starlace",
    sun: "sunwarden",
    pulse: "riftecho",
    shield: "stonebloom"
  };
  var USER_VIBE_IDS = ["calm", "energy", "nature", "clinical", "dark"];
  function normalizeProfileAvatar(value) {
    const id = typeof value === "string" ? value.trim() : "";
    if (PROFILE_AVATAR_IDS.includes(id)) return id;
    if (LEGACY_AVATAR_MAP[id]) return LEGACY_AVATAR_MAP[id];
    return "voidorb";
  }
  function normalizeUserVibe(value) {
    const v = typeof value === "string" ? value.trim() : "";
    return USER_VIBE_IDS.includes(v) ? v : "calm";
  }
  function normalizeDisplayNameTheme(value) {
    const allowed = ["mint", "coral", "sky", "violet", "gold"];
    const v = typeof value === "string" ? value.trim() : "";
    return allowed.includes(v) ? v : "mint";
  }

  // packages/shared/src/settings/consentDashboard.mjs
  function buildConsentDashboardEntries(input) {
    const p = input && typeof input === "object" ? input : {};
    const rows = [];
    rows.push({
      id: "healthData",
      granted: p.healthDataConsent === true,
      updatedAt: p.healthDataConsentAt || null,
      revokeField: "healthDataConsent"
    });
    rows.push({
      id: "cookie",
      granted: p.cookieConsent === true,
      updatedAt: p.cookieConsentAt || null,
      revokeField: "cookieConsent"
    });
    rows.push({
      id: "aiModel",
      granted: p.aiModelDownloadConsent === "granted",
      updatedAt: p.aiModelDownloadConsentAt || null,
      revokeField: "aiModelDownloadConsent",
      revokeValue: "deferred"
    });
    rows.push({
      id: "push",
      granted: p.pushNotificationsEnabled === true || p.notificationsEnabled === true,
      updatedAt: p.pushNotificationsEnabledAt || p.notificationsEnabledAt || null,
      revokeField: "pushNotificationsEnabled"
    });
    rows.push({
      id: "anonPool",
      granted: p.contributeAnonData === true,
      updatedAt: p.contributeAnonDataAt || null,
      revokeField: "contributeAnonData"
    });
    rows.push({
      id: "sessionRecording",
      granted: p.sessionRecording === true,
      updatedAt: p.sessionRecordingAt || null,
      revokeField: "sessionRecording"
    });
    rows.push({
      id: "barcodeFood",
      granted: p.barcodeFoodLoggingEnabled === true,
      updatedAt: p.barcodeFoodLoggingEnabledAt || null,
      revokeField: "barcodeFoodLoggingEnabled"
    });
    return rows;
  }
  function buildConsentAuditPayload(field, value, platform) {
    return {
      field: String(field || ""),
      value,
      ts: Date.now(),
      platform: platform || (typeof window !== "undefined" ? "pwa" : "rn")
    };
  }

  // packages/shared/src/settings/profileExport.mjs
  var SETTINGS_PROFILE_EXPORT_VERSION = 1;
  function buildSettingsProfileExport(prefs, goals) {
    return {
      kind: "rianell-settings-profile",
      version: SETTINGS_PROFILE_EXPORT_VERSION,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      settings: prefs && typeof prefs === "object" ? { ...prefs } : {},
      goals: goals && typeof goals === "object" ? { ...goals } : {}
    };
  }
  function parseSettingsProfileImport(raw) {
    let parsed = raw;
    if (typeof raw === "string") {
      parsed = JSON.parse(raw);
    }
    if (!parsed || typeof parsed !== "object") {
      throw new Error("invalid_profile");
    }
    if (parsed.kind !== "rianell-settings-profile") {
      throw new Error("wrong_kind");
    }
    const version = typeof parsed.version === "number" ? parsed.version : 0;
    if (version > SETTINGS_PROFILE_EXPORT_VERSION) {
      throw new Error("unsupported_version");
    }
    const settings = parsed.settings && typeof parsed.settings === "object" ? parsed.settings : {};
    const goals = parsed.goals && typeof parsed.goals === "object" ? parsed.goals : {};
    return { settings, goals, exportedAt: parsed.exportedAt || null };
  }

  // packages/shared/src/logging/vitalSuggestions.mjs
  var VITAL_SUGGESTION_LOOKBACK_DAYS = 90;
  var VITAL_SUGGESTION_FIELD_IDS = [
    "bloodPressure",
    "bloodGlucose",
    "spO2",
    "hrv",
    "bodyWeight"
  ];
  function parsePositiveNumber(raw) {
    const n = typeof raw === "number" ? raw : parseFloat(String(raw ?? ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  function parsePositiveInt(raw) {
    const n = typeof raw === "number" ? raw : parseInt(String(raw ?? ""), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  function daysBetween(fromIso, toIso) {
    if (!fromIso || !toIso) return null;
    const from = /* @__PURE__ */ new Date(fromIso + "T12:00:00");
    const to = /* @__PURE__ */ new Date(toIso + "T12:00:00");
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
    return Math.round((to.getTime() - from.getTime()) / (1e3 * 60 * 60 * 24));
  }
  function sortLogsDesc(logs) {
    return [...logs || []].filter((log) => log && typeof log.date === "string" && log.date).sort((a, b) => a.date === b.date ? 0 : a.date < b.date ? 1 : -1);
  }
  function logHasVitalField(log, fieldId) {
    switch (fieldId) {
      case "bloodPressure":
        return parsePositiveInt(log.bloodPressureSystolic) != null;
      case "bloodGlucose":
        return parsePositiveNumber(log.bloodGlucose) != null;
      case "spO2":
        return parsePositiveInt(log.spO2) != null;
      case "hrv":
        return parsePositiveInt(log.hrv) != null;
      case "bodyWeight":
        return parsePositiveNumber(log.bodyWeight) != null;
      default:
        return false;
    }
  }
  function extractVitalValues(log, fieldId, unitPrefs = {}) {
    switch (fieldId) {
      case "bloodPressure": {
        const systolic = parsePositiveInt(log.bloodPressureSystolic);
        if (systolic == null) return null;
        const bpm = parsePositiveInt(log.bpm);
        const out = { bloodPressureSystolic: systolic };
        if (bpm != null) out.bpm = bpm;
        return out;
      }
      case "bloodGlucose": {
        const raw = parsePositiveNumber(log.bloodGlucose);
        if (raw == null) return null;
        const storedUnit = log.bloodGlucoseUnit === "mgdl" ? "mgdl" : "mmol";
        const targetUnit = unitPrefs.glucoseUnit === "mgdl" ? "mgdl" : "mmol";
        let mmol = storedUnit === "mgdl" ? mgdlToMmol(raw) : raw;
        if (mmol == null) return null;
        const value = targetUnit === "mgdl" ? mmolToMgdl(mmol) : mmol;
        if (value == null) return null;
        return {
          bloodGlucose: Number(Number(value).toFixed(targetUnit === "mgdl" ? 0 : 1)),
          bloodGlucoseUnit: targetUnit
        };
      }
      case "spO2": {
        const spO2 = parsePositiveInt(log.spO2);
        return spO2 != null ? { spO2 } : null;
      }
      case "hrv": {
        const hrv = parsePositiveInt(log.hrv);
        return hrv != null ? { hrv } : null;
      }
      case "bodyWeight": {
        const raw = parsePositiveNumber(log.bodyWeight);
        if (raw == null) return null;
        const storedUnit = log.bodyWeightUnit === "lbs" ? "lbs" : "kg";
        const targetUnit = unitPrefs.bodyWeightUnit === "lbs" ? "lbs" : "kg";
        let kg = storedUnit === "lbs" ? lbsToKg(raw) : raw;
        if (kg == null) return null;
        const value = targetUnit === "lbs" ? kgToLbs(kg) : kg;
        if (value == null) return null;
        return { bodyWeight: Number(Number(value).toFixed(1)), bodyWeightUnit: targetUnit };
      }
      default:
        return null;
    }
  }
  function formatVitalSuggestionDisplay(fieldId, values, unitPrefs = {}) {
    if (!values) return "";
    switch (fieldId) {
      case "bloodPressure": {
        const sys = values.bloodPressureSystolic;
        const bpm = values.bpm;
        if (bpm != null) return `${sys} mmHg / ${bpm} bpm`;
        return `${sys} mmHg`;
      }
      case "bloodGlucose":
        return `${values.bloodGlucose} ${values.bloodGlucoseUnit === "mgdl" ? "mg/dL" : "mmol/L"}`;
      case "spO2":
        return `${values.spO2}%`;
      case "hrv":
        return `${values.hrv} ms`;
      case "bodyWeight":
        return `${values.bodyWeight} ${values.bodyWeightUnit === "lbs" ? "lb" : "kg"}`;
      default:
        return "";
    }
  }
  function findLatestVitalSuggestion(logs, fieldId, targetDateIso, options = {}) {
    if (!fieldId || !VITAL_SUGGESTION_FIELD_IDS.includes(fieldId)) return null;
    const lookbackDays = options.lookbackDays ?? VITAL_SUGGESTION_LOOKBACK_DAYS;
    const excludeSameDate = options.excludeSameDate !== false;
    const unitPrefs = options.unitPrefs && typeof options.unitPrefs === "object" ? options.unitPrefs : {};
    for (const log of sortLogsDesc(logs)) {
      if (!log.date) continue;
      if (targetDateIso && log.date >= targetDateIso) continue;
      if (excludeSameDate && targetDateIso && log.date === targetDateIso) continue;
      if (lookbackDays != null && targetDateIso) {
        const age = daysBetween(log.date, targetDateIso);
        if (age == null || age > lookbackDays) continue;
      }
      if (!logHasVitalField(log, fieldId)) continue;
      const values = extractVitalValues(log, fieldId, unitPrefs);
      if (!values) continue;
      return {
        fieldId,
        fromDate: log.date,
        values,
        displayValue: formatVitalSuggestionDisplay(fieldId, values, unitPrefs)
      };
    }
    return null;
  }
  function buildVitalSuggestions(logs, targetDateIso, options = {}) {
    const out = {};
    VITAL_SUGGESTION_FIELD_IDS.forEach((fieldId) => {
      const row = findLatestVitalSuggestion(logs, fieldId, targetDateIso, options);
      if (row) out[fieldId] = row;
    });
    return out;
  }

  // packages/shared/src/logging/microCheckin.mjs
  var HOME_CHECKIN_PERIODS = ["AM", "midday", "PM"];
  function periodForHour(hour) {
    const h = typeof hour === "number" ? hour : (/* @__PURE__ */ new Date()).getHours();
    if (h < 11) return "AM";
    if (h < 17) return "midday";
    return "PM";
  }
  function completedCheckinPeriods(todayLog) {
    const subs = Array.isArray(todayLog?.subEntries) ? todayLog.subEntries : [];
    return new Set(
      subs.map((s) => s?.period).filter((p) => typeof p === "string" && HOME_CHECKIN_PERIODS.includes(p))
    );
  }
  function byDateAsc(a, b) {
    return String(a.date).localeCompare(String(b.date));
  }
  function applyMicroCheckin(logs, todayStr, period, metrics = {}) {
    if (!HOME_CHECKIN_PERIODS.includes(period)) {
      throw new Error(`Invalid check-in period: ${period}`);
    }
    const sub = normalizeSubEntry({
      id: `${todayStr}-${period}`,
      period,
      mood: metrics.mood,
      sleep: metrics.sleep,
      fatigue: metrics.fatigue
    });
    const incoming = { date: todayStr, flare: "No", subEntries: [sub] };
    const list = Array.isArray(logs) ? [...logs] : [];
    const idx = list.findIndex((l) => l?.date === todayStr);
    if (idx >= 0) {
      const merged = mergeLogEntriesForDate(list[idx], incoming);
      const next = [...list];
      next[idx] = merged;
      return next.sort(byDateAsc);
    }
    return [...list, { ...incoming }].sort(byDateAsc);
  }

  // packages/shared/src/logging/favorites.mjs
  var MAX_FAVORITES = 24;
  function normalizeFavoriteItem(value, maxLen = 120) {
    if (typeof value !== "string") return null;
    const s = value.trim().slice(0, maxLen);
    return s || null;
  }
  function normalizeFavoriteList(raw, maxLen) {
    if (!Array.isArray(raw)) return [];
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const item of raw) {
      const s = normalizeFavoriteItem(item, maxLen);
      if (!s || seen.has(s.toLowerCase())) continue;
      seen.add(s.toLowerCase());
      out.push(s);
      if (out.length >= MAX_FAVORITES) break;
    }
    return out;
  }
  function normalizeLogFavorites(value) {
    const v = value && typeof value === "object" ? value : {};
    return {
      meals: normalizeFavoriteList(v.meals, 200),
      exercises: normalizeFavoriteList(v.exercises, 120),
      medCombos: normalizeFavoriteList(v.medCombos, 200)
    };
  }
  function addLogFavorite(favorites, kind, label) {
    const base = normalizeLogFavorites(favorites);
    const key = kind === "meals" || kind === "exercises" || kind === "medCombos" ? kind : null;
    if (!key) return base;
    const s = normalizeFavoriteItem(label);
    if (!s) return base;
    const next = [s, ...base[key].filter((x) => x.toLowerCase() !== s.toLowerCase())].slice(0, MAX_FAVORITES);
    return { ...base, [key]: next };
  }

  // packages/shared/src/logging/symptomTemplates.mjs
  var MAX_TEMPLATES = 12;
  var MAX_CHIPS = 40;
  function normalizeSymptomTemplates(value) {
    if (!Array.isArray(value)) return [];
    const out = [];
    for (const row of value) {
      if (!row || typeof row !== "object") continue;
      const condition = typeof row.condition === "string" ? row.condition.trim().slice(0, 120) : "";
      const chips = Array.isArray(row.chips) ? row.chips.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim().slice(0, 80)).slice(0, MAX_CHIPS) : [];
      if (!condition && !chips.length) continue;
      out.push({ condition: condition || "General", chips });
      if (out.length >= MAX_TEMPLATES) break;
    }
    return out;
  }
  function getSymptomChipsForCondition(templates, condition) {
    const list = normalizeSymptomTemplates(templates);
    const needle = (condition || "").trim().toLowerCase();
    if (!needle) return list[0]?.chips || [];
    const exact = list.find((t2) => t2.condition.toLowerCase() === needle);
    if (exact) return exact.chips;
    const partial = list.find((t2) => t2.condition.toLowerCase().includes(needle) || needle.includes(t2.condition.toLowerCase()));
    return partial?.chips || list[0]?.chips || [];
  }
  function upsertSymptomTemplate(templates, condition, chips) {
    const list = normalizeSymptomTemplates(templates);
    const cond = (condition || "General").trim().slice(0, 120);
    const chipList = Array.isArray(chips) ? chips.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim().slice(0, 80)).slice(0, MAX_CHIPS) : [];
    const idx = list.findIndex((t2) => t2.condition.toLowerCase() === cond.toLowerCase());
    if (idx >= 0) {
      const next = [...list];
      next[idx] = { condition: cond, chips: chipList };
      return next;
    }
    return [...list, { condition: cond, chips: chipList }].slice(-MAX_TEMPLATES);
  }

  // packages/shared/src/logging/medSchedule.mjs
  var MAX_SCHEDULE = 20;
  function normalizeTime(value) {
    if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) return null;
    const [h, m] = value.split(":").map(Number);
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return value;
  }
  function normalizeMedScheduleEntry(value) {
    const v = value && typeof value === "object" ? value : {};
    const drug = typeof v.drug === "string" ? v.drug.trim().slice(0, 120) : "";
    const dose = typeof v.dose === "string" ? v.dose.trim().slice(0, 80) : "";
    const times = Array.isArray(v.times) ? v.times.map(normalizeTime).filter(Boolean).slice(0, 8) : [];
    const id = typeof v.id === "string" && v.id.trim() ? v.id.trim().slice(0, 40) : `med-${drug.slice(0, 20) || "rx"}`;
    if (!drug && !times.length) return null;
    return { id, drug: drug || "Medication", dose, times, enabled: v.enabled !== false };
  }
  function normalizeMedSchedule(raw) {
    if (!Array.isArray(raw)) return [];
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    for (const row of raw) {
      const entry = normalizeMedScheduleEntry(row);
      if (!entry || seen.has(entry.id)) continue;
      seen.add(entry.id);
      out.push(entry);
      if (out.length >= MAX_SCHEDULE) break;
    }
    return out;
  }
  function buildTodayMedDoseStatuses(schedule, dateIso, takenMap = {}) {
    const day = typeof dateIso === "string" ? dateIso.slice(0, 10) : (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const entries = normalizeMedSchedule(schedule).filter((e) => e.enabled !== false);
    const doses = [];
    entries.forEach((entry) => {
      entry.times.forEach((time) => {
        const key = `${entry.id}@${day}T${time}`;
        const status = takenMap[key] === "skipped" || takenMap[key] === "missed" ? takenMap[key] : takenMap[key] === "taken" ? "taken" : "pending";
        doses.push({
          drug: entry.drug,
          dose: entry.dose,
          scheduledAt: `${day}T${time}`,
          status,
          scheduleId: entry.id
        });
      });
    });
    return doses;
  }

  // packages/shared/src/logging/progressiveTracking.mjs
  var PROGRESSIVE_CATEGORIES = ["core", "sleep", "food", "exercise", "medications", "cycle"];
  var UNLOCK_DAYS = {
    core: 0,
    sleep: 3,
    food: 7,
    exercise: 14,
    medications: 21,
    cycle: 28
  };
  function getUnlockDaysForCategory(category) {
    return UNLOCK_DAYS[category] ?? 0;
  }
  function daysSinceTrackingProfileStart(profile) {
    const p = normalizeTrackingProfile(profile);
    if (!p.configuredAt) return 0;
    const start = Date.parse(p.configuredAt);
    if (!Number.isFinite(start)) return 0;
    return Math.max(0, Math.floor((Date.now() - start) / 864e5));
  }
  function getUnlockedLogCategories(profile) {
    const days = daysSinceTrackingProfileStart(profile);
    return PROGRESSIVE_CATEGORIES.filter((cat) => days >= (UNLOCK_DAYS[cat] ?? 0));
  }
  function isLogCategoryUnlocked(profile, category) {
    return getUnlockedLogCategories(profile).includes(category);
  }
  function getVisibleTrackingFields(profile) {
    const p = normalizeTrackingProfile(profile);
    const unlocked = new Set(getUnlockedLogCategories(profile));
    const fields = { ...p.fields };
    if (!unlocked.has("sleep")) {
      fields.sleep = false;
      fields.fatigue = false;
    }
    return fields;
  }
  function shouldShowWizardCategory(profile, category) {
    if (!isLogCategoryUnlocked(profile, category)) return false;
    if (category === "core") return true;
    if (category === "sleep") {
      const f = getVisibleTrackingFields(profile);
      return f.sleep || f.fatigue;
    }
    return true;
  }

  // packages/shared/src/logging/barcodeFood.mjs
  var OFF_PRODUCT_API = "https://world.openfoodfacts.org/api/v2/product";
  var OFF_SEARCH_API = "https://world.openfoodfacts.org/cgi/search.pl";
  var OFF_USER_AGENT = "Rianell/1.0 (health PWA; contact: support@rianell.com)";
  function parseNutrients(nutriments = {}) {
    const n = nutriments && typeof nutriments === "object" ? nutriments : {};
    return {
      energy_kcal: numOrUndef(n["energy-kcal_100g"] ?? n["energy-kcal"]),
      proteins_g: numOrUndef(n.proteins_100g ?? n.proteins),
      carbohydrates_g: numOrUndef(n.carbohydrates_100g ?? n.carbohydrates),
      fat_g: numOrUndef(n.fat_100g ?? n.fat),
      fiber_g: numOrUndef(n.fiber_100g ?? n.fiber)
    };
  }
  function numOrUndef(v) {
    const x = Number(v);
    return Number.isFinite(x) ? x : void 0;
  }
  function mapProduct(p, barcode) {
    const name = p.product_name || p.generic_name || p.brands || "Unknown product";
    const brand = typeof p.brands === "string" ? p.brands.split(",")[0].trim() : "";
    const nutrients = parseNutrients(p.nutriments);
    const tags = Array.isArray(p.labels_tags) ? p.labels_tags.filter((t2) => typeof t2 === "string") : [];
    return {
      barcode: String(barcode || p.code || "").replace(/\D/g, ""),
      name: String(name).trim().slice(0, 200),
      brand: brand.slice(0, 120),
      nutriScore: typeof p.nutriscore_grade === "string" ? p.nutriscore_grade.toUpperCase().slice(0, 1) : void 0,
      serving: typeof p.serving_size === "string" ? p.serving_size.slice(0, 80) : void 0,
      nutrients,
      fodmap_tags: tags.filter((t2) => t2.includes("fodmap")).map((t2) => t2.replace(/^en:/, ""))
    };
  }
  async function fetchOpenFoodFactsProduct(barcode, fetchImpl = globalThis.fetch) {
    const code = String(barcode || "").replace(/\D/g, "");
    if (code.length < 8) throw new Error("Invalid barcode");
    if (typeof fetchImpl !== "function") throw new Error("fetch unavailable");
    const res = await fetchImpl(`${OFF_PRODUCT_API}/${code}.json`, {
      headers: { Accept: "application/json", "User-Agent": OFF_USER_AGENT }
    });
    if (!res.ok) throw new Error(`Open Food Facts HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 1 || !data.product) throw new Error("Product not found");
    return mapProduct(data.product, code);
  }
  var lookupBarcode = fetchOpenFoodFactsProduct;
  async function searchFood(query, page = 1, fetchImpl = globalThis.fetch) {
    const q = String(query || "").trim().slice(0, 120);
    if (!q) return [];
    if (typeof fetchImpl !== "function") throw new Error("fetch unavailable");
    const params = new URLSearchParams({
      search_terms: q,
      search_simple: "1",
      action: "process",
      json: "1",
      page_size: "20",
      page: String(Math.max(1, Math.min(20, Number(page) || 1)))
    });
    const url = `${OFF_SEARCH_API}?${params.toString()}`;
    if (!url.startsWith(OFF_SEARCH_API)) throw new Error("Invalid search URL");
    const res = await fetchImpl(url, {
      headers: { Accept: "application/json", "User-Agent": OFF_USER_AGENT }
    });
    if (!res.ok) throw new Error(`Open Food Facts search HTTP ${res.status}`);
    const data = await res.json();
    const products = Array.isArray(data.products) ? data.products : [];
    return products.filter((p) => p && (p.product_name || p.generic_name)).slice(0, 20).map((p) => mapProduct(p, p.code || p._id));
  }
  function formatBarcodeFoodLabel(product) {
    if (!product || typeof product !== "object") return "";
    const parts = [product.brand, product.name].filter(Boolean);
    return parts.join(", ").slice(0, 200);
  }
  function parseServingGrams(serving) {
    if (typeof serving !== "string" || !serving.trim()) return null;
    const gMatch = serving.match(/(\d+(?:[.,]\d+)?)\s*g\b/i);
    if (gMatch) {
      const n = Number(String(gMatch[1]).replace(",", "."));
      if (Number.isFinite(n) && n > 0) return Math.min(500, Math.round(n * 10) / 10);
    }
    return null;
  }
  function barcodeProductToFoodItem(product) {
    if (!product || typeof product !== "object") {
      return { name: "", calories: void 0, protein: void 0, barcode: "" };
    }
    const baseName = formatBarcodeFoodLabel(product);
    const nutrients = product.nutrients && typeof product.nutrients === "object" ? product.nutrients : {};
    const grams = parseServingGrams(product.serving) ?? 100;
    const factor = grams / 100;
    let name = baseName;
    if (product.serving && grams !== 100) {
      name = `${baseName} (${String(product.serving).slice(0, 48)})`;
    } else if (grams === 100 && !product.serving) {
      name = `${baseName} (100g)`;
    }
    const calories = nutrients.energy_kcal != null ? Math.round(nutrients.energy_kcal * factor) : void 0;
    const protein = nutrients.proteins_g != null ? Math.round(nutrients.proteins_g * factor * 10) / 10 : void 0;
    return {
      name: name.slice(0, 200),
      calories,
      protein,
      barcode: String(product.barcode || "").replace(/\D/g, ""),
      source: "barcode"
    };
  }

  // packages/shared/src/notifications/smartReminder.mjs
  var SMART_REMINDER_WINDOW_DAYS = 14;
  var SMART_REMINDER_MIN_SAMPLES = 3;
  var SMART_REMINDER_GRACE_MINUTES = 30;
  function toDateStr3(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  function parseHHMM(hhmm) {
    const m = /^(\d{2}):(\d{2})$/.exec(String(hhmm || "").trim());
    if (!m) return null;
    const hour = Number(m[1]);
    const minute = Number(m[2]);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return { hour, minute, totalMinutes: hour * 60 + minute };
  }
  function localDateStrFromNow(now = /* @__PURE__ */ new Date()) {
    return toDateStr3(now);
  }
  function minutesToHHMM(totalMinutes) {
    const m = (totalMinutes % (24 * 60) + 24 * 60) % (24 * 60);
    const hour = Math.floor(m / 60);
    const minute = m % 60;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }
  function addMinutesToHHMM(hhmm, delta) {
    const p = parseHHMM(hhmm);
    if (!p) return hhmm;
    return minutesToHHMM(p.totalMinutes + delta);
  }
  function parseSavedAtToMinutes(savedAt) {
    if (typeof savedAt !== "string" || !savedAt.trim()) return null;
    const d = new Date(savedAt);
    if (Number.isNaN(d.getTime())) return null;
    return d.getHours() * 60 + d.getMinutes();
  }
  function hasLoggedToday(logs, todayStr) {
    if (!Array.isArray(logs) || !todayStr) return false;
    return logs.some((l) => l && l.date === todayStr);
  }
  function computeMedianLogTimeMinutes(logs, opts = {}) {
    const windowDays = opts.windowDays ?? SMART_REMINDER_WINDOW_DAYS;
    const minSamples = opts.minSamples ?? SMART_REMINDER_MIN_SAMPLES;
    const now = opts.now instanceof Date ? opts.now : /* @__PURE__ */ new Date();
    const todayStr = opts.todayStr ?? toDateStr3(now);
    const end = /* @__PURE__ */ new Date(`${todayStr}T23:59:59`);
    const start = new Date(end);
    start.setDate(start.getDate() - windowDays);
    const minutes = [];
    (logs || []).forEach((log) => {
      if (!log?.date) return;
      const d = /* @__PURE__ */ new Date(`${log.date}T12:00:00`);
      if (Number.isNaN(d.getTime()) || d < start || d > end) return;
      const m = parseSavedAtToMinutes(log.savedAt);
      if (m == null) return;
      minutes.push(m);
    });
    if (minutes.length < minSamples) return null;
    minutes.sort((a, b) => a - b);
    const mid = Math.floor(minutes.length / 2);
    return minutes.length % 2 === 1 ? minutes[mid] : Math.round((minutes[mid - 1] + minutes[mid]) / 2);
  }
  function resolveSmartReminderTime(logs, fallbackHHMM, opts = {}) {
    const median = computeMedianLogTimeMinutes(logs, opts);
    if (median == null) {
      const fallback = parseHHMM(fallbackHHMM);
      return { time: fallback ? fallbackHHMM : "20:00", learned: false };
    }
    return { time: minutesToHHMM(median), learned: true };
  }
  function resolveMissedLogNudgeTimeHHMM(logs, fallbackHHMM, opts = {}) {
    const { time, learned } = resolveSmartReminderTime(logs, fallbackHHMM, opts);
    const grace = opts.graceMinutes ?? SMART_REMINDER_GRACE_MINUTES;
    return { time: addMinutesToHHMM(time, grace), learned, baseTime: time };
  }
  function shouldFireMissedLogNudge(logs, now, opts = {}) {
    const todayStr = opts.todayStr ?? toDateStr3(now);
    if (hasLoggedToday(logs, todayStr)) {
      return { fire: false, reason: "logged-today" };
    }
    const fallback = opts.fallbackHHMM ?? "20:00";
    const { time: nudgeHHMM, learned } = resolveMissedLogNudgeTimeHHMM(logs, fallback, opts);
    const nudge = parseHHMM(nudgeHHMM);
    if (!nudge) return { fire: false, reason: "invalid-nudge-time" };
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (nowMinutes < nudge.totalMinutes) {
      return { fire: false, reason: "before-nudge-time", nudgeHHMM, learned };
    }
    if (opts.lastNudgeDate === todayStr) {
      return { fire: false, reason: "already-nudged", nudgeHHMM, learned };
    }
    return { fire: true, nudgeHHMM, learned };
  }
  function stampLogSavedAtForSave(entry, existingEntry, when = /* @__PURE__ */ new Date()) {
    if (!entry || typeof entry !== "object") return entry;
    if (existingEntry?.savedAt && existingEntry.date === entry.date) {
      return { ...entry, savedAt: existingEntry.savedAt };
    }
    return { ...entry, savedAt: when.toISOString() };
  }

  // packages/shared/src/notifications/medDoseReminders.mjs
  var MED_DOSE_SNOOZE_MINUTES = 15;
  var MED_DOSE_FIRE_WINDOW_MS = 6e4;
  function medDoseReminderNotificationId(scheduledAt) {
    const safe = String(scheduledAt || "").replace(/[^0-9A-Za-z]/g, "");
    return `rianell-med-dose-${safe || "unknown"}`;
  }
  function extractMedDoseTakenMap(logs, dateStr) {
    const map = {};
    if (!Array.isArray(logs) || !dateStr) return map;
    const log = logs.find((l) => l && l.date === dateStr);
    if (!log) return map;
    if (Array.isArray(log.medicationDoses)) {
      log.medicationDoses.forEach((d) => {
        if (!d?.scheduledAt || !d.status) return;
        if (d.status === "taken" || d.status === "skipped" || d.status === "missed") {
          map[d.scheduledAt] = d.status;
        }
      });
    }
    return map;
  }
  function parseScheduledAt(scheduledAt) {
    if (typeof scheduledAt !== "string" || !scheduledAt.includes("T")) return null;
    const [date, time] = scheduledAt.split("T");
    const m = /^(\d{2}):(\d{2})$/.exec(time || "");
    if (!m || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    return { date, hour: Number(m[1]), minute: Number(m[2]) };
  }
  function isMedDoseSnoozed(scheduledAt, snoozeUntilMap, now = /* @__PURE__ */ new Date()) {
    if (!snoozeUntilMap || typeof snoozeUntilMap !== "object") return false;
    const until = snoozeUntilMap[scheduledAt];
    if (typeof until !== "string") return false;
    const t2 = new Date(until);
    return !Number.isNaN(t2.getTime()) && t2 > now;
  }
  function listTodayMedDoseReminders(schedule, logs, now = /* @__PURE__ */ new Date(), opts = {}) {
    const todayStr = opts.todayStr ?? localDateStrFromNow(now);
    const takenFromLog = extractMedDoseTakenMap(logs, todayStr);
    const takenMap = { ...takenFromLog, ...opts.takenMap || {} };
    const doses = buildTodayMedDoseStatuses(schedule, todayStr, takenMap).filter((d) => d.status === "pending");
    const notified = opts.notifiedAt || {};
    const snoozeUntil = opts.snoozeUntil || {};
    return doses.map((dose) => {
      const parsed = parseScheduledAt(dose.scheduledAt);
      if (!parsed) return null;
      const triggerAt = /* @__PURE__ */ new Date(`${parsed.date}T${String(parsed.hour).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")}:00`);
      const snoozed = isMedDoseSnoozed(dose.scheduledAt, snoozeUntil, now);
      const alreadyNotified = notified[dose.scheduledAt] === todayStr;
      const fire = shouldFireMedDoseReminder(dose, now, { todayStr, snoozeUntil, notified, triggerAt });
      return {
        ...dose,
        triggerAt: triggerAt.toISOString(),
        fire: fire.fire,
        fireReason: fire.reason,
        schedule: fire.schedule,
        snoozed,
        alreadyNotified
      };
    }).filter(Boolean);
  }
  function shouldFireMedDoseReminder(dose, now = /* @__PURE__ */ new Date(), opts = {}) {
    const todayStr = opts.todayStr ?? localDateStrFromNow(now);
    const scheduledAt = dose?.scheduledAt;
    if (!scheduledAt || dose.status !== "pending") return { fire: false, schedule: false, reason: "not-pending" };
    if (isMedDoseSnoozed(scheduledAt, opts.snoozeUntil, now)) {
      return { fire: false, schedule: false, reason: "snoozed" };
    }
    const notified = opts.notifiedAt || {};
    if (notified[scheduledAt] === todayStr) return { fire: false, schedule: false, reason: "already-notified" };
    const parsed = parseScheduledAt(scheduledAt);
    if (!parsed || parsed.date !== todayStr) return { fire: false, schedule: false, reason: "not-today" };
    const triggerAt = opts.triggerAt instanceof Date ? opts.triggerAt : /* @__PURE__ */ new Date(`${parsed.date}T${String(parsed.hour).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")}:00`);
    const delta = now.getTime() - triggerAt.getTime();
    if (delta < 0) return { fire: false, schedule: true, reason: "upcoming", triggerAt: triggerAt.toISOString() };
    if (delta <= MED_DOSE_FIRE_WINDOW_MS) return { fire: true, schedule: false, reason: "due-now", triggerAt: triggerAt.toISOString() };
    if (delta <= 30 * 6e4) return { fire: true, schedule: false, reason: "overdue", triggerAt: triggerAt.toISOString() };
    return { fire: false, schedule: false, reason: "missed-window" };
  }
  function hasEnabledMedSchedule(schedule) {
    return normalizeMedSchedule(schedule).some((e) => e.enabled !== false && Array.isArray(e.times) && e.times.length > 0);
  }
  function buildMedDoseNotificationContent(dose) {
    const label = dose?.dose ? `${dose.drug} (${dose.dose})` : dose?.drug || "Medication";
    return {
      title: "Medication reminder",
      body: `Time for ${label}. Mark taken when you log today.`,
      scheduledAt: dose.scheduledAt
    };
  }

  // packages/shared/src/notifications/flareRiskNudge.mjs
  function mean2(values) {
    if (!values.length) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  function isoWeekKey(date = /* @__PURE__ */ new Date()) {
    const d = date instanceof Date ? new Date(date.getTime()) : new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNo = 1 + Math.round(((d.getTime() - week1.getTime()) / 864e5 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `${d.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  }
  function evaluateFatigueWeekAnomaly(logs, opts = {}) {
    const list = [...Array.isArray(logs) ? logs : []].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const baselineDays = opts.baselineDays ?? 30;
    const recentDays = opts.recentDays ?? 7;
    const baseline = list.slice(-baselineDays);
    const recent = list.slice(-recentDays);
    const baseVals = baseline.map((l) => l.fatigue).filter((v) => v != null);
    const recentVals = recent.map((l) => l.fatigue).filter((v) => v != null);
    if (baseVals.length < 3 || recentVals.length < 2) {
      return { elevated: false, reason: "insufficient-data" };
    }
    const baseAvg = mean2(baseVals);
    const recentAvg = mean2(recentVals);
    if (baseAvg == null || recentAvg == null) return { elevated: false, reason: "no-averages" };
    const delta = recentAvg - baseAvg;
    const threshold = 2;
    if (delta < threshold) return { elevated: false, reason: "below-threshold", delta };
    const severity = Math.abs(delta) >= 3 ? "high" : "medium";
    return {
      elevated: true,
      severity,
      delta: Number(delta.toFixed(1)),
      baselineAvg: Number(baseAvg.toFixed(1)),
      recentAvg: Number(recentAvg.toFixed(1))
    };
  }
  function shouldFireFlareRiskNudge(logs, now = /* @__PURE__ */ new Date(), opts = {}) {
    const evalResult = evaluateFatigueWeekAnomaly(logs, opts);
    if (!evalResult.elevated) return { fire: false, reason: evalResult.reason || "no-anomaly", eval: evalResult };
    const week = isoWeekKey(now);
    if (opts.lastNudgeWeek === week) return { fire: false, reason: "already-nudged", week, eval: evalResult };
    return { fire: true, week, eval: evalResult };
  }
  function buildFlareRiskNotificationContent(evalResult) {
    return {
      title: "High fatigue week",
      body: "Patterns suggest an unusually fatiguing week. Consider pacing and logging how you feel.",
      severity: evalResult?.severity || "medium"
    };
  }

  // packages/shared/src/notifications/webPushConsent.mjs
  function isConfiguredVapidPublicKey(vapidPublicKey) {
    const vapid = String(vapidPublicKey || "").trim();
    return vapid.length > 0 && vapid !== "YOUR_VAPID_PUBLIC_KEY";
  }
  function canOfferWebPush(prefs, opts = {}) {
    const p = prefs && typeof prefs === "object" ? prefs : {};
    const vapid = String(opts.vapidPublicKey || "").trim();
    if (!isConfiguredVapidPublicKey(vapid)) return { ok: false, reason: "vapid-unconfigured" };
    if (p.demoMode === true) return { ok: false, reason: "demo-mode" };
    if (p.localOnlyMode === true) return { ok: false, reason: "local-only" };
    if (!isPrivacyRegionConfigured(p)) return { ok: false, reason: "region-unconfigured" };
    if (p.privacyRegion === "eea_uk" && p.healthDataConsent !== true) {
      return { ok: false, reason: "health-consent-required" };
    }
    return { ok: true };
  }

  // packages/shared/src/notifications/reEngagementNudge.mjs
  var RE_ENGAGEMENT_IDLE_DAYS = 7;
  function touchLastActiveAt(now = /* @__PURE__ */ new Date()) {
    return now.toISOString();
  }
  function daysSinceIso(iso, now = /* @__PURE__ */ new Date()) {
    if (!iso || typeof iso !== "string") return Infinity;
    const t2 = Date.parse(iso);
    if (!Number.isFinite(t2)) return Infinity;
    return (now.getTime() - t2) / 864e5;
  }
  function shouldFireReEngagementNudge(now = /* @__PURE__ */ new Date(), opts = {}) {
    if (opts.enabled === false) return { fire: false, reason: "disabled" };
    const lastActiveAt = opts.lastActiveAt;
    if (!lastActiveAt) return { fire: false, reason: "no-activity-baseline" };
    const idleDays = daysSinceIso(lastActiveAt, now);
    if (idleDays < RE_ENGAGEMENT_IDLE_DAYS) {
      return { fire: false, reason: "not-idle-enough", idleDays };
    }
    const lastNudge = opts.lastReEngagementNudgeAt;
    if (lastNudge && Date.parse(lastNudge) >= Date.parse(lastActiveAt)) {
      return { fire: false, reason: "already-nudged", idleDays };
    }
    return { fire: true, reason: "idle-7d", idleDays };
  }
  function buildReEngagementNotificationContent() {
    return {
      title: "We miss you",
      body: "A quick check-in keeps your health trends useful. Tap to log today.",
      url: "/?quick=true"
    };
  }

  // packages/shared/src/home/homeStreakStats.mjs
  function parseMood(log) {
    if (log?.mood == null || log.mood === "") return null;
    const n = typeof log.mood === "number" ? log.mood : parseInt(String(log.mood), 10);
    return Number.isFinite(n) ? n : null;
  }
  function isGoodDayLog(log) {
    if (!log || typeof log !== "object") return false;
    const noFlare = log.flare !== "Yes";
    const mood = parseMood(log);
    const moodOk = mood == null || mood >= 6;
    return noFlare && moodOk;
  }
  function logsNewestFirst(logs) {
    return [...Array.isArray(logs) ? logs : []].sort(
      (a, b) => String(b?.date || "").localeCompare(String(a?.date || ""))
    );
  }
  function computeGoodDayStreak(logs) {
    const sorted = logsNewestFirst(logs);
    let streak = 0;
    for (const log of sorted) {
      if (isGoodDayLog(log)) streak += 1;
      else break;
    }
    return streak;
  }
  function computeFlareFreeDays(logs) {
    const sorted = logsNewestFirst(logs);
    let count = 0;
    for (const log of sorted) {
      if (log?.flare === "Yes") break;
      if (log?.date) count += 1;
    }
    return count;
  }
  function computeHomeStreakSnapshot(logs, options = {}) {
    const dismissed = options.dismissed === true;
    const minStreak = typeof options.minStreak === "number" ? options.minStreak : 2;
    const goodDayStreak = computeGoodDayStreak(logs);
    const flareFreeDays = computeFlareFreeDays(logs);
    const showCard = !dismissed && (goodDayStreak >= minStreak || flareFreeDays >= minStreak);
    return { goodDayStreak, flareFreeDays, showCard };
  }

  // packages/shared/src/notifications/streakReminderNudge.mjs
  var STREAK_REMINDER_MIN_STREAK = 2;
  function shouldFireStreakReminderNudge(logs, now = /* @__PURE__ */ new Date(), opts = {}) {
    if (opts.enabled === false) return { fire: false, reason: "disabled" };
    if (opts.homeStreakCardDismissed === true) return { fire: false, reason: "h3-dismissed" };
    const todayStr = opts.todayStr ?? localDateStrFromNow(now);
    const goodDayStreak = computeGoodDayStreak(logs);
    const minStreak = opts.minStreak ?? STREAK_REMINDER_MIN_STREAK;
    if (goodDayStreak < minStreak) {
      return { fire: false, reason: "streak-too-short", goodDayStreak };
    }
    const timing = shouldFireMissedLogNudge(logs, now, {
      fallbackHHMM: opts.fallbackHHMM,
      lastNudgeDate: opts.lastNudgeDate,
      todayStr,
      now
    });
    if (!timing.fire) return { ...timing, goodDayStreak };
    return {
      fire: true,
      reason: "streak-reminder",
      goodDayStreak,
      flareFreeDays: computeFlareFreeDays(logs),
      nudgeHHMM: timing.nudgeHHMM
    };
  }
  function buildStreakReminderNotificationContent(snapshot2 = {}) {
    const goodDays = snapshot2.goodDayStreak ?? 0;
    const flareFree = snapshot2.flareFreeDays ?? 0;
    const body = goodDays <= 1 ? "One calm day in a row. A quick log keeps your picture complete." : `${goodDays} calm day(s) in a row \xB7 ${flareFree} flare-free. Still time to log today, no scores, just continuity.`;
    return {
      title: "Recent patterns",
      body,
      url: "/?quick=true"
    };
  }

  // packages/shared/src/notifications/notificationParity.mjs
  function buildNotificationContent(platform, content) {
    const base = {
      title: content?.title || "",
      body: content?.body || ""
    };
    if (platform === "ios") {
      return { ...base, sound: true, badge: typeof content?.badge === "number" ? content.badge : 1 };
    }
    if (platform === "android") {
      return { ...base, channelId: content?.channelId || "health-reminders" };
    }
    return { ...base, data: content?.data || {} };
  }

  // packages/shared/src/home/homeAppointment.mjs
  var APPOINTMENT_COUNTDOWN_DAYS = 14;
  function parseAppointmentDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    return value;
  }
  function daysUntilAppointment(appointmentDate, todayStr) {
    const a = parseAppointmentDate(appointmentDate);
    const t2 = parseAppointmentDate(todayStr);
    if (!a || !t2) return null;
    const ms = (/* @__PURE__ */ new Date(`${a}T12:00:00`)).getTime() - (/* @__PURE__ */ new Date(`${t2}T12:00:00`)).getTime();
    return Math.round(ms / 864e5);
  }
  function shouldShowAppointmentCard(appointmentDate, todayStr, maxDays = APPOINTMENT_COUNTDOWN_DAYS) {
    const days = daysUntilAppointment(appointmentDate, todayStr);
    if (days == null) return false;
    return days >= 0 && days <= maxDays;
  }
  function appointmentCountdownLabelKey(days) {
    if (days === 0) return "home.appointment.today";
    if (days === 1) return "home.appointment.tomorrow";
    return "home.appointment.inDays";
  }

  // packages/shared/src/home/homeWeather.mjs
  var WEATHER_CACHE_MS = 60 * 60 * 1e3;
  function roundWeatherCoord(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    return Math.round(value * 100) / 100;
  }
  function normalizeWeatherCoords(lat, lon) {
    const la = roundWeatherCoord(lat);
    const lo = roundWeatherCoord(lon);
    if (la == null || lo == null) return null;
    if (la < -90 || la > 90 || lo < -180 || lo > 180) return null;
    return { lat: la, lon: lo };
  }
  function buildWeatherForecastUrl(lat, lon) {
    const coords = normalizeWeatherCoords(lat, lon);
    if (!coords) return null;
    const params = new URLSearchParams({
      latitude: String(coords.lat),
      longitude: String(coords.lon),
      current: "pressure_msl,temperature_2m,weather_code",
      timezone: "auto"
    });
    return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  }
  function buildAirQualityUrl(lat, lon) {
    const coords = normalizeWeatherCoords(lat, lon);
    if (!coords) return null;
    const params = new URLSearchParams({
      latitude: String(coords.lat),
      longitude: String(coords.lon),
      current: "us_aqi"
    });
    return `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`;
  }
  function parseWeatherApiResponse(forecastJson, aqiJson) {
    const current = forecastJson?.current;
    if (!current || typeof current !== "object") return null;
    const temp = typeof current.temperature_2m === "number" ? Number(current.temperature_2m.toFixed(1)) : null;
    const pressure = typeof current.pressure_msl === "number" ? Math.round(current.pressure_msl) : null;
    const usAqi = aqiJson?.current && typeof aqiJson.current.us_aqi === "number" ? Math.round(aqiJson.current.us_aqi) : null;
    const weatherCode = typeof current.weather_code === "number" ? Math.round(current.weather_code) : null;
    if (temp == null && pressure == null && usAqi == null) return null;
    return {
      tempC: temp,
      pressureHpa: pressure,
      usAqi,
      weatherCode,
      fetchedAt: Date.now()
    };
  }
  function isWeatherCacheFresh(cache, maxAgeMs = WEATHER_CACHE_MS) {
    if (!cache || typeof cache !== "object") return false;
    const at = cache.fetchedAt;
    return typeof at === "number" && Date.now() - at < maxAgeMs;
  }
  async function fetchHomeWeatherSnapshot(lat, lon, options = {}) {
    const coords = normalizeWeatherCoords(lat, lon);
    if (!coords) return null;
    const fetchFn = options.fetchFn || (typeof fetch === "function" ? fetch.bind(globalThis) : null);
    if (!fetchFn) return null;
    const forecastUrl = buildWeatherForecastUrl(coords.lat, coords.lon);
    const aqiUrl = buildAirQualityUrl(coords.lat, coords.lon);
    if (!forecastUrl) return null;
    let forecastJson = null;
    try {
      const forecastRes = await fetchFn(forecastUrl);
      if (!forecastRes?.ok) return null;
      forecastJson = await forecastRes.json();
    } catch {
      return null;
    }
    let aqiJson = null;
    if (aqiUrl) {
      try {
        const aqiRes = await fetchFn(aqiUrl);
        if (aqiRes?.ok) aqiJson = await aqiRes.json();
      } catch {
        aqiJson = null;
      }
    }
    return parseWeatherApiResponse(forecastJson, aqiJson);
  }

  // packages/shared/src/home/weatherIcons.mjs
  function resolveConditionIconId(weatherCode) {
    const code = typeof weatherCode === "number" && Number.isFinite(weatherCode) ? weatherCode : null;
    if (code == null) return "weather-unknown";
    if (code === 0) return "weather-clear";
    if (code === 1 || code === 2) return "weather-partly-cloudy";
    if (code === 3) return "weather-cloudy";
    if (code === 45 || code === 48) return "weather-fog";
    if (code >= 51 && code <= 67 || code >= 80 && code <= 82) return "weather-rain";
    if (code >= 71 && code <= 77 || code >= 85 && code <= 86) return "weather-snow";
    if (code >= 95 && code <= 99) return "weather-thunder";
    return "weather-cloudy";
  }
  function resolveTempIconId(tempC) {
    if (typeof tempC !== "number" || !Number.isFinite(tempC)) return "weather-temp-mild";
    if (tempC < 5) return "weather-temp-cold";
    if (tempC < 20) return "weather-temp-mild";
    if (tempC < 28) return "weather-temp-warm";
    return "weather-temp-hot";
  }
  function resolvePressureIconId(pressureHpa) {
    if (typeof pressureHpa !== "number" || !Number.isFinite(pressureHpa)) return "weather-pressure";
    if (pressureHpa < 1e3) return "weather-pressure-low";
    if (pressureHpa > 1020) return "weather-pressure-high";
    return "weather-pressure";
  }
  function resolveWeatherIconTone(iconId) {
    const id = String(iconId || "");
    if (id.startsWith("weather-aqi-")) {
      if (id === "weather-aqi-good") return "success";
      if (id === "weather-aqi-moderate") return "warning";
      return "danger";
    }
    if (id.startsWith("weather-temp-")) {
      if (id === "weather-temp-cold" || id === "weather-temp-hot") return "warning";
      return "default";
    }
    return "default";
  }
  function resolveAqiIconId(usAqi) {
    if (typeof usAqi !== "number" || !Number.isFinite(usAqi)) return "weather-aqi-moderate";
    if (usAqi <= 50) return "weather-aqi-good";
    if (usAqi <= 100) return "weather-aqi-moderate";
    return "weather-aqi-poor";
  }
  function buildWeatherDisplayMetrics(snapshot2) {
    if (!snapshot2 || typeof snapshot2 !== "object") return null;
    const metrics = [];
    if (snapshot2.tempC != null) {
      metrics.push({
        key: "temp",
        icon: resolveTempIconId(snapshot2.tempC),
        text: `${snapshot2.tempC}\xB0C`
      });
    }
    if (snapshot2.pressureHpa != null) {
      metrics.push({
        key: "pressure",
        icon: resolvePressureIconId(snapshot2.pressureHpa),
        text: `${snapshot2.pressureHpa} hPa`
      });
    }
    if (snapshot2.usAqi != null) {
      metrics.push({
        key: "aqi",
        icon: resolveAqiIconId(snapshot2.usAqi),
        text: `AQI ${snapshot2.usAqi}`
      });
    }
    if (!metrics.length) return null;
    return {
      conditionIcon: resolveConditionIconId(snapshot2.weatherCode),
      metrics
    };
  }

  // packages/shared/src/clinician/medTimeline.mjs
  function mean3(values) {
    if (!values.length) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  function normalizeTreatmentStarts(value) {
    if (!Array.isArray(value)) return [];
    return value.filter((t2) => t2 && typeof t2.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t2.date)).map((t2) => ({
      date: t2.date,
      label: String(t2.label || t2.name || t2.drug || "Treatment start").slice(0, 80)
    }));
  }
  function inferTreatmentStartsFromLogs(logs) {
    const list = [...Array.isArray(logs) ? logs : []].sort(
      (a, b) => String(a?.date || "").localeCompare(String(b?.date || ""))
    );
    const seen = /* @__PURE__ */ new Set();
    const starts = [];
    for (const log of list) {
      const names = [];
      if (Array.isArray(log.medications)) {
        log.medications.forEach((m) => {
          const n = typeof m === "string" ? m : m?.name || m?.drug;
          if (n) names.push(String(n).trim());
        });
      }
      if (Array.isArray(log.medicationDoses)) {
        log.medicationDoses.forEach((d) => {
          if (d?.drug) names.push(String(d.drug).trim());
        });
      }
      for (const name of names) {
        if (!name || seen.has(name)) continue;
        seen.add(name);
        starts.push({ date: log.date, label: name });
      }
    }
    return starts.slice(0, 12);
  }
  function buildMedicationTimeline(logs, treatmentStarts = [], opts = {}) {
    const list = [...Array.isArray(logs) ? logs : []].sort(
      (a, b) => String(a?.date || "").localeCompare(String(b?.date || ""))
    );
    const explicit = normalizeTreatmentStarts(treatmentStarts);
    const starts = explicit.length ? explicit : inferTreatmentStartsFromLogs(logs);
    const windowDays = opts.windowDays ?? 14;
    const rows = starts.flatMap((treatment) => {
      const idx = list.findIndex((l) => l.date >= treatment.date);
      if (idx < 0) return [];
      const pre = list.slice(Math.max(0, idx - windowDays), idx);
      const post = list.slice(idx, idx + windowDays);
      const preFatigue = mean3(pre.map((l) => l.fatigue).filter((v) => v != null));
      const postFatigue = mean3(post.map((l) => l.fatigue).filter((v) => v != null));
      return [
        {
          id: `treatment:${treatment.date}`,
          label: treatment.label,
          startDate: treatment.date,
          preDays: pre.length,
          postDays: post.length,
          preFatigueAvg: preFatigue != null ? Number(preFatigue.toFixed(1)) : null,
          postFatigueAvg: postFatigue != null ? Number(postFatigue.toFixed(1)) : null
        }
      ];
    });
    const dates = list.map((l) => l.date).filter(Boolean);
    const spanStart = dates[0] || null;
    const spanEnd = dates[dates.length - 1] || null;
    return { rows, spanStart, spanEnd };
  }
  function buildTimelineSvg(rows, opts = {}) {
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length) return "";
    const width = opts.width ?? 520;
    const rowH = 28;
    const height = 40 + list.length * rowH;
    const left = 120;
    const bars = list.map((row, i) => {
      const y = 36 + i * rowH;
      const barW = Math.max(40, width - left - 24);
      const label = String(row.label || "").slice(0, 18);
      const detail = `${row.preFatigueAvg ?? "-"} \u2192 ${row.postFatigueAvg ?? "-"}`;
      return `<text x="8" y="${y + 12}" font-size="10" fill="#333">${label}</text><rect x="${left}" y="${y}" width="${barW}" height="16" fill="rgba(76,175,80,0.25)" stroke="#4caf50"/><text x="${left + 6}" y="${y + 12}" font-size="9" fill="#222">${row.startDate} \xB7 fatigue ${detail}</text>`;
    }).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${bars}</svg>`;
  }

  // packages/shared/src/home/homeDashboardPrefs.mjs
  function normalizeHomeDashboardPrefs(raw) {
    const v = raw && typeof raw === "object" ? raw : {};
    const lat = roundWeatherCoord(v.weatherLat);
    const lon = roundWeatherCoord(v.weatherLon);
    let weatherCache = null;
    if (v.weatherCache && typeof v.weatherCache === "object") {
      weatherCache = v.weatherCache;
    } else if (typeof v.weatherCacheJson === "string" && v.weatherCacheJson) {
      try {
        weatherCache = JSON.parse(v.weatherCacheJson);
      } catch {
        weatherCache = null;
      }
    }
    return {
      homeStreakCardDismissed: v.homeStreakCardDismissed === true,
      weatherStripEnabled: v.weatherStripEnabled === true,
      weatherLat: lat,
      weatherLon: lon,
      weatherCache,
      nextAppointmentDate: parseAppointmentDate(v.nextAppointmentDate),
      treatmentStarts: normalizeTreatmentStarts(v.treatmentStarts),
      homeGapQuestionCache: v.homeGapQuestionCache && typeof v.homeGapQuestionCache === "object" ? v.homeGapQuestionCache : null,
      homeQuestionAnswerState: v.homeQuestionAnswerState && typeof v.homeQuestionAnswerState === "object" ? v.homeQuestionAnswerState : null,
      weeklyReviewDismissedWeek: typeof v.weeklyReviewDismissedWeek === "string" ? v.weeklyReviewDismissedWeek : null,
      homeWelcomeCardDismissed: v.homeWelcomeCardDismissed === true,
      goalsModalSeenCount: typeof v.goalsModalSeenCount === "number" && Number.isFinite(v.goalsModalSeenCount) ? Math.max(0, Math.floor(v.goalsModalSeenCount)) : 0,
      firstOpenDate: typeof v.firstOpenDate === "string" ? v.firstOpenDate : null,
      weeklyReviewCompletedAt: typeof v.weeklyReviewCompletedAt === "string" ? v.weeklyReviewCompletedAt : null,
      personalBestDismissedAt: typeof v.personalBestDismissedAt === "string" ? v.personalBestDismissedAt : null
    };
  }

  // packages/shared/src/home/personalBests.mjs
  function logsNewestFirst2(logs) {
    return [...Array.isArray(logs) ? logs : []].sort(
      (a, b) => String(b?.date || "").localeCompare(String(a?.date || ""))
    );
  }
  function longestConsecutiveRun(logs, predicate) {
    const sorted = logsNewestFirst2(logs);
    let best = 0;
    let current = 0;
    for (const log of sorted) {
      if (predicate(log)) {
        current += 1;
        if (current > best) best = current;
      } else {
        current = 0;
      }
    }
    return best;
  }
  function longestFlareFreeRun(logs) {
    const sorted = logsNewestFirst2(logs);
    let best = 0;
    let current = 0;
    for (const log of sorted) {
      if (log?.flare === "Yes") {
        current = 0;
      } else if (log?.date) {
        current += 1;
        if (current > best) best = current;
      }
    }
    return best;
  }
  function computePersonalBests(logs) {
    const list = Array.isArray(logs) ? logs : [];
    return {
      longestGoodRun: longestConsecutiveRun(list, isGoodDayLog),
      longestFlareFreeRun: longestFlareFreeRun(list),
      totalLogs: list.length
    };
  }
  function pickPersonalBestHighlight(bests, current = {}) {
    const good = typeof current.goodDayStreak === "number" ? current.goodDayStreak : 0;
    const flareFree = typeof current.flareFreeDays === "number" ? current.flareFreeDays : 0;
    if (good >= 2 && good >= bests.longestGoodRun) {
      return { kind: "goodDays", n: good };
    }
    if (flareFree >= 2 && flareFree >= bests.longestFlareFreeRun) {
      return { kind: "flareFree", n: flareFree };
    }
    return null;
  }

  // packages/shared/src/home/firstSessionPrompt.mjs
  function shouldSuppressFirstRunLoggingPrompt(prefs, logs, ctx) {
    const logArr = Array.isArray(logs) ? logs : [];
    if (logArr.length === 0) return true;
    return !isFirstRunWizardComplete(prefs, ctx);
  }

  // packages/shared/src/export/logCsv.mjs
  var LOG_CSV_FIELD_IDS = [
    "date",
    "bpm",
    "weight",
    "fatigue",
    "stiffness",
    "backPain",
    "sleep",
    "jointPain",
    "mobility",
    "dailyFunction",
    "swelling",
    "flare",
    "mood",
    "irritability",
    "notes"
  ];
  var LOG_CSV_I18N_KEYS = {
    date: "export.csv.date",
    bpm: "export.csv.bpm",
    weight: "export.csv.weight",
    fatigue: "export.csv.fatigue",
    stiffness: "export.csv.stiffness",
    backPain: "export.csv.backPain",
    sleep: "export.csv.sleep",
    jointPain: "export.csv.jointPain",
    mobility: "export.csv.mobility",
    dailyFunction: "export.csv.dailyFunction",
    swelling: "export.csv.swelling",
    flare: "export.csv.flare",
    mood: "export.csv.mood",
    irritability: "export.csv.irritability",
    notes: "export.csv.notes"
  };
  var LOG_CSV_ENGLISH_HEADERS = {
    date: "Date",
    bpm: "BPM",
    weight: "Weight",
    fatigue: "Fatigue",
    stiffness: "Stiffness",
    backPain: "Back Pain",
    sleep: "Sleep",
    jointPain: "Joint Pain",
    mobility: "Mobility",
    dailyFunction: "Ability to do Daily activities",
    swelling: "Swelling",
    flare: "Flare",
    mood: "Mood",
    irritability: "Irritability",
    notes: "Notes"
  };
  function escapeCsvCell(value) {
    const s = value == null ? "" : String(value);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }
  function logsToCsv(logs, labelForField) {
    const label = typeof labelForField === "function" ? labelForField : (id) => LOG_CSV_ENGLISH_HEADERS[id] || id;
    const header = LOG_CSV_FIELD_IDS.map((id) => escapeCsvCell(label(id))).join(",");
    const rows = (Array.isArray(logs) ? logs : []).map(
      (log) => LOG_CSV_FIELD_IDS.map((id) => {
        let v = log && log[id];
        if (id === "notes" && typeof v === "string") v = v.replace(/,/g, ";");
        return escapeCsvCell(v ?? "");
      }).join(",")
    );
    return [header, ...rows].join("\n");
  }
  var LOG_CSV_LEGACY_HEADER_ALIASES = {
    dailyFunction: ["Daily Function", "Daily Activities"]
  };
  function parseCsvLine(line) {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  }
  function headerToFieldId(header, aliasMap) {
    const h = header.trim();
    if (!h) return null;
    const lower = h.toLowerCase();
    for (const id of LOG_CSV_FIELD_IDS) {
      const raw = aliasMap[id];
      const legacy = LOG_CSV_LEGACY_HEADER_ALIASES[id] || [];
      const aliases = Array.isArray(raw) ? [...raw, ...legacy] : typeof raw === "string" && raw ? [raw, LOG_CSV_ENGLISH_HEADERS[id], ...legacy] : [LOG_CSV_ENGLISH_HEADERS[id], ...legacy];
      if (aliases.some((a) => a && a.toLowerCase() === lower)) return id;
    }
    return null;
  }
  function parseLogsCsv(text, aliasMap = LOG_CSV_ENGLISH_HEADERS) {
    const lines = String(text || "").split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) throw new Error("CSV must include a header row and at least one data row.");
    const headers = parseCsvLine(lines[0]);
    const fieldIndexes = {};
    headers.forEach((h, idx) => {
      const id = headerToFieldId(h, aliasMap);
      if (id) fieldIndexes[id] = idx;
    });
    if (fieldIndexes.date === void 0) throw new Error("CSV header row must include a Date column.");
    const logs = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
      if (!values.some((v) => v)) continue;
      const raw = {};
      LOG_CSV_FIELD_IDS.forEach((id) => {
        const idx = fieldIndexes[id];
        if (idx === void 0 || values[idx] === void 0) return;
        let v = values[idx];
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).replace(/""/g, '"');
        raw[id] = v;
      });
      logs.push(raw);
    }
    return logs;
  }

  // packages/shared/src/export/fhirLite.mjs
  var METRIC_CODES = {
    mood: { system: "http://loinc.org", code: "80296-7", display: "Mood" },
    sleep: { system: "http://loinc.org", code: "93832-4", display: "Sleep duration" },
    fatigue: { system: "http://loinc.org", code: "75826-7", display: "Fatigue" },
    bpm: { system: "http://loinc.org", code: "8867-4", display: "Heart rate" },
    weight: { system: "http://loinc.org", code: "29463-7", display: "Body weight" },
    bodyWeight: { system: "http://loinc.org", code: "29463-7", display: "Body weight" },
    bloodPressureSystolic: { system: "http://loinc.org", code: "8480-6", display: "Systolic blood pressure" },
    bloodPressureDiastolic: { system: "http://loinc.org", code: "8462-4", display: "Diastolic blood pressure" },
    bloodGlucose: { system: "http://loinc.org", code: "2339-0", display: "Glucose" },
    spO2: { system: "http://loinc.org", code: "59408-5", display: "Oxygen saturation" },
    hrv: { system: "http://loinc.org", code: "80404-7", display: "HRV RMSSD" },
    bbt: { system: "http://loinc.org", code: "8310-5", display: "Basal body temperature" }
  };
  var METRIC_UNITS = {
    weight: "kg",
    bodyWeight: "kg",
    bpm: "/min",
    bloodPressureSystolic: "mmHg",
    bloodPressureDiastolic: "mmHg",
    bloodGlucose: "mmol/L",
    spO2: "%",
    hrv: "ms",
    bbt: "Cel"
  };
  function observationFor(log, field, value) {
    const coding = METRIC_CODES[field];
    if (!coding || value === void 0 || value === null || value === "") return null;
    const num2 = Number(value);
    const isNum = Number.isFinite(num2);
    return {
      resourceType: "Observation",
      status: "final",
      category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "survey" }] }],
      code: { coding: [coding] },
      subject: { display: "Rianell user" },
      effectiveDateTime: `${log.date}T12:00:00Z`,
      valueQuantity: isNum ? { value: num2, unit: METRIC_UNITS[field] || "{score}" } : void 0,
      valueString: isNum ? void 0 : String(value)
    };
  }
  function logToFhirObservations(log) {
    if (!log || !log.date) return [];
    const out = [];
    for (const field of Object.keys(METRIC_CODES)) {
      const obs = observationFor(log, field, log[field]);
      if (obs) out.push(obs);
    }
    if (log.notes) {
      out.push({
        resourceType: "Observation",
        status: "final",
        code: { text: "Daily notes" },
        effectiveDateTime: `${log.date}T12:00:00Z`,
        valueString: String(log.notes).slice(0, 2e3)
      });
    }
    return out;
  }
  function logsToFhirBundle(logs) {
    const entries = [];
    const list = Array.isArray(logs) ? logs : [];
    for (const log of list) {
      for (const obs of logToFhirObservations(log)) {
        entries.push({ fullUrl: `urn:uuid:rianell-${log.date}-${obs.code?.coding?.[0]?.code || "note"}`, resource: obs });
      }
    }
    return {
      resourceType: "Bundle",
      type: "collection",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      entry: entries
    };
  }

  // packages/shared/src/export/shareReadOnlyLink.mjs
  var SHARE_LINK_FORMAT = "rianell-share-v1";
  var SHARE_LINK_KDF_ITERATIONS = 31e4;
  var SHARE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  var STRIP_WHEN_NOTES_OFF = [
    "notes",
    "energyClarity",
    "painLocation",
    "food",
    "barcodeFood",
    "medications",
    "medicationDoses"
  ];
  function generateShareCode(len = 16) {
    const bytes = new Uint8Array(len);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      throw new Error("crypto.getRandomValues not available");
    }
    return Array.from(bytes).map((b) => SHARE_CODE_CHARS[b % SHARE_CODE_CHARS.length]).join("");
  }
  function buildShareSnapshot(logs, opts = {}) {
    const from = opts.dateFrom || null;
    const to = opts.dateTo || null;
    const includeNotes = opts.includeNotes === true;
    const list = Array.isArray(logs) ? logs : [];
    const filtered = list.filter((l) => l && l.date && (!from || l.date >= from) && (!to || l.date <= to)).map((l) => {
      const entry = { ...l };
      if (!includeNotes) {
        STRIP_WHEN_NOTES_OFF.forEach((f) => {
          delete entry[f];
        });
      }
      return entry;
    }).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const snapshot2 = { logs: filtered };
    if (opts.includeCondition && opts.conditionName) {
      snapshot2.condition = String(opts.conditionName).slice(0, 200);
    }
    return snapshot2;
  }
  async function createReadOnlyShareEnvelope(logs, passphrase, expiresInHours = 72) {
    const hours = Math.min(168, Math.max(1, Number(expiresInHours) || 72));
    const expiresAt = new Date(Date.now() + hours * 3600 * 1e3).toISOString();
    const envelope = await encryptExportWithPassphrase(
      { logs: Array.isArray(logs) ? logs : [], share: { readOnly: true, expiresAt } },
      passphrase
    );
    return {
      format: SHARE_LINK_FORMAT,
      encrypted: envelope,
      expiresAt,
      exportFormat: ENCRYPTED_EXPORT_FORMAT
    };
  }
  function shareEnvelopeToPortableJson(envelope) {
    return JSON.stringify(envelope, null, 2);
  }
  async function uploadShareLink(snapshot2, passphrase, supabaseClient, opts = {}) {
    if (!supabaseClient || typeof supabaseClient.from !== "function") {
      throw new Error("Supabase client unavailable");
    }
    const shareCode = generateShareCode();
    const hours = Math.min(2160, Math.max(1, Number(opts.ttlHours) || 168));
    const expiresAt = new Date(Date.now() + hours * 3600 * 1e3).toISOString();
    const logs = snapshot2 && Array.isArray(snapshot2.logs) ? snapshot2.logs : [];
    const payload = {
      logs,
      share: { readOnly: true, expiresAt }
    };
    if (snapshot2 && snapshot2.condition) {
      payload.condition = snapshot2.condition;
    }
    const envelope = await encryptExportWithPassphrase(
      payload,
      passphrase,
      void 0,
      { iterations: SHARE_LINK_KDF_ITERATIONS }
    );
    const metadata = {
      log_count: logs.length,
      date_from: logs[0]?.date ?? null,
      date_to: logs[logs.length - 1]?.date ?? null,
      has_notes: opts.includeNotes === true,
      has_condition: opts.includeCondition === true
    };
    const { error } = await supabaseClient.from("share_links").insert({
      share_code: shareCode,
      encrypted_blob: envelope.ciphertext,
      salt: envelope.salt,
      iv: envelope.iv,
      kdf_iterations: envelope.iterations,
      expires_at: expiresAt,
      metadata
    });
    if (error) throw new Error(error.message || "Failed to upload share link");
    return {
      shareCode,
      url: `https://rianell.com/share/${shareCode}`,
      expiresAt
    };
  }
  async function fetchShareLink(shareCode, supabaseClient) {
    if (!supabaseClient || typeof supabaseClient.from !== "function") {
      throw new Error("Supabase client unavailable");
    }
    const code = String(shareCode || "").trim();
    if (!code) throw new Error("Share code required");
    const { data, error } = await supabaseClient.from("share_links").select("encrypted_blob, salt, iv, kdf_iterations, expires_at, metadata").eq("share_code", code).single();
    if (error || !data) {
      throw new Error(error?.message || "Share link not found or expired");
    }
    if (typeof supabaseClient.rpc === "function") {
      supabaseClient.rpc("increment_share_access", { p_code: code }).then(() => {
      }).catch(() => {
      });
    }
    return data;
  }
  function shareRowToEnvelope(row) {
    if (!row) throw new Error("Share link data missing");
    return {
      format: ENCRYPTED_EXPORT_FORMAT,
      kdf: "PBKDF2",
      iterations: row.kdf_iterations || SHARE_LINK_KDF_ITERATIONS,
      salt: row.salt,
      iv: row.iv,
      ciphertext: row.encrypted_blob
    };
  }

  // packages/shared/src/export/webdavBackup.mjs
  async function buildEncryptedBackupBlob(logs, passphrase) {
    const envelope = await encryptExportWithPassphrase({ logs: Array.isArray(logs) ? logs : [] }, passphrase);
    return JSON.stringify(envelope);
  }
  async function putWebDavEncryptedBackup({ url, username, password, body, filename }) {
    const base = String(url || "").replace(/\/$/, "");
    if (!base.startsWith("http")) throw new Error("WebDAV URL must start with http:// or https://");
    const name = filename || `rianell-backup-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
    const target = `${base}/${encodeURIComponent(name)}`;
    const auth = typeof btoa === "function" ? btoa(`${username}:${password}`) : Buffer.from(`${username}:${password}`, "utf8").toString("base64");
    const res = await fetch(target, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`
      },
      body
    });
    if (!res.ok) throw new Error(`WebDAV upload failed (${res.status})`);
    return { url: target, status: res.status };
  }

  // packages/shared/src/migration/MigrationAdapter.mjs
  var MigrationAdapter = class {
    static get id() {
      return "base";
    }
    static get displayName() {
      return "Base";
    }
    static get fileTypes() {
      return [".csv"];
    }
    static get fieldMap() {
      return {};
    }
    static async parse(_fileContent) {
      return [];
    }
  };
  function listMigrationAdapters(adapters) {
    return adapters.map((A) => ({
      id: A.id,
      displayName: A.displayName,
      fileTypes: A.fileTypes
    }));
  }
  function detectImportConflicts(existingLogs, importedLogs) {
    const dates = new Set((existingLogs || []).map((l) => l?.date).filter(Boolean));
    return (importedLogs || []).map((entry) => ({
      entry,
      conflict: dates.has(entry.date)
    }));
  }

  // packages/shared/src/migration/adapters/cara.mjs
  function parseCsvLine2(line) {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') inQuotes = !inQuotes;
      else if (c === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else current += c;
    }
    values.push(current.trim());
    return values;
  }
  var CaraMigrationAdapter = class extends MigrationAdapter {
    static get id() {
      return "cara";
    }
    static get displayName() {
      return "Cara Care";
    }
    static get fileTypes() {
      return [".csv"];
    }
    static get fieldMap() {
      return {
        Date: "date",
        Symptoms: "symptoms",
        Mood: "mood",
        Notes: "notes",
        Pain: "jointPain"
      };
    }
    static async parse(fileContent) {
      const lines = String(fileContent || "").split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) return [];
      const headers = parseCsvLine2(lines[0]);
      const lowerHeaders = headers.map((h) => h.toLowerCase());
      const logs = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = parseCsvLine2(lines[i]);
        const row = {};
        lowerHeaders.forEach((h, idx) => {
          row[h] = vals[idx];
        });
        const dateRaw = row.date || row.day;
        const date = String(dateRaw || "").slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
        const entry = { date };
        const mood = Number.parseInt(row.mood, 10);
        if (Number.isFinite(mood)) entry.mood = Math.min(10, mood);
        const pain = Number.parseInt(row.pain, 10);
        if (Number.isFinite(pain)) entry.jointPain = Math.min(10, pain);
        const notes = [row.notes, row.symptoms].filter(Boolean).join(" - ");
        if (notes) entry.notes = notes.slice(0, 500);
        logs.push(entry);
      }
      return logs;
    }
  };

  // packages/shared/src/migration/adapters/daylio.mjs
  var ACTIVITY_MAP = {
    sleep: "sleep",
    sport: "exercise",
    exercise: "exercise",
    meds: "medication"
  };
  function parseCsvLine3(line) {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') inQuotes = !inQuotes;
      else if (c === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else current += c;
    }
    values.push(current.trim());
    return values;
  }
  var DaylioMigrationAdapter = class extends MigrationAdapter {
    static get id() {
      return "daylio";
    }
    static get displayName() {
      return "Daylio";
    }
    static get fileTypes() {
      return [".csv"];
    }
    static get fieldMap() {
      return { date: "date", mood: "mood", note: "notes", activities: "tags" };
    }
    static async parse(fileContent) {
      const lines = String(fileContent || "").split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) return [];
      const headers = parseCsvLine3(lines[0]).map((h) => h.toLowerCase());
      const logs = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = parseCsvLine3(lines[i]);
        const row = {};
        headers.forEach((h, idx) => {
          row[h] = vals[idx];
        });
        const date = String(row.date || "").slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
        const moodRaw = Number.parseInt(row.mood, 10);
        const entry = { date };
        if (Number.isFinite(moodRaw)) entry.mood = Math.min(10, Math.max(1, moodRaw * 2));
        if (row.note) entry.notes = String(row.note).slice(0, 500);
        const acts = String(row.activities || "").split(",").map((a) => a.trim().toLowerCase()).filter(Boolean);
        for (const a of acts) {
          if (ACTIVITY_MAP[a]) entry[ACTIVITY_MAP[a]] = entry[ACTIVITY_MAP[a]] || true;
        }
        logs.push(entry);
      }
      return logs;
    }
  };

  // packages/shared/src/migration/adapters/oura.mjs
  function parseCsvLine4(line) {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') inQuotes = !inQuotes;
      else if (c === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else current += c;
    }
    values.push(current.trim());
    return values;
  }
  function parseCsv(text) {
    const lines = String(text || "").split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = parseCsvLine4(lines[0]).map((h) => h.toLowerCase());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = parseCsvLine4(lines[i]);
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = vals[idx];
      });
      rows.push(row);
    }
    return rows;
  }
  var OuraMigrationAdapter = class extends MigrationAdapter {
    static get id() {
      return "oura";
    }
    static get displayName() {
      return "Oura Ring";
    }
    static get fileTypes() {
      return [".csv"];
    }
    static get fieldMap() {
      return {
        date: "date",
        total_sleep_duration: "sleepHours",
        hrv_average: "hrv",
        steps: "exercise.steps",
        score: "ouraReadiness"
      };
    }
    static async parse(fileContent) {
      const rows = parseCsv(fileContent);
      const byDate = /* @__PURE__ */ new Map();
      for (const row of rows) {
        const date = String(row.date || "").slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
        const entry = byDate.get(date) || { date };
        if (row.total_sleep_duration) {
          const secs = Number(row.total_sleep_duration);
          if (Number.isFinite(secs)) entry.sleep = Math.min(10, Math.round(secs / 3600 * 2));
        }
        if (row.hrv_average) entry.hrv = Number(row.hrv_average);
        if (row.steps) entry.steps = Number(row.steps);
        if (row.score) entry.ouraReadiness = Number(row.score);
        byDate.set(date, entry);
      }
      return [...byDate.values()];
    }
  };

  // packages/shared/src/import/migrationAssistants.mjs
  var BEARABLE_ALIASES = {
    date: ["Date", "date", "Day"],
    mood: ["Mood", "mood"],
    sleep: ["Sleep", "sleep", "Sleep quality"],
    fatigue: ["Energy", "Fatigue", "fatigue"],
    notes: ["Notes", "Note", "notes"],
    flare: ["Symptom severity", "Flare", "flare"]
  };
  var FLAREDOWN_ALIASES = {
    date: ["date", "Date", "entry_date"],
    mood: ["mood", "Mood"],
    sleep: ["sleep", "Sleep"],
    fatigue: ["fatigue", "Fatigue", "energy"],
    notes: ["notes", "Notes", "journal"],
    flare: ["flare", "Flare", "symptom_level"]
  };
  var CARA_ALIASES = {
    date: ["Date", "date", "Day"],
    mood: ["Mood", "mood"],
    pain: ["Pain", "pain", "Symptoms", "jointPain"],
    notes: ["Notes", "Note", "notes"]
  };
  var MIGRATION_ADAPTERS = [CaraMigrationAdapter, DaylioMigrationAdapter, OuraMigrationAdapter];
  var MIGRATION_SOURCES = [
    { id: "bearable", labelKey: "settings.import.migration.bearable" },
    { id: "flaredown", labelKey: "settings.import.migration.flaredown" },
    { id: "cara", labelKey: "settings.import.migration.cara" },
    { id: "oura", labelKey: "settings.import.migration.oura" },
    { id: "daylio", labelKey: "settings.import.migration.daylio" },
    { id: "generic", labelKey: "settings.import.migration.generic" }
  ];
  function parseCsvLine5(line) {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else current += char;
    }
    values.push(current.trim());
    return values;
  }
  function mapRow(headers, values, aliasMap) {
    const fieldIndexes = {};
    headers.forEach((h, idx) => {
      const lower = h.trim().toLowerCase();
      for (const [id, aliases] of Object.entries(aliasMap)) {
        if (aliases.some((a) => a.toLowerCase() === lower)) {
          fieldIndexes[id] = idx;
          break;
        }
      }
    });
    const raw = {};
    for (const [id, idx] of Object.entries(fieldIndexes)) {
      if (values[idx] !== void 0) raw[id] = values[idx];
    }
    return raw;
  }
  function normalizeMigrationDate(raw) {
    const s = String(raw || "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) {
      const dd = dmy[1].padStart(2, "0");
      const mm = dmy[2].padStart(2, "0");
      return `${dmy[3]}-${mm}-${dd}`;
    }
    return "";
  }
  function normalizeMigrationRow(raw) {
    const date = normalizeMigrationDate(raw.date);
    if (!date) return null;
    const mood = Number.parseInt(raw.mood, 10);
    const sleep = Number.parseInt(raw.sleep, 10);
    const fatigue = Number.parseInt(raw.fatigue, 10);
    const pain = Number.parseInt(raw.pain ?? raw.jointPain, 10);
    const entry = {
      date,
      mood: Number.isFinite(mood) ? mood : void 0,
      sleep: Number.isFinite(sleep) ? sleep : void 0,
      fatigue: Number.isFinite(fatigue) ? fatigue : void 0,
      jointPain: Number.isFinite(pain) ? pain : void 0,
      notes: typeof raw.notes === "string" ? raw.notes.trim().slice(0, 500) : void 0,
      flare: raw.flare && Number(raw.flare) >= 7 ? "Yes" : "No"
    };
    Object.keys(entry).forEach((k) => {
      if (entry[k] === void 0) delete entry[k];
    });
    return entry;
  }
  function resolveAliasMap(sourceId) {
    if (sourceId === "flaredown") return FLAREDOWN_ALIASES;
    if (sourceId === "bearable") return BEARABLE_ALIASES;
    if (sourceId === "cara") return CARA_ALIASES;
    return { ...BEARABLE_ALIASES, ...FLAREDOWN_ALIASES, ...CARA_ALIASES };
  }
  async function parseMigrationFile(text, sourceId = "generic") {
    const adapter = MIGRATION_ADAPTERS.find((A) => A.id === sourceId);
    if (adapter) return adapter.parse(text);
    return parseMigrationCsv(text, sourceId);
  }
  function parseMigrationCsv(text, sourceId = "generic") {
    const lines = String(text || "").split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) throw new Error("Migration CSV must include a header row and data.");
    const headers = parseCsvLine5(lines[0]);
    const aliasMap = resolveAliasMap(sourceId);
    const logs = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine5(lines[i]);
      if (!values.some((v) => v)) continue;
      const raw = mapRow(headers, values, aliasMap);
      const entry = normalizeMigrationRow(raw);
      if (entry) logs.push(entry);
    }
    if (!logs.length) throw new Error("No rows could be mapped. Check column headers for your export source.");
    return logs;
  }
  function listMigrationSources() {
    return MIGRATION_SOURCES;
  }

  // packages/shared/src/sync/logSyncConflicts.mjs
  var CONFLICT_KEYS = [
    "bpm",
    "weight",
    "fatigue",
    "stiffness",
    "backPain",
    "sleep",
    "jointPain",
    "mobility",
    "dailyFunction",
    "swelling",
    "flare",
    "mood",
    "irritability",
    "notes"
  ];
  function snapshot(entry) {
    const out = {};
    for (const k of CONFLICT_KEYS) {
      const v = entry && entry[k];
      if (v !== void 0 && v !== null && v !== "") out[k] = v;
    }
    return JSON.stringify(out);
  }
  function findLogSyncConflicts(localLogs, cloudLogs) {
    const cloudByDate = /* @__PURE__ */ new Map();
    if (Array.isArray(cloudLogs)) {
      for (const log of cloudLogs) {
        if (log && log.date) cloudByDate.set(log.date, log);
      }
    }
    const conflicts = [];
    if (!Array.isArray(localLogs)) return conflicts;
    for (const local of localLogs) {
      if (!local || !local.date) continue;
      const cloud = cloudByDate.get(local.date);
      if (!cloud) continue;
      if (snapshot(local) !== snapshot(cloud)) {
        conflicts.push({ date: local.date, local, cloud });
      }
    }
    return conflicts;
  }
  function mergeHealthLogsWithConflictPolicy(localLogs, cloudLogs, policy = "local", perDate = {}) {
    const cloudMap = /* @__PURE__ */ new Map();
    const localMap = /* @__PURE__ */ new Map();
    if (Array.isArray(cloudLogs)) cloudLogs.forEach((l) => {
      if (l?.date) cloudMap.set(l.date, l);
    });
    if (Array.isArray(localLogs)) localLogs.forEach((l) => {
      if (l?.date) localMap.set(l.date, l);
    });
    const conflictDates = new Set(findLogSyncConflicts(localLogs, cloudLogs).map((c) => c.date));
    const dates = /* @__PURE__ */ new Set([...cloudMap.keys(), ...localMap.keys()]);
    const merged = [];
    for (const date of dates) {
      const local = localMap.get(date);
      const cloud = cloudMap.get(date);
      if (local && cloud && conflictDates.has(date)) {
        const pick = perDate[date] === "cloud" ? "cloud" : perDate[date] === "local" ? "local" : policy;
        merged.push(pick === "cloud" ? cloud : local);
      } else {
        merged.push(local || cloud);
      }
    }
    merged.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return merged;
  }

  // packages/shared/src/clinician/appointmentReport.mjs
  var APPOINTMENT_DISCLAIMER = "Wellness tracking only, not medical advice, diagnosis, or treatment. Discuss patterns with your clinician.";
  var APPOINTMENT_RANGE_DAYS = 30;
  function sortLogsNewestFirst(logs) {
    return [...Array.isArray(logs) ? logs : []].sort(
      (a, b) => String(b?.date || "").localeCompare(String(a?.date || ""))
    );
  }
  function filterLogsForAppointment(logs, days = APPOINTMENT_RANGE_DAYS, todayStr) {
    const today = todayStr || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const end = /* @__PURE__ */ new Date(`${today}T12:00:00`);
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    return (Array.isArray(logs) ? logs : []).filter((log) => {
      if (!log?.date || !/^\d{4}-\d{2}-\d{2}$/.test(log.date)) return false;
      const d = /* @__PURE__ */ new Date(`${log.date}T12:00:00`);
      return d >= start && d <= end;
    });
  }
  function mean4(values) {
    if (!values.length) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  function buildAppointmentChartRows(logs, days = 14) {
    const slice = filterLogsForAppointment(logs, days);
    const mood = slice.map((l) => l.mood).filter((v) => v != null);
    const sleep = slice.map((l) => l.sleep).filter((v) => v != null);
    const fatigue = slice.map((l) => l.fatigue).filter((v) => v != null);
    const flareDays = slice.filter((l) => l.flare === "Yes").length;
    const rows = [
      { label: "Logged days", value: String(slice.length) },
      { label: "Flare days", value: String(flareDays) }
    ];
    const moodAvg = mean4(mood);
    const sleepAvg = mean4(sleep);
    const fatigueAvg = mean4(fatigue);
    if (moodAvg != null) rows.push({ label: "Mood (avg /10)", value: moodAvg.toFixed(1) });
    if (sleepAvg != null) rows.push({ label: "Sleep (avg /10)", value: sleepAvg.toFixed(1) });
    if (fatigueAvg != null) rows.push({ label: "Fatigue (avg /10)", value: fatigueAvg.toFixed(1) });
    return rows;
  }
  function collectFlareCalendarEntries(logs, days = APPOINTMENT_RANGE_DAYS, todayStr) {
    return filterLogsForAppointment(logs, days, todayStr).filter((l) => l.flare === "Yes").map((l) => l.date).sort();
  }
  function collectMedicationList(logs, medSchedule = []) {
    const names = /* @__PURE__ */ new Set();
    (Array.isArray(medSchedule) ? medSchedule : []).forEach((m) => {
      if (m?.enabled !== false && m?.drug) names.add(String(m.drug).trim());
    });
    sortLogsNewestFirst(logs).slice(0, 30).forEach((log) => {
      if (Array.isArray(log.medications)) {
        log.medications.forEach((med) => {
          const n = typeof med === "string" ? med : med?.name || med?.drug;
          if (n) names.add(String(n).trim());
        });
      }
      if (Array.isArray(log.medicationDoses)) {
        log.medicationDoses.forEach((d) => {
          if (d?.drug) names.add(String(d.drug).trim());
        });
      }
    });
    return [...names].filter(Boolean).sort();
  }
  function buildAppointmentReportModel(logs, opts = {}) {
    const rangeDays = opts.rangeDays ?? APPOINTMENT_RANGE_DAYS;
    const filtered = filterLogsForAppointment(logs, rangeDays, opts.todayStr);
    return {
      appointmentDate: opts.appointmentDate || null,
      rangeLabel: opts.rangeLabel || `Last ${rangeDays} days`,
      briefText: opts.briefText || "",
      chartRows: buildAppointmentChartRows(logs, Math.min(14, rangeDays)),
      flareDates: collectFlareCalendarEntries(logs, rangeDays, opts.todayStr),
      medications: collectMedicationList(filtered, opts.medSchedule),
      timelineRows: Array.isArray(opts.timelineRows) ? opts.timelineRows : [],
      doctorQuestions: Array.isArray(opts.doctorQuestions) ? opts.doctorQuestions : [],
      disclaimer: opts.disclaimer || APPOINTMENT_DISCLAIMER
    };
  }
  function escapeHtml(s) {
    return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function buildAppointmentReportHtml(model) {
    const m = model && typeof model === "object" ? model : {};
    const chartRows = (m.chartRows || []).map((r) => `<tr><td>${escapeHtml(r.label)}</td><td>${escapeHtml(r.value)}</td></tr>`).join("");
    const flareList = (m.flareDates || []).length ? (m.flareDates || []).map((d) => `<li>${escapeHtml(d)}</li>`).join("") : "<li>None recorded in range</li>";
    const medList = (m.medications || []).length ? (m.medications || []).map((d) => `<li>${escapeHtml(d)}</li>`).join("") : "<li>None listed</li>";
    const timeline = (m.timelineRows || []).map(
      (row) => `<tr><td>${escapeHtml(row.startDate)}</td><td>${escapeHtml(row.label)}</td><td>${escapeHtml(row.preFatigueAvg ?? "-")}</td><td>${escapeHtml(row.postFatigueAvg ?? "-")}</td></tr>`
    ).join("");
    const questions = (m.doctorQuestions || []).map((q, i) => `<li>${escapeHtml(q)}</li>`).join("");
    const apptLine = m.appointmentDate ? `<p><strong>Upcoming visit:</strong> ${escapeHtml(m.appointmentDate)}</p>` : "";
    const briefBlock = m.briefText ? `<h2>Visit prep summary</h2><p style="white-space:pre-wrap">${escapeHtml(m.briefText)}</p>` : "<p><em>Generate a clinician brief in the app to include AI summary text.</em></p>";
    const questionsBlock = questions ? `<h2>Questions for my clinician</h2><ol>${questions}</ol>` : "";
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Rianell appointment report</title>
<style>
body{font-family:system-ui,sans-serif;padding:28px;color:#222;font-size:13px;line-height:1.45}
h1{font-size:20px;margin:0 0 8px}
h2{font-size:15px;margin:20px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}
table{border-collapse:collapse;width:100%;margin:8px 0}
td,th{border:1px solid #ccc;padding:6px 8px;text-align:left}
.footer{font-size:11px;color:#666;margin-top:24px;border-top:1px solid #eee;padding-top:10px}
.page{page-break-after:always}
.page:last-child{page-break-after:auto}
</style></head><body>
<div class="page">
<h1>Rianell appointment report</h1>
<p><strong>Range:</strong> ${escapeHtml(m.rangeLabel)}</p>
${apptLine}
${briefBlock}
<h2>Chart summary</h2>
<table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>${chartRows}</tbody></table>
${questionsBlock}
<p class="footer">${escapeHtml(m.disclaimer)}</p>
</div>
<div class="page">
<h2>Medications</h2>
<ul>${medList}</ul>
<h2>Flare calendar</h2>
<ul>${flareList}</ul>
<h2>Treatment timeline</h2>
<table><thead><tr><th>Start</th><th>Label</th><th>Pre fatigue</th><th>Post fatigue</th></tr></thead>
<tbody>${timeline || '<tr><td colspan="4">No treatment markers recorded</td></tr>'}</tbody></table>
<p class="footer">${escapeHtml(m.disclaimer)}</p>
</div>
</body></html>`;
  }

  // packages/shared/src/clinician/qrHandoff.mjs
  var QR_HANDOFF_FORMAT = "rianell-qr-handoff-v1";
  var QR_HANDOFF_MAX_CHARS = 2400;
  var QR_HANDOFF_DEFAULT_TTL_MINUTES = 60;
  function buildQrHandoffLogsSubset(logs, maxLogs = 14) {
    const list = [...Array.isArray(logs) ? logs : []].sort(
      (a, b) => String(a?.date || "").localeCompare(String(b?.date || ""))
    );
    return list.slice(-Math.max(1, Math.min(30, maxLogs)));
  }
  async function createQrHandoffPayload(logs, passphrase, opts = {}) {
    if (typeof passphrase !== "string" || passphrase.length < ENCRYPTED_EXPORT_MIN_LENGTH) {
      throw new Error(`Passphrase must be at least ${ENCRYPTED_EXPORT_MIN_LENGTH} characters`);
    }
    const ttlMin = Math.min(180, Math.max(5, Number(opts.ttlMinutes) || QR_HANDOFF_DEFAULT_TTL_MINUTES));
    const expiresAt = new Date(Date.now() + ttlMin * 6e4).toISOString();
    const subset = buildQrHandoffLogsSubset(logs, opts.maxLogs ?? 14);
    const encrypted = await encryptExportWithPassphrase(
      {
        logs: subset,
        handoff: { readOnly: true, expiresAt, format: QR_HANDOFF_FORMAT }
      },
      passphrase,
      opts.subtle
    );
    const payload = {
      format: QR_HANDOFF_FORMAT,
      expiresAt,
      encrypted
    };
    const token = JSON.stringify(payload);
    if (token.length > QR_HANDOFF_MAX_CHARS) {
      throw new Error("Handoff payload too large for QR. Try fewer logs or use encrypted file export");
    }
    return { token, expiresAt, logCount: subset.length };
  }
  function parseQrHandoffToken(token) {
    if (typeof token !== "string" || !token.trim()) throw new Error("Empty handoff token");
    const parsed = JSON.parse(token);
    if (!parsed || parsed.format !== QR_HANDOFF_FORMAT) throw new Error("Unsupported handoff format");
    return parsed;
  }
  function isQrHandoffExpired(payload, now = /* @__PURE__ */ new Date()) {
    if (!payload?.expiresAt) return true;
    return Date.parse(payload.expiresAt) <= now.getTime();
  }
  async function decryptQrHandoffToken(token, passphrase, opts = {}) {
    const payload = parseQrHandoffToken(token);
    if (isQrHandoffExpired(payload, opts.now)) throw new Error("Handoff expired");
    const data = await decryptExportWithPassphrase(payload.encrypted, passphrase, opts.subtle);
    return {
      logs: Array.isArray(data?.logs) ? data.logs : [],
      expiresAt: payload.expiresAt,
      readOnly: true
    };
  }

  // packages/shared/src/research/researchFacets.mjs
  function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  function flareToBit(flare) {
    if (flare === "Yes" || flare === true || flare === 1) return 1;
    if (flare === "No" || flare === false || flare === 0) return 0;
    return null;
  }
  function buildResearchFacetsFromLog(log) {
    if (!log?.date || !/^\d{4}-\d{2}-\d{2}$/.test(String(log.date))) return null;
    const out = { date: String(log.date) };
    const sleep = num(log.sleep);
    const fatigue = num(log.fatigue);
    const mood = num(log.mood);
    const flare = flareToBit(log.flare);
    if (sleep != null) out.sleep = sleep;
    if (fatigue != null) out.fatigue = fatigue;
    if (mood != null) out.mood = mood;
    if (flare != null) out.flare = flare;
    if (Object.keys(out).length <= 1) return null;
    return out;
  }
  function validateResearchFacets(facets) {
    if (!facets || typeof facets !== "object") return false;
    if (!facets.date || !/^\d{4}-\d{2}-\d{2}$/.test(String(facets.date))) return false;
    for (const key of Object.keys(facets)) {
      if (key === "date") continue;
      if (key === "flare") {
        if (facets.flare !== 0 && facets.flare !== 1) return false;
        continue;
      }
      const n = num(facets[key]);
      if (n == null || n < 0 || n > 10) return false;
    }
    return true;
  }

  // packages/shared/src/research/poolGates.mjs
  var POOL_INSIGHT_MIN_K = 5;
  var POOL_CONTRIBUTION_MIN_DAYS = 90;
  var PLACEHOLDER_CONDITIONS = /* @__PURE__ */ new Set(["", "medical condition"]);
  function isValidMedicalConditionForPool(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) return false;
    return !PLACEHOLDER_CONDITIONS.has(trimmed.toLowerCase());
  }
  function canExportContributionHistory(prefs, opts = {}) {
    if (!opts.signedIn) return { allowed: false, reason: "signIn" };
    if (!prefs?.contributeAnonData) return { allowed: false, reason: "optIn" };
    if (!isValidMedicalConditionForPool(prefs.medicalCondition)) {
      return { allowed: false, reason: "condition" };
    }
    return { allowed: true };
  }
  function canViewPoolInsights(prefs, opts = {}) {
    const poolDayCount = Number(opts.poolDayCount) || 0;
    if (!opts.signedIn) return { allowed: false, reason: "signIn" };
    if (!prefs?.contributeAnonData) return { allowed: false, reason: "optIn" };
    if (!isValidMedicalConditionForPool(prefs.medicalCondition)) {
      return { allowed: false, reason: "condition" };
    }
    if (poolDayCount < POOL_CONTRIBUTION_MIN_DAYS) {
      return { allowed: false, reason: "minDays", minDays: POOL_CONTRIBUTION_MIN_DAYS, poolDayCount };
    }
    return { allowed: true };
  }

  // packages/shared/src/research/poolInsights.mjs
  function mean5(values) {
    const list = values.filter((v) => v != null && Number.isFinite(v));
    if (!list.length) return null;
    return list.reduce((a, b) => a + b, 0) / list.length;
  }
  function buildUserCohortsFromFacets(rows, kMin = POOL_INSIGHT_MIN_K) {
    const byUser = /* @__PURE__ */ new Map();
    for (const row of Array.isArray(rows) ? rows : []) {
      const userId = row?.user_id || row?.userId;
      const facets = row?.research_facets || row?.facets;
      if (!userId || !facets || typeof facets !== "object") continue;
      if (!byUser.has(userId)) byUser.set(userId, []);
      byUser.get(userId).push(facets);
    }
    const highSleep = [];
    const lowSleep = [];
    for (const [, days] of byUser) {
      const sleepVals = days.map((d) => Number(d.sleep)).filter((v) => Number.isFinite(v));
      const avgSleep = mean5(sleepVals);
      if (avgSleep == null) continue;
      const flareDays = days.filter((d) => flareToBit(d.flare) === 1).length;
      const flareRate = days.length ? flareDays / days.length : null;
      if (flareRate == null) continue;
      const entry = { avgSleep, flareRate, dayCount: days.length };
      if (avgSleep >= 7) highSleep.push(entry);
      else lowSleep.push(entry);
    }
    return {
      highSleep,
      lowSleep,
      contributorCount: byUser.size,
      kMin,
      highSleepCohort: highSleep.length,
      lowSleepCohort: lowSleep.length
    };
  }
  function buildSleepFlareInsight(cohorts) {
    const kMin = cohorts?.kMin ?? POOL_INSIGHT_MIN_K;
    const high = cohorts?.highSleep || [];
    const low = cohorts?.lowSleep || [];
    if (high.length < kMin || low.length < kMin) return null;
    const highFlare = mean5(high.map((h) => h.flareRate));
    const lowFlare = mean5(low.map((h) => h.flareRate));
    if (highFlare == null || lowFlare == null) return null;
    if (highFlare >= lowFlare) return null;
    return {
      id: "sleep-flare",
      kMin,
      highSleepCohort: high.length,
      lowSleepCohort: low.length,
      highFlarePct: Math.round(highFlare * 100),
      lowFlarePct: Math.round(lowFlare * 100)
    };
  }
  function computePoolInsightsFromFacets(rows, opts = {}) {
    const kMin = opts.kMin ?? POOL_INSIGHT_MIN_K;
    const cohorts = buildUserCohortsFromFacets(rows, kMin);
    const insights = [];
    const sleepFlare = buildSleepFlareInsight(cohorts);
    if (sleepFlare) insights.push(sleepFlare);
    return {
      kMin,
      contributorCount: cohorts.contributorCount,
      insights,
      suppressed: insights.length === 0
    };
  }
  function normalizePoolInsightsRpcResult(data) {
    if (!data || typeof data !== "object") {
      return { kMin: POOL_INSIGHT_MIN_K, contributorCount: 0, insights: [], suppressed: true };
    }
    const insights = Array.isArray(data.insights) ? data.insights : [];
    return {
      kMin: Number(data.kMin) || POOL_INSIGHT_MIN_K,
      contributorCount: Number(data.contributorCount) || 0,
      insights,
      suppressed: insights.length === 0
    };
  }

  // packages/shared/src/research/contributionExport.mjs
  var CONTRIBUTION_EXPORT_FORMAT = "rianell-contribution-export-v1";
  function formatContributionExport(rows, opts = {}) {
    const list = Array.isArray(rows) ? rows : [];
    return {
      format: CONTRIBUTION_EXPORT_FORMAT,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      medicalCondition: opts.medicalCondition || null,
      rowCount: list.length,
      rows: list.map((row) => ({
        id: row.id ?? null,
        createdAt: row.created_at || row.createdAt || null,
        medicalCondition: row.medical_condition || row.medicalCondition || null,
        researchFacets: row.research_facets || row.researchFacets || null,
        decrypted: row.decrypted ?? null
      })),
      retentionNote: "Opting out stops future uploads. Existing rows remain until you delete them from Settings or request erasure."
    };
  }

  // packages/shared/src/research/anonPoolPayload.mjs
  function buildAnonymizedLogPayload(log) {
    const anonymized = {
      date: log?.date,
      bpm: log?.bpm,
      weight: log?.weight,
      backPain: log?.backPain,
      jointPain: log?.jointPain,
      stiffness: log?.stiffness,
      swelling: log?.swelling,
      sleep: log?.sleep,
      mood: log?.mood,
      irritability: log?.irritability,
      mobility: log?.mobility,
      dailyFunction: log?.dailyFunction,
      fatigue: log?.fatigue,
      flare: log?.flare,
      hydration: log?.hydration,
      steps: log?.steps,
      weatherSensitivity: log?.weatherSensitivity,
      energyClarity: log?.energyClarity,
      exercise: log?.exercise,
      food: flattenFood(log?.food)
    };
    Object.keys(anonymized).forEach((key) => {
      const v = anonymized[key];
      if (v === void 0 || v === null || v === "") delete anonymized[key];
    });
    return anonymized;
  }
  function flattenFood(food) {
    if (!food) return void 0;
    const arr = Array.isArray(food) ? food : [].concat(
      food.breakfast || [],
      food.lunch || [],
      food.dinner || [],
      food.snack || []
    );
    if (!arr.length) return void 0;
    return arr.map((item) => ({
      name: item && item.name || "",
      calories: item && item.calories,
      protein: item && item.protein
    }));
  }
  function buildAnonymizedInsertRow(log, opts) {
    const payload = buildAnonymizedLogPayload(log);
    const research_facets = buildResearchFacetsFromLog(log);
    return {
      user_id: opts.userId,
      medical_condition: opts.medicalConditionHash || opts.medicalCondition,
      anonymized_log: opts.encryptedLog,
      research_facets
    };
  }

  // packages/shared/src/research/medicalConditionHash.mjs
  var MEDICAL_CONDITION_POOL_SALT = "rianell-anon-pool-v1";
  async function hashMedicalConditionLabel(label) {
    const text = String(label || "").trim().toLowerCase();
    if (!text) return "";
    const payload = `${MEDICAL_CONDITION_POOL_SALT}:${text}`;
    const data = new TextEncoder().encode(payload);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  async function medicalConditionForPoolStorage(label) {
    return hashMedicalConditionLabel(label);
  }

  // packages/shared/src/crossCutting/weeklyReview.mjs
  var WEEKLY_REVIEW_STEPS = [
    { id: "correlations", i18n: "weeklyReview.step.correlations" },
    { id: "digest", i18n: "weeklyReview.step.digest" },
    { id: "brief", i18n: "weeklyReview.step.brief" },
    { id: "confirm", i18n: "weeklyReview.step.confirm" },
    { id: "pdf", i18n: "weeklyReview.step.pdf" }
  ];
  var WEEKLY_REVIEW_MIN_LOG_DAYS = 7;
  function isoWeekKey2(dateStr) {
    const d = /^\d{4}-\d{2}-\d{2}$/.test(String(dateStr || "")) ? /* @__PURE__ */ new Date(`${dateStr}T12:00:00`) : /* @__PURE__ */ new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    return monday.toISOString().slice(0, 10);
  }
  function isoWeekMondayKey(dateStr) {
    return isoWeekKey2(dateStr);
  }
  function isSundayReviewDay(todayStr) {
    const d = /^\d{4}-\d{2}-\d{2}$/.test(String(todayStr || "")) ? /* @__PURE__ */ new Date(`${todayStr}T12:00:00`) : /* @__PURE__ */ new Date();
    return d.getDay() === 0;
  }
  function countDistinctLogDays(logs) {
    const dates = new Set((Array.isArray(logs) ? logs : []).map((l) => l?.date).filter(Boolean));
    return dates.size;
  }
  function canOfferWeeklyReview(logs, opts = {}) {
    if (opts.simpleMode) return { allowed: false, reason: "simpleMode" };
    if (opts.aiEnabled === false) return { allowed: false, reason: "aiOff" };
    const dayCount = countDistinctLogDays(logs);
    if (dayCount < WEEKLY_REVIEW_MIN_LOG_DAYS) {
      return { allowed: false, reason: "minDays", minDays: WEEKLY_REVIEW_MIN_LOG_DAYS, dayCount };
    }
    const today = opts.todayStr || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const sunday = isSundayReviewDay(today);
    const dismissedWeek = opts.weeklyReviewDismissedWeek || null;
    const thisWeek = isoWeekKey2(today);
    if (dismissedWeek === thisWeek && !opts.force) {
      return { allowed: false, reason: "dismissed" };
    }
    return { allowed: true, sundayHighlight: sunday, logDayCount: dayCount };
  }
  function summarizeCorrelationStep(correlationCards) {
    const list = Array.isArray(correlationCards) ? correlationCards : [];
    return list.slice(0, 3).map((c) => ({
      id: c.id || c.metricA,
      label: c.label || (c.label1 && c.label2 ? `${c.label1} & ${c.label2}` : c.title || ""),
      label1: c.label1 || null,
      label2: c.label2 || null,
      metric1: c.metric1 || null,
      metric2: c.metric2 || null,
      coefficient: c.coefficient != null ? c.coefficient : null,
      direction: c.direction || null,
      detail: c.detail || c.summary || (c.coefficient != null ? `${c.direction || "corr"} (${c.coefficient})` : ""),
      confidence: c.confidence || c.confidenceLevel || null,
      sampleSize: c.sampleSize != null ? c.sampleSize : null
    }));
  }
  function summarizeDigestStep(digest) {
    if (!digest || typeof digest !== "object") {
      return { headline: "", improvements: [], concerns: [], changes: [], goalStatus: [] };
    }
    return {
      headline: digest.headline || "",
      improvements: Array.isArray(digest.improvements) ? digest.improvements : [],
      concerns: Array.isArray(digest.concerns) ? digest.concerns : [],
      changes: Array.isArray(digest.changes) ? digest.changes : [],
      goalStatus: Array.isArray(digest.goalStatus) ? digest.goalStatus : []
    };
  }

  // packages/shared/src/crossCutting/progressiveDisclosure.mjs
  var PROGRESSIVE_DISCLOSURE_MILESTONES = [
    { id: "day1", i18n: "progressiveDisclosure.milestone.day1", unlockDay: 0 },
    { id: "week2", i18n: "progressiveDisclosure.milestone.week2", unlockDay: 14 },
    { id: "month2", i18n: "progressiveDisclosure.milestone.month2", unlockDay: 60 },
    { id: "pool", i18n: "progressiveDisclosure.milestone.pool", unlockDay: 90, optional: true }
  ];
  var ON_DEVICE_MOAT_BULLET_KEYS = [
    "onDeviceMoat.bullet.localInference",
    "onDeviceMoat.bullet.noCloudLlmDefault",
    "onDeviceMoat.bullet.poolOptIn",
    "onDeviceMoat.bullet.localOnly"
  ];
  function getProgressiveDisclosureMilestones() {
    return PROGRESSIVE_DISCLOSURE_MILESTONES;
  }
  function getOnDeviceMoatBulletKeys() {
    return ON_DEVICE_MOAT_BULLET_KEYS;
  }

  // packages/shared/src/crossCutting/mentalHealthScreening.mjs
  var PHQ2_QUESTIONS = [
    { id: "phq2_1", i18n: "mentalHealth.phq2.q1" },
    { id: "phq2_2", i18n: "mentalHealth.phq2.q2" }
  ];
  var GAD2_QUESTIONS = [
    { id: "gad2_1", i18n: "mentalHealth.gad2.q1" },
    { id: "gad2_2", i18n: "mentalHealth.gad2.q2" }
  ];
  var PHQ9_QUESTIONS = [
    { id: "phq9_1", i18n: "mentalHealth.phq2.q1" },
    { id: "phq9_2", i18n: "mentalHealth.phq2.q2" },
    { id: "phq9_3", i18n: "mentalHealth.phq9.q3" },
    { id: "phq9_4", i18n: "mentalHealth.phq9.q4" },
    { id: "phq9_5", i18n: "mentalHealth.phq9.q5" },
    { id: "phq9_6", i18n: "mentalHealth.phq9.q6" },
    { id: "phq9_7", i18n: "mentalHealth.phq9.q7" },
    { id: "phq9_8", i18n: "mentalHealth.phq9.q8" },
    { id: "phq9_9", i18n: "mentalHealth.phq9.q9" }
  ];
  var GAD7_QUESTIONS = [
    { id: "gad7_1", i18n: "mentalHealth.gad2.q1" },
    { id: "gad7_2", i18n: "mentalHealth.gad2.q2" },
    { id: "gad7_3", i18n: "mentalHealth.gad7.q3" },
    { id: "gad7_4", i18n: "mentalHealth.gad7.q4" },
    { id: "gad7_5", i18n: "mentalHealth.gad7.q5" },
    { id: "gad7_6", i18n: "mentalHealth.gad7.q6" },
    { id: "gad7_7", i18n: "mentalHealth.gad7.q7" }
  ];
  var PHQ9_FOLLOWUP_QUESTIONS = PHQ9_QUESTIONS.slice(2);
  var GAD7_FOLLOWUP_QUESTIONS = GAD7_QUESTIONS.slice(2);
  var PHQ9_MAX_SCORE = 27;
  var GAD7_MAX_SCORE = 21;
  var PHQ2_MAX_SCORE = 6;
  var GAD2_MAX_SCORE = 6;
  var PHQ9_ITEM9_ID = "phq9_9";
  var SCREENING_RESPONSE_OPTIONS = [
    { value: 0, i18n: "mentalHealth.response.notAtAll" },
    { value: 1, i18n: "mentalHealth.response.severalDays" },
    { value: 2, i18n: "mentalHealth.response.moreThanHalf" },
    { value: 3, i18n: "mentalHealth.response.nearlyEveryDay" }
  ];
  var CRISIS_BY_REGION = {
    eea_uk: [
      { i18n: "mentalHealth.crisis.samaritans", url: "https://www.samaritans.org/" },
      { i18n: "mentalHealth.crisis.nhs111", url: "https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-111/" }
    ],
    us: [{ i18n: "mentalHealth.crisis.us988", url: "https://988lifeline.org/" }],
    ca: [{ i18n: "mentalHealth.crisis.ca988", url: "https://988.ca/" }],
    au: [{ i18n: "mentalHealth.crisis.lifelineAu", url: "https://www.lifeline.org.au/" }],
    other: [{ i18n: "mentalHealth.crisis.findaHelpline", url: "https://findahelpline.com/" }]
  };
  function scoreScreeningResponses(responses) {
    const list = Array.isArray(responses) ? responses : [];
    let total = 0;
    let answered = 0;
    for (const r of list) {
      const v = Number(r?.value);
      if (!Number.isFinite(v) || v < 0 || v > 3) continue;
      total += v;
      answered += 1;
    }
    return { total, answered, complete: answered === list.length && list.length > 0 };
  }
  function shouldOfferPhq9FollowUp(phq2Total) {
    return Number(phq2Total) >= 3;
  }
  function shouldOfferGad7FollowUp(gad2Total) {
    return Number(gad2Total) >= 3;
  }
  var PHQ2_TO_PHQ9_ID = { phq2_1: "phq9_1", phq2_2: "phq9_2" };
  var GAD2_TO_GAD7_ID = { gad2_1: "gad7_1", gad2_2: "gad7_2" };
  function mergePhq9Responses(phq2Responses, followUpResponses) {
    const merged = {};
    for (const q of PHQ2_QUESTIONS) {
      const phq9Id = PHQ2_TO_PHQ9_ID[q.id];
      if (phq9Id) merged[phq9Id] = Number(phq2Responses?.[q.id]) || 0;
    }
    for (const q of PHQ9_FOLLOWUP_QUESTIONS) {
      merged[q.id] = Number(followUpResponses?.[q.id]) || 0;
    }
    return merged;
  }
  function mergeGad7Responses(gad2Responses, followUpResponses) {
    const merged = {};
    for (const q of GAD2_QUESTIONS) {
      const gad7Id = GAD2_TO_GAD7_ID[q.id];
      if (gad7Id) merged[gad7Id] = Number(gad2Responses?.[q.id]) || 0;
    }
    for (const q of GAD7_FOLLOWUP_QUESTIONS) {
      merged[q.id] = Number(followUpResponses?.[q.id]) || 0;
    }
    return merged;
  }
  function scorePhq9FromResponses(responseMap) {
    const responses = PHQ9_QUESTIONS.map((q) => ({ value: responseMap?.[q.id] }));
    return scoreScreeningResponses(responses);
  }
  function scoreGad7FromResponses(responseMap) {
    const responses = GAD7_QUESTIONS.map((q) => ({ value: responseMap?.[q.id] }));
    return scoreScreeningResponses(responses);
  }
  function isPhq9SuicideItemPositive(responseMap) {
    const v = Number(responseMap?.[PHQ9_ITEM9_ID]);
    return Number.isFinite(v) && v >= 1;
  }
  function interpretPhq2Score(total) {
    if (total >= 3) return { level: "elevated", i18n: "mentalHealth.phq2.elevated" };
    return { level: "low", i18n: "mentalHealth.phq2.low" };
  }
  function interpretGad2Score(total) {
    if (total >= 3) return { level: "elevated", i18n: "mentalHealth.gad2.elevated" };
    return { level: "low", i18n: "mentalHealth.gad2.low" };
  }
  function interpretPhq9Score(total) {
    const t2 = Number(total);
    if (t2 >= 20) return { level: "severe", i18n: "mentalHealth.phq9.severity.severe" };
    if (t2 >= 15) return { level: "moderatelySevere", i18n: "mentalHealth.phq9.severity.moderatelySevere" };
    if (t2 >= 10) return { level: "moderate", i18n: "mentalHealth.phq9.severity.moderate" };
    if (t2 >= 5) return { level: "mild", i18n: "mentalHealth.phq9.severity.mild" };
    return { level: "minimal", i18n: "mentalHealth.phq9.severity.minimal" };
  }
  function interpretGad7Score(total) {
    const t2 = Number(total);
    if (t2 >= 15) return { level: "severe", i18n: "mentalHealth.gad7.severity.severe" };
    if (t2 >= 10) return { level: "moderate", i18n: "mentalHealth.gad7.severity.moderate" };
    if (t2 >= 5) return { level: "mild", i18n: "mentalHealth.gad7.severity.mild" };
    return { level: "minimal", i18n: "mentalHealth.gad7.severity.minimal" };
  }
  function getCrisisResourcesForRegion(regionId) {
    const key = String(regionId || "other").toLowerCase();
    if (key === "eea_uk" || key === "uk") return CRISIS_BY_REGION.eea_uk;
    if (key === "us" || key === "us_ca") return CRISIS_BY_REGION.us;
    if (key === "ca") return CRISIS_BY_REGION.ca;
    if (key === "au") return CRISIS_BY_REGION.au;
    return CRISIS_BY_REGION.other;
  }
  var MENTAL_HEALTH_DISCLAIMER_I18N = "mentalHealth.disclaimer";

  // packages/shared/src/mood/moodMetrics.mjs
  var MOOD_CHECKIN_PERIODS = HOME_CHECKIN_PERIODS;
  var PERIOD_ORDER = { AM: 0, midday: 1, PM: 2 };
  function clampMood(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return Math.min(10, Math.max(0, Math.round(n)));
  }
  function toDateStr4(d) {
    return d.toISOString().slice(0, 10);
  }
  function filterLogsByDays(logs, days, todayStr) {
    const list = Array.isArray(logs) ? logs : [];
    const end = /^\d{4}-\d{2}-\d{2}$/.test(todayStr || "") ? /* @__PURE__ */ new Date(`${todayStr}T12:00:00`) : /* @__PURE__ */ new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - (Math.max(1, days) - 1));
    const startStr = toDateStr4(start);
    const endStr = todayStr || toDateStr4(end);
    return list.filter((l) => l?.date && l.date >= startStr && l.date <= endStr);
  }
  function collectMoodReadings(logs, days = 14, todayStr) {
    const rangeLogs = filterLogsByDays(logs, days, todayStr).sort(
      (a, b) => String(b.date).localeCompare(String(a.date))
    );
    const out = [];
    for (const log of rangeLogs) {
      const daily = clampMood(log.mood);
      if (daily != null) {
        out.push({ date: log.date, period: null, mood: daily, source: "daily" });
      }
      const subs = Array.isArray(log.subEntries) ? log.subEntries : [];
      for (const sub of subs) {
        const m = clampMood(sub?.mood);
        if (m == null) continue;
        const period = typeof sub.period === "string" ? sub.period : null;
        out.push({ date: log.date, period, mood: m, source: "checkin" });
      }
    }
    out.sort((a, b) => {
      const dc = String(b.date).localeCompare(String(a.date));
      if (dc !== 0) return dc;
      const pa = a.period ? PERIOD_ORDER[a.period] ?? 9 : 10;
      const pb = b.period ? PERIOD_ORDER[b.period] ?? 9 : 10;
      return pa - pb;
    });
    return out;
  }
  function summarizeMoodMetrics(logs, opts = {}) {
    const days = opts.days ?? 14;
    const todayStr = opts.todayStr;
    const moodTarget = opts.moodTarget ?? 7;
    const readings = collectMoodReadings(logs, days, todayStr);
    if (!readings.length) {
      return {
        days,
        count: 0,
        average: null,
        latest: null,
        trend: null,
        atTargetCount: 0,
        belowTargetCount: 0,
        moodTarget,
        readings: [],
        dailyAverages: []
      };
    }
    const sum = readings.reduce((s, r) => s + r.mood, 0);
    const avg = Math.round(sum / readings.length * 10) / 10;
    const latest = readings[0];
    const chronological = [...readings].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const mid = Math.floor(chronological.length / 2);
    const firstHalf = chronological.slice(0, mid || 1);
    const secondHalf = chronological.slice(mid || 1);
    const avgFirst = firstHalf.reduce((s, r) => s + r.mood, 0) / firstHalf.length;
    const avgSecond = secondHalf.length ? secondHalf.reduce((s, r) => s + r.mood, 0) / secondHalf.length : avgFirst;
    let trend = "stable";
    if (avgSecond - avgFirst >= 0.5) trend = "up";
    else if (avgFirst - avgSecond >= 0.5) trend = "down";
    const atTarget = readings.filter((r) => r.mood >= moodTarget).length;
    const byDate = /* @__PURE__ */ new Map();
    for (const r of readings) {
      if (!byDate.has(r.date)) byDate.set(r.date, []);
      byDate.get(r.date).push(r.mood);
    }
    const dailyAverages = [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, moods]) => ({
      date,
      average: Math.round(moods.reduce((s, m) => s + m, 0) / moods.length * 10) / 10,
      count: moods.length
    }));
    return {
      days,
      count: readings.length,
      average: avg,
      latest,
      trend,
      atTargetCount: atTarget,
      belowTargetCount: readings.length - atTarget,
      moodTarget,
      readings: readings.slice(0, 30),
      dailyAverages
    };
  }
  function moodQualitativeKey(score) {
    const n = clampMood(score);
    if (n == null) return "mood.qualitative.none";
    if (n <= 3) return "mood.qualitative.low";
    if (n <= 5) return "mood.qualitative.moderate";
    if (n <= 7) return "mood.qualitative.okay";
    return "mood.qualitative.good";
  }

  // packages/shared/src/analytics/smartlookConfig.mjs
  var SMARTLOOK_PROJECT_KEY = "c205987c47aef0b2da2a93569620b15a81bef013";
  var SMARTLOOK_REGION = "eu";
  var SMARTLOOK_SDK_URL = "https://web-sdk.smartlook.com/recorder.js";
  function resolveSmartlookProjectKey(candidate) {
    const key = typeof candidate === "string" ? candidate.trim() : "";
    if (key && key !== "YOUR_SMARTLOOK_PROJECT_KEY") return key;
    return SMARTLOOK_PROJECT_KEY;
  }
  function resolveSmartlookRegion(candidate) {
    const region = typeof candidate === "string" ? candidate.trim() : "";
    return region || SMARTLOOK_REGION;
  }

  // packages/shared/src/analytics/sessionRecordingPrefs.mjs
  function shouldActivateSessionRecording(prefs) {
    const p = prefs && typeof prefs === "object" ? prefs : {};
    if (p.sessionRecording !== true) return false;
    const disclosed = typeof p.sessionRecordingDisclosureAt === "string" && p.sessionRecordingDisclosureAt.length > 0;
    const enabledAt = typeof p.sessionRecordingAt === "string" && p.sessionRecordingAt.length > 0;
    return disclosed || enabledAt;
  }

  // packages/shared/src/onboarding/guidedQuestionnaire.mjs
  var GUIDED_QUESTIONNAIRE_CARD_IDS = [
    "welcome",
    "appearance",
    "avatarPick",
    "signIn",
    "region",
    "coachTone",
    "helperLevel",
    "healthConsent",
    "cookies",
    "sessionRecording",
    "aiDownload",
    "communityHelp",
    "dailyNudge",
    "install",
    "accountSignUp",
    "finish"
  ];
  function isGuidedOnboardingAuthenticated(prefs, ctx) {
    if (ctx && ctx.isAuthenticated === true) return true;
    const p = prefs && typeof prefs === "object" ? prefs : {};
    return p.onboardingAccountLinked === true;
  }
  function skipSetupCardsForReturningSignIn(cardId, prefs, ctx) {
    const setupCards = [
      "appearance",
      "avatarPick",
      "region",
      "coachTone",
      "helperLevel",
      "healthConsent",
      "cookies",
      "sessionRecording",
      "aiDownload",
      "communityHelp",
      "dailyNudge",
      "install",
      "accountSignUp"
    ];
    if (!setupCards.includes(cardId)) return false;
    const p = prefs && typeof prefs === "object" ? prefs : {};
    return p.onboardingPath === "signIn" && isGuidedOnboardingAuthenticated(p, ctx);
  }
  var GUIDED_CARD_META = {
    welcome: {
      kind: "choice",
      titleKey: "onboarding.questionnaire.welcome.title",
      bodyKey: "onboarding.questionnaire.welcome.body",
      illustration: "mascot-wave",
      settingsHintKey: "",
      choices: [
        { id: "signIn", labelKey: "onboarding.questionnaire.welcome.signIn" },
        { id: "setUp", labelKey: "onboarding.questionnaire.welcome.setUp" }
      ]
    },
    appearance: {
      kind: "theme",
      titleKey: "onboarding.questionnaire.appearance.title",
      bodyKey: "onboarding.questionnaire.appearance.body",
      illustration: "sparkle",
      settingsHintKey: "onboarding.questionnaire.settingsHint",
      choices: [{ id: "continue", labelKey: "onboarding.questionnaire.continue" }]
    },
    avatarPick: {
      kind: "avatar-carousel",
      titleKey: "onboarding.questionnaire.avatarPick.title",
      bodyKey: "onboarding.questionnaire.avatarPick.body",
      illustration: "sparkle",
      settingsHintKey: "onboarding.questionnaire.settingsHint"
    },
    signIn: {
      kind: "auth",
      titleKey: "onboarding.questionnaire.signIn.title",
      bodyKey: "onboarding.questionnaire.signIn.body",
      illustration: "shield",
      settingsHintKey: "",
      choices: [
        { id: "setUpInstead", labelKey: "onboarding.questionnaire.signIn.setUpInstead" }
      ]
    },
    region: {
      kind: "choice",
      titleKey: "onboarding.questionnaire.region.title",
      bodyKey: "onboarding.questionnaire.region.body",
      illustration: "globe",
      settingsHintKey: "onboarding.questionnaire.settingsHint",
      choices: [
        { id: "confirm", labelKey: "onboarding.questionnaire.region.confirm" },
        { id: "pickAnother", labelKey: "onboarding.questionnaire.region.pickAnother" }
      ]
    },
    coachTone: {
      kind: "choice",
      titleKey: "onboarding.questionnaire.coachTone.title",
      bodyKey: "onboarding.questionnaire.coachTone.body",
      illustration: "coach",
      settingsHintKey: "onboarding.questionnaire.settingsHint",
      choices: [
        { id: "encouraging", labelKey: "onboarding.questionnaire.coachTone.warm", hintKey: "onboarding.questionnaire.coachTone.warmHint" },
        { id: "clinical", labelKey: "onboarding.questionnaire.coachTone.facts", hintKey: "onboarding.questionnaire.coachTone.factsHint" },
        { id: "minimal", labelKey: "onboarding.questionnaire.coachTone.short", hintKey: "onboarding.questionnaire.coachTone.shortHint" }
      ]
    },
    helperLevel: {
      kind: "choice",
      titleKey: "onboarding.questionnaire.helperLevel.title",
      bodyKey: "onboarding.questionnaire.helperLevel.body",
      illustration: "helper",
      settingsHintKey: "onboarding.questionnaire.settingsHint",
      choices: [
        { id: "guideAlot", labelKey: "onboarding.questionnaire.helperLevel.guide", hintKey: "onboarding.questionnaire.helperLevel.guideHint" },
        { id: "keepSimple", labelKey: "onboarding.questionnaire.helperLevel.simple", hintKey: "onboarding.questionnaire.helperLevel.simpleHint" },
        { id: "exploreMyself", labelKey: "onboarding.questionnaire.helperLevel.explore", hintKey: "onboarding.questionnaire.helperLevel.exploreHint" }
      ]
    },
    healthConsent: {
      kind: "consent",
      titleKey: "onboarding.questionnaire.healthConsent.title",
      bodyKey: "onboarding.questionnaire.healthConsent.body",
      illustration: "shield",
      settingsHintKey: "onboarding.questionnaire.settingsHint",
      choices: [
        { id: "agree", labelKey: "onboarding.questionnaire.healthConsent.agree" },
        { id: "notNow", labelKey: "onboarding.questionnaire.healthConsent.notNow" }
      ]
    },
    cookies: {
      kind: "consent",
      titleKey: "onboarding.questionnaire.cookies.title",
      bodyKey: "onboarding.questionnaire.cookies.body",
      illustration: "cookie",
      settingsHintKey: "onboarding.questionnaire.settingsHint",
      choices: [
        { id: "accept", labelKey: "onboarding.questionnaire.cookies.accept" },
        { id: "decline", labelKey: "onboarding.questionnaire.cookies.decline" }
      ]
    },
    sessionRecording: {
      kind: "consent",
      titleKey: "onboarding.questionnaire.sessionRecording.title",
      bodyKey: "onboarding.questionnaire.sessionRecording.body",
      illustration: "sparkle",
      settingsHintKey: "onboarding.questionnaire.settingsHint",
      choices: [
        { id: "yes", labelKey: "onboarding.questionnaire.sessionRecording.yes" },
        { id: "no", labelKey: "onboarding.questionnaire.sessionRecording.no" }
      ]
    },
    aiDownload: {
      kind: "choice",
      titleKey: "onboarding.questionnaire.aiDownload.title",
      bodyKey: "onboarding.questionnaire.aiDownload.body",
      illustration: "brain",
      settingsHintKey: "onboarding.questionnaire.settingsHint",
      choices: [
        { id: "now", labelKey: "onboarding.questionnaire.aiDownload.now" },
        { id: "later", labelKey: "onboarding.questionnaire.aiDownload.later" }
      ]
    },
    communityHelp: {
      kind: "choice",
      titleKey: "onboarding.questionnaire.communityHelp.title",
      bodyKey: "onboarding.questionnaire.communityHelp.body",
      illustration: "heart",
      settingsHintKey: "onboarding.questionnaire.settingsHint",
      choices: [
        { id: "yes", labelKey: "onboarding.questionnaire.communityHelp.yes" },
        { id: "no", labelKey: "onboarding.questionnaire.communityHelp.no" }
      ]
    },
    dailyNudge: {
      kind: "reminder",
      titleKey: "onboarding.questionnaire.dailyNudge.title",
      bodyKey: "onboarding.questionnaire.dailyNudge.body",
      illustration: "bell",
      settingsHintKey: "onboarding.questionnaire.settingsHint",
      choices: [
        { id: "yes", labelKey: "onboarding.questionnaire.dailyNudge.yes" },
        { id: "no", labelKey: "onboarding.questionnaire.dailyNudge.no" }
      ]
    },
    install: {
      kind: "choice",
      titleKey: "onboarding.questionnaire.install.title",
      bodyKey: "onboarding.questionnaire.install.body",
      illustration: "install",
      settingsHintKey: "onboarding.questionnaire.settingsHint",
      choices: [
        { id: "install", labelKey: "onboarding.questionnaire.install.install" },
        { id: "skip", labelKey: "onboarding.questionnaire.install.skip" }
      ]
    },
    accountSignUp: {
      kind: "auth",
      titleKey: "onboarding.questionnaire.accountSignUp.title",
      bodyKey: "onboarding.questionnaire.accountSignUp.body",
      illustration: "shield",
      settingsHintKey: "onboarding.questionnaire.settingsHint",
      choices: [
        { id: "skip", labelKey: "onboarding.questionnaire.accountSignUp.skip" }
      ]
    },
    finish: {
      kind: "info",
      titleKey: "onboarding.questionnaire.finish.title",
      bodyKey: "onboarding.questionnaire.finish.body",
      illustration: "celebrate",
      settingsHintKey: "",
      choices: [
        { id: "start", labelKey: "onboarding.questionnaire.finish.start" },
        { id: "quickTour", labelKey: "onboarding.questionnaire.finish.quickTour" }
      ]
    }
  };
  function shouldSkipGuidedCard(cardId, prefs, ctx) {
    const p = prefs && typeof prefs === "object" ? prefs : {};
    const c = ctx && typeof ctx === "object" ? ctx : { platform: "pwa" };
    switch (cardId) {
      case "welcome":
      case "finish":
        return false;
      case "appearance": {
        if (skipSetupCardsForReturningSignIn(cardId, p, c)) return true;
        if (typeof p.appearanceOnboardingAt === "string" && p.appearanceOnboardingAt.length > 0) return true;
        if (p.appearanceMode === "light" || p.appearanceMode === "dark" || p.appearanceMode === "warm-dark") {
          return true;
        }
        return false;
      }
      case "avatarPick":
        if (skipSetupCardsForReturningSignIn(cardId, p, c)) return true;
        if (typeof p.avatarPickAt === "string" && p.avatarPickAt.length > 0) return true;
        return false;
      case "coachTone":
      case "helperLevel":
      case "communityHelp":
      case "dailyNudge":
        if (skipSetupCardsForReturningSignIn(cardId, p, c)) return true;
        return false;
      case "signIn": {
        const path = typeof p.onboardingPath === "string" ? p.onboardingPath : "";
        if (path !== "signIn") return true;
        if (isGuidedOnboardingAuthenticated(p, c)) return true;
        return false;
      }
      case "accountSignUp":
        if (p.onboardingPath === "signIn") return true;
        if (isGuidedOnboardingAuthenticated(p, c)) return true;
        return false;
      case "region":
        if (skipSetupCardsForReturningSignIn(cardId, p, c)) return true;
        return isPrivacyRegionConfigured(p);
      case "healthConsent":
        if (skipSetupCardsForReturningSignIn(cardId, p, c)) return true;
        return p.privacyRegion !== "eea_uk" || p.healthDataConsent === true;
      case "cookies":
        if (skipSetupCardsForReturningSignIn(cardId, p, c)) return true;
        if (p.cookieConsent === true) return true;
        if (c.cookieConsentAccepted === true) return true;
        return false;
      case "sessionRecording": {
        if (skipSetupCardsForReturningSignIn(cardId, p, c)) return true;
        if (typeof p.sessionRecordingDisclosureAt === "string" && p.sessionRecordingDisclosureAt.length > 0) {
          return true;
        }
        const regionId = typeof p.privacyRegion === "string" && p.privacyRegion ? p.privacyRegion : "other";
        const resolved = resolvePolicyPack(regionId);
        const feat = resolved.features?.sessionRecording;
        if (!feat || feat.enabled === false) return true;
        return false;
      }
      case "aiDownload":
        if (skipSetupCardsForReturningSignIn(cardId, p, c)) return true;
        if (p.aiEnabled === false) return true;
        if (p.aiModelDownloadConsent === "granted" || p.aiModelDownloadConsent === "deferred") return true;
        return false;
      case "install":
        if (skipSetupCardsForReturningSignIn(cardId, p, c)) return true;
        if (c.platform !== "pwa") return true;
        if (c.installModalSeen === true) return true;
        if (c.standalonePwa === true) return true;
        return false;
      default:
        return true;
    }
  }
  function buildGuidedQuestionnaire(prefs, ctx) {
    return GUIDED_QUESTIONNAIRE_CARD_IDS.filter((id) => !shouldSkipGuidedCard(id, prefs, ctx)).map((id) => {
      const meta = GUIDED_CARD_META[id];
      return {
        id,
        kind: meta.kind,
        titleKey: meta.titleKey,
        bodyKey: meta.bodyKey,
        illustration: meta.illustration,
        settingsHintKey: meta.settingsHintKey,
        choices: meta.choices ? [...meta.choices] : void 0
      };
    });
  }
  function applyQuestionnaireAnswer(prefs, cardId, choiceId, extra = {}) {
    const p = prefs && typeof prefs === "object" ? { ...prefs } : {};
    const now = (/* @__PURE__ */ new Date()).toISOString();
    switch (cardId) {
      case "welcome":
        if (choiceId === "signIn") return { ...p, onboardingPath: "signIn" };
        if (choiceId === "setUp") return { ...p, onboardingPath: "setup" };
        return p;
      case "appearance": {
        if (choiceId !== "continue") return p;
        const appearanceMode = extra.appearanceMode === "light" ? "light" : "dark";
        const themeCandidates = ["mint", "red-black", "mono", "rainbow"];
        const globalTheme = typeof extra.globalTheme === "string" && themeCandidates.includes(extra.globalTheme) ? extra.globalTheme : "mint";
        return {
          ...p,
          appearanceMode,
          globalTheme,
          team: globalTheme,
          appearanceOnboardingAt: now
        };
      }
      case "avatarPick": {
        if (choiceId !== "continue" && choiceId !== "skip") return p;
        const avatar = typeof extra.profileAvatar === "string" && extra.profileAvatar.trim() ? extra.profileAvatar.trim() : p.profileAvatar;
        return {
          ...p,
          profileAvatar: avatar || p.profileAvatar || "voidorb",
          avatarPickAt: choiceId === "continue" ? now : p.avatarPickAt
        };
      }
      case "signIn":
        if (choiceId === "setUpInstead") return { ...p, onboardingPath: "setup" };
        return p;
      case "accountSignUp":
        return p;
      case "region": {
        if (choiceId !== "confirm" && choiceId !== "pickAnother") return p;
        const regionId = typeof extra.regionId === "string" && extra.regionId ? extra.regionId : p.privacyRegion;
        if (!regionId) return p;
        const packId = extra.policyPackId || p.policyAcknowledgedVersion || "v1.0.0";
        const withRegion = {
          ...p,
          privacyRegion: regionId,
          privacyRegionSource: "onboarding",
          privacyRegionUpdatedAt: now,
          policyAcknowledgedVersion: packId,
          policyAcknowledgedAt: now,
          uiLocaleSource: "onboarding"
        };
        return applyRegionDefaultLocale(withRegion, regionId, getPolicyPack());
      }
      case "coachTone":
        return {
          ...p,
          performance: {
            ...typeof p.performance === "object" && p.performance ? p.performance : {},
            llmCoachPersona: normalizeLlmCoachPersona(choiceId)
          },
          llmCoachPersona: normalizeLlmCoachPersona(choiceId)
        };
      case "helperLevel": {
        if (choiceId === "guideAlot") {
          return { ...p, aiEnabled: true, simpleMode: false };
        }
        if (choiceId === "keepSimple") {
          return { ...p, aiEnabled: true, simpleMode: true };
        }
        if (choiceId === "exploreMyself") {
          return { ...p, aiEnabled: false, simpleMode: false };
        }
        return p;
      }
      case "healthConsent":
        if (choiceId === "agree") {
          return { ...p, healthDataConsent: true, healthDataConsentAt: now };
        }
        if (choiceId === "notNow") {
          return { ...p, healthDataConsent: false, healthDataConsentAt: null };
        }
        return p;
      case "cookies":
        if (choiceId === "accept") {
          return { ...p, cookieConsent: true, cookieConsentAt: now };
        }
        if (choiceId === "decline") {
          return { ...p, cookieConsent: false, cookieConsentAt: null };
        }
        return p;
      case "sessionRecording": {
        const enabled = choiceId === "yes";
        return {
          ...p,
          sessionRecording: enabled,
          sessionRecordingAt: enabled ? now : null,
          sessionRecordingDisclosureAt: now
        };
      }
      case "aiDownload": {
        if (choiceId === "now") {
          return { ...p, aiModelDownloadConsent: "granted", aiModelDownloadConsentAt: now };
        }
        if (choiceId === "later") {
          return { ...p, aiModelDownloadConsent: "deferred" };
        }
        return p;
      }
      case "communityHelp":
        if (choiceId === "yes") {
          return { ...p, contributeAnonData: true, contributeAnonDataAt: now, useOpenData: true };
        }
        if (choiceId === "no") {
          return { ...p, contributeAnonData: false, contributeAnonDataAt: null, useOpenData: false };
        }
        return p;
      case "dailyNudge": {
        const reminderTime = typeof extra.reminderTime === "string" && extra.reminderTime ? extra.reminderTime : "09:00";
        const notifications = typeof p.notifications === "object" && p.notifications ? { ...p.notifications } : {};
        if (choiceId === "yes") {
          return {
            ...p,
            reminder: true,
            notifications: { ...notifications, enabled: true, dailyReminderTime: reminderTime }
          };
        }
        if (choiceId === "no") {
          return {
            ...p,
            reminder: false,
            notifications: { ...notifications, enabled: false }
          };
        }
        return p;
      }
      case "install":
        if (choiceId === "skip" || choiceId === "install") {
          return { ...p, installModalSeen: true };
        }
        return p;
      case "finish":
        if (choiceId === "quickTour") {
          return completeFirstRunWizard({ ...p, replayTutorial: true, tutorialSeen: false });
        }
        if (choiceId === "start") {
          return completeFirstRunWizard(p);
        }
        return p;
      default:
        return p;
    }
  }
  function resolveGuidedCardIndex(cards, cardId) {
    const idx = cards.findIndex((c) => c.id === cardId);
    return idx >= 0 ? idx : 0;
  }
  function resolveNextGuidedCardIndex(cards, answeredCardId) {
    const orderIdx = GUIDED_QUESTIONNAIRE_CARD_IDS.indexOf(answeredCardId);
    if (orderIdx < 0) return 0;
    for (let i = orderIdx + 1; i < GUIDED_QUESTIONNAIRE_CARD_IDS.length; i += 1) {
      const idx = cards.findIndex((c) => c.id === GUIDED_QUESTIONNAIRE_CARD_IDS[i]);
      if (idx >= 0) return idx;
    }
    return Math.max(cards.length - 1, 0);
  }
  function resolveGuidedCardProgress(cards, cardIndex) {
    const total = cards.length || 1;
    const current = Math.min(Math.max(cardIndex + 1, 1), total);
    return { current, total };
  }

  // packages/shared/src/onboarding/unifiedOnboardingProgress.mjs
  var TUTORIAL_SLIDE_ORDER_AI_ON = [0, 1, 8, 2, 3, 4, 5, 6, 7];
  var TUTORIAL_SLIDE_ORDER_AI_OFF = [0, 1, 8, 5, 7];
  function getTutorialVisibleIndices(aiEnabled) {
    return aiEnabled !== false ? [...TUTORIAL_SLIDE_ORDER_AI_ON] : [...TUTORIAL_SLIDE_ORDER_AI_OFF];
  }
  function buildInductionProgressSteps(prefs, ctx, options = {}) {
    const p = prefs && typeof prefs === "object" ? prefs : {};
    const indices = options.tutorialSlideIndices ?? getTutorialVisibleIndices(p.aiEnabled !== false);
    const regionConfigured = isPrivacyRegionConfigured(p);
    const regionId = regionConfigured ? String(p.privacyRegion) : "";
    const wizardIds = ["region"];
    if (!regionConfigured || regionId === "eea_uk") {
      wizardIds.push("healthConsent");
    }
    for (const id of ["cookies", "sessionRecording"]) {
      if (!shouldSkipFirstRunStep(id, p, ctx)) wizardIds.push(id);
    }
    if (p.tutorialSeen !== true) {
      wizardIds.push("tutorial");
    }
    for (const id of ["aiDownload", "install"]) {
      if (!shouldSkipFirstRunStep(id, p, ctx)) wizardIds.push(id);
    }
    const steps = [];
    for (const id of wizardIds) {
      if (id === "tutorial") {
        indices.forEach((slideIndex, tutorialPos) => {
          steps.push({ type: "tutorial", slideIndex, tutorialPos });
        });
      } else {
        steps.push({ type: "wizard", id });
      }
    }
    return steps;
  }
  function buildUnifiedOnboardingSteps(prefs, ctx, options = {}) {
    const plan = buildFirstRunPlan(prefs, ctx);
    const tutorialIndices = options.tutorialSlideIndices ?? getTutorialVisibleIndices(prefs?.aiEnabled !== false);
    const steps = [];
    for (const { id } of plan) {
      if (id === "tutorial") {
        tutorialIndices.forEach((slideIndex, tutorialPos) => {
          steps.push({ type: "tutorial", slideIndex, tutorialPos });
        });
      } else {
        steps.push({ type: "wizard", id });
      }
    }
    return steps;
  }
  function inductionStepsEqual(a, b) {
    if (a.type !== b.type) return false;
    if (a.type === "tutorial") return a.tutorialPos === b.tutorialPos;
    return a.id === b.id;
  }
  function mergeInductionSessionSteps(existing, next) {
    if (!existing.length) return next;
    if (next.length <= existing.length) return existing;
    const merged = [...existing];
    for (const step of next) {
      if (merged.some((s) => inductionStepsEqual(s, step))) continue;
      const anchorIdx = next.findIndex((s) => inductionStepsEqual(s, step));
      let insertAt = merged.length;
      for (let i = anchorIdx - 1; i >= 0; i -= 1) {
        const prev = next[i];
        const prevInMerged = merged.findIndex((s) => inductionStepsEqual(s, prev));
        if (prevInMerged >= 0) {
          insertAt = prevInMerged + 1;
          break;
        }
      }
      merged.splice(insertAt, 0, step);
    }
    return merged;
  }
  function resolveProgressFromSessionSteps(sessionSteps, state) {
    const { wizardStepId, tutorialPos = 0, sessionTotal } = state;
    const total = typeof sessionTotal === "number" && sessionTotal > 0 ? Math.max(sessionTotal, sessionSteps.length) : sessionSteps.length || 1;
    if (wizardStepId === "tutorial") {
      const idx2 = sessionSteps.findIndex(
        (s) => s.type === "tutorial" && s.tutorialPos === tutorialPos
      );
      return { current: idx2 >= 0 ? idx2 + 1 : 1, total };
    }
    const idx = sessionSteps.findIndex((s) => s.type === "wizard" && s.id === wizardStepId);
    return { current: idx >= 0 ? idx + 1 : 1, total };
  }
  function resolveUnifiedOnboardingProgress(state) {
    const {
      prefs,
      ctx,
      wizardStepId,
      tutorialPos = 0,
      tutorialSlideIndices,
      sessionTotal,
      sessionSteps
    } = state;
    if (sessionSteps && sessionSteps.length > 0) {
      return resolveProgressFromSessionSteps(sessionSteps, {
        wizardStepId,
        tutorialPos,
        sessionTotal
      });
    }
    const indices = tutorialSlideIndices ?? getTutorialVisibleIndices(prefs?.aiEnabled !== false);
    const steps = buildInductionProgressSteps(prefs, ctx, { tutorialSlideIndices: indices });
    return resolveProgressFromSessionSteps(steps, {
      wizardStepId,
      tutorialPos,
      sessionTotal
    });
  }
  function createOnboardingProgressSession(prefs, ctx, options = {}) {
    const indices = options.tutorialSlideIndices ?? getTutorialVisibleIndices(prefs?.aiEnabled !== false);
    let sessionSteps = buildInductionProgressSteps(prefs, ctx, { tutorialSlideIndices: indices });
    let sessionTotal = sessionSteps.length || 1;
    return {
      getTotal() {
        return sessionTotal;
      },
      refresh(prefsNext, ctxNext, tutorialSlideIndicesNext) {
        const idx = tutorialSlideIndicesNext ?? getTutorialVisibleIndices(prefsNext?.aiEnabled !== false);
        const nextSteps = buildInductionProgressSteps(prefsNext, ctxNext, { tutorialSlideIndices: idx });
        sessionSteps = mergeInductionSessionSteps(sessionSteps, nextSteps);
        sessionTotal = sessionSteps.length || 1;
        return sessionTotal;
      },
      resolve(state) {
        const tutorialSlideIndices = state.tutorialSlideIndices ?? getTutorialVisibleIndices(state.prefs?.aiEnabled !== false);
        this.refresh(state.prefs, state.ctx, tutorialSlideIndices);
        return resolveUnifiedOnboardingProgress({
          ...state,
          tutorialSlideIndices,
          sessionTotal,
          sessionSteps
        });
      }
    };
  }
  function mergeGuidedSessionCards(existing, next) {
    if (!existing.length) return next;
    if (next.length <= existing.length) return existing;
    const merged = [...existing];
    for (const card of next) {
      if (merged.some((c) => c.id === card.id)) continue;
      const anchorIdx = next.findIndex((c) => c.id === card.id);
      let insertAt = merged.length;
      for (let i = anchorIdx - 1; i >= 0; i -= 1) {
        const prev = next[i];
        const prevInMerged = merged.findIndex((c) => c.id === prev.id);
        if (prevInMerged >= 0) {
          insertAt = prevInMerged + 1;
          break;
        }
      }
      merged.splice(insertAt, 0, card);
    }
    return merged;
  }
  function buildGuidedOnboardingProgressSteps(prefs, ctx) {
    return buildGuidedQuestionnaire(prefs, ctx);
  }
  function createGuidedOnboardingProgressSession(prefs, ctx) {
    let sessionCards = buildGuidedQuestionnaire(prefs, ctx);
    let sessionTotal = sessionCards.length || 1;
    return {
      getTotal() {
        return sessionTotal;
      },
      getCards() {
        return sessionCards;
      },
      refresh(prefsNext, ctxNext) {
        const nextCards = buildGuidedQuestionnaire(prefsNext, ctxNext);
        sessionCards = mergeGuidedSessionCards(sessionCards, nextCards);
        sessionTotal = sessionCards.length || 1;
        return sessionTotal;
      },
      resolve(prefsNext, ctxNext, cardIndex) {
        this.refresh(prefsNext, ctxNext);
        return resolveGuidedCardProgress(sessionCards, cardIndex);
      }
    };
  }

  // packages/shared/src/achievements/achievements.mjs
  var ACHIEVEMENTS_STORAGE_KEY = "rianellAchievements";
  var LOGGING_ACHIEVEMENTS = [
    {
      id: "food_logging",
      category: "food",
      icon: "food",
      tier: "bronze",
      kind: "logging",
      i18nTitle: "achievements.food.title",
      i18nDescription: "achievements.food.description",
      i18nNotificationTitle: "achievements.food.notificationTitle",
      i18nNotificationBody: "achievements.food.notificationBody"
    },
    {
      id: "exercise_logging",
      category: "exercise",
      icon: "run",
      tier: "silver",
      kind: "logging",
      i18nTitle: "achievements.exercise.title",
      i18nDescription: "achievements.exercise.description",
      i18nNotificationTitle: "achievements.exercise.notificationTitle",
      i18nNotificationBody: "achievements.exercise.notificationBody"
    },
    {
      id: "medication_logging",
      category: "medications",
      icon: "pill",
      tier: "gold",
      kind: "logging",
      i18nTitle: "achievements.medication.title",
      i18nDescription: "achievements.medication.description",
      i18nNotificationTitle: "achievements.medication.notificationTitle",
      i18nNotificationBody: "achievements.medication.notificationBody"
    }
  ];
  var MILESTONE_ACHIEVEMENTS = [
    {
      id: "milestone_3",
      category: "milestone",
      icon: "calendar",
      tier: "bronze",
      kind: "milestone",
      requiredDays: 3,
      i18nTitle: "achievements.milestone3.title",
      i18nDescription: "achievements.milestone3.description",
      i18nNotificationTitle: "achievements.milestone3.notificationTitle",
      i18nNotificationBody: "achievements.milestone3.notificationBody"
    },
    {
      id: "milestone_30",
      category: "milestone",
      icon: "calendar",
      tier: "silver",
      kind: "milestone",
      requiredDays: 30,
      i18nTitle: "achievements.milestone30.title",
      i18nDescription: "achievements.milestone30.description",
      i18nNotificationTitle: "achievements.milestone30.notificationTitle",
      i18nNotificationBody: "achievements.milestone30.notificationBody"
    },
    {
      id: "milestone_60",
      category: "milestone",
      icon: "calendar",
      tier: "silver",
      kind: "milestone",
      requiredDays: 60,
      i18nTitle: "achievements.milestone60.title",
      i18nDescription: "achievements.milestone60.description",
      i18nNotificationTitle: "achievements.milestone60.notificationTitle",
      i18nNotificationBody: "achievements.milestone60.notificationBody"
    },
    {
      id: "milestone_90",
      category: "milestone",
      icon: "calendar",
      tier: "gold",
      kind: "milestone",
      requiredDays: 90,
      i18nTitle: "achievements.milestone90.title",
      i18nDescription: "achievements.milestone90.description",
      i18nNotificationTitle: "achievements.milestone90.notificationTitle",
      i18nNotificationBody: "achievements.milestone90.notificationBody"
    },
    {
      id: "milestone_180",
      category: "milestone",
      icon: "calendar",
      tier: "platinum",
      kind: "milestone",
      requiredDays: 180,
      i18nTitle: "achievements.milestone180.title",
      i18nDescription: "achievements.milestone180.description",
      i18nNotificationTitle: "achievements.milestone180.notificationTitle",
      i18nNotificationBody: "achievements.milestone180.notificationBody"
    }
  ];
  var ENGAGEMENT_ACHIEVEMENTS = [
    {
      id: "sleep_pioneer",
      category: "engagement",
      unlockCategory: "sleep",
      icon: "sleep",
      tier: "bronze",
      kind: "engagement",
      i18nTitle: "achievements.sleepPioneer.title",
      i18nDescription: "achievements.sleepPioneer.description",
      i18nNotificationTitle: "achievements.sleepPioneer.notificationTitle",
      i18nNotificationBody: "achievements.sleepPioneer.notificationBody"
    },
    {
      id: "cycle_tracker",
      category: "engagement",
      unlockCategory: "cycle",
      icon: "cycle",
      tier: "gold",
      kind: "engagement",
      i18nTitle: "achievements.cycleTracker.title",
      i18nDescription: "achievements.cycleTracker.description",
      i18nNotificationTitle: "achievements.cycleTracker.notificationTitle",
      i18nNotificationBody: "achievements.cycleTracker.notificationBody"
    },
    {
      id: "full_logger",
      category: "engagement",
      icon: "star",
      tier: "platinum",
      kind: "full_logger",
      i18nTitle: "achievements.fullLogger.title",
      i18nDescription: "achievements.fullLogger.description",
      i18nNotificationTitle: "achievements.fullLogger.notificationTitle",
      i18nNotificationBody: "achievements.fullLogger.notificationBody"
    }
  ];
  var ALL_ACHIEVEMENTS = [
    ...LOGGING_ACHIEVEMENTS,
    ...MILESTONE_ACHIEVEMENTS,
    ...ENGAGEMENT_ACHIEVEMENTS
  ];
  var ACHIEVEMENT_ID_SET = new Set(ALL_ACHIEVEMENTS.map((a) => a.id));
  function isKnownAchievementId(achievementId) {
    return ACHIEVEMENT_ID_SET.has(achievementId);
  }
  function getRequiredDaysForDef(def) {
    if (typeof def.requiredDays === "number") return def.requiredDays;
    if (def.kind === "full_logger") {
      return Math.max(...PROGRESSIVE_CATEGORIES.map((cat) => UNLOCK_DAYS[cat] ?? 0));
    }
    if (def.kind === "engagement" && def.unlockCategory) {
      return getUnlockDaysForCategory(def.unlockCategory);
    }
    if (def.kind === "logging") {
      return getUnlockDaysForCategory(def.category);
    }
    return 0;
  }
  function isAchievementUnlocked(def, profile, days) {
    if (def.kind === "milestone") {
      return days >= getRequiredDaysForDef(def);
    }
    if (def.kind === "full_logger") {
      return PROGRESSIVE_CATEGORIES.every((cat) => days >= (UNLOCK_DAYS[cat] ?? 0));
    }
    if (def.kind === "engagement" && def.unlockCategory) {
      return isLogCategoryUnlocked(profile, def.unlockCategory);
    }
    if (def.kind === "logging") {
      return isLogCategoryUnlocked(profile, def.category);
    }
    return false;
  }
  function getRequiredDaysForAchievement(achievementId) {
    const def = ALL_ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!def) return 0;
    return getRequiredDaysForDef(def);
  }
  function normalizePersistedEntry(value) {
    if (!value || typeof value !== "object") return {};
    const out = {};
    if (typeof value.notifiedAt === "string" && value.notifiedAt) out.notifiedAt = value.notifiedAt;
    if (typeof value.seenAt === "string" && value.seenAt) out.seenAt = value.seenAt;
    return out;
  }
  function normalizeAchievementState(value) {
    const raw = value && typeof value === "object" ? value : {};
    const achievements = {};
    for (const def of ALL_ACHIEVEMENTS) {
      achievements[def.id] = normalizePersistedEntry(raw[def.id] ?? raw.achievements?.[def.id]);
    }
    const updatedAt = typeof raw.updatedAt === "string" ? raw.updatedAt : null;
    return { achievements, updatedAt };
  }
  function computeAchievementSnapshots(profile, persisted = {}, now = /* @__PURE__ */ new Date()) {
    const normalized = normalizeAchievementState(persisted);
    const days = daysSinceTrackingProfileStart(profile);
    const snapshots = ALL_ACHIEVEMENTS.map((def) => {
      const requiredDays = getRequiredDaysForDef(def);
      const unlocked = isAchievementUnlocked(def, profile, days);
      const progress = requiredDays > 0 ? Math.min(1, days / requiredDays) : unlocked ? 1 : 0;
      const daysRemaining = unlocked ? 0 : Math.max(0, requiredDays - days);
      const entry = normalized.achievements[def.id] || {};
      return {
        id: def.id,
        category: def.category,
        icon: def.icon,
        tier: def.tier,
        kind: def.kind,
        i18nTitle: def.i18nTitle,
        i18nDescription: def.i18nDescription,
        i18nNotificationTitle: def.i18nNotificationTitle,
        i18nNotificationBody: def.i18nNotificationBody,
        requiredDays,
        daysElapsed: days,
        daysRemaining,
        progress,
        unlocked,
        notifiedAt: entry.notifiedAt ?? null,
        seenAt: entry.seenAt ?? null
      };
    });
    return { snapshots, daysSinceStart: days, updatedAt: normalized.updatedAt };
  }
  function pickLatestIso(a, b) {
    if (!a) return b || null;
    if (!b) return a || null;
    return Date.parse(a) >= Date.parse(b) ? a : b;
  }
  function mergeAchievementState(local, remote) {
    const loc = normalizeAchievementState(local);
    const rem = normalizeAchievementState(remote);
    const achievements = {};
    for (const def of ALL_ACHIEVEMENTS) {
      const l = loc.achievements[def.id] || {};
      const r = rem.achievements[def.id] || {};
      achievements[def.id] = {
        ...l.notifiedAt || r.notifiedAt ? { notifiedAt: pickLatestIso(l.notifiedAt, r.notifiedAt) } : {},
        ...l.seenAt || r.seenAt ? { seenAt: pickLatestIso(l.seenAt, r.seenAt) } : {}
      };
    }
    const localTs = loc.updatedAt ? Date.parse(loc.updatedAt) : 0;
    const remoteTs = rem.updatedAt ? Date.parse(rem.updatedAt) : 0;
    const updatedAt = remoteTs > localTs ? rem.updatedAt : loc.updatedAt || rem.updatedAt || (/* @__PURE__ */ new Date()).toISOString();
    return { achievements, updatedAt };
  }
  function detectNewlyUnlocked(prevSnapshots, nextSnapshots) {
    const prev = Array.isArray(prevSnapshots) ? prevSnapshots : [];
    const next = Array.isArray(nextSnapshots) ? nextSnapshots : [];
    const prevMap = new Map(prev.map((s) => [s.id, s]));
    return next.filter((s) => {
      if (!s.unlocked) return false;
      const was = prevMap.get(s.id);
      if (was?.unlocked) return false;
      if (s.notifiedAt) return false;
      return true;
    });
  }
  function markAchievementNotified(state, achievementId, iso = (/* @__PURE__ */ new Date()).toISOString()) {
    if (!isKnownAchievementId(achievementId)) return normalizeAchievementState(state);
    const normalized = normalizeAchievementState(state);
    const entry = { ...normalized.achievements[achievementId], notifiedAt: iso };
    return {
      achievements: { ...normalized.achievements, [achievementId]: entry },
      updatedAt: iso
    };
  }
  function markAchievementSeen(state, achievementId, iso = (/* @__PURE__ */ new Date()).toISOString()) {
    if (!isKnownAchievementId(achievementId)) return normalizeAchievementState(state);
    const normalized = normalizeAchievementState(state);
    const entry = { ...normalized.achievements[achievementId], seenAt: iso };
    return {
      achievements: { ...normalized.achievements, [achievementId]: entry },
      updatedAt: iso
    };
  }

  // packages/shared/src/achievements/achievementUnlockNotification.mjs
  var DEFAULT_STRINGS = {
    "achievements.food.notificationTitle": "Food logging unlocked",
    "achievements.food.notificationBody": "You can now log meals in the daily wizard.",
    "achievements.exercise.notificationTitle": "Exercise logging unlocked",
    "achievements.exercise.notificationBody": "You can now log activity in the daily wizard.",
    "achievements.medication.notificationTitle": "Medication logging unlocked",
    "achievements.medication.notificationBody": "You can now log medications in the daily wizard.",
    "achievements.milestone3.notificationTitle": "3-day streak",
    "achievements.milestone3.notificationBody": "You have tracked for three days. Keep going!",
    "achievements.milestone30.notificationTitle": "30-day milestone",
    "achievements.milestone30.notificationBody": "A full month of consistent tracking.",
    "achievements.milestone60.notificationTitle": "60-day milestone",
    "achievements.milestone60.notificationBody": "Two months of dedication to your health.",
    "achievements.milestone90.notificationTitle": "Dedicated tracker",
    "achievements.milestone90.notificationBody": "Ninety days of consistent tracking.",
    "achievements.milestone180.notificationTitle": "Half-year journey",
    "achievements.milestone180.notificationBody": "Six months of tracking your health.",
    "achievements.sleepPioneer.notificationTitle": "Sleep pioneer",
    "achievements.sleepPioneer.notificationBody": "Sleep logging is now available.",
    "achievements.cycleTracker.notificationTitle": "Cycle tracker",
    "achievements.cycleTracker.notificationBody": "Cycle logging is now available.",
    "achievements.fullLogger.notificationTitle": "Full logger",
    "achievements.fullLogger.notificationBody": "Every logging category is unlocked."
  };
  function shouldFireAchievementUnlockNotification(snapshot2, opts = {}) {
    if (opts.notificationsEnabled === false) return { fire: false, reason: "disabled" };
    if (!snapshot2?.unlocked) return { fire: false, reason: "locked" };
    if (snapshot2.notifiedAt) return { fire: false, reason: "already-notified" };
    return { fire: true, reason: "new-unlock", achievementId: snapshot2.id };
  }
  function buildAchievementUnlockNotificationContent(achievementId, t2) {
    const def = ALL_ACHIEVEMENTS.find((a) => a.id === achievementId);
    const translate = typeof t2 === "function" ? t2 : (key) => DEFAULT_STRINGS[key] || key;
    if (!def) {
      return {
        title: translate("achievements.notification.title"),
        body: translate("achievements.notification.body"),
        url: "/?quick=true",
        achievementId
      };
    }
    return {
      title: translate(def.i18nNotificationTitle),
      body: translate(def.i18nNotificationBody),
      url: "/?quick=true",
      achievementId: def.id
    };
  }

  // packages/shared/src/achievements/achievementToastQueue.mjs
  var queue = [];
  var showing = false;
  var presenter = null;
  function registerAchievementToastPresenter(fn) {
    presenter = fn;
    if (fn) drainQueue();
  }
  function drainQueue() {
    if (!presenter || showing || !queue.length) return;
    showing = true;
    const item = queue.shift();
    if (item) presenter(item);
  }
  function enqueueAchievementToast(item) {
    if (!item?.id) return;
    queue.push({
      id: String(item.id),
      title: String(item.title || ""),
      body: String(item.body || "")
    });
    drainQueue();
  }
  function markAchievementToastDismissed() {
    showing = false;
    drainQueue();
  }
  function getAchievementToastQueueLength() {
    return queue.length;
  }
  function isAchievementToastShowing() {
    return showing;
  }
  function resetAchievementToastQueue() {
    queue = [];
    showing = false;
    presenter = null;
  }

  // packages/shared/src/crypto/keyManagement.mjs
  var PBKDF2_ITERATIONS = 31e4;
  function getSubtle2() {
    if (typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.subtle) {
      return globalThis.crypto.subtle;
    }
    throw new Error("Web Crypto unavailable");
  }
  function randomBytes2(length) {
    const buf = new Uint8Array(length);
    if (typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.getRandomValues) {
      globalThis.crypto.getRandomValues(buf);
    }
    return buf;
  }
  function bytesToBase642(bytes) {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(bytes).toString("base64");
    }
    let binary = "";
    const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
    return btoa(binary);
  }
  function base64ToBytes2(b64) {
    if (typeof Buffer !== "undefined") {
      return new Uint8Array(Buffer.from(String(b64 || ""), "base64"));
    }
    const binary = atob(String(b64 || ""));
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  }
  async function deriveWrappingKey(passphrase, salt) {
    const subtle = getSubtle2();
    const enc = new TextEncoder();
    const baseKey = await subtle.importKey("raw", enc.encode(String(passphrase || "")), "PBKDF2", false, ["deriveKey"]);
    return subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
      baseKey,
      { name: "AES-KW", length: 256 },
      false,
      ["wrapKey", "unwrapKey"]
    );
  }
  async function generateDek() {
    const subtle = getSubtle2();
    return subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  }
  async function wrapDek(dek, wrappingKey) {
    const subtle = getSubtle2();
    const wrapped = await subtle.wrapKey("raw", dek, wrappingKey, "AES-KW");
    return wrapped;
  }
  async function unwrapDek(wrappedDek, wrappingKey) {
    const subtle = getSubtle2();
    return subtle.unwrapKey("raw", wrappedDek, wrappingKey, "AES-KW", { name: "AES-GCM", length: 256 }, true, [
      "encrypt",
      "decrypt"
    ]);
  }
  async function encryptData(plaintext, dek) {
    const subtle = getSubtle2();
    const iv = randomBytes2(12);
    const enc = new TextEncoder();
    const ciphertext = await subtle.encrypt({ name: "AES-GCM", iv }, dek, enc.encode(String(plaintext ?? "")));
    return { ciphertext: bytesToBase642(new Uint8Array(ciphertext)), iv: bytesToBase642(iv) };
  }
  async function decryptData(ciphertextB64, ivB64, dek) {
    const subtle = getSubtle2();
    const iv = base64ToBytes2(ivB64);
    const ciphertext = base64ToBytes2(ciphertextB64);
    const plainBuf = await subtle.decrypt({ name: "AES-GCM", iv }, dek, ciphertext);
    return new TextDecoder().decode(plainBuf);
  }
  function generateSalt(bytes = 16) {
    return randomBytes2(bytes);
  }
  function saltToBase64(salt) {
    return bytesToBase642(salt);
  }
  function base64ToSalt(b64) {
    return base64ToBytes2(b64);
  }
  function wrappedDekToBase64(buf) {
    return bytesToBase642(new Uint8Array(buf));
  }
  function base64ToWrappedDek(b64) {
    return base64ToBytes2(b64).buffer;
  }

  // packages/shared/src/nutrition/fodmap.mjs
  var FODMAP_CATEGORIES = {
    apple: "high",
    apricot: "high",
    avocado: "low",
    banana: "low",
    blackberry: "high",
    blueberry: "low",
    bread: "high",
    broccoli: "low",
    cabbage: "high",
    carrot: "low",
    cauliflower: "high",
    celery: "low",
    cheese: "low",
    chickpea: "high",
    chocolate: "moderate",
    coconut: "low",
    corn: "low",
    couscous: "high",
    cucumber: "low",
    garlic: "high",
    grape: "low",
    honey: "high",
    hummus: "high",
    lactose: "high",
    lentil: "high",
    mango: "high",
    milk: "high",
    mushroom: "high",
    oat: "low",
    onion: "high",
    orange: "low",
    pasta: "high",
    peach: "high",
    pear: "high",
    pineapple: "low",
    potato: "low",
    rice: "low",
    rye: "high",
    spinach: "low",
    strawberry: "low",
    tomato: "low",
    watermelon: "high",
    wheat: "high",
    yogurt: "moderate",
    beans: "high",
    cashew: "high",
    almond: "low",
    pistachio: "high",
    sausage: "high",
    soy: "moderate",
    tofu: "low",
    beer: "high",
    coffee: "low",
    tea: "low"
  };
  var KEYWORD_MAP = Object.entries(FODMAP_CATEGORIES).flatMap(([key, status]) => {
    return [{ pattern: key, status }];
  });
  function normalizeFoodName(name) {
    return String(name || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  }
  function getFodmapStatus(foodName) {
    const norm = normalizeFoodName(foodName);
    if (!norm) return "unknown";
    if (FODMAP_CATEGORIES[norm]) return FODMAP_CATEGORIES[norm];
    for (const { pattern, status } of KEYWORD_MAP) {
      if (norm.includes(pattern)) return status;
    }
    const first = norm.split(" ")[0];
    if (FODMAP_CATEGORIES[first]) return FODMAP_CATEGORIES[first];
    return "unknown";
  }
  function getFodmapWarning(status) {
    switch (status) {
      case "high":
        return "wizard.food.fodmap.high";
      case "moderate":
        return "wizard.food.fodmap.moderate";
      case "low":
        return "wizard.food.fodmap.low";
      default:
        return "";
    }
  }
  function countHighFodmapDays(logs) {
    if (!Array.isArray(logs)) return 0;
    let days = 0;
    for (const log of logs) {
      const foods = collectFoodNames(log);
      if (foods.some((f) => getFodmapStatus(f) === "high")) days += 1;
    }
    return days;
  }
  function collectFoodNames(log) {
    const names = [];
    const food = log?.food;
    if (!food || typeof food !== "object") return names;
    for (const meal of ["breakfast", "lunch", "dinner", "snack"]) {
      const items = food[meal];
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        if (typeof item === "string") names.push(item);
        else if (item && typeof item.name === "string") names.push(item.name);
      }
    }
    return names;
  }

  // packages/shared/src/nutrition/macroBreakdown.mjs
  function calculateMacrosForServing(food, servingGrams = 100) {
    const g = Math.max(0, Number(servingGrams) || 100);
    const factor = g / 100;
    const n = food?.nutrients && typeof food.nutrients === "object" ? food.nutrients : {};
    const protein_g = round1((n.proteins_g ?? 0) * factor);
    const carbs_g = round1((n.carbohydrates_g ?? 0) * factor);
    const fat_g = round1((n.fat_g ?? 0) * factor);
    const fiber_g = round1((n.fiber_g ?? 0) * factor);
    const kcalFromNutrients = (n.energy_kcal ?? 0) * factor;
    const kcalFromMacros = protein_g * 4 + carbs_g * 4 + fat_g * 9;
    const kcal = round1(kcalFromNutrients > 0 ? kcalFromNutrients : kcalFromMacros);
    return { kcal, protein_g, carbs_g, fat_g, fiber_g };
  }
  function macroPercentages(macros) {
    const p = (macros?.protein_g ?? 0) * 4;
    const c = (macros?.carbs_g ?? 0) * 4;
    const f = (macros?.fat_g ?? 0) * 9;
    const total = p + c + f;
    if (total <= 0) return { protein: 0, carbs: 0, fat: 0 };
    return {
      protein: Math.round(p / total * 100),
      carbs: Math.round(c / total * 100),
      fat: Math.round(f / total * 100)
    };
  }
  function aggregateDailyMacros(log) {
    const totals = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
    const food = log?.food;
    if (!food || typeof food !== "object") return totals;
    for (const meal of ["breakfast", "lunch", "dinner", "snack"]) {
      const items = food[meal];
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        if (!item || typeof item !== "object" || !item.macros) continue;
        const m = item.macros;
        totals.kcal += Number(m.kcal) || 0;
        totals.protein_g += Number(m.protein_g) || 0;
        totals.carbs_g += Number(m.carbs_g) || 0;
        totals.fat_g += Number(m.fat_g) || 0;
        totals.fiber_g += Number(m.fiber_g) || 0;
      }
    }
    return {
      kcal: round1(totals.kcal),
      protein_g: round1(totals.protein_g),
      carbs_g: round1(totals.carbs_g),
      fat_g: round1(totals.fat_g),
      fiber_g: round1(totals.fiber_g)
    };
  }
  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  // packages/shared/src/nutrition/mealPhoto.mjs
  var MEAL_PHOTO_CATEGORY = "food";
  var MEAL_PHOTO_BUCKET = "health-photos";
  function buildMealPhotoMetadata(extra = {}) {
    return {
      category: MEAL_PHOTO_CATEGORY,
      ...extra
    };
  }
  var MEAL_PHOTO_ACCEPT = "image/*";
  function isMealPhoto(attachment) {
    if (!attachment || typeof attachment !== "object") return false;
    return attachment.category === MEAL_PHOTO_CATEGORY || attachment.tag === MEAL_PHOTO_CATEGORY;
  }

  // packages/shared/src/api/apiKeys.mjs
  var KEY_PREFIX = "rn_live_";
  var KEY_HEX_LEN = 32;
  function generateRawApiKey(randomBytes3 = crypto.getRandomValues(new Uint8Array(KEY_HEX_LEN / 2))) {
    const hex = Array.from(randomBytes3, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${KEY_PREFIX}${hex}`;
  }
  function apiKeyDisplayPrefix(rawKey) {
    const s = String(rawKey || "");
    if (!s.startsWith(KEY_PREFIX)) return s.slice(0, 12);
    return `${s.slice(0, KEY_PREFIX.length + 8)}\u2026`;
  }
  async function hashApiKey(rawKey) {
    const data = new TextEncoder().encode(String(rawKey || ""));
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  }
  var DEFAULT_API_SCOPES = ["logs:read"];
  var WEBHOOK_EVENTS = ["log.created", "flare.detected", "goal.achieved", "sync.completed", "export.created"];
  function isValidWebhookUrl(url) {
    try {
      const u = new URL(String(url || ""));
      return u.protocol === "https:";
    } catch {
      return false;
    }
  }

  // packages/shared/src/api/webhooks.mjs
  function buildWebhookInvokePayload({ event, logDate, userId }) {
    return {
      event: String(event || "log.created"),
      log_date: String(logDate || ""),
      user_id: String(userId || ""),
      ts: Date.now()
    };
  }
  async function invokeDeliverWebhook(supabase, payload) {
    if (!supabase || typeof supabase.functions?.invoke !== "function") return;
    try {
      await supabase.functions.invoke("deliver-webhook", { body: payload });
    } catch {
    }
  }

  // packages/shared/src/connectors/oauth2.mjs
  var OAUTH2_SCOPES = ["logs:read", "metrics:read", "goals:read", "profile:read", "logs:write"];
  function generateCodeVerifier() {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return base64UrlEncode(bytes);
  }
  async function deriveCodeChallenge(verifier) {
    const data = new TextEncoder().encode(String(verifier || ""));
    const digest = await crypto.subtle.digest("SHA-256", data);
    return base64UrlEncode(new Uint8Array(digest));
  }
  function base64UrlEncode(bytes) {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(bytes).toString("base64url");
    }
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function buildAuthorizeUrl(baseUrl, params) {
    const u = new URL(`${String(baseUrl || "").replace(/\/$/, "")}/oauth2-authorize`);
    u.searchParams.set("client_id", params.clientId);
    u.searchParams.set("redirect_uri", params.redirectUri);
    u.searchParams.set("response_type", "code");
    u.searchParams.set("scope", (params.scopes || ["logs:read"]).join(" "));
    u.searchParams.set("code_challenge", params.codeChallenge);
    u.searchParams.set("code_challenge_method", "S256");
    if (params.state) u.searchParams.set("state", params.state);
    return u.toString();
  }
  var CONNECTOR_PROVIDERS = {
    "google-sheets": { id: "google-sheets", label: "Google Sheets", oauth: true },
    withings: { id: "withings", label: "Withings", oauth: true },
    strava: { id: "strava", label: "Strava", oauth: true },
    health_connect: { id: "health_connect", label: "Health Connect", oauth: false, platform: "android" },
    fhir_import: { id: "fhir_import", label: "FHIR Import", oauth: false }
  };

  // packages/shared/src/connectors/providers.mjs
  var CONNECTOR_PROVIDER_SPECS = {
    strava: {
      id: "strava",
      label: "Strava",
      oauth: true,
      authUrl: "https://www.strava.com/oauth/authorize",
      tokenUrl: "https://www.strava.com/oauth/token",
      scopes: ["activity:read_all"],
      syncMode: "import"
    },
    withings: {
      id: "withings",
      label: "Withings",
      oauth: true,
      authUrl: "https://account.withings.com/oauth2_user/authorize2",
      tokenUrl: "https://wbsapi.withings.net/v2/oauth2",
      scopes: ["user.metrics", "user.activity"],
      syncMode: "import"
    },
    "google-sheets": {
      id: "google-sheets",
      label: "Google Sheets",
      oauth: true,
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      syncMode: "bidirectional"
    },
    health_connect: {
      id: "health_connect",
      label: "Health Connect",
      oauth: false,
      platform: "android",
      syncMode: "import"
    },
    fhir_import: {
      id: "fhir_import",
      label: "FHIR Import",
      oauth: false,
      syncMode: "import"
    }
  };
  var OAUTH_CONNECTOR_IDS = ["strava", "withings", "google-sheets"];
  function getConnectorProvider(id) {
    return CONNECTOR_PROVIDER_SPECS[id] || null;
  }
  function listOAuthConnectors() {
    return OAUTH_CONNECTOR_IDS.map((id) => CONNECTOR_PROVIDER_SPECS[id]).filter(Boolean);
  }
  function listConnectorsForPlatform(platform) {
    return Object.values(CONNECTOR_PROVIDER_SPECS).filter((c) => !c.platform || c.platform === platform);
  }
  function parseGoogleSheetId(input) {
    const raw = String(input || "").trim();
    if (!raw) return "";
    if (/^[a-zA-Z0-9_-]{20,}$/.test(raw)) return raw;
    const m = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    return m ? m[1] : "";
  }

  // packages/shared/src/connectors/strava.mjs
  function activityDate(activity) {
    const raw = activity.start_date_local || activity.start_date || "";
    return String(raw).slice(0, 10);
  }
  function mapStravaActivitiesToPartialLogs(activities) {
    const byDate = /* @__PURE__ */ new Map();
    for (const act of activities || []) {
      const date = activityDate(act);
      if (!date || date.length < 10) continue;
      const name = String(act.name || act.type || "Activity").slice(0, 120);
      const seconds = Number(act.moving_time ?? act.elapsed_time ?? 0);
      const duration = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds / 60)) : 0;
      const exercise = { name, duration };
      const existing = byDate.get(date) || { date, exercise: [] };
      existing.exercise = [...existing.exercise || [], exercise];
      byDate.set(date, existing);
    }
    return [...byDate.values()];
  }

  // packages/shared/src/connectors/withings.mjs
  var TYPE_WEIGHT = 1;
  var TYPE_BPM = 11;
  var TYPE_SLEEP = 38;
  function toDateFromUnix(ts) {
    const n = Number(ts);
    if (!Number.isFinite(n) || n <= 0) return "";
    return new Date(n * 1e3).toISOString().slice(0, 10);
  }
  function pickMeasureValue(measures, type) {
    for (const m of measures || []) {
      if (Number(m.type) !== type) continue;
      const value = Number(m.value);
      const unit = Number(m.unit ?? 0);
      if (!Number.isFinite(value)) continue;
      return value * Math.pow(10, unit);
    }
    return null;
  }
  function mapWithingsMeasuresToPartialLogs(groups) {
    const byDate = /* @__PURE__ */ new Map();
    for (const group of groups || []) {
      const date = toDateFromUnix(group.date ?? group.startdate ?? group.created);
      if (!date) continue;
      const measures = group.measures || group.data || [];
      const partial = byDate.get(date) || { date };
      const weight = pickMeasureValue(measures, TYPE_WEIGHT);
      const bpm = pickMeasureValue(measures, TYPE_BPM);
      const sleepHours = pickMeasureValue(measures, TYPE_SLEEP);
      if (weight != null) partial.weight = String(Math.round(weight * 10) / 10);
      if (bpm != null) partial.bpm = Math.round(bpm);
      if (sleepHours != null) partial.sleep = Math.round(sleepHours * 10) / 10;
      byDate.set(date, partial);
    }
    return [...byDate.values()];
  }
  function mapWithingsActivityToPartialLogs(activities) {
    const byDate = /* @__PURE__ */ new Map();
    for (const row of activities || []) {
      const date = String(row.date || "").slice(0, 10);
      if (!date) continue;
      const partial = byDate.get(date) || { date };
      const steps = Number(row.steps ?? row.data?.steps);
      if (Number.isFinite(steps) && steps > 0) partial.steps = Math.round(steps);
      byDate.set(date, partial);
    }
    return [...byDate.values()];
  }
  function mergeWithingsPartialLogs(...lists) {
    const byDate = /* @__PURE__ */ new Map();
    for (const list of lists) {
      for (const entry of list || []) {
        const date = entry.date;
        if (!date) continue;
        byDate.set(date, { ...byDate.get(date) || {}, ...entry, date });
      }
    }
    return [...byDate.values()];
  }

  // packages/shared/src/connectors/googleSheets.mjs
  var DEFAULT_SHEET_COLUMN_MAP = Object.fromEntries(
    LOG_CSV_FIELD_IDS.map((id) => [id.toLowerCase(), id])
  );
  function normalizeHeader(h) {
    return String(h || "").trim().toLowerCase().replace(/\s+/g, "");
  }
  function cellToFieldValue(fieldId, raw) {
    const v = String(raw ?? "").trim();
    if (!v) return void 0;
    if (fieldId === "date") return v.slice(0, 10);
    if (fieldId === "bpm" || fieldId === "fatigue" || fieldId === "sleep") {
      const n = Number(v);
      return Number.isFinite(n) ? n : void 0;
    }
    return v;
  }
  function rowsToPartialLogs(rows, columnMap = DEFAULT_SHEET_COLUMN_MAP) {
    if (!Array.isArray(rows) || rows.length < 2) return [];
    const headers = (rows[0] || []).map(normalizeHeader);
    const fieldByCol = headers.map((h) => columnMap[h] || columnMap[h.replace(/_/g, "")] || null);
    const out = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r] || [];
      const partial = {};
      fieldByCol.forEach((fieldId, i) => {
        if (!fieldId) return;
        const val = cellToFieldValue(fieldId, row[i]);
        if (val !== void 0 && val !== "") partial[fieldId] = val;
      });
      if (partial.date) out.push(partial);
    }
    return out.slice(0, 500);
  }
  function partialLogsToRows(logs, fieldIds = LOG_CSV_FIELD_IDS) {
    const header = [...fieldIds];
    const body = (logs || []).slice(0, 500).map(
      (log) => fieldIds.map((id) => {
        const v = log[id];
        if (v == null) return "";
        return String(v);
      })
    );
    return [header, ...body];
  }
  function mergeSheetRoundTrip(logs) {
    const rows = partialLogsToRows(logs);
    return rowsToPartialLogs(rows);
  }

  // packages/shared/src/connectors/oauthState.mjs
  function base64UrlEncode2(bytes) {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(bytes).toString("base64url");
    }
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function base64UrlDecode(str) {
    if (typeof Buffer !== "undefined") {
      return new Uint8Array(Buffer.from(String(str || ""), "base64url"));
    }
    const padded = String(str || "").replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(padded);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  async function importHmacKey(secret) {
    const raw = new TextEncoder().encode(String(secret || ""));
    return crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  }
  async function createOAuthState({ userId, provider, secret, ttlSec = 600 }) {
    const payload = {
      userId: String(userId),
      provider: String(provider),
      nonce: crypto.randomUUID(),
      exp: Math.floor(Date.now() / 1e3) + ttlSec
    };
    const key = await importHmacKey(secret);
    const data = new TextEncoder().encode(JSON.stringify(payload));
    const sig = await crypto.subtle.sign("HMAC", key, data);
    return `${base64UrlEncode2(data)}.${base64UrlEncode2(new Uint8Array(sig))}`;
  }
  async function verifyOAuthState(state, secret) {
    const parts = String(state || "").split(".");
    if (parts.length !== 2) return null;
    const data = base64UrlDecode(parts[0]);
    const sig = base64UrlDecode(parts[1]);
    const key = await importHmacKey(secret);
    const ok = await crypto.subtle.verify("HMAC", key, sig, data);
    if (!ok) return null;
    let payload;
    try {
      payload = JSON.parse(new TextDecoder().decode(data));
    } catch {
      return null;
    }
    if (!payload || payload.exp < Math.floor(Date.now() / 1e3)) return null;
    return payload;
  }

  // packages/shared/src/fhir/loincMap.mjs
  var LOINC_MAP = {
    mood: "72133-2",
    pain: "38208-5",
    fatigue: "72514-3",
    sleep_hours: "93832-4",
    weight: "29463-7",
    blood_pressure_systolic: "8480-6",
    blood_pressure_diastolic: "8462-4",
    blood_glucose: "15074-8",
    spO2: "59408-5",
    hrv: "80404-7"
  };
  var LOINC_TO_FIELD = Object.fromEntries(
    Object.entries(LOINC_MAP).map(([field, code]) => [code, field])
  );
  function loincForField(field) {
    return LOINC_MAP[field] || null;
  }
  function fieldForLoinc(code) {
    return LOINC_TO_FIELD[String(code || "")] || null;
  }
  function buildFhirObservation({ patientId, field, value, unit, effectiveDate }) {
    const code = loincForField(field);
    if (!code) return null;
    return {
      resourceType: "Observation",
      status: "final",
      subject: { reference: `Patient/${patientId}` },
      code: {
        coding: [{ system: "http://loinc.org", code, display: field }]
      },
      effectiveDateTime: effectiveDate,
      valueQuantity: value != null ? { value: Number(value), unit: unit || "1" } : void 0
    };
  }

  // packages/shared/src/fhir/hl7Parser.mjs
  function parseORU(message) {
    const text = String(message || "").trim();
    if (!text) return [];
    const segments = text.split(/\r\n|\r|\n/).map((s) => s.trim()).filter(Boolean);
    const results = [];
    let observedAt = "";
    for (const seg of segments) {
      const fields = seg.split("|");
      const type = fields[0];
      if (type === "OBR" && fields[7]) observedAt = fields[7];
      if (type === "OBX") {
        const testName = (fields[3] || "").split("^")[1] || fields[3] || "";
        results.push({
          testName: testName.trim(),
          value: (fields[5] || "").trim(),
          units: (fields[6] || "").trim(),
          referenceRange: (fields[7] || "").trim(),
          observedAt: (fields[14] || observedAt || "").trim()
        });
      }
    }
    return results;
  }
  function mapLabResultsToLogFields(labResults) {
    const out = {};
    for (const r of labResults) {
      const name = r.testName.toLowerCase();
      const val = parseFloat(r.value);
      if (!Number.isFinite(val)) continue;
      if (name.includes("glucose")) out.bloodGlucose = val;
      else if (name.includes("weight")) out.weight = val;
      else if (name.includes("systolic")) out.bloodPressureSystolic = val;
      else if (name.includes("diastolic")) out.bloodPressureDiastolic = val;
    }
    return out;
  }

  // packages/shared/src/community/communityTips.mjs
  var COMMUNITY_TIP_CATEGORIES = ["trigger", "treatment", "lifestyle", "general"];
  var TIP_MAX_LENGTH = 500;
  var TIP_MIN_UPVOTES_VISIBLE = 20;
  function validateTipSubmission({ content, conditionTag, category }) {
    const errors = [];
    if (!conditionTag || typeof conditionTag !== "string") errors.push("condition_required");
    if (!COMMUNITY_TIP_CATEGORIES.includes(category)) errors.push("invalid_category");
    const text = typeof content === "string" ? content.trim() : "";
    if (!text) errors.push("content_required");
    if (text.length > TIP_MAX_LENGTH) errors.push("content_too_long");
    return { ok: errors.length === 0, errors, content: text };
  }
  function formatCommunityTip(tip) {
    if (!tip || typeof tip !== "object") return null;
    return {
      id: tip.id,
      conditionTag: tip.condition_tag || tip.conditionTag,
      category: tip.category,
      content: tip.content,
      upvotes: typeof tip.upvotes === "number" ? tip.upvotes : 0,
      showUpvotes: (tip.upvotes || 0) >= TIP_MIN_UPVOTES_VISIBLE,
      approved: tip.approved === true
    };
  }

  // packages/shared/src/community/cohortInsights.mjs
  var COHORT_MIN_K = 5;
  function buildCohortBenchmarkCard(poolInsights, condition) {
    if (!poolInsights || typeof poolInsights !== "object") {
      return { visible: false, reason: "no_data" };
    }
    const n = poolInsights.contributor_count ?? poolInsights.contributorCount ?? 0;
    if (n < COHORT_MIN_K) {
      return { visible: false, reason: "k_anon_suppressed", contributorCount: n };
    }
    return {
      visible: true,
      condition: condition || poolInsights.condition_tag || "your condition",
      contributorCount: n,
      metrics: [
        { key: "sleep", label: "average sleep", value: poolInsights.avg_sleep_hours, unit: "h" },
        { key: "pain", label: "average pain on flare days", value: poolInsights.avg_pain_flare, unit: "/10" },
        { key: "fatigue", label: "average fatigue", value: poolInsights.avg_fatigue, unit: "/10" }
      ].filter((m) => m.value != null)
    };
  }

  // packages/shared/src/community/communityTriggers.mjs
  function normalizeTriggerRow(row) {
    if (!row || typeof row !== "object") return null;
    return {
      id: row.id,
      conditionTag: row.condition_tag || row.conditionTag,
      triggerName: row.trigger_name || row.triggerName,
      triggerCategory: row.trigger_category || row.triggerCategory,
      contributorCount: row.contributor_count ?? row.contributorCount ?? 0,
      approved: row.approved === true
    };
  }
  function getCommunityTriggers(rows, conditionTag) {
    const list = Array.isArray(rows) ? rows : [];
    return list.map(normalizeTriggerRow).filter(Boolean).filter((t2) => !conditionTag || t2.conditionTag === conditionTag).filter((t2) => t2.approved && t2.contributorCount >= COHORT_MIN_K).sort((a, b) => b.contributorCount - a.contributorCount);
  }

  // packages/shared/src/metrics/sliderWellness.mjs
  var METRICS_HIGHER_IS_BETTER = Object.freeze([
    "sleep",
    "mobility",
    "dailyFunction",
    "mood"
  ]);
  var METRIC_SLIDER_FIELDS = Object.freeze([
    "fatigue",
    "stiffness",
    "jointPain",
    "mobility",
    "swelling",
    "sleep",
    "mood",
    "irritability",
    "weatherSensitivity",
    "dailyFunction",
    "backPain"
  ]);
  var SLIDER_MIN = 1;
  var SLIDER_MAX = 10;
  function clampInt2(raw, min, max) {
    const n = typeof raw === "number" ? raw : parseInt(String(raw ?? ""), 10);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, Math.round(n)));
  }
  function isMetricHigherIsBetter(field) {
    return METRICS_HIGHER_IS_BETTER.includes(field);
  }
  function rawToWellnessSlider(field, raw) {
    const value = clampInt2(raw, SLIDER_MIN, SLIDER_MAX);
    return isMetricHigherIsBetter(field) ? value : SLIDER_MAX + SLIDER_MIN - value;
  }
  function wellnessSliderToRaw(field, wellness) {
    const score = clampInt2(wellness, SLIDER_MIN, SLIDER_MAX);
    return isMetricHigherIsBetter(field) ? score : SLIDER_MAX + SLIDER_MIN - score;
  }
  function classifyWellnessSlider(wellness, t2 = (k, fb) => fb) {
    const v = clampInt2(wellness, SLIDER_MIN, SLIDER_MAX);
    if (v >= 8) return { id: "good", color: "#7bdf8c", label: t2("common.good", "Good") };
    if (v >= 4) return { id: "moderate", color: "#ffb74d", label: t2("wizard.lifestyle.steps.moderate", "Moderate") };
    return { id: "bad", color: "#ff8a65", label: t2("common.bad", "Bad") };
  }
  function wellnessSliderFillColor(wellness) {
    const v = clampInt2(wellness, SLIDER_MIN, SLIDER_MAX);
    if (v >= 8) return "#4CAF50";
    if (v >= 4) return "#FF9800";
    return "#F44336";
  }
  function wellnessSliderFillPercent(wellness) {
    const v = clampInt2(wellness, SLIDER_MIN, SLIDER_MAX);
    return (v - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN) * 100;
  }

  // packages/shared/src/a11y/wcagHelpers.mjs
  var WCAG_BODY_TEXT_MIN_CONTRAST = 4.5;
  var WCAG_LARGE_TEXT_MIN_CONTRAST = 3;
  var WCAG_UI_COMPONENT_MIN_CONTRAST = 3;
  var MIN_TOUCH_TARGET_PX = 44;
  var PRIMARY_ACTION_MIN_HEIGHT_PX = 64;
  function prefersReducedMotion() {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function getMotionDurationMs(normalMs, reducedMs = 100) {
    return prefersReducedMotion() ? reducedMs : normalMs;
  }
  function getBrainFogFontScale(enabled) {
    return enabled ? 1.2 : 1;
  }
  function buildFocusScrollMargin(bottomNavPx = 80) {
    return { scrollMarginBottom: `${bottomNavPx}px` };
  }
  function isAllowedAppearanceMode(mode) {
    return ["system", "dark", "light", "warm-dark"].includes(mode);
  }
  function contrastRatioPasses(ratio, isLargeText = false) {
    const min = isLargeText ? WCAG_LARGE_TEXT_MIN_CONTRAST : WCAG_BODY_TEXT_MIN_CONTRAST;
    return ratio >= min;
  }

  // packages/shared/src/crypto/secureStorage.mjs
  var SENSITIVE_STORAGE_KEYS = [
    "userKeys",
    "supabaseSession",
    "vapidSubscription",
    "encryptionPassphrase"
  ];
  function isSensitiveKey(key) {
    return SENSITIVE_STORAGE_KEYS.includes(key);
  }
  var encryptedBackend = null;
  function configureSecureStorageBackend(backend) {
    encryptedBackend = backend;
  }
  var secureStore = {
    async getItem(key) {
      if (isSensitiveKey(key) && encryptedBackend?.getItem) {
        return encryptedBackend.getItem(key);
      }
      if (typeof localStorage !== "undefined") return localStorage.getItem(key);
      return null;
    },
    async setItem(key, value) {
      if (isSensitiveKey(key) && encryptedBackend?.setItem) {
        return encryptedBackend.setItem(key, value);
      }
      if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
    },
    async removeItem(key) {
      if (isSensitiveKey(key) && encryptedBackend?.removeItem) {
        return encryptedBackend.removeItem(key);
      }
      if (typeof localStorage !== "undefined") localStorage.removeItem(key);
    }
  };

  // packages/shared/src/index.mjs
  function identity(value) {
    return value;
  }
  function readTextFileSync(fs, absPath) {
    return fs.readFileSync(absPath, "utf8");
  }
  function existsSync(fs, absPath) {
    return fs.existsSync(absPath);
  }
  function getDefaultAccessibilitySettings() {
    return {
      textScale: 1,
      largeTextEnabled: false,
      ttsEnabled: false,
      ttsReadModeEnabled: false,
      plainLanguageEnabled: false,
      chartPaletteMode: "standard",
      colorblindMode: "none"
      // reserved
    };
  }
  function normalizeAccessibilitySettings(value) {
    const d = getDefaultAccessibilitySettings();
    const v = value && typeof value === "object" ? value : {};
    const textScaleRaw = typeof v.textScale === "number" ? v.textScale : d.textScale;
    const textScale = Number.isFinite(textScaleRaw) ? Math.min(2, Math.max(0.75, textScaleRaw)) : d.textScale;
    const colorblindMode = typeof v.colorblindMode === "string" ? v.colorblindMode : d.colorblindMode;
    const chartPaletteMode = v.chartPaletteMode === "high-contrast" ? "high-contrast" : d.chartPaletteMode;
    return {
      textScale,
      largeTextEnabled: v.largeTextEnabled === true,
      ttsEnabled: v.ttsEnabled === true,
      ttsReadModeEnabled: v.ttsReadModeEnabled === true,
      plainLanguageEnabled: v.plainLanguageEnabled === true,
      chartPaletteMode,
      colorblindMode
    };
  }
  var LOGS_STORAGE_KEY_V1 = "healthLogs";
  var LOGS_STORAGE_KEY_MOBILE_LEGACY = "rianell.logs.v1";
  var SETTINGS_STORAGE_KEY = "rianellSettings";
  var GOALS_STORAGE_KEY = "rianellGoals";
  var PREDICTION_STATE_KEY = "rianellPredictionState";
  var PREFS_STORAGE_KEY_MOBILE = "rianell.preferences.v1";
  var LOGS_BACKUP_KEY = "healthLogs_backup";
  var OFFLINE_QUEUE_KEY = "healthLogsOfflineQueue";
  var DEFAULT_GOALS = {
    steps: 1e4,
    hydration: 9,
    sleep: 5,
    goodDaysPerWeek: 3
  };
  function normalizeGoals(value) {
    const d = DEFAULT_GOALS;
    const v = value && typeof value === "object" ? value : {};
    return {
      steps: clampInt3(v.steps, 0, 1e5) ?? d.steps,
      hydration: clampInt3(v.hydration, 0, 30) ?? d.hydration,
      sleep: clampInt3(v.sleep, 0, 10) ?? d.sleep,
      goodDaysPerWeek: clampInt3(v.goodDaysPerWeek, 0, 7) ?? d.goodDaysPerWeek
    };
  }
  function hasActiveGoals(value) {
    if (!value || typeof value !== "object") return false;
    const steps = clampInt3(value.steps, 0, 1e5) ?? 0;
    const hydration = clampInt3(value.hydration, 0, 30) ?? 0;
    const sleep = clampInt3(value.sleep, 0, 10) ?? 0;
    const goodDays = clampInt3(value.goodDaysPerWeek, 0, 7) ?? 0;
    return steps > 0 || hydration > 0 || sleep > 0 || goodDays > 0;
  }
  function getDefaultAppSettingsFields() {
    return {
      userName: "",
      weightUnit: "kg",
      medicalCondition: "",
      contributeAnonData: false,
      useOpenData: false,
      backup: true,
      compress: false,
      animations: true,
      lazy: true,
      aiModelDownloadConsent: "deferred"
    };
  }
  function normalizePreferencesPartial(value) {
    const d = getDefaultAppSettingsFields();
    const v = value && typeof value === "object" ? value : {};
    const weightUnit = v.weightUnit === "lb" ? "lb" : "kg";
    const consent = v.aiModelDownloadConsent;
    return {
      userName: typeof v.userName === "string" ? v.userName.slice(0, 120) : d.userName,
      weightUnit,
      medicalCondition: typeof v.medicalCondition === "string" ? v.medicalCondition.slice(0, 200) : d.medicalCondition,
      contributeAnonData: v.contributeAnonData === true,
      useOpenData: v.useOpenData === true,
      backup: v.backup !== false,
      compress: v.compress === true,
      animations: v.animations !== false,
      lazy: v.lazy !== false,
      lazyCharts: v.lazyCharts !== false,
      aiModelDownloadConsent: consent === "granted" || consent === "deferred" ? consent : d.aiModelDownloadConsent
    };
  }
  function mergeHealthLogs(localLogs, cloudLogs) {
    const logsMap = /* @__PURE__ */ new Map();
    if (Array.isArray(cloudLogs)) {
      cloudLogs.forEach((log) => {
        if (log && log.date) logsMap.set(log.date, log);
      });
    }
    if (Array.isArray(localLogs)) {
      localLogs.forEach((log) => {
        if (log && log.date) logsMap.set(log.date, log);
      });
    }
    const merged = Array.from(logsMap.values());
    merged.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return merged;
  }
  function clampInt3(raw, min, max) {
    const n = typeof raw === "number" ? raw : typeof raw === "string" ? parseInt(raw, 10) : NaN;
    if (!Number.isFinite(n)) return void 0;
    return Math.max(min, Math.min(max, Math.trunc(n)));
  }
  function normalizeString2(raw, maxLen) {
    if (typeof raw !== "string") return void 0;
    const s = raw.trim();
    if (!s) return void 0;
    if (typeof maxLen === "number") return s.slice(0, maxLen);
    return s;
  }
  function omitEmpty(obj) {
    Object.keys(obj).forEach((k) => {
      const v = obj[k];
      if (v === void 0) delete obj[k];
      else if (typeof v === "string" && v.trim() === "") delete obj[k];
      else if (Array.isArray(v) && v.length === 0) delete obj[k];
    });
    return obj;
  }
  function normalizeLogEntry(value) {
    const v = value && typeof value === "object" ? value : {};
    const date = typeof v.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.date) ? v.date : (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const entry = {
      date,
      bpm: clampInt3(v.bpm, 30, 120),
      weight: typeof v.weight === "string" ? v.weight : typeof v.weight === "number" ? v.weight.toFixed(1) : void 0,
      // stored as kg string (web)
      fatigue: clampInt3(v.fatigue, 0, 10),
      stiffness: clampInt3(v.stiffness, 0, 10),
      sleep: clampInt3(v.sleep, 0, 10),
      jointPain: clampInt3(v.jointPain, 0, 10),
      mobility: clampInt3(v.mobility, 0, 10),
      dailyFunction: clampInt3(v.dailyFunction, 0, 10),
      swelling: clampInt3(v.swelling, 0, 10),
      flare: v.flare === "Yes" ? "Yes" : v.flare === "No" ? "No" : "No",
      mood: clampInt3(v.mood, 0, 10),
      irritability: clampInt3(v.irritability, 0, 10),
      notes: normalizeString2(v.notes, 500),
      food: v.food && typeof v.food === "object" ? v.food : void 0,
      exercise: Array.isArray(v.exercise) ? v.exercise : void 0,
      energyClarity: normalizeString2(v.energyClarity, 80),
      stressors: Array.isArray(v.stressors) ? v.stressors.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim()).slice(0, 50) : void 0,
      symptoms: Array.isArray(v.symptoms) ? v.symptoms.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim()).slice(0, 80) : void 0,
      weatherSensitivity: clampInt3(v.weatherSensitivity, 0, 10),
      painLocation: normalizeString2(v.painLocation, 150),
      steps: typeof v.steps === "number" ? v.steps : typeof v.steps === "string" ? parseInt(v.steps, 10) : void 0,
      hydration: typeof v.hydration === "number" ? v.hydration : typeof v.hydration === "string" ? parseFloat(v.hydration) : void 0,
      medications: Array.isArray(v.medications) ? v.medications : void 0,
      subEntries: normalizeSubEntries(v.subEntries),
      cycle: normalizeCycleFields(v.cycle),
      medicationDoses: normalizeMedicationDoses(v.medicationDoses),
      savedAt: typeof v.savedAt === "string" ? v.savedAt.slice(0, 40) : void 0,
      barcodeFood: typeof v.barcodeFood === "string" ? v.barcodeFood.slice(0, 200) : void 0,
      customMetrics: normalizeCustomMetricValues(v.customMetrics),
      ...normalizeVitalMetrics(v)
    };
    if (entry.steps != null && !Number.isFinite(entry.steps)) entry.steps = void 0;
    if (entry.hydration != null && !Number.isFinite(entry.hydration)) entry.hydration = void 0;
    return omitEmpty(entry);
  }
  function createSampleLogEntry() {
    return normalizeLogEntry({
      date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      flare: "No",
      bpm: 72,
      weight: "75.0",
      sleep: 8,
      mood: 8,
      fatigue: 4,
      steps: 7500,
      hydration: 8,
      notes: "Sample entry",
      food: { breakfast: [], lunch: [], dinner: [], snack: [] },
      exercise: [{ name: "Walking", duration: 20 }]
    });
  }
  return __toCommonJS(index_exports);
})();
