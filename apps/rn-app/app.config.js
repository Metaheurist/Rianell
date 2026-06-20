/**
 * Extends app.json with env-driven extras (Supabase for cloud login parity with web).
 */
const appJson = require('./app.json');

function firstNonEmpty(...vals) {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

const supabaseUrl = firstNonEmpty(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_URL
);

const supabaseAnonKey = firstNonEmpty(
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  process.env.SUPABASE_PUBLISHABLE_KEY,
  process.env.SUPABASE_ANON_KEY
);
const llmEndpoint = firstNonEmpty(
  process.env.EXPO_PUBLIC_LLM_ENDPOINT,
  process.env.LLM_ENDPOINT
);
const modelsBaseUrl = firstNonEmpty(
  process.env.EXPO_PUBLIC_MODELS_BASE_URL,
  process.env.MODELS_BASE_URL,
  llmEndpoint,
  'https://rianell.com/'
);
const iosBundleIdentifier = firstNonEmpty(
  process.env.EXPO_PUBLIC_IOS_BUNDLE_IDENTIFIER,
  process.env.IOS_BUNDLE_IDENTIFIER,
  appJson?.expo?.ios?.bundleIdentifier,
  'com.anonymous.mobile'
);
const { resolveSmartlookProjectKey, resolveSmartlookRegion } =
  require('../../packages/shared/src/analytics/smartlookConfig.mjs');

const smartlookProjectKey = resolveSmartlookProjectKey(
  firstNonEmpty(
    process.env.EXPO_PUBLIC_SMARTLOOK_PROJECT_KEY,
    process.env.SMARTLOOK_PROJECT_KEY
  )
);
const smartlookRegion = resolveSmartlookRegion(
  firstNonEmpty(
    process.env.EXPO_PUBLIC_SMARTLOOK_REGION,
    process.env.SMARTLOOK_REGION
  )
);

module.exports = {
  expo: {
    ...appJson.expo,
    ios: {
      ...(appJson.expo.ios || {}),
      bundleIdentifier: iosBundleIdentifier,
    },
    extra: {
      ...(appJson.expo.extra || {}),
      supabaseUrl,
      supabaseAnonKey,
      smartlookProjectKey,
      smartlookRegion,
      llmEndpoint,
      modelsBaseUrl,
    },
  },
};
