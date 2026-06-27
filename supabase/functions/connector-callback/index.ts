import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { encryptToken, verifySignedState } from '../_shared/connectorCrypto.ts';
import { exchangeCodeForTokens } from '../_shared/connectorProviders.ts';

const OAUTH_PROVIDERS = new Set(['strava', 'withings']);

Deno.serve(async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  const url = new URL(req.url);
  const provider = url.searchParams.get('provider') || '';
  const code = url.searchParams.get('code') || '';
  const state = url.searchParams.get('state') || '';
  const successRedirect = Deno.env.get('CONNECTOR_SUCCESS_REDIRECT') || '/connector-success.html';

  if (!OAUTH_PROVIDERS.has(provider) || !code || !state) {
    return redirectWithError(successRedirect, provider, 'missing_params');
  }

  const stateSecret = Deno.env.get('CONNECTOR_STATE_SECRET');
  const tokenSecret = Deno.env.get('CONNECTOR_TOKEN_SECRET');
  if (!stateSecret || !tokenSecret) {
    return redirectWithError(successRedirect, provider, 'not_configured');
  }

  const payload = await verifySignedState(state, stateSecret);
  if (!payload || payload.provider !== provider) {
    return redirectWithError(successRedirect, provider, 'invalid_state');
  }

  const userId = String(payload.userId || '');
  if (!userId) return redirectWithError(successRedirect, provider, 'invalid_user');

  try {
    const tokens = await exchangeCodeForTokens(provider, code);
    const access = String(tokens.access_token || '');
    const refresh = tokens.refresh_token ? String(tokens.refresh_token) : null;
    const expiresIn = Number(tokens.expires_in || 0);
    const expiresAt = expiresIn > 0
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const accessEnc = await encryptToken(access, tokenSecret);
    const refreshEnc = refresh ? await encryptToken(refresh, tokenSecret) : null;

    await admin.from('connector_tokens').upsert({
      user_id: userId,
      provider,
      access_token_encrypted: accessEnc,
      refresh_token_encrypted: refreshEnc,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' });

    const metadata: Record<string, unknown> = {};
    if (tokens.athlete?.id) metadata.stravaAthleteId = tokens.athlete.id;
    if (tokens.userid) metadata.withingsUserId = tokens.userid;

    await admin.from('user_integrations').upsert({
      user_id: userId,
      provider,
      metadata,
      sync_status: 'connected',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' });

    const dest = new URL(successRedirect);
    dest.searchParams.set('provider', provider);
    dest.searchParams.set('status', 'success');
    return Response.redirect(dest.toString(), 302);
  } catch (err) {
    return redirectWithError(successRedirect, provider, (err as Error).message || 'exchange_failed');
  }
});

function redirectWithError(base: string, provider: string, message: string) {
  const dest = new URL(base, 'https://placeholder.local');
  dest.searchParams.set('provider', provider);
  dest.searchParams.set('status', 'error');
  dest.searchParams.set('message', message.slice(0, 120));
  return Response.redirect(dest.toString(), 302);
}
