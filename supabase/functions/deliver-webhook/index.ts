/**
 * Plan 18 API5 — outbound webhook delivery with retries.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RETRY_DELAYS_MS = [0, 5000, 30000, 300000];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const body = await req.json().catch(() => ({}));
  const userId = body.user_id as string;
  const event = (body.event as string) || 'log.created';
  if (!userId) return json({ error: 'user_id required' }, 400);

  const { data: hooks } = await admin
    .from('user_webhooks')
    .select('*')
    .eq('user_id', userId)
    .eq('enabled', true);

  const delivered: string[] = [];
  for (const hook of hooks ?? []) {
    if (!hook.events?.includes(event)) continue;
    if (!String(hook.url).startsWith('https://')) continue;
    const payload = { event, ...body };
    const deliveryId = crypto.randomUUID();
    let success = false;
    for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
      if (RETRY_DELAYS_MS[attempt] > 0) await sleep(RETRY_DELAYS_MS[attempt]);
      const sig = hook.secret ? await hmacSha256(hook.secret, JSON.stringify(payload)) : '';
      try {
        const res = await fetch(hook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Rianell-Event': event,
            'X-Rianell-Signature': sig,
            'X-Rianell-Delivery': deliveryId,
          },
          body: JSON.stringify(payload),
        });
        await admin.from('webhook_deliveries').insert({
          webhook_id: hook.id,
          event_type: event,
          payload,
          response_status: res.status,
          attempt: attempt + 1,
        });
        if (res.ok) {
          success = true;
          await admin.from('user_webhooks').update({
            last_delivered_at: new Date().toISOString(),
            failure_count: 0,
          }).eq('id', hook.id);
          break;
        }
      } catch {
        await admin.from('webhook_deliveries').insert({
          webhook_id: hook.id,
          event_type: event,
          payload,
          response_status: 0,
          attempt: attempt + 1,
        });
      }
    }
    if (!success) {
      const failures = (hook.failure_count ?? 0) + 1;
      await admin.from('user_webhooks').update({
        failure_count: failures,
        enabled: failures < 10,
      }).eq('id', hook.id);
    } else {
      delivered.push(hook.id);
    }
  }

  return json({ delivered });
});

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function hmacSha256(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
