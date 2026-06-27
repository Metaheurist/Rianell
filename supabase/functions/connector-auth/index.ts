import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders, handleCors, jsonResponse } from '../_shared/cors.ts';
import { createSignedState } from '../_shared/connectorCrypto.ts';
import { buildAuthorizeUrl } from '../_shared/connectorProviders.ts';

const OAUTH_PROVIDERS = new Set(['strava', 'withings']);

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const auth = req.headers.get('Authorization') ?? '';
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data: { user } } = await client.auth.getUser();
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => ({}));
  const provider = String(body.provider || '');
  if (!OAUTH_PROVIDERS.has(provider)) return jsonResponse({ error: 'Unsupported provider' }, 400);

  const stateSecret = Deno.env.get('CONNECTOR_STATE_SECRET');
  if (!stateSecret) return jsonResponse({ error: 'Connectors not configured' }, 503);

  try {
    const state = await createSignedState({
      userId: user.id,
      provider,
      nonce: crypto.randomUUID(),
      exp: Math.floor(Date.now() / 1000) + 600,
    }, stateSecret);
    const authorizeUrl = buildAuthorizeUrl(provider, state);
    return jsonResponse({ authorizeUrl, state, provider });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message || 'Auth init failed' }, 503);
  }
});
