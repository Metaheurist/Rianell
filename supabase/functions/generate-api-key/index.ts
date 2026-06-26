/** Plan 18 API4 — generate API key (returns raw key once). */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const auth = req.headers.get('Authorization') ?? '';
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data: { user } } = await client.auth.getUser();
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => ({}));
  const label = typeof body.label === 'string' ? body.label.slice(0, 80) : 'API key';
  const scopes = Array.isArray(body.scopes) ? body.scopes : ['logs:read'];
  const rawKey = `rn_live_${crypto.randomUUID().replace(/-/g, '')}`;
  const keyHash = await sha256Hex(rawKey);
  const keyPrefix = rawKey.slice(0, 16);

  const { data, error } = await client.from('api_keys').insert({
    user_id: user.id,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    label,
    scopes,
  }).select('id, key_prefix, label, scopes, created_at').single();

  if (error) return json({ error: error.message }, 500);
  return json({ key: rawKey, record: data });
});

async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
