import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  OAUTH2_SCOPES,
  generateCodeVerifier,
  deriveCodeChallenge,
  buildAuthorizeUrl,
  CONNECTOR_PROVIDERS,
  listConnectorsForPlatform,
} from '@rianell/shared';

const root = join(import.meta.dirname, '..', '..');

test('OAuth2 PKCE verifier and challenge round-trip', async () => {
  const verifier = generateCodeVerifier();
  assert.ok(verifier.length >= 43);
  const challenge = await deriveCodeChallenge(verifier);
  assert.ok(challenge.length > 20);
});

test('buildAuthorizeUrl includes PKCE params', () => {
  const url = buildAuthorizeUrl('https://example.com', {
    clientId: 'cid',
    redirectUri: 'https://app/cb',
    scopes: ['logs:read'],
    codeChallenge: 'abc',
  });
  assert.match(url, /code_challenge=abc/);
  assert.match(url, /code_challenge_method=S256/);
});

test('OAUTH2_SCOPES includes logs:read', () => {
  assert.ok(OAUTH2_SCOPES.includes('logs:read'));
});

test('CONNECTOR_PROVIDERS lists withings and strava', () => {
  assert.ok(CONNECTOR_PROVIDERS.withings);
  assert.ok(CONNECTOR_PROVIDERS.strava);
  const android = listConnectorsForPlatform('android');
  assert.ok(android.some((c) => c.id === 'health_connect'));
});

test('Schema.sql defines oauth2 tables', () => {
  const schema = readFileSync(join(root, 'supabase/Schema.sql'), 'utf8');
  assert.match(schema, /oauth2_clients/);
  assert.match(schema, /oauth2_auth_codes/);
  assert.match(schema, /user_integrations/);
});

test('OAuth2 edge functions exist', () => {
  assert.ok(existsSync(join(root, 'supabase/functions/oauth2-authorize/index.ts')));
  assert.ok(existsSync(join(root, 'supabase/functions/oauth2-token/index.ts')));
});

test('Connector edge functions exist', () => {
  assert.ok(existsSync(join(root, 'supabase/functions/connector-withings/index.ts')));
  assert.ok(existsSync(join(root, 'supabase/functions/connector-strava/index.ts')));
  assert.ok(existsSync(join(root, 'supabase/functions/connector-google-sheets/index.ts')));
});

test('Health Connect sync module exists', () => {
  const src = readFileSync(join(root, 'apps/rn-app/src/connectors/HealthConnectSync.ts'), 'utf8');
  assert.match(src, /syncFromHealthConnect/);
});

test('Zapier connector docs exist', () => {
  assert.ok(existsSync(join(root, 'docs/connectors/zapier-template.md')));
});
