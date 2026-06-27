import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { handleCors, jsonResponse } from '../_shared/cors.ts';

const OAUTH_PROVIDERS = new Set(['strava', 'withings', 'google-sheets']);

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  await admin.from('connector_tokens').delete().eq('user_id', user.id).eq('provider', provider);
  await admin.from('user_integrations').delete().eq('user_id', user.id).eq('provider', provider);

  return jsonResponse({ ok: true, provider });
});
