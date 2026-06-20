/**
 * Smartlook session recording — shared project key + EU region (PWA + RN parity).
 * Client-side key; rotate in Smartlook dashboard if compromised.
 */
export const SMARTLOOK_PROJECT_KEY = 'c205987c47aef0b2da2a93569620b15a81bef013';
export const SMARTLOOK_REGION = 'eu';
export const SMARTLOOK_SDK_URL = 'https://web-sdk.smartlook.com/recorder.js';

export function resolveSmartlookProjectKey(candidate) {
  const key = typeof candidate === 'string' ? candidate.trim() : '';
  if (key && key !== 'YOUR_SMARTLOOK_PROJECT_KEY') return key;
  return SMARTLOOK_PROJECT_KEY;
}

export function resolveSmartlookRegion(candidate) {
  const region = typeof candidate === 'string' ? candidate.trim() : '';
  return region || SMARTLOOK_REGION;
}
