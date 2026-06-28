import { isFirstRunWizardComplete } from '../onboarding/firstRunOrchestrator.mjs';

/**
 * Suppress passive "you have not logged today" prompts during onboarding or before
 * the user has created their first entry.
 * @param {Record<string, unknown>} prefs
 * @param {unknown[]} logs
 * @param {import('../onboarding/firstRunSteps.mjs').FirstRunPlatformContext} [ctx]
 */
export function shouldSuppressFirstRunLoggingPrompt(prefs, logs, ctx) {
  const logArr = Array.isArray(logs) ? logs : [];
  if (logArr.length === 0) return true;
  return !isFirstRunWizardComplete(prefs, ctx);
}
