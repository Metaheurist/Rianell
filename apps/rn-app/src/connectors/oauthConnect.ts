import { Linking } from 'react-native';
import { mergeLogEntriesForDate, normalizeLogEntry, OAUTH_CONNECTOR_IDS } from '@rianell/shared';
import { getSupabaseClient } from '../cloud/supabaseClient';
import type { LogEntry } from '../storage/logs';

export type ConnectorProviderId = (typeof OAUTH_CONNECTOR_IDS)[number];

const SYNC_FN: Record<ConnectorProviderId, string> = {
  strava: 'connector-strava',
  withings: 'connector-withings',
  'google-sheets': 'connector-google-sheets',
};

export async function startConnectorOAuth(provider: ConnectorProviderId): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Cloud sync required');
  const { data, error } = await client.functions.invoke('connector-auth', { body: { provider } });
  if (error) throw error;
  const authorizeUrl = data?.authorizeUrl as string | undefined;
  if (!authorizeUrl) throw new Error(data?.error || 'OAuth init failed');
  await Linking.openURL(authorizeUrl);
}

export async function disconnectConnector(provider: ConnectorProviderId): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Cloud sync required');
  const { error } = await client.functions.invoke('connector-disconnect', { body: { provider } });
  if (error) throw error;
}

export async function syncConnector(
  provider: ConnectorProviderId,
  opts?: { mode?: 'import' | 'export'; logs?: LogEntry[] },
): Promise<{ entries?: LogEntry[]; exported?: number }> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Cloud sync required');
  const fn = SYNC_FN[provider];
  const body: Record<string, unknown> = {};
  if (provider === 'google-sheets') {
    body.mode = opts?.mode ?? 'import';
    if (body.mode === 'export' && opts?.logs) body.logs = opts.logs.slice(-90);
  }
  const { data, error } = await client.functions.invoke(fn, { body });
  if (error) throw error;
  if (data?.error) throw new Error(String(data.error));
  return data as { entries?: LogEntry[]; exported?: number };
}

export function mergeConnectorEntries(existing: LogEntry[], incoming: LogEntry[]): LogEntry[] {
  const byDate = new Map(existing.map((e) => [e.date, e]));
  for (const raw of incoming) {
    const inc = normalizeLogEntry(raw) as LogEntry;
    if (!inc.date) continue;
    const prev = byDate.get(inc.date);
    byDate.set(
      inc.date,
      prev ? (mergeLogEntriesForDate(prev, inc) as LogEntry) : inc,
    );
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function parseConnectorCallbackUrl(url: string): { provider?: string; status?: string } {
  try {
    const u = new URL(url);
    if (u.protocol !== 'rianell:') return {};
    return {
      provider: u.searchParams.get('provider') ?? undefined,
      status: u.searchParams.get('status') ?? undefined,
    };
  } catch {
    return {};
  }
}

export function watchConnectorDeepLinks(onSuccess: (provider: ConnectorProviderId) => void): () => void {
  const handler = ({ url }: { url: string }) => {
    const parsed = parseConnectorCallbackUrl(url);
    if (parsed.status === 'success' && parsed.provider && OAUTH_CONNECTOR_IDS.includes(parsed.provider as ConnectorProviderId)) {
      onSuccess(parsed.provider as ConnectorProviderId);
    }
  };
  const sub = Linking.addEventListener('url', handler);
  Linking.getInitialURL().then((url) => {
    if (url) handler({ url });
  });
  return () => sub.remove();
}
