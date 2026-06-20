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

  return rows;
}
