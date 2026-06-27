/** Canonical third-party connector registry (CN4–CN7). Slugs use hyphens. */

export const CONNECTOR_PROVIDER_SPECS = {
  strava: {
    id: 'strava',
    label: 'Strava',
    oauth: true,
    authUrl: 'https://www.strava.com/oauth/authorize',
    tokenUrl: 'https://www.strava.com/oauth/token',
    scopes: ['activity:read_all'],
    syncMode: 'import',
  },
  withings: {
    id: 'withings',
    label: 'Withings',
    oauth: true,
    authUrl: 'https://account.withings.com/oauth2_user/authorize2',
    tokenUrl: 'https://wbsapi.withings.net/v2/oauth2',
    scopes: ['user.metrics', 'user.activity'],
    syncMode: 'import',
  },
  'google-sheets': {
    id: 'google-sheets',
    label: 'Google Sheets',
    oauth: true,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    syncMode: 'bidirectional',
  },
  health_connect: {
    id: 'health_connect',
    label: 'Health Connect',
    oauth: false,
    platform: 'android',
    syncMode: 'import',
  },
  fhir_import: {
    id: 'fhir_import',
    label: 'FHIR Import',
    oauth: false,
    syncMode: 'import',
  },
};

export const OAUTH_CONNECTOR_IDS = ['strava', 'withings', 'google-sheets'];

export function getConnectorProvider(id) {
  return CONNECTOR_PROVIDER_SPECS[id] || null;
}

export function listOAuthConnectors() {
  return OAUTH_CONNECTOR_IDS.map((id) => CONNECTOR_PROVIDER_SPECS[id]).filter(Boolean);
}

export function listConnectorsForPlatform(platform) {
  return Object.values(CONNECTOR_PROVIDER_SPECS).filter((c) => !c.platform || c.platform === platform);
}

export function parseGoogleSheetId(input) {
  const raw = String(input || '').trim();
  if (!raw) return '';
  if (/^[a-zA-Z0-9_-]{20,}$/.test(raw)) return raw;
  const m = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : '';
}
