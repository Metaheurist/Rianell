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
    HOME_SUGGESTIONS_MAX_CHIPS: () => HOME_SUGGESTIONS_MAX_CHIPS,
    HOME_SUGGESTIONS_MIN_DAYS: () => HOME_SUGGESTIONS_MIN_DAYS,
    HOME_SUGGESTIONS_RANGE_DAYS: () => HOME_SUGGESTIONS_RANGE_DAYS,
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
    analysisSnapshotFromSummary: () => analysisSnapshotFromSummary,
    applyMigrationPendingFlag: () => applyMigrationPendingFlag,
    applyPrivacyProfileToLocal: () => applyPrivacyProfileToLocal,
    applyRegionDefaultLocale: () => applyRegionDefaultLocale,
    applyRegionDowngradeToggles: () => applyRegionDowngradeToggles,
    buildHomeQuestionContext: () => buildHomeQuestionContext,
    buildHomeQuestionFallback: () => buildHomeQuestionFallback,
    buildHomeQuestionPrompt: () => buildHomeQuestionPrompt,
    buildLlmRequestPayload: () => buildLlmRequestPayload,
    buildMotdPrompt: () => buildMotdPrompt,
    buildSuggestPrompt: () => buildSuggestPrompt,
    buildSummaryPrompt: () => buildSummaryPrompt,
    canChooseDataResidency: () => canChooseDataResidency,
    checkPolicyDrift: () => checkPolicyDrift,
    checkPolicyDriftSync: () => checkPolicyDriftSync,
    clearMigrationPending: () => clearMigrationPending,
    computeHomeAnalysisSnapshot: () => computeHomeAnalysisSnapshot,
    createSampleLogEntry: () => createSampleLogEntry,
    createTranslator: () => createTranslator,
    existsSync: () => existsSync,
    filterLogsForHomeSuggestions: () => filterLogsForHomeSuggestions,
    formatDate: () => formatDate,
    formatNumber: () => formatNumber,
    formatRelativeDay: () => formatRelativeDay,
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
    isRtlLocale: () => isRtlLocale,
    isValidLocaleId: () => isValidLocaleId,
    isValidPrivacyRegion: () => isValidPrivacyRegion,
    languageNameForLocale: () => languageNameForLocale,
    loadPolicyPackFromDisk: () => loadPolicyPackFromDisk,
    loadPromptPack: () => loadPromptPack,
    localeFallbackChain: () => localeFallbackChain,
    localeLabel: () => localeLabel,
    mergeHealthLogs: () => mergeHealthLogs,
    needsDataResidencyMigration: () => needsDataResidencyMigration,
    normalizeAccessibilitySettings: () => normalizeAccessibilitySettings,
    normalizeGoals: () => normalizeGoals,
    normalizeLogEntry: () => normalizeLogEntry,
    normalizePreferencesPartial: () => normalizePreferencesPartial,
    pickHomeAiSuggestions: () => pickHomeAiSuggestions,
    prefsToConsents: () => prefsToConsents,
    privacyProfileFromLocal: () => privacyProfileFromLocal,
    readTextFileSync: () => readTextFileSync,
    resolveActiveLocale: () => resolveActiveLocale,
    resolveAuthResidencyCode: () => resolveAuthResidencyCode,
    resolveDataResidency: () => resolveDataResidency,
    resolvePolicyPack: () => resolvePolicyPack,
    setPolicyPack: () => setPolicyPack,
    suggestPrivacyRegionFromHint: () => suggestPrivacyRegionFromHint,
    t: () => t,
    textDirection: () => textDirection
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
        "label": "United States \u2014 California",
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
        "label": "United States \u2014 other states",
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
    "pt-PT",
    "ar",
    "he"
  ];
  var DEFAULT_LOCALE = "en-GB";
  var DEFAULT_PRIVACY_REGION = "eea_uk";
  function isValidLocaleId(id) {
    if (typeof id !== "string") return false;
    if (SHIPPED_LOCALES.includes(id)) return true;
    return id === "ar" || id === "he" || id.startsWith("ar-") || id.startsWith("he-");
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
      he: "\u05E2\u05D1\u05E8\u05D9\u05EA"
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
        "context.improving": "Improving: {metrics}.",
        "context.worsening": "Worsening: {metrics}.",
        "context.stable": "Stable: {metrics}.",
        "context.dataLine": "{dayCount} day(s) of data.",
        "context.flares": "Flares: {count} day(s).",
        "context.topStressor": "Top stressor: {name}{pct}."
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
    "fr-FR": {
      "locale": "fr-FR",
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
    "nl-NL": {
      "locale": "nl-NL",
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
    "pl-PL": {
      "locale": "pl-PL",
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
    "pt-BR": {
      "locale": "pt-BR",
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
    "pt-PT": {
      "locale": "pt-PT",
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
    }
  };

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
  function buildMotdPrompt(locale, theme, options = {}) {
    const pack = loadPromptPack(locale, options.packs);
    const system = promptString(
      pack,
      "motd.system",
      "You write one short, simple quote about healthy living for a health tracking app. Topics: sleep, water, gentle movement, rest, fresh air, balanced food, or stress relief. Use plain everyday words. Max 18 words. No names. No medical advice. No quotation marks. Reply with only the quote sentence."
    );
    const userBase = promptString(pack, "motd.user", "Write one healthy-lifestyle quote.");
    const user = theme ? `${userBase} Theme: ${theme}.` : userBase;
    return { system, user };
  }
  function buildSummaryPrompt(locale, context, options = {}) {
    const pack = loadPromptPack(locale, options.packs);
    const system = promptString(
      pack,
      "summary.system",
      "You summarise health tracking data for the patient in exactly 2 short sentences. Use only the data provided. Mention 1-2 specific findings. Be clear and encouraging. Reply with only the summary text."
    );
    return { system, user: `Data: ${context}` };
  }
  function buildSuggestPrompt(locale, context, options = {}) {
    const pack = loadPromptPack(locale, options.packs);
    const system = promptString(
      pack,
      "suggest.system",
      "You write one short sentence for a daily health log note. Compare today to the recent average. Use only the data provided. Reply with only the note sentence."
    );
    return { system, user: `Data: ${context}` };
  }
  function buildHomeQuestionPrompt(locale, context, options = {}) {
    const pack = loadPromptPack(locale, options.packs);
    const system = promptString(
      pack,
      "homeQuestion.system",
      "You answer one specific health-tracking question using only the data provided. Write 3\u20135 short sentences in plain language. No diagnosis or medical orders. Be encouraging. Reply with only the answer text."
    );
    return { system, user: context };
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

  // packages/shared/src/ai/homeSuggestions.mjs
  var HOME_SUGGESTIONS_RANGE_DAYS = 14;
  var HOME_SUGGESTIONS_MIN_DAYS = 3;
  var HOME_SUGGESTIONS_MAX_CHIPS = 3;
  var SYMPTOM_FREQ_THRESHOLD = 3;
  var FLARE_DAYS_THRESHOLD = 2;
  var CORRELATION_THRESHOLD = 0.35;
  function toDate(value) {
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
      const d = toDate(log?.date);
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
      const d = toDate(l.date);
      return d && d >= weekAgo && d <= today;
    });
    const lastWeek = logs.filter((l) => {
      const d = toDate(l.date);
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
  function pickHomeAiSuggestions(logs, analysis, options = {}) {
    const {
      aiEnabled = true,
      loggedToday = false,
      rangeDays = HOME_SUGGESTIONS_RANGE_DAYS,
      minDays = HOME_SUGGESTIONS_MIN_DAYS,
      maxChips = HOME_SUGGESTIONS_MAX_CHIPS
    } = options;
    if (!aiEnabled || !loggedToday) return [];
    const recent = filterLogsForHomeSuggestions(logs, rangeDays);
    if (recent.length < minDays) return [];
    const snapshot = analysis || computeHomeAnalysisSnapshot(logs, rangeDays);
    const workLogs = snapshot._logs || recent;
    const picked = [];
    const used = /* @__PURE__ */ new Set();
    function add(id, labelKey, labelParams) {
      if (picked.length >= maxChips || used.has(id)) return;
      used.add(id);
      picked.push({ id, labelKey, labelParams: labelParams || {} });
    }
    const sym = topSymptomName(workLogs);
    if (sym) add("symptom", "home.questions.symptom", { symptom: sym.name });
    const flareDays = snapshot.flareDays ?? workLogs.filter((l) => l.flare === "Yes").length;
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
    const stressor = snapshot.topStressors?.[0] || (topStressorName(workLogs)?.name ?? null);
    if (stressor) add("stressor", "home.questions.stressor", { stressor: String(stressor) });
    const corr = findCorrelationPair(workLogs);
    if (corr) {
      add("correlation", "home.questions.correlation", {
        a: METRIC_LABELS[corr.a] || corr.a,
        b: METRIC_LABELS[corr.b] || corr.b
      });
    }
    if (weekCompare(workLogs)) add("compare", "home.questions.compare", {});
    return picked.slice(0, maxChips);
  }
  function buildHomeQuestionFallback(suggestion, analysis) {
    const snap = analysis || {};
    const id = suggestion?.id || "";
    if (id === "symptom" && suggestion.labelParams?.symptom) {
      return `${suggestion.labelParams.symptom} appears often in your recent logs \u2014 track triggers and rest on high-symptom days.`;
    }
    if (id === "flare" && snap.flareDays != null) {
      return `You logged ${snap.flareDays} flare day(s) recently. Note sleep, stress, and activity around those dates.`;
    }
    if (id.startsWith("trend-") && snap.avgFatigue != null) {
      return `Recent averages \u2014 fatigue ${snap.avgFatigue.toFixed(1)}, sleep ${snap.avgSleep != null ? snap.avgSleep.toFixed(1) : "\u2014"}, mood ${snap.avgMood != null ? snap.avgMood.toFixed(1) : "\u2014"} (1\u201310).`;
    }
    if (id === "stressor" && suggestion.labelParams?.stressor) {
      return `${suggestion.labelParams.stressor} shows up in your stress logs \u2014 consider pacing and recovery after high-stress days.`;
    }
    if (id === "compare") {
      return "Compare this week\u2019s scores to last week in Charts to spot gradual shifts.";
    }
    return "Keep logging daily \u2014 patterns become clearer with more entries.";
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
    const recentNotes = (logs || []).map((l) => l && l.notes ? String(l.notes).trim() : "").filter(Boolean);
    if (recentNotes.length) parts.push(wrapUserNote(recentNotes[recentNotes.length - 1]));
    const text = parts.join(" ");
    return text.length > MAX_CONTEXT_CHARS ? text.slice(0, MAX_CONTEXT_CHARS) : text;
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
