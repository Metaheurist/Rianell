export type ConnectorProviderId = 'strava' | 'withings' | 'google-sheets';

export const CONNECTOR_SPECS: Record<ConnectorProviderId, {
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientIdEnv: string;
  clientSecretEnv: string;
  extraAuthParams?: Record<string, string>;
}> = {
  strava: {
    authUrl: 'https://www.strava.com/oauth/authorize',
    tokenUrl: 'https://www.strava.com/oauth/token',
    scopes: ['activity:read_all'],
    clientIdEnv: 'STRAVA_CLIENT_ID',
    clientSecretEnv: 'STRAVA_CLIENT_SECRET',
  },
  withings: {
    authUrl: 'https://account.withings.com/oauth2_user/authorize2',
    tokenUrl: 'https://wbsapi.withings.net/v2/oauth2',
    scopes: ['user.metrics', 'user.activity'],
    clientIdEnv: 'WITHINGS_CLIENT_ID',
    clientSecretEnv: 'WITHINGS_CLIENT_SECRET',
  },
  'google-sheets': {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
    extraAuthParams: { access_type: 'offline', prompt: 'consent' },
  },
};

export function getProviderCredentials(provider: string) {
  const spec = CONNECTOR_SPECS[provider as ConnectorProviderId];
  if (!spec) return null;
  const clientId = Deno.env.get(spec.clientIdEnv) || '';
  const clientSecret = Deno.env.get(spec.clientSecretEnv) || '';
  if (!clientId || !clientSecret) return null;
  return { spec, clientId, clientSecret };
}

export function callbackUrl(provider: string) {
  const base = Deno.env.get('SUPABASE_URL')!.replace(/\/$/, '');
  return `${base}/functions/v1/connector-callback?provider=${encodeURIComponent(provider)}`;
}

export function buildAuthorizeUrl(provider: string, state: string) {
  const creds = getProviderCredentials(provider);
  if (!creds) throw new Error('Provider not configured');
  const u = new URL(creds.spec.authUrl);
  u.searchParams.set('client_id', creds.clientId);
  u.searchParams.set('redirect_uri', callbackUrl(provider));
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('scope', creds.spec.scopes.join(' '));
  u.searchParams.set('state', state);
  if (provider === 'withings') {
    u.searchParams.set('mode', 'demo');
  }
  for (const [k, v] of Object.entries(creds.spec.extraAuthParams || {})) {
    u.searchParams.set(k, v);
  }
  return u.toString();
}

export async function exchangeCodeForTokens(provider: string, code: string) {
  const creds = getProviderCredentials(provider);
  if (!creds) throw new Error('Provider not configured');
  const body = new URLSearchParams({
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: callbackUrl(provider),
  });
  const res = await fetch(creds.spec.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Token exchange failed');
  return data;
}

export async function refreshAccessToken(provider: string, refreshToken: string) {
  const creds = getProviderCredentials(provider);
  if (!creds) throw new Error('Provider not configured');
  const body = new URLSearchParams({
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  const res = await fetch(creds.spec.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Refresh failed');
  return data;
}
