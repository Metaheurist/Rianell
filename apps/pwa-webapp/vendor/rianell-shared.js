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
    ALLOWED_LLM_MODEL_HOSTS: () => ALLOWED_LLM_MODEL_HOSTS,
    ANON_POOL_EXCLUDED_FIELDS: () => ANON_POOL_EXCLUDED_FIELDS,
    ANON_POOL_INCLUDED_FIELDS: () => ANON_POOL_INCLUDED_FIELDS,
    APPOINTMENT_COUNTDOWN_DAYS: () => APPOINTMENT_COUNTDOWN_DAYS,
    BLOCKED_COMMERCIAL_LLM_HOST_PATTERNS: () => BLOCKED_COMMERCIAL_LLM_HOST_PATTERNS,
    CAREGIVER_RELATIONSHIPS: () => CAREGIVER_RELATIONSHIPS,
    DEFAULT_GOALS: () => DEFAULT_GOALS,
    DEFAULT_LOCALE: () => DEFAULT_LOCALE,
    DEFAULT_PRIVACY_REGION: () => DEFAULT_PRIVACY_REGION,
    ENCRYPTED_EXPORT_FORMAT: () => ENCRYPTED_EXPORT_FORMAT,
    ENCRYPTED_EXPORT_KDF_ITERATIONS: () => ENCRYPTED_EXPORT_KDF_ITERATIONS,
    GOALS_STORAGE_KEY: () => GOALS_STORAGE_KEY,
    GOLDEN_LLM_INTENTS: () => GOLDEN_LLM_INTENTS,
    GOLDEN_LLM_LOCALES: () => GOLDEN_LLM_LOCALES,
    HOME_CHECKIN_PERIODS: () => HOME_CHECKIN_PERIODS,
    HOME_SUGGESTIONS_MAX_CHIPS: () => HOME_SUGGESTIONS_MAX_CHIPS,
    HOME_SUGGESTIONS_MIN_DAYS: () => HOME_SUGGESTIONS_MIN_DAYS,
    HOME_SUGGESTIONS_RANGE_DAYS: () => HOME_SUGGESTIONS_RANGE_DAYS,
    LLM_COACH_PERSONAS: () => LLM_COACH_PERSONAS,
    LOCAL_ONLY_NETWORK_FEATURES: () => LOCAL_ONLY_NETWORK_FEATURES,
    LOGS_BACKUP_KEY: () => LOGS_BACKUP_KEY,
    LOGS_STORAGE_KEY_MOBILE_LEGACY: () => LOGS_STORAGE_KEY_MOBILE_LEGACY,
    LOGS_STORAGE_KEY_V1: () => LOGS_STORAGE_KEY_V1,
    LOG_CSV_ENGLISH_HEADERS: () => LOG_CSV_ENGLISH_HEADERS,
    LOG_CSV_FIELD_IDS: () => LOG_CSV_FIELD_IDS,
    LOG_CSV_I18N_KEYS: () => LOG_CSV_I18N_KEYS,
    MAX_HOME_QUESTION_ANSWERS_PER_DAY: () => MAX_HOME_QUESTION_ANSWERS_PER_DAY,
    MAX_WEEK_CHAT_TURNS: () => MAX_WEEK_CHAT_TURNS,
    MIGRATION_COPY: () => MIGRATION_COPY,
    MIGRATION_SOURCES: () => MIGRATION_SOURCES,
    OFFLINE_QUEUE_KEY: () => OFFLINE_QUEUE_KEY,
    POLICY_BODIES: () => POLICY_BODIES,
    POLICY_SUMMARIES: () => POLICY_SUMMARIES,
    PREDICTION_STATE_KEY: () => PREDICTION_STATE_KEY,
    PREFS_STORAGE_KEY_MOBILE: () => PREFS_STORAGE_KEY_MOBILE,
    PRIVACY_REGIONS: () => PRIVACY_REGIONS,
    PROCESSING_ACTIVITY_LOG_KEY: () => PROCESSING_ACTIVITY_LOG_KEY,
    PROCESSING_ACTIVITY_LOG_MAX: () => PROCESSING_ACTIVITY_LOG_MAX,
    PROFILE_AVATAR_IDS: () => PROFILE_AVATAR_IDS,
    PROGRESSIVE_CATEGORIES: () => PROGRESSIVE_CATEGORIES,
    SETTINGS_PROFILE_EXPORT_VERSION: () => SETTINGS_PROFILE_EXPORT_VERSION,
    SETTINGS_STORAGE_KEY: () => SETTINGS_STORAGE_KEY,
    SHARE_LINK_FORMAT: () => SHARE_LINK_FORMAT,
    SHIPPED_LOCALES: () => SHIPPED_LOCALES,
    TRACKING_PROFILE_FIELD_KEYS: () => TRACKING_PROFILE_FIELD_KEYS,
    UNSET_PRIVACY_REGION: () => UNSET_PRIVACY_REGION,
    WEATHER_CACHE_MS: () => WEATHER_CACHE_MS,
    addLogFavorite: () => addLogFavorite,
    analysisSnapshotFromSummary: () => analysisSnapshotFromSummary,
    appendProcessingActivity: () => appendProcessingActivity,
    applyLocaleDefaultsToPrefs: () => applyLocaleDefaultsToPrefs,
    applyMicroCheckin: () => applyMicroCheckin,
    applyMigrationPendingFlag: () => applyMigrationPendingFlag,
    applyPrivacyProfileToLocal: () => applyPrivacyProfileToLocal,
    applyRegionDefaultLocale: () => applyRegionDefaultLocale,
    applyRegionDowngradeToggles: () => applyRegionDowngradeToggles,
    appointmentCountdownLabelKey: () => appointmentCountdownLabelKey,
    auditGoldenPrompt: () => auditGoldenPrompt,
    buildAirQualityUrl: () => buildAirQualityUrl,
    buildClinicianBriefContext: () => buildClinicianBriefContext,
    buildClinicianBriefFallback: () => buildClinicianBriefFallback,
    buildClinicianBriefPrompt: () => buildClinicianBriefPrompt,
    buildConsentDashboardEntries: () => buildConsentDashboardEntries,
    buildEncryptedBackupBlob: () => buildEncryptedBackupBlob,
    buildExplainChartContext: () => buildExplainChartContext,
    buildExplainChartFallback: () => buildExplainChartFallback,
    buildExplainChartPrompt: () => buildExplainChartPrompt,
    buildHomeQuestionContext: () => buildHomeQuestionContext,
    buildHomeQuestionFallback: () => buildHomeQuestionFallback,
    buildHomeQuestionPrompt: () => buildHomeQuestionPrompt,
    buildLlmRequestPayload: () => buildLlmRequestPayload,
    buildMotdPrompt: () => buildMotdPrompt,
    buildProxyLogMetadata: () => buildProxyLogMetadata,
    buildSettingsProfileExport: () => buildSettingsProfileExport,
    buildStructuredSummaryPrompt: () => buildStructuredSummaryPrompt,
    buildSuggestPrompt: () => buildSuggestPrompt,
    buildSummaryPrompt: () => buildSummaryPrompt,
    buildTodayMedDoseStatuses: () => buildTodayMedDoseStatuses,
    buildWeatherForecastUrl: () => buildWeatherForecastUrl,
    buildWeekChatContext: () => buildWeekChatContext,
    buildWeekChatFallback: () => buildWeekChatFallback,
    buildWeekChatPrompt: () => buildWeekChatPrompt,
    buildWeekChatUserPayload: () => buildWeekChatUserPayload,
    canAnswerHomeQuestionToday: () => canAnswerHomeQuestionToday,
    canChooseDataResidency: () => canChooseDataResidency,
    canSendWeekChatTurn: () => canSendWeekChatTurn,
    checkPolicyDrift: () => checkPolicyDrift,
    checkPolicyDriftSync: () => checkPolicyDriftSync,
    clearMigrationPending: () => clearMigrationPending,
    coachPersonaPromptKey: () => coachPersonaPromptKey,
    completedCheckinPeriods: () => completedCheckinPeriods,
    computeFlareFreeDays: () => computeFlareFreeDays,
    computeGoodDayStreak: () => computeGoodDayStreak,
    computeHomeAnalysisSnapshot: () => computeHomeAnalysisSnapshot,
    computeHomeCardContext: () => computeHomeCardContext,
    computeHomeStreakSnapshot: () => computeHomeStreakSnapshot,
    createReadOnlyShareEnvelope: () => createReadOnlyShareEnvelope,
    createSampleLogEntry: () => createSampleLogEntry,
    createTranslator: () => createTranslator,
    customMetricFieldKey: () => customMetricFieldKey,
    customMetricIdFromField: () => customMetricIdFromField,
    daysSinceTrackingProfileStart: () => daysSinceTrackingProfileStart,
    daysUntilAppointment: () => daysUntilAppointment,
    decryptExportWithPassphrase: () => decryptExportWithPassphrase,
    deriveDateFormatFromLocale: () => deriveDateFormatFromLocale,
    deriveFirstDayOfWeekFromLocale: () => deriveFirstDayOfWeekFromLocale,
    deriveWeightUnitFromLocale: () => deriveWeightUnitFromLocale,
    detectHomeLoggingGaps: () => detectHomeLoggingGaps,
    encryptExportWithPassphrase: () => encryptExportWithPassphrase,
    existsSync: () => existsSync,
    extractLogFieldsFromVoiceTranscript: () => extractLogFieldsFromVoiceTranscript,
    fetchHomeWeatherSnapshot: () => fetchHomeWeatherSnapshot,
    fetchOpenFoodFactsProduct: () => fetchOpenFoodFactsProduct,
    filterLogsForHomeSuggestions: () => filterLogsForHomeSuggestions,
    findLogSyncConflicts: () => findLogSyncConflicts,
    formatActivityTypeLabel: () => formatActivityTypeLabel,
    formatBarcodeFoodLabel: () => formatBarcodeFoodLabel,
    formatDate: () => formatDate,
    formatNumber: () => formatNumber,
    formatRelativeDay: () => formatRelativeDay,
    formatStructuredLlmOutput: () => formatStructuredLlmOutput,
    formatWeekChatHistory: () => formatWeekChatHistory,
    getDefaultAccessibilitySettings: () => getDefaultAccessibilitySettings,
    getDefaultAppSettingsFields: () => getDefaultAppSettingsFields,
    getDefaultLocaleForRegion: () => getDefaultLocaleForRegion,
    getDefaultTrackingProfileFields: () => getDefaultTrackingProfileFields,
    getFeatureAvailability: () => getFeatureAvailability,
    getLlmCapability: () => getLlmCapability,
    getPolicyBodyParagraphs: () => getPolicyBodyParagraphs,
    getPolicyDocumentsForRegion: () => getPolicyDocumentsForRegion,
    getPolicyDocumentsForRegionI18n: () => getPolicyDocumentsForRegionI18n,
    getPolicyPack: () => getPolicyPack,
    getRegionLabels: () => getRegionLabels,
    getResidencyChooserOptions: () => getResidencyChooserOptions,
    getResidencyConfigFromEnv: () => getResidencyConfigFromEnv,
    getResidencyDisplayLabel: () => getResidencyDisplayLabel,
    getResidencyRegistry: () => getResidencyRegistry,
    getSupportedLocalesForRegion: () => getSupportedLocalesForRegion,
    getSymptomChipsForCondition: () => getSymptomChipsForCondition,
    getUnlockedLogCategories: () => getUnlockedLogCategories,
    getVisibleTrackingFields: () => getVisibleTrackingFields,
    identity: () => identity,
    isCloudSyncBlockedByMigration: () => isCloudSyncBlockedByMigration,
    isCustomMetricField: () => isCustomMetricField,
    isGoodDayLog: () => isGoodDayLog,
    isLlmInferenceAllowed: () => isLlmInferenceAllowed,
    isLocalOnlyModeEnabled: () => isLocalOnlyModeEnabled,
    isLogCategoryUnlocked: () => isLogCategoryUnlocked,
    isLoggingStreakBroken: () => isLoggingStreakBroken,
    isPrivacyRegionConfigured: () => isPrivacyRegionConfigured,
    isPwaOnDeviceLlmOnly: () => isPwaOnDeviceLlmOnly,
    isRtlLocale: () => isRtlLocale,
    isTrackingProfileConfigured: () => isTrackingProfileConfigured,
    isValidLocaleId: () => isValidLocaleId,
    isValidPrivacyRegion: () => isValidPrivacyRegion,
    isWeatherCacheFresh: () => isWeatherCacheFresh,
    languageNameForLocale: () => languageNameForLocale,
    loadPolicyPackFromDisk: () => loadPolicyPackFromDisk,
    loadPromptPack: () => loadPromptPack,
    localOnlyBlockReason: () => localOnlyBlockReason,
    localeFallbackChain: () => localeFallbackChain,
    localeLabel: () => localeLabel,
    logToFhirObservations: () => logToFhirObservations,
    logsToCsv: () => logsToCsv,
    logsToFhirBundle: () => logsToFhirBundle,
    mergeHealthLogs: () => mergeHealthLogs,
    mergeHealthLogsWithConflictPolicy: () => mergeHealthLogsWithConflictPolicy,
    mergeLogEntriesForDate: () => mergeLogEntriesForDate,
    needsDataResidencyMigration: () => needsDataResidencyMigration,
    nextHomeQuestionAnswerState: () => nextHomeQuestionAnswerState,
    normalizeAccessibilitySettings: () => normalizeAccessibilitySettings,
    normalizeActivityEntry: () => normalizeActivityEntry,
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
    normalizePreferencesPartial: () => normalizePreferencesPartial,
    normalizeProfileAvatar: () => normalizeProfileAvatar,
    normalizeSubEntries: () => normalizeSubEntries,
    normalizeSubEntry: () => normalizeSubEntry,
    normalizeSymptomTemplates: () => normalizeSymptomTemplates,
    normalizeTrackingProfile: () => normalizeTrackingProfile,
    normalizeWeatherCoords: () => normalizeWeatherCoords,
    parseAppointmentDate: () => parseAppointmentDate,
    parseLogsCsv: () => parseLogsCsv,
    parseMigrationCsv: () => parseMigrationCsv,
    parseSettingsProfileImport: () => parseSettingsProfileImport,
    parseStructuredLlmOutput: () => parseStructuredLlmOutput,
    parseWeatherApiResponse: () => parseWeatherApiResponse,
    periodForHour: () => periodForHour,
    pickDailyHomeGapQuestion: () => pickDailyHomeGapQuestion,
    pickHomeAiSuggestionBundle: () => pickHomeAiSuggestionBundle,
    pickHomeAiSuggestions: () => pickHomeAiSuggestions,
    prefsToConsents: () => prefsToConsents,
    privacyProfileFromLocal: () => privacyProfileFromLocal,
    putWebDavEncryptedBackup: () => putWebDavEncryptedBackup,
    readCustomMetricRadarValue: () => readCustomMetricRadarValue,
    readProcessingActivity: () => readProcessingActivity,
    readTextFileSync: () => readTextFileSync,
    resolveActiveLocale: () => resolveActiveLocale,
    resolveAuthResidencyCode: () => resolveAuthResidencyCode,
    resolveDataResidency: () => resolveDataResidency,
    resolveHomeCardOrder: () => resolveHomeCardOrder,
    resolvePolicyPack: () => resolvePolicyPack,
    roundWeatherCoord: () => roundWeatherCoord,
    runGoldenPromptAudit: () => runGoldenPromptAudit,
    sanitizeCustomMetricLabel: () => sanitizeCustomMetricLabel,
    setPolicyPack: () => setPolicyPack,
    shareEnvelopeToPortableJson: () => shareEnvelopeToPortableJson,
    shouldAllowNetworkOperation: () => shouldAllowNetworkOperation,
    shouldShowAppointmentCard: () => shouldShowAppointmentCard,
    shouldShowWizardCategory: () => shouldShowWizardCategory,
    stampLogEntryForCaregiver: () => stampLogEntryForCaregiver,
    suggestPrivacyRegionFromHint: () => suggestPrivacyRegionFromHint,
    t: () => t,
    textDirection: () => textDirection,
    upsertSymptomTemplate: () => upsertSymptomTemplate,
    validateRemoteLlmEndpoint: () => validateRemoteLlmEndpoint
  });

  // packages/shared/src/logging/logSchema.mjs
  var SUB_ENTRY_PERIODS = /* @__PURE__ */ new Set(["AM", "midday", "PM", "partial"]);
  function clampInt(raw, min, max) {
    const n = typeof raw === "number" ? raw : typeof raw === "string" ? parseInt(raw, 10) : NaN;
    if (!Number.isFinite(n)) return void 0;
    return Math.max(min, Math.min(max, Math.round(n)));
  }
  function normalizeString(raw, maxLen) {
    if (typeof raw !== "string") return void 0;
    const s = raw.trim();
    if (!s) return void 0;
    if (typeof maxLen === "number") return s.slice(0, maxLen);
    return s;
  }
  function normalizeCycleFields(value) {
    const v = value && typeof value === "object" ? value : {};
    const phase = v.phase === "menstrual" || v.phase === "follicular" || v.phase === "ovulation" || v.phase === "luteal" ? v.phase : void 0;
    const flow = v.flow === "none" || v.flow === "light" || v.flow === "medium" || v.flow === "heavy" ? v.flow : void 0;
    const cycleDay = clampInt(v.cycleDay, 1, 45);
    const pmsSymptoms = Array.isArray(v.pmsSymptoms) ? v.pmsSymptoms.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim()).slice(0, 20) : void 0;
    const out = { cycleDay, phase, flow, pmsSymptoms };
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
      "Optional features \u2014 encrypted cloud backup, anonymised research contribution, and on-device AI \u2014 each need separate consent. You can change or withdraw consent in Settings.",
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
      ["aiEnabled", "onDeviceLlmDownload"]
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
      aiModelDownloadConsent: p.aiModelDownloadConsent
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
    { id: "bugReport", labelKey: "settings.privacy.localOnly.bugReport" },
    { id: "remoteLlm", labelKey: "settings.privacy.localOnly.remoteLlm" }
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
  async function deriveExportKey(passphrase, salt, subtle) {
    const enc = new TextEncoder();
    const cryptoSubtle = getSubtle(subtle);
    const keyMaterial = await cryptoSubtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
    return cryptoSubtle.deriveKey(
      { name: "PBKDF2", salt, iterations: ENCRYPTED_EXPORT_KDF_ITERATIONS, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }
  async function encryptExportWithPassphrase(payload, passphrase, subtle) {
    if (typeof passphrase !== "string" || passphrase.length < 8) {
      throw new Error("Passphrase must be at least 8 characters");
    }
    const cryptoSubtle = getSubtle(subtle);
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const key = await deriveExportKey(passphrase, salt, cryptoSubtle);
    const encoded = new TextEncoder().encode(JSON.stringify(payload));
    const cipher = await cryptoSubtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
    return {
      format: ENCRYPTED_EXPORT_FORMAT,
      kdf: "PBKDF2",
      iterations: ENCRYPTED_EXPORT_KDF_ITERATIONS,
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
    const key = await deriveExportKey(passphrase, salt, cryptoSubtle);
    const plain = await cryptoSubtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
    return JSON.parse(new TextDecoder().decode(plain));
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
    const id = p?.regions?.[regionId] ? regionId : "other";
    return p.regions[id];
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
  function formatDate(value, locale, opts = {}) {
    const d = value instanceof Date ? value : new Date(value);
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
        "summary.system": "Du fasst Gesundheitsdaten f\xFCr den Nutzer in genau 2 kurzen S\xE4tzen zusammen. Nutze nur die bereitgestellten Daten. Nenne 1\u20132 konkrete Befunde. Sei klar und ermutigend. Antworte nur mit dem Text.",
        "suggest.system": "Du schreibst einen kurzen Satz f\xFCr eine Tagesnotiz. Vergleiche heute mit dem j\xFCngsten Durchschnitt. Nutze nur die bereitgestellten Daten. Antworte nur mit dem Satz.",
        "homeQuestion.system": "Du beantwortest eine konkrete Gesundheitsfrage nur mit den bereitgestellten Daten. Schreibe 3\u20135 kurze S\xE4tze in einfacher Sprache. Keine Diagnose oder medizinischen Anweisungen. Sei ermutigend. Antworte nur mit der Antwort.",
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
        "summary.system": "You summarise health tracking data for the patient in exactly 2 short sentences. Use only the data provided. Mention 1-2 specific findings. Be clear and encouraging. Reply with only the summary text.",
        "suggest.system": "You write one short sentence for a daily health log note. Compare today to the recent average. Use only the data provided. Reply with only the note sentence.",
        "homeQuestion.system": "You answer one specific health-tracking question using only the data provided. Write 3\u20135 short sentences in plain language. No diagnosis or medical orders. Be encouraging. Reply with only the answer text.",
        "clinicianBrief.system": "You write a one-page clinician visit prep brief from health-tracking data. Use only the data provided. Structure: key patterns, symptom/stressor highlights, questions to ask the clinician. Plain language. No diagnosis or treatment orders. Max 180 words. Reply with only the brief text.",
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
        "summary.system.plain": "You summarise health tracking data in exactly 2 short sentences using plain B1 English (simple words, short clauses). Use only the data provided. Mention 1-2 findings. Be encouraging. Reply with only the summary text."
      }
    },
    "en-US": {
      "locale": "en-US",
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
    "es-ES": {
      "locale": "es-ES",
      "label": "Espa\xF1ol",
      "llmCapability": "full",
      "strings": {
        "motd.system": "Escribes una cita breve y sencilla sobre vida saludable para una app de seguimiento. Temas: sue\xF1o, agua, movimiento suave, descanso, aire fresco, comida equilibrada o alivio del estr\xE9s. Palabras cotidianas. M\xE1x. 18 palabras. Sin nombres. Sin consejo m\xE9dico. Sin comillas. Responde solo con la frase.",
        "motd.user": "Escribe una cita sobre estilo de vida saludable.",
        "summary.system": "Resumes datos de salud para el usuario en exactamente 2 frases cortas. Usa solo los datos proporcionados. Menciona 1\u20132 hallazgos concretos. S\xE9 claro y alentador. Responde solo con el resumen.",
        "suggest.system": "Escribes una frase corta para una nota diaria. Compara hoy con el promedio reciente. Usa solo los datos proporcionados. Responde solo con la frase.",
        "homeQuestion.system": "Respondes una pregunta concreta de salud usando solo los datos proporcionados. Escribe 3\u20135 frases cortas en lenguaje sencillo. Sin diagn\xF3stico ni \xF3rdenes m\xE9dicas. S\xE9 alentador. Responde solo con la respuesta.",
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
        "homeQuestion.system": "You answer one specific health-tracking question using only the data provided. Write 3\u20135 short sentences in plain language. No diagnosis or medical orders. Be encouraging. Reply with only the answer text.",
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
        "summary.system": "Riassumi i dati di salute per l\u2019utente in esattamente 2 frasi brevi. Usa solo i dati forniti. Menziona 1\u20132 risultati specifici. Sii chiaro e incoraggiante. Rispondi solo con il riepilogo.",
        "suggest.system": "Scrivi una frase breve per una nota giornaliera. Confronta oggi con la media recente. Usa solo i dati forniti. Rispondi solo con la frase.",
        "homeQuestion.system": "Rispondi a una domanda specifica usando solo i dati forniti. Scrivi 3\u20135 frasi brevi in linguaggio semplice. Niente diagnosi o ordini medici. Sii incoraggiante. Rispondi solo con la risposta.",
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
        "summary.system": "Je vat gezondheidsgegevens samen in precies 2 korte zinnen. Gebruik alleen de verstrekte data. Noem 1\u20132 specifieke bevindingen. Wees duidelijk en bemoedigend. Antwoord alleen met de samenvatting.",
        "suggest.system": "Je schrijft \xE9\xE9n korte zin voor een dagelijkse lognotitie. Vergelijk vandaag met het recente gemiddelde. Gebruik alleen de verstrekte data. Antwoord alleen met de zin.",
        "homeQuestion.system": "Je beantwoordt \xE9\xE9n specifieke gezondheidsvraag met alleen de verstrekte data. Schrijf 3\u20135 korte zinnen in eenvoudige taal. Geen diagnose of medische orders. Wees bemoedigend. Antwoord alleen met het antwoord.",
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
        "summary.system": "Streszczasz dane zdrowotne w dok\u0142adnie 2 kr\xF3tkich zdaniach. U\u017Cywaj tylko podanych danych. Wspomnij 1\u20132 konkretne ustalenia. B\u0105d\u017A jasny i zach\u0119caj\u0105cy. Odpowiedz tylko podsumowaniem.",
        "suggest.system": "Piszesz jedno kr\xF3tkie zdanie do notatki dziennika. Por\xF3wnaj dzi\u015B ze \u015Bredni\u0105 z ostatnich dni. U\u017Cywaj tylko podanych danych. Odpowiedz tylko zdaniem.",
        "homeQuestion.system": "Odpowiadasz na jedno konkretne pytanie zdrowotne, u\u017Cywaj\u0105c tylko podanych danych. Napisz 3\u20135 kr\xF3tkich zda\u0144 prostym j\u0119zykiem. Bez diagnozy ani zalece\u0144 medycznych. B\u0105d\u017A zach\u0119caj\u0105cy. Odpowiedz tylko odpowiedzi\u0105.",
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
        "summary.system": "Voc\xEA resume dados de sa\xFAde em exatamente 2 frases curtas. Use apenas os dados fornecidos. Mencione 1\u20132 achados espec\xEDficos. Seja claro e encorajador. Responda apenas com o resumo.",
        "suggest.system": "Voc\xEA escreve uma frase curta para uma nota di\xE1ria. Compare hoje com a m\xE9dia recente. Use apenas os dados fornecidos. Responda apenas com a frase.",
        "homeQuestion.system": "Voc\xEA responde uma pergunta espec\xEDfica de sa\xFAde usando apenas os dados fornecidos. Escreva 3\u20135 frases curtas em linguagem simples. Sem diagn\xF3stico nem ordens m\xE9dicas. Seja encorajador. Responda apenas com a resposta.",
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
        "summary.system": "Resumes dados de sa\xFAde em exatamente 2 frases curtas. Usa apenas os dados fornecidos. Menciona 1\u20132 achados espec\xEDficos. S\xEA claro e encorajador. Responde apenas com o resumo.",
        "suggest.system": "Escreves uma frase curta para uma nota di\xE1ria. Compara hoje com a m\xE9dia recente. Usa apenas os dados fornecidos. Responde apenas com a frase.",
        "homeQuestion.system": "Respondes a uma pergunta espec\xEDfica de sa\xFAde usando apenas os dados fornecidos. Escreve 3\u20135 frases curtas em linguagem simples. Sem diagn\xF3stico nem ordens m\xE9dicas. S\xEA encorajador. Responde apenas com a resposta.",
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
        "You answer one specific health-tracking question using only the data provided. Write 3\u20135 short sentences in plain language. No diagnosis or medical orders. Be encouraging. Reply with only the answer text."
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
    let num = 0;
    let denX = 0;
    let denY = 0;
    for (let i = 0; i < n; i++) {
      const dx = xs[i] - avgX;
      const dy = ys[i] - avgY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }
    if (denX === 0 || denY === 0) return null;
    return num / Math.sqrt(denX * denY);
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
      return `Recent averages - fatigue ${snap.avgFatigue.toFixed(1)}, sleep ${snap.avgSleep != null ? snap.avgSleep.toFixed(1) : "-"}, mood ${snap.avgMood != null ? snap.avgMood.toFixed(1) : "-"} (1\u201310).`;
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
    { id: "nudge", basePriority: 40 },
    { id: "appointment", basePriority: 78 },
    { id: "weather", basePriority: 48 },
    { id: "streak", basePriority: 38 },
    { id: "checkin", basePriority: 70 },
    { id: "pacing", basePriority: 55 },
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
  function computeHomeCardContext(logs, todayStr, options = {}) {
    const {
      aiEnabled = true,
      simpleMode = false,
      showGoals = true,
      hasPacingData = false,
      showCheckin = true,
      showStreak = false,
      showWeather = false,
      showAppointment = false
    } = options;
    const loggedToday = Array.isArray(logs) && logs.some((l) => l?.date === todayStr);
    const streakBroken = isLoggingStreakBroken(logs, todayStr);
    const showAiQuestions = aiEnabled && !simpleMode && loggedToday;
    return {
      loggedToday,
      streakBroken,
      aiEnabled: aiEnabled !== false,
      simpleMode: simpleMode === true,
      showGoals: showGoals !== false && aiEnabled !== false,
      showAiQuestions,
      showPacing: hasPacingData === true,
      showCheckin: showCheckin !== false && simpleMode !== true,
      showStreak: showStreak === true,
      showWeather: showWeather === true,
      showAppointment: showAppointment === true
    };
  }
  function resolveHomeCardOrder(context) {
    const ctx = context || {};
    const scored = [];
    for (const card of HOME_CARDS) {
      if (card.id === "nudge" && (!ctx.streakBroken || ctx.loggedToday)) continue;
      if (card.id === "goals" && !ctx.showGoals) continue;
      if (card.id === "pacing" && !ctx.showPacing) continue;
      if (card.id === "checkin" && !ctx.showCheckin) continue;
      if (card.id === "streak" && !ctx.showStreak) continue;
      if (card.id === "weather" && !ctx.showWeather) continue;
      if (card.id === "appointment" && !ctx.showAppointment) continue;
      let priority = card.basePriority;
      if (ctx.loggedToday && card.id === "goals") priority += 50;
      if (ctx.loggedToday && card.id === "checkin") priority += 35;
      if (ctx.loggedToday && card.id === "pacing") priority += 20;
      if (!ctx.loggedToday && card.id === "hero") priority += 30;
      if (!ctx.loggedToday && card.id === "nudge") priority += 80;
      if (ctx.streakBroken && card.id === "nudge") priority += 20;
      if (ctx.showAppointment && card.id === "appointment") priority += 25;
      if (ctx.loggedToday && card.id === "weather") priority += 15;
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

  // packages/shared/src/ai/explainChartContext.mjs
  var MAX_CONTEXT_CHARS3 = 720;
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
      const avg = trend.average != null && Number.isFinite(trend.average) ? trend.average.toFixed(1) : "\u2014";
      const cur = trend.current != null && Number.isFinite(trend.current) ? trend.current.toFixed(1) : "\u2014";
      const delta = trend.delta != null && Number.isFinite(trend.delta) ? `${trend.delta >= 0 ? "+" : ""}${trend.delta.toFixed(1)}` : "\u2014";
      parts.push(`${trend.label}: avg ${avg}, latest ${cur}, change ${delta} (${trend.points || 0} points).`);
    }
    const text = parts.join(" ");
    return text.length > MAX_CONTEXT_CHARS3 ? text.slice(0, MAX_CONTEXT_CHARS3) : text;
  }
  function buildExplainChartFallback(chartSummary = {}) {
    const trend = chartSummary.trends?.[0];
    if (!trend) return "Not enough chart data to narrate this range yet.";
    const label = trend.label || trend.key || "Metric";
    const avg = trend.average != null ? Number(trend.average).toFixed(1) : "\u2014";
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
  var MAX_CONTEXT_CHARS4 = 720;
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
    return text.length > MAX_CONTEXT_CHARS4 ? text.slice(0, MAX_CONTEXT_CHARS4) : text;
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
    return `You logged ${total} days this period. Keep noting what helps \u2014 patterns build with steady logging.`;
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
    if (!raw) return { allowed: true };
    let host = "";
    try {
      host = new URL(raw).hostname.toLowerCase();
    } catch {
      return { allowed: false, reason: "invalid_url" };
    }
    if (BLOCKED_COMMERCIAL_LLM_HOST_PATTERNS.some((re) => re.test(host))) {
      return { allowed: false, reason: "commercial_api_blocked" };
    }
    return { allowed: true };
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
      next.dateFormat = next.dateFormat || deriveDateFormatFromLocale(loc);
      next.firstDayOfWeek = typeof next.firstDayOfWeek === "number" ? next.firstDayOfWeek : deriveFirstDayOfWeekFromLocale(loc);
      next.localeDefaultsApplied = true;
    }
    return next;
  }

  // packages/shared/src/settings/avatars.mjs
  var PROFILE_AVATAR_IDS = ["leaf", "heart", "star", "sun", "pulse", "shield"];
  function normalizeProfileAvatar(value) {
    const id = typeof value === "string" ? value.trim() : "";
    return PROFILE_AVATAR_IDS.includes(id) ? id : "leaf";
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
    return rows;
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
  var OFF_API = "https://world.openfoodfacts.org/api/v2/product";
  async function fetchOpenFoodFactsProduct(barcode, fetchImpl = globalThis.fetch) {
    const code = String(barcode || "").replace(/\D/g, "");
    if (code.length < 8) throw new Error("Invalid barcode");
    if (typeof fetchImpl !== "function") throw new Error("fetch unavailable");
    const res = await fetchImpl(`${OFF_API}/${code}.json`, {
      headers: { Accept: "application/json", "User-Agent": "Rianell/1.0 (health PWA; contact: support@rianell.com)" }
    });
    if (!res.ok) throw new Error(`Open Food Facts HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 1 || !data.product) throw new Error("Product not found");
    const p = data.product;
    const name = p.product_name || p.generic_name || p.brands || "Unknown product";
    const brand = typeof p.brands === "string" ? p.brands.split(",")[0].trim() : "";
    return {
      barcode: code,
      name: String(name).trim().slice(0, 200),
      brand: brand.slice(0, 120),
      nutriScore: typeof p.nutriscore_grade === "string" ? p.nutriscore_grade.toUpperCase().slice(0, 1) : void 0,
      serving: typeof p.serving_size === "string" ? p.serving_size.slice(0, 80) : void 0
    };
  }
  function formatBarcodeFoodLabel(product) {
    if (!product || typeof product !== "object") return "";
    const parts = [product.brand, product.name].filter(Boolean);
    return parts.join(" \u2014 ").slice(0, 200);
  }

  // packages/shared/src/logging/voiceLogExtract.mjs
  var MOOD_WORDS = [
    ["great", 9],
    ["good", 7],
    ["okay", 5],
    ["low", 3],
    ["awful", 2]
  ];
  function extractLogFieldsFromVoiceTranscript(text) {
    const raw = typeof text === "string" ? text.trim() : "";
    if (!raw) return { notes: "" };
    const lower = raw.toLowerCase();
    let mood;
    for (const [word, score] of MOOD_WORDS) {
      if (lower.includes(word)) {
        mood = score;
        break;
      }
    }
    const fatigueMatch = lower.match(/fatigue(?: level)?\s*(?:was|is|at)?\s*(\d{1,2})/);
    const sleepMatch = lower.match(/sleep(?: was| is| score)?\s*(?:was|is|at)?\s*(\d{1,2})/);
    const painMatch = lower.match(/pain(?: level)?\s*(?:was|is|at)?\s*(\d{1,2})/);
    const flare = /\bflare\b|\bflaring\b/.test(lower) ? "Yes" : void 0;
    const out = {
      notes: raw.slice(0, 500),
      mood: mood ?? (fatigueMatch ? void 0 : 5),
      fatigue: fatigueMatch ? Math.min(10, parseInt(fatigueMatch[1], 10)) : void 0,
      sleep: sleepMatch ? Math.min(10, parseInt(sleepMatch[1], 10)) : void 0,
      jointPain: painMatch ? Math.min(10, parseInt(painMatch[1], 10)) : void 0,
      flare
    };
    Object.keys(out).forEach((k) => {
      if (out[k] === void 0) delete out[k];
    });
    return out;
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
      current: "pressure_msl,temperature_2m",
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
    if (temp == null && pressure == null && usAqi == null) return null;
    return {
      tempC: temp,
      pressureHpa: pressure,
      usAqi,
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
    const forecastRes = await fetchFn(forecastUrl);
    if (!forecastRes?.ok) return null;
    const forecastJson = await forecastRes.json();
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
      homeGapQuestionCache: v.homeGapQuestionCache && typeof v.homeGapQuestionCache === "object" ? v.homeGapQuestionCache : null,
      homeQuestionAnswerState: v.homeQuestionAnswerState && typeof v.homeQuestionAnswerState === "object" ? v.homeQuestionAnswerState : null
    };
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
    dailyFunction: "Daily Function",
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
      const aliases = Array.isArray(raw) ? raw : typeof raw === "string" && raw ? [raw, LOG_CSV_ENGLISH_HEADERS[id]] : [LOG_CSV_ENGLISH_HEADERS[id]];
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
    weight: { system: "http://loinc.org", code: "29463-7", display: "Body weight" }
  };
  function observationFor(log, field, value) {
    const coding = METRIC_CODES[field];
    if (!coding || value === void 0 || value === null || value === "") return null;
    const num = Number(value);
    const isNum = Number.isFinite(num);
    return {
      resourceType: "Observation",
      status: "final",
      category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "survey" }] }],
      code: { coding: [coding] },
      subject: { display: "Rianell user" },
      effectiveDateTime: `${log.date}T12:00:00Z`,
      valueQuantity: isNum ? { value: num, unit: field === "weight" ? "kg" : field === "bpm" ? "/min" : "{score}" } : void 0,
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
  var MIGRATION_SOURCES = [
    { id: "bearable", labelKey: "settings.import.migration.bearable" },
    { id: "flaredown", labelKey: "settings.import.migration.flaredown" },
    { id: "generic", labelKey: "settings.import.migration.generic" }
  ];
  function parseCsvLine2(line) {
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
    const entry = {
      date,
      mood: Number.isFinite(mood) ? mood : void 0,
      sleep: Number.isFinite(sleep) ? sleep : void 0,
      fatigue: Number.isFinite(fatigue) ? fatigue : void 0,
      notes: typeof raw.notes === "string" ? raw.notes.trim().slice(0, 500) : void 0,
      flare: raw.flare && Number(raw.flare) >= 7 ? "Yes" : "No"
    };
    Object.keys(entry).forEach((k) => {
      if (entry[k] === void 0) delete entry[k];
    });
    return entry;
  }
  function parseMigrationCsv(text, sourceId = "generic") {
    const lines = String(text || "").split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) throw new Error("Migration CSV must include a header row and data.");
    const headers = parseCsvLine2(lines[0]);
    const aliasMap = sourceId === "flaredown" ? FLAREDOWN_ALIASES : sourceId === "bearable" ? BEARABLE_ALIASES : { ...BEARABLE_ALIASES, ...FLAREDOWN_ALIASES };
    const logs = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine2(lines[i]);
      if (!values.some((v) => v)) continue;
      const raw = mapRow(headers, values, aliasMap);
      const entry = normalizeMigrationRow(raw);
      if (entry) logs.push(entry);
    }
    if (!logs.length) throw new Error("No rows could be mapped. Check column headers for your export source.");
    return logs;
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
      steps: clampInt2(v.steps, 0, 1e5) ?? d.steps,
      hydration: clampInt2(v.hydration, 0, 30) ?? d.hydration,
      sleep: clampInt2(v.sleep, 0, 10) ?? d.sleep,
      goodDaysPerWeek: clampInt2(v.goodDaysPerWeek, 0, 7) ?? d.goodDaysPerWeek
    };
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
  function clampInt2(raw, min, max) {
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
      bpm: clampInt2(v.bpm, 30, 120),
      weight: typeof v.weight === "string" ? v.weight : typeof v.weight === "number" ? v.weight.toFixed(1) : void 0,
      // stored as kg string (web)
      fatigue: clampInt2(v.fatigue, 0, 10),
      stiffness: clampInt2(v.stiffness, 0, 10),
      sleep: clampInt2(v.sleep, 0, 10),
      jointPain: clampInt2(v.jointPain, 0, 10),
      mobility: clampInt2(v.mobility, 0, 10),
      dailyFunction: clampInt2(v.dailyFunction, 0, 10),
      swelling: clampInt2(v.swelling, 0, 10),
      flare: v.flare === "Yes" ? "Yes" : v.flare === "No" ? "No" : "No",
      mood: clampInt2(v.mood, 0, 10),
      irritability: clampInt2(v.irritability, 0, 10),
      notes: normalizeString2(v.notes, 500),
      food: v.food && typeof v.food === "object" ? v.food : void 0,
      exercise: Array.isArray(v.exercise) ? v.exercise : void 0,
      energyClarity: normalizeString2(v.energyClarity, 80),
      stressors: Array.isArray(v.stressors) ? v.stressors.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim()).slice(0, 50) : void 0,
      symptoms: Array.isArray(v.symptoms) ? v.symptoms.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim()).slice(0, 80) : void 0,
      weatherSensitivity: clampInt2(v.weatherSensitivity, 1, 10),
      painLocation: normalizeString2(v.painLocation, 150),
      steps: typeof v.steps === "number" ? v.steps : typeof v.steps === "string" ? parseInt(v.steps, 10) : void 0,
      hydration: typeof v.hydration === "number" ? v.hydration : typeof v.hydration === "string" ? parseFloat(v.hydration) : void 0,
      medications: Array.isArray(v.medications) ? v.medications : void 0,
      subEntries: normalizeSubEntries(v.subEntries),
      cycle: normalizeCycleFields(v.cycle),
      medicationDoses: normalizeMedicationDoses(v.medicationDoses),
      barcodeFood: typeof v.barcodeFood === "string" ? v.barcodeFood.slice(0, 200) : void 0,
      customMetrics: normalizeCustomMetricValues(v.customMetrics)
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
