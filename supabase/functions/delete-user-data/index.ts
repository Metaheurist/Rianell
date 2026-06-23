/**
 * GDPR Art. 17 — full account erasure: all app tables + auth.users removal.
 * Invoke with the signed-in user's JWT (self-delete) or service_role (operator).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteRequest {
  userId?: string;
  shouldSoftDelete?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json({ error: 'Server misconfigured' }, 500);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return json({ error: 'Missing Authorization bearer token' }, 401);
  }

  let body: DeleteRequest = {};
  try {
    body = (await req.json()) as DeleteRequest;
  } catch {
    body = {};
  }

  const shouldSoftDelete = body.shouldSoftDelete === true;
  const bearer = authHeader.replace(/^Bearer\s+/i, '');

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let targetUserId: string;

  if (bearer === serviceRoleKey) {
    if (!body.userId || typeof body.userId !== 'string') {
      return json({ error: 'userId required for service_role invocation' }, 400);
    }
    targetUserId = body.userId;
  } else {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    targetUserId = body.userId ?? user.id;
    if (targetUserId !== user.id) {
      return json({ error: 'Forbidden: can only delete your own account' }, 403);
    }
  }

  const { error: rpcError } = await admin.rpc('delete_all_user_data', {
    p_user_id: targetUserId,
  });

  if (rpcError) {
    console.error('delete_all_user_data failed:', rpcError.message);
    return json({ error: rpcError.message }, 500);
  }

  const { error: authDeleteError } = await admin.auth.admin.deleteUser(
    targetUserId,
    shouldSoftDelete,
  );

  if (authDeleteError) {
    console.error('auth.admin.deleteUser failed:', authDeleteError.message);
    return json({ error: authDeleteError.message }, 500);
  }

  return json({ ok: true, userId: targetUserId, softDelete: shouldSoftDelete }, 200);
});

function json(payload: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
