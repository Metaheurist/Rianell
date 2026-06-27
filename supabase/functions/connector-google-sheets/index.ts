import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getValidAccessToken, markSyncResult, rowsToPartialLogs } from '../_shared/connectorSync.ts';

const LOG_FIELDS = [
  'date', 'bpm', 'weight', 'fatigue', 'stiffness', 'backPain', 'sleep',
  'jointPain', 'mobility', 'dailyFunction', 'swelling', 'flare', 'mood', 'irritability', 'notes',
];

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
  const mode = String(body.mode || 'import');
  const sheetId = String(body.sheetId || body.sheet_id || '');
  const range = String(body.range || body.sheet_range || 'Sheet1!A1:O500');
  const exportRange = String(body.exportRange || body.metadata?.exportRange || range);
  const logs = Array.isArray(body.logs) ? body.logs : [];

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  if (!sheetId) {
    const { data: integration } = await admin
      .from('user_integrations')
      .select('sheet_id, sheet_range, metadata')
      .eq('user_id', user.id)
      .eq('provider', 'google-sheets')
      .maybeSingle();
    if (!integration?.sheet_id) return jsonResponse({ error: 'Sheet not configured' }, 400);
    sheetId = integration.sheet_id;
  }

  const resolvedSheetId = sheetId;
  if (!resolvedSheetId) return jsonResponse({ error: 'Sheet not configured' }, 400);

  try {
    const access = await getValidAccessToken(admin, user.id, 'google-sheets');

    if (mode === 'export') {
      const rows = [LOG_FIELDS];
      for (const log of logs.slice(0, 500)) {
        rows.push(LOG_FIELDS.map((f) => String(log[f] ?? '')));
      }
      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${resolvedSheetId}/values/${encodeURIComponent(exportRange)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
      const res = await fetch(appendUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: rows.slice(1) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Sheets export failed');
      await admin.from('user_integrations').upsert({
        user_id: user.id,
        provider: 'google-sheets',
        sheet_id: resolvedSheetId,
        sheet_range: range,
        metadata: { exportRange },
        last_sync_at: new Date().toISOString(),
        sync_status: 'synced',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,provider' });
      return jsonResponse({ ok: true, exported: rows.length - 1, provider: 'google-sheets' });
    }

    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${resolvedSheetId}/values/${encodeURIComponent(range)}`;
    const res = await fetch(readUrl, { headers: { Authorization: `Bearer ${access}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Sheets import failed');
    const entries = rowsToPartialLogs((data.values || []) as string[][]);
    await admin.from('user_integrations').upsert({
      user_id: user.id,
      provider: 'google-sheets',
      sheet_id: resolvedSheetId,
      sheet_range: range,
      metadata: { exportRange: exportRange || range },
      last_sync_at: new Date().toISOString(),
      sync_status: 'synced',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' });
    await markSyncResult(admin, user.id, 'google-sheets', 'synced', entries.length);
    return jsonResponse({ entries, syncedAt: new Date().toISOString(), provider: 'google-sheets' });
  } catch (err) {
    await markSyncResult(admin, user.id, 'google-sheets', 'error', 0);
    return jsonResponse({ error: (err as Error).message || 'Sync failed' }, 500);
  }
});
