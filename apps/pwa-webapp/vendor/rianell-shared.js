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
    DEFAULT_GOALS: () => DEFAULT_GOALS,
    DEFAULT_LOCALE: () => DEFAULT_LOCALE,
    DEFAULT_PRIVACY_REGION: () => DEFAULT_PRIVACY_REGION,
    GOALS_STORAGE_KEY: () => GOALS_STORAGE_KEY,
    LOGS_BACKUP_KEY: () => LOGS_BACKUP_KEY,
    LOGS_STORAGE_KEY_MOBILE_LEGACY: () => LOGS_STORAGE_KEY_MOBILE_LEGACY,
    LOGS_STORAGE_KEY_V1: () => LOGS_STORAGE_KEY_V1,
    MIGRATION_COPY: () => MIGRATION_COPY,
    OFFLINE_QUEUE_KEY: () => OFFLINE_QUEUE_KEY,
    POLICY_SUMMARIES: () => POLICY_SUMMARIES,
    PREDICTION_STATE_KEY: () => PREDICTION_STATE_KEY,
    PREFS_STORAGE_KEY_MOBILE: () => PREFS_STORAGE_KEY_MOBILE,
    PRIVACY_REGIONS: () => PRIVACY_REGIONS,
    SETTINGS_STORAGE_KEY: () => SETTINGS_STORAGE_KEY,
    SHIPPED_LOCALES: () => SHIPPED_LOCALES,
    UNSET_PRIVACY_REGION: () => UNSET_PRIVACY_REGION,
    applyMigrationPendingFlag: () => applyMigrationPendingFlag,
    applyPrivacyProfileToLocal: () => applyPrivacyProfileToLocal,
    applyRegionDefaultLocale: () => applyRegionDefaultLocale,
    applyRegionDowngradeToggles: () => applyRegionDowngradeToggles,
    canChooseDataResidency: () => canChooseDataResidency,
    checkPolicyDrift: () => checkPolicyDrift,
    checkPolicyDriftSync: () => checkPolicyDriftSync,
    clearMigrationPending: () => clearMigrationPending,
    createSampleLogEntry: () => createSampleLogEntry,
    createTranslator: () => createTranslator,
    existsSync: () => existsSync,
    getDefaultAccessibilitySettings: () => getDefaultAccessibilitySettings,
    getDefaultAppSettingsFields: () => getDefaultAppSettingsFields,
    getDefaultLocaleForRegion: () => getDefaultLocaleForRegion,
    getFeatureAvailability: () => getFeatureAvailability,
    getPolicyDocumentsForRegion: () => getPolicyDocumentsForRegion,
    getPolicyDocumentsForRegionI18n: () => getPolicyDocumentsForRegionI18n,
    getPolicyPack: () => getPolicyPack,
    getRegionLabels: () => getRegionLabels,
    getResidencyChooserOptions: () => getResidencyChooserOptions,
    getResidencyConfigFromEnv: () => getResidencyConfigFromEnv,
    getResidencyDisplayLabel: () => getResidencyDisplayLabel,
    getResidencyRegistry: () => getResidencyRegistry,
    getSupportedLocalesForRegion: () => getSupportedLocalesForRegion,
    identity: () => identity,
    isCloudSyncBlockedByMigration: () => isCloudSyncBlockedByMigration,
    isPrivacyRegionConfigured: () => isPrivacyRegionConfigured,
    isValidLocaleId: () => isValidLocaleId,
    isValidPrivacyRegion: () => isValidPrivacyRegion,
    loadPolicyPackFromDisk: () => loadPolicyPackFromDisk,
    localeFallbackChain: () => localeFallbackChain,
    localeLabel: () => localeLabel,
    mergeHealthLogs: () => mergeHealthLogs,
    needsDataResidencyMigration: () => needsDataResidencyMigration,
    normalizeAccessibilitySettings: () => normalizeAccessibilitySettings,
    normalizeGoals: () => normalizeGoals,
    normalizeLogEntry: () => normalizeLogEntry,
    normalizePreferencesPartial: () => normalizePreferencesPartial,
    prefsToConsents: () => prefsToConsents,
    privacyProfileFromLocal: () => privacyProfileFromLocal,
    readTextFileSync: () => readTextFileSync,
    resolveActiveLocale: () => resolveActiveLocale,
    resolveAuthResidencyCode: () => resolveAuthResidencyCode,
    resolveDataResidency: () => resolveDataResidency,
    resolvePolicyPack: () => resolvePolicyPack,
    setPolicyPack: () => setPolicyPack,
    suggestPrivacyRegionFromHint: () => suggestPrivacyRegionFromHint,
    t: () => t
  });

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
      title: "EEA & UK \u2014 GDPR",
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
      title: "United States \u2014 other states",
      summary: "Consumer wellness self-tracking is generally outside HIPAA unless you are a covered entity or business associate. State privacy laws may grant access and deletion rights similar to our global baseline."
    },
    "other-jurisdictions-au": {
      id: "other-jurisdictions-au",
      title: "Australia \u2014 APPs",
      summary: "Australian Privacy Principles apply to personal information we hold. You may access and correct your data. Notifiable data breach rules apply to serious incidents affecting your information."
    },
    "other-jurisdictions-br": {
      id: "other-jurisdictions-br",
      title: "Brazil \u2014 LGPD",
      summary: "LGPD grants rights of confirmation, access, correction, anonymisation, portability, and deletion. Consent is the primary legal basis for health-related processing in the app."
    }
  };

  // policy-packs/v1.json
  var v1_default = {
    version: "1.0.0",
    policyPackId: "v1.0.0",
    regions: {
      eea_uk: {
        label: "EEA & United Kingdom",
        defaultLocale: "en-GB",
        supportedLocales: ["en-GB", "fr-FR", "de-DE", "es-ES", "it-IT", "pl-PL", "nl-NL", "pt-PT"],
        requiredDataResidency: "default",
        policyDocuments: ["global-baseline", "eu-gdpr", "data-subject-rights"],
        features: {
          localHealthLogging: { enabled: true, requiredConsents: ["healthData"] },
          cloudEncryptedBackup: { enabled: true, requiredConsents: ["healthData", "cloudSync"] },
          anonymizedResearchPool: { enabled: true, requiredConsents: ["healthData", "anonContribution"] },
          onDeviceLlmDownload: { enabled: true, requiredConsents: ["healthData", "aiModel"] },
          openDataPoolForAi: { enabled: true, requiredConsents: ["healthData"] },
          bugReports: { enabled: true, requiredConsents: [] },
          ePrivacyStorageBanner: { enabled: true, requiredConsents: [] }
        }
      },
      us_ca: {
        label: "United States \u2014 California",
        defaultLocale: "en-US",
        supportedLocales: ["en-US"],
        requiredDataResidency: "default",
        policyDocuments: ["global-baseline", "other-jurisdictions-us-ca", "data-subject-rights"],
        features: {
          localHealthLogging: { enabled: true, requiredConsents: ["healthData"] },
          cloudEncryptedBackup: { enabled: true, requiredConsents: ["healthData", "cloudSync"] },
          anonymizedResearchPool: { enabled: true, requiredConsents: ["healthData", "anonContribution"] },
          onDeviceLlmDownload: { enabled: true, requiredConsents: ["healthData", "aiModel"] },
          openDataPoolForAi: { enabled: true, requiredConsents: ["healthData"] },
          bugReports: { enabled: true, requiredConsents: [] },
          ePrivacyStorageBanner: { enabled: false, requiredConsents: [] }
        }
      },
      us_other: {
        label: "United States \u2014 other states",
        defaultLocale: "en-US",
        supportedLocales: ["en-US"],
        requiredDataResidency: "default",
        policyDocuments: ["global-baseline", "other-jurisdictions-us", "data-subject-rights"],
        features: {
          localHealthLogging: { enabled: true, requiredConsents: ["healthData"] },
          cloudEncryptedBackup: { enabled: true, requiredConsents: ["healthData", "cloudSync"] },
          anonymizedResearchPool: { enabled: true, requiredConsents: ["healthData", "anonContribution"] },
          onDeviceLlmDownload: { enabled: true, requiredConsents: ["healthData", "aiModel"] },
          openDataPoolForAi: { enabled: true, requiredConsents: ["healthData"] },
          bugReports: { enabled: true, requiredConsents: [] },
          ePrivacyStorageBanner: { enabled: false, requiredConsents: [] }
        }
      },
      au: {
        label: "Australia",
        defaultLocale: "en-AU",
        supportedLocales: ["en-AU"],
        requiredDataResidency: "default",
        policyDocuments: ["global-baseline", "other-jurisdictions-au", "data-subject-rights"],
        features: {
          localHealthLogging: { enabled: true, requiredConsents: ["healthData"] },
          cloudEncryptedBackup: { enabled: true, requiredConsents: ["healthData", "cloudSync"] },
          anonymizedResearchPool: { enabled: true, requiredConsents: ["healthData", "anonContribution"] },
          onDeviceLlmDownload: { enabled: true, requiredConsents: ["healthData", "aiModel"] },
          openDataPoolForAi: { enabled: true, requiredConsents: ["healthData"] },
          bugReports: { enabled: true, requiredConsents: [] },
          ePrivacyStorageBanner: { enabled: false, requiredConsents: [] }
        }
      },
      br: {
        label: "Brazil",
        defaultLocale: "pt-BR",
        supportedLocales: ["pt-BR"],
        requiredDataResidency: "default",
        policyDocuments: ["global-baseline", "other-jurisdictions-br", "data-subject-rights"],
        features: {
          localHealthLogging: { enabled: true, requiredConsents: ["healthData"] },
          cloudEncryptedBackup: { enabled: true, requiredConsents: ["healthData", "cloudSync"] },
          anonymizedResearchPool: { enabled: true, requiredConsents: ["healthData", "anonContribution"] },
          onDeviceLlmDownload: { enabled: true, requiredConsents: ["healthData", "aiModel"] },
          openDataPoolForAi: { enabled: true, requiredConsents: ["healthData"] },
          bugReports: { enabled: true, requiredConsents: [] },
          ePrivacyStorageBanner: { enabled: false, requiredConsents: [] }
        }
      },
      other: {
        label: "Rest of world",
        defaultLocale: "en-GB",
        supportedLocales: ["en-GB", "en-US", "en-AU", "pt-BR", "fr-FR", "de-DE", "es-ES", "it-IT", "pl-PL", "nl-NL", "pt-PT"],
        requiredDataResidency: "default",
        policyDocuments: ["global-baseline", "data-subject-rights"],
        features: {
          localHealthLogging: { enabled: true, requiredConsents: ["healthData"] },
          cloudEncryptedBackup: { enabled: true, requiredConsents: ["healthData", "cloudSync"] },
          anonymizedResearchPool: { enabled: false, requiredConsents: ["healthData", "anonContribution"] },
          onDeviceLlmDownload: { enabled: true, requiredConsents: ["healthData", "aiModel"] },
          openDataPoolForAi: { enabled: true, requiredConsents: ["healthData"] },
          bugReports: { enabled: true, requiredConsents: [] },
          ePrivacyStorageBanner: { enabled: false, requiredConsents: [] }
        }
      }
    }
  };

  // packages/shared/src/privacy/policyPackData.mjs
  var POLICY_PACK_V1 = v1_default;

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

  // packages/shared/src/privacy/getPolicyDocuments.mjs
  function getPolicyDocumentsForRegion(regionId, pack) {
    const resolved = resolvePolicyPack(regionId, pack);
    return (resolved.policyDocuments || []).map((docId) => POLICY_SUMMARIES[docId]).filter(Boolean);
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
    "pt-PT"
  ];
  var DEFAULT_LOCALE = "en-GB";
  var DEFAULT_PRIVACY_REGION = "eea_uk";
  function isValidLocaleId(id) {
    return typeof id === "string" && SHIPPED_LOCALES.includes(id);
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
      "pt-PT": "Portugu\xEAs (Portugal)"
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
    return {
      textScale,
      largeTextEnabled: v.largeTextEnabled === true,
      ttsEnabled: v.ttsEnabled === true,
      ttsReadModeEnabled: v.ttsReadModeEnabled === true,
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
      steps: clampInt(v.steps, 0, 1e5) ?? d.steps,
      hydration: clampInt(v.hydration, 0, 30) ?? d.hydration,
      sleep: clampInt(v.sleep, 0, 10) ?? d.sleep,
      goodDaysPerWeek: clampInt(v.goodDaysPerWeek, 0, 7) ?? d.goodDaysPerWeek
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
  function clampInt(raw, min, max) {
    const n = typeof raw === "number" ? raw : typeof raw === "string" ? parseInt(raw, 10) : NaN;
    if (!Number.isFinite(n)) return void 0;
    return Math.max(min, Math.min(max, Math.trunc(n)));
  }
  function normalizeString(raw, maxLen) {
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
      bpm: clampInt(v.bpm, 30, 120),
      weight: typeof v.weight === "string" ? v.weight : typeof v.weight === "number" ? v.weight.toFixed(1) : void 0,
      // stored as kg string (web)
      fatigue: clampInt(v.fatigue, 0, 10),
      stiffness: clampInt(v.stiffness, 0, 10),
      sleep: clampInt(v.sleep, 0, 10),
      jointPain: clampInt(v.jointPain, 0, 10),
      mobility: clampInt(v.mobility, 0, 10),
      dailyFunction: clampInt(v.dailyFunction, 0, 10),
      swelling: clampInt(v.swelling, 0, 10),
      flare: v.flare === "Yes" ? "Yes" : v.flare === "No" ? "No" : "No",
      mood: clampInt(v.mood, 0, 10),
      irritability: clampInt(v.irritability, 0, 10),
      notes: normalizeString(v.notes, 500),
      food: v.food && typeof v.food === "object" ? v.food : void 0,
      exercise: Array.isArray(v.exercise) ? v.exercise : void 0,
      energyClarity: normalizeString(v.energyClarity, 80),
      stressors: Array.isArray(v.stressors) ? v.stressors.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim()).slice(0, 50) : void 0,
      symptoms: Array.isArray(v.symptoms) ? v.symptoms.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim()).slice(0, 80) : void 0,
      weatherSensitivity: clampInt(v.weatherSensitivity, 1, 10),
      painLocation: normalizeString(v.painLocation, 150),
      steps: typeof v.steps === "number" ? v.steps : typeof v.steps === "string" ? parseInt(v.steps, 10) : void 0,
      hydration: typeof v.hydration === "number" ? v.hydration : typeof v.hydration === "string" ? parseFloat(v.hydration) : void 0,
      medications: Array.isArray(v.medications) ? v.medications : void 0
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
