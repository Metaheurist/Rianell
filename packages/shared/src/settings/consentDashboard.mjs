/** Consent dashboard rows (Plan 03 S7). */
export function buildConsentDashboardEntries(input) {
  const p = input && typeof input === 'object' ? input : {};
  const rows = [];

  rows.push({
    id: 'healthData',
    granted: p.healthDataConsent === true,
    updatedAt: p.healthDataConsentAt || null,
    revokeField: 'healthDataConsent',
  });
  rows.push({
    id: 'cookie',
    granted: p.cookieConsent === true,
    updatedAt: p.cookieConsentAt || null,
    revokeField: 'cookieConsent',
  });
  rows.push({
    id: 'aiModel',
    granted: p.aiModelDownloadConsent === 'granted',
    updatedAt: p.aiModelDownloadConsentAt || null,
    revokeField: 'aiModelDownloadConsent',
    revokeValue: 'deferred',
  });
  rows.push({
    id: 'push',
    granted: p.pushNotificationsEnabled === true || p.notificationsEnabled === true,
    updatedAt: p.pushNotificationsEnabledAt || p.notificationsEnabledAt || null,
    revokeField: 'pushNotificationsEnabled',
  });
  rows.push({
    id: 'anonPool',
    granted: p.contributeAnonData === true,
    updatedAt: p.contributeAnonDataAt || null,
    revokeField: 'contributeAnonData',
  });
  rows.push({
    id: 'sessionRecording',
    granted: p.sessionRecording === true,
    updatedAt: p.sessionRecordingAt || null,
    revokeField: 'sessionRecording',
  });
  rows.push({
    id: 'barcodeFood',
    granted: p.barcodeFoodLoggingEnabled === true,
    updatedAt: p.barcodeFoodLoggingEnabledAt || null,
    revokeField: 'barcodeFoodLoggingEnabled',
  });

  return rows;
}

/** Audit payload for consent_audit_log RPC (Plan 15 FC3). */
export function buildConsentAuditPayload(field, value, platform) {
  return {
    field: String(field || ''),
    value,
    ts: Date.now(),
    platform: platform || (typeof window !== 'undefined' ? 'pwa' : 'rn'),
  };
}
