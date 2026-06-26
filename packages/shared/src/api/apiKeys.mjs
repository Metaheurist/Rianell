/** Plan 18 API4 — API key generation helpers (client-side display; hash stored server-side). */

const KEY_PREFIX = 'rn_live_';
const KEY_HEX_LEN = 32;

export function generateRawApiKey(randomBytes = crypto.getRandomValues(new Uint8Array(KEY_HEX_LEN / 2))) {
  const hex = Array.from(randomBytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${KEY_PREFIX}${hex}`;
}

export function apiKeyDisplayPrefix(rawKey) {
  const s = String(rawKey || '');
  if (!s.startsWith(KEY_PREFIX)) return s.slice(0, 12);
  return `${s.slice(0, KEY_PREFIX.length + 8)}…`;
}

export async function hashApiKey(rawKey) {
  const data = new TextEncoder().encode(String(rawKey || ''));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export const DEFAULT_API_SCOPES = ['logs:read'];

export const WEBHOOK_EVENTS = ['log.created', 'flare.detected', 'goal.achieved'];

export function isValidWebhookUrl(url) {
  try {
    const u = new URL(String(url || ''));
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}
