import { getSupabaseClient } from '../cloud/supabaseClient';

export type BugReportPayload = {
  title?: string;
  description: string;
  steps?: string;
  expected_behavior?: string;
  actual_behavior?: string;
  console_output?: string;
  user_agent?: string;
  url?: string;
  client_timestamp?: string;
};

/**
 * Insert a bug report via Supabase RLS (insert-only for anon/authenticated).
 */
export async function submitBugReport(payload: BugReportPayload): Promise<void> {
  const { loadPreferences } = await import('../storage/preferences');
  const { shouldAllowNetworkOperation } = await import('@rianell/shared');
  const prefs = await loadPreferences();
  if (!shouldAllowNetworkOperation(prefs, 'bugReport')) {
    throw new Error('Bug reports are disabled while local-only mode is on.');
  }
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Bug reports require Supabase configuration (EXPO_PUBLIC_SUPABASE_URL and key).');
  }
  const description = payload.description.trim();
  if (!description) {
    throw new Error('description is required');
  }
  const { data: sessionData } = await client.auth.getSession();
  const userId = sessionData.session?.user?.id ?? null;
  const { error } = await client.from('bug_reports').insert({
    user_id: userId,
    client_ip: 'client',
    title: (payload.title || '').trim().slice(0, 160) || null,
    description: description.slice(0, 4000),
    steps_to_reproduce: (payload.steps || '').trim().slice(0, 4000) || null,
    expected_behavior: (payload.expected_behavior || '').trim().slice(0, 2000) || null,
    actual_behavior: (payload.actual_behavior || '').trim().slice(0, 2000) || null,
    console_output: (payload.console_output || '').trim().slice(0, 32000) || null,
    user_agent: (payload.user_agent || '').trim().slice(0, 512) || null,
    page_url: (payload.url || '').trim().slice(0, 1000) || null,
    client_timestamp: payload.client_timestamp || new Date().toISOString(),
  });
  if (error) {
    throw new Error(error.message || 'Failed to submit bug report.');
  }
}
