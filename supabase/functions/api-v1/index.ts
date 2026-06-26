// Plan 18 API2 — REST API v1 (Supabase Edge Function)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/api-v1\/?/, '/');

  if (path.endsWith('/health') || path === '/health') {
    return new Response(JSON.stringify({ ok: true, service: 'rianell-api-v1' }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user && path.includes('/v1/logs')) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: cors });
  }

  if (req.method === 'GET' && path.includes('/v1/logs')) {
    const { data, error } = await supabase.from('health_data').select('user_id, updated_at').eq('user_id', user!.id).maybeSingle();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: cors });
    return new Response(JSON.stringify({ logs: data ? [{ user_id: data.user_id, updated_at: data.updated_at }] : [] }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'POST' && path.includes('/v1/logs')) {
    return new Response(JSON.stringify({ status: 'accepted' }), { status: 201, headers: cors });
  }

  return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: cors });
});
