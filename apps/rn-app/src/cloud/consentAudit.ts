import { buildConsentAuditPayload } from '@rianell/shared';
import { getSupabaseClient } from './supabaseClient';

export const CONSENT_AUDIT_FIELDS = new Set([
  'healthDataConsent',
  'cookieConsent',
  'sessionRecording',
  'contributeAnonData',
  'pushNotificationsEnabled',
  'notificationsEnabled',
  'aiModelDownloadConsent',
  'localOnlyMode',
  'barcodeFoodLoggingEnabled',
]);

export async function logConsentEventToCloud(field: string, value: unknown): Promise<void> {
  try {
    const client = getSupabaseClient();
    if (!client) return;
    const { data } = await client.auth.getSession();
    if (!data.session) return;
    const metadata = buildConsentAuditPayload(field, value, 'rn');
    await client.rpc('log_consent_event', {
      p_consent_type: String(field || 'consent_changed'),
      p_metadata: metadata,
    });
  } catch {
    /* fire-and-forget */
  }
}

export function maybeLogConsentChange(field: string, value: unknown): void {
  if (!CONSENT_AUDIT_FIELDS.has(field)) return;
  void logConsentEventToCloud(field, value);
}
