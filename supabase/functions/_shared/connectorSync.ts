import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { decryptToken, encryptToken } from './connectorCrypto.ts';
import { refreshAccessToken } from './connectorProviders.ts';

export async function getValidAccessToken(
  admin: SupabaseClient,
  userId: string,
  provider: string,
): Promise<string> {
  const tokenSecret = Deno.env.get('CONNECTOR_TOKEN_SECRET');
  if (!tokenSecret) throw new Error('Connectors not configured');

  const { data: row, error } = await admin
    .from('connector_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .maybeSingle();
  if (error || !row) throw new Error('Not connected');

  let access = await decryptToken(row.access_token_encrypted, tokenSecret);
  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  const needsRefresh = expiresAt > 0 && expiresAt < Date.now() + 60_000;

  if (needsRefresh && row.refresh_token_encrypted) {
    const refreshPlain = await decryptToken(row.refresh_token_encrypted, tokenSecret);
    const refreshed = await refreshAccessToken(provider, refreshPlain);
    access = String(refreshed.access_token || access);
    const refreshEnc = refreshed.refresh_token
      ? await encryptToken(String(refreshed.refresh_token), tokenSecret)
      : row.refresh_token_encrypted;
    const expiresIn = Number(refreshed.expires_in || 0);
    await admin.from('connector_tokens').update({
      access_token_encrypted: await encryptToken(access, tokenSecret),
      refresh_token_encrypted: refreshEnc,
      expires_at: expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : row.expires_at,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId).eq('provider', provider);
  }

  return access;
}

export async function markSyncResult(
  admin: SupabaseClient,
  userId: string,
  provider: string,
  status: 'idle' | 'synced' | 'error',
  entryCount = 0,
) {
  await admin.from('user_integrations').upsert({
    user_id: userId,
    provider,
    last_sync_at: new Date().toISOString(),
    sync_status: status,
    metadata: { lastEntryCount: entryCount },
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,provider' });
}

function mapStravaActivities(activities: Array<Record<string, unknown>>) {
  const byDate = new Map<string, Record<string, unknown>>();
  for (const act of activities) {
    const date = String(act.start_date_local || act.start_date || '').slice(0, 10);
    if (!date) continue;
    const name = String(act.name || act.type || 'Activity').slice(0, 120);
    const seconds = Number(act.moving_time ?? act.elapsed_time ?? 0);
    const duration = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds / 60)) : 0;
    const existing = byDate.get(date) || { date, exercise: [] as Array<{ name: string; duration: number }> };
    (existing.exercise as Array<{ name: string; duration: number }>).push({ name, duration });
    byDate.set(date, existing);
  }
  return [...byDate.values()];
}

function mapWithingsMeasures(groups: Array<Record<string, unknown>>) {
  const byDate = new Map<string, Record<string, unknown>>();
  for (const group of groups) {
    const ts = Number(group.date ?? group.startdate ?? 0);
    if (!ts) continue;
    const date = new Date(ts * 1000).toISOString().slice(0, 10);
    const measures = (group.measures || group.data || []) as Array<{ type: number; value: number; unit?: number }>;
    const partial: Record<string, unknown> = byDate.get(date) || { date };
    for (const m of measures) {
      const val = Number(m.value) * Math.pow(10, Number(m.unit ?? 0));
      if (m.type === 1) partial.weight = String(Math.round(val * 10) / 10);
      if (m.type === 11) partial.bpm = Math.round(val);
    }
    byDate.set(date, partial);
  }
  return [...byDate.values()];
}

function rowsToPartialLogs(rows: string[][]) {
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => String(h || '').trim().toLowerCase());
  const out: Array<Record<string, unknown>> = [];
  for (let r = 1; r < rows.length && out.length < 500; r++) {
    const row = rows[r] || [];
    const partial: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      const v = String(row[i] ?? '').trim();
      if (!v) return;
      if (h === 'date') partial.date = v.slice(0, 10);
      else if (['bpm', 'fatigue', 'sleep'].includes(h)) {
        const n = Number(v);
        if (Number.isFinite(n)) partial[h] = n;
      } else partial[h] = v;
    });
    if (partial.date) out.push(partial);
  }
  return out;
}

export { mapStravaActivities, mapWithingsMeasures, rowsToPartialLogs };
