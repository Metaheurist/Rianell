/** Plan 05 P2 — append-only local processing activity log (sync, model, export). */

export const PROCESSING_ACTIVITY_LOG_KEY = 'rianellProcessingActivityLog';
export const PROCESSING_ACTIVITY_LOG_MAX = 500;

const VALID_TYPES = new Set(['cloud_sync', 'anon_sync', 'model_download', 'export', 'encrypted_export']);

export function normalizeActivityEntry(raw) {
  const v = raw && typeof raw === 'object' ? raw : {};
  const type = VALID_TYPES.has(v.type) ? v.type : 'export';
  const at = typeof v.at === 'string' ? v.at : new Date().toISOString();
  const detail = typeof v.detail === 'string' ? v.detail.slice(0, 200) : undefined;
  const out = { type, at };
  if (detail) out.detail = detail;
  return out;
}

export function appendProcessingActivity(existing, entry) {
  const list = Array.isArray(existing) ? existing.map(normalizeActivityEntry) : [];
  list.unshift(normalizeActivityEntry(entry));
  return list.slice(0, PROCESSING_ACTIVITY_LOG_MAX);
}

export function readProcessingActivity(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeActivityEntry).slice(0, PROCESSING_ACTIVITY_LOG_MAX);
}

export function formatActivityTypeLabel(type) {
  switch (type) {
    case 'cloud_sync':
      return 'settings.privacy.activity.cloudSync';
    case 'anon_sync':
      return 'settings.privacy.activity.anonSync';
    case 'model_download':
      return 'settings.privacy.activity.modelDownload';
    case 'encrypted_export':
      return 'settings.privacy.activity.encryptedExport';
    default:
      return 'settings.privacy.activity.export';
  }
}
