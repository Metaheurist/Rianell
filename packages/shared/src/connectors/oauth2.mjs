/** Plan 19 CN1 — OAuth2 PKCE connector framework. */

export const OAUTH2_SCOPES = ['logs:read', 'metrics:read', 'goals:read', 'profile:read', 'logs:write'];

export function generateCodeVerifier() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return base64UrlEncode(bytes);
}

export async function deriveCodeChallenge(verifier) {
  const data = new TextEncoder().encode(String(verifier || ''));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(bytes) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64url');
  }
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function buildAuthorizeUrl(baseUrl, params) {
  const u = new URL(`${String(baseUrl || '').replace(/\/$/, '')}/oauth2-authorize`);
  u.searchParams.set('client_id', params.clientId);
  u.searchParams.set('redirect_uri', params.redirectUri);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('scope', (params.scopes || ['logs:read']).join(' '));
  u.searchParams.set('code_challenge', params.codeChallenge);
  u.searchParams.set('code_challenge_method', 'S256');
  if (params.state) u.searchParams.set('state', params.state);
  return u.toString();
}

/** Connector provider registry (CN4–CN7). */
export const CONNECTOR_PROVIDERS = {
  'google-sheets': { id: 'google-sheets', label: 'Google Sheets', oauth: true },
  withings: { id: 'withings', label: 'Withings', oauth: true },
  strava: { id: 'strava', label: 'Strava', oauth: true },
  health_connect: { id: 'health_connect', label: 'Health Connect', oauth: false, platform: 'android' },
  fhir_import: { id: 'fhir_import', label: 'FHIR Import', oauth: false },
};
