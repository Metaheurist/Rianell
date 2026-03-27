/**
 * Extends app.json with env-driven extras (Supabase for cloud login parity with web).
 * Icons and adaptive icons remain in app.json (merged below).
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

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...(appJson.expo.extra || {}),
      // Keep RN sourced from the same CI/local secret names used by web/Capacitor.
      supabaseUrl,
      supabaseAnonKey,
      llmEndpoint,
    },
  },
};
