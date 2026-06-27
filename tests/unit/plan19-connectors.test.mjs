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
  assert.ok(CONNECTOR_PROVIDERS['google-sheets']);
  const android = listConnectorsForPlatform('android');
  assert.ok(android.some((c) => c.id === 'health_connect'));
});

test('Schema.sql defines connector_tokens table', () => {
  const schema = readFileSync(join(root, 'supabase/Schema.sql'), 'utf8');
  assert.match(schema, /connector_tokens/);
  assert.match(schema, /user_integrations/);
});

test('Connector OAuth edge functions exist', () => {
  assert.ok(existsSync(join(root, 'supabase/functions/connector-auth/index.ts')));
  assert.ok(existsSync(join(root, 'supabase/functions/connector-callback/index.ts')));
  assert.ok(existsSync(join(root, 'supabase/functions/connector-disconnect/index.ts')));
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

test('Connector operator SETUP.md exists', () => {
  assert.ok(existsSync(join(root, 'docs/connectors/SETUP.md')));
  const setup = readFileSync(join(root, 'docs/connectors/SETUP.md'), 'utf8');
  assert.match(setup, /connector-auth/);
  assert.match(setup, /CONNECTOR_TOKEN_SECRET/);
});

test('PWA connector-success.html exists', () => {
  assert.ok(existsSync(join(root, 'apps/pwa-webapp/connector-success.html')));
  const html = readFileSync(join(root, 'apps/pwa-webapp/connector-success.html'), 'utf8');
  assert.match(html, /connector-oauth-success/);
});

test('Connector hardening migration exists', () => {
  assert.ok(existsSync(join(root, 'supabase/migrations/20260627100000_connectors_hardening.sql')));
  const sql = readFileSync(join(root, 'supabase/migrations/20260627100000_connectors_hardening.sql'), 'utf8');
  assert.match(sql, /connector_tokens/);
});

test('RN oauthConnect module exists', () => {
  assert.ok(existsSync(join(root, 'apps/rn-app/src/connectors/oauthConnect.ts')));
  const src = readFileSync(join(root, 'apps/rn-app/src/connectors/oauthConnect.ts'), 'utf8');
  assert.match(src, /parseConnectorCallbackUrl/);
  assert.match(src, /rianell:/);
});

test('Wiki documents v1.135.0 connectors', () => {
  const features = readFileSync(join(root, 'wiki/Features-Guide.md'), 'utf8');
  const release = readFileSync(join(root, 'wiki/Release-Notes.md'), 'utf8');
  const faq = readFileSync(join(root, 'wiki/FAQ.md'), 'utf8');
  assert.match(features, /Third-party connectors/);
  assert.match(features, /Strava/);
  assert.match(release, /v1\.135\.0/);
  assert.match(faq, /Strava/);
});
