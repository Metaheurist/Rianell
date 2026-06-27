import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getValidAccessToken, markSyncResult, mapWithingsMeasures } from '../_shared/connectorSync.ts';

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

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    const access = await getValidAccessToken(admin, user.id, 'withings');
    const { data: integration } = await admin
      .from('user_integrations')
      .select('last_sync_at, metadata')
      .eq('user_id', user.id)
      .eq('provider', 'withings')
      .maybeSingle();

    let lastupdate = 0;
    if (integration?.last_sync_at) {
      lastupdate = Math.floor(new Date(integration.last_sync_at).getTime() / 1000);
    } else {
      lastupdate = Math.floor(Date.now() / 1000) - 90 * 86400;
    }

    const measBody = new URLSearchParams({
      action: 'getmeas',
      lastupdate: String(lastupdate),
    });
    const measRes = await fetch('https://wbsapi.withings.net/measure', {
      method: 'POST',
      headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: measBody,
    });
    const measJson = await measRes.json();
    if (measJson.status !== 0) throw new Error(measJson.error || 'Withings measure error');
    const groups = measJson.body?.measuregrps || measJson.body?.measuregroups || [];
    const entries = mapWithingsMeasures(groups);
    await markSyncResult(admin, user.id, 'withings', 'synced', entries.length);
    return jsonResponse({ entries, syncedAt: new Date().toISOString(), provider: 'withings' });
  } catch (err) {
    await markSyncResult(admin, user.id, 'withings', 'error', 0);
    return jsonResponse({ error: (err as Error).message || 'Sync failed' }, 500);
  }
});
