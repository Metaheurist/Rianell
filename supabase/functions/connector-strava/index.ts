import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getValidAccessToken, markSyncResult, mapStravaActivities } from '../_shared/connectorSync.ts';

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
  const sinceSec = Number(body.since || 0);
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    const access = await getValidAccessToken(admin, user.id, 'strava');
    const { data: integration } = await admin
      .from('user_integrations')
      .select('last_sync_at')
      .eq('user_id', user.id)
      .eq('provider', 'strava')
      .maybeSingle();

    let after = sinceSec;
    if (!after && integration?.last_sync_at) {
      after = Math.floor(new Date(integration.last_sync_at).getTime() / 1000);
    }
    if (!after) {
      after = Math.floor(Date.now() / 1000) - 90 * 86400;
    }

    const url = new URL('https://www.strava.com/api/v3/athlete/activities');
    url.searchParams.set('after', String(after));
    url.searchParams.set('per_page', '30');
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${access}` },
    });
    const activities = await res.json();
    if (!res.ok) throw new Error(activities.message || 'Strava API error');

    const entries = mapStravaActivities(Array.isArray(activities) ? activities : []);
    await markSyncResult(admin, user.id, 'strava', 'synced', entries.length);
    return jsonResponse({ entries, syncedAt: new Date().toISOString(), provider: 'strava' });
  } catch (err) {
    await markSyncResult(admin, user.id, 'strava', 'error', 0);
    return jsonResponse({ error: (err as Error).message || 'Sync failed' }, 500);
  }
});
