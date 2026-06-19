/** Plan 09 C8 — user-defined chart metrics (0–10 scale or boolean). */

const MAX_CUSTOM = 8;
const LABEL_MAX = 40;

/** Strip HTML/script chars from user-supplied metric labels (XSS guard for ApexCharts). */
export function sanitizeCustomMetricLabel(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"'&`]/g, '')
    .trim()
    .slice(0, LABEL_MAX);
}

export function customMetricFieldKey(id) {
  return `custom_${id}`;
}

export function isCustomMetricField(field) {
  return typeof field === 'string' && field.startsWith('custom_');
}

export function customMetricIdFromField(field) {
  if (!isCustomMetricField(field)) return null;
  return field.slice(7);
}

/**
 * @param {unknown} raw
 * @returns {{ id: string, label: string, type: 'scale'|'boolean', color: string } | null}
 */
export function normalizeCustomChartMetric(raw) {
  const v = raw && typeof raw === 'object' ? raw : {};
  const id =
    typeof v.id === 'string' && /^[a-z0-9_-]{1,24}$/i.test(v.id) ? v.id.toLowerCase() : undefined;
  const label = sanitizeCustomMetricLabel(v.label);
  const type = v.type === 'boolean' ? 'boolean' : 'scale';
  const color =
    typeof v.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(v.color) ? v.color : '#78909c';
  if (!id || !label) return null;
  return { id, label, type, color };
}

/** @param {unknown} raw */
export function normalizeCustomChartMetrics(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = new Set();
  for (const item of raw) {
    const m = normalizeCustomChartMetric(item);
    if (!m || seen.has(m.id)) continue;
    seen.add(m.id);
    out.push(m);
    if (out.length >= MAX_CUSTOM) break;
  }
  return out;
}

/** @param {unknown} raw */
export function normalizeCustomMetricValues(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const out = {};
  for (const [k, val] of Object.entries(raw)) {
    if (!/^[a-z0-9_-]{1,24}$/i.test(k)) continue;
    if (typeof val === 'boolean') out[k.toLowerCase()] = val;
    else if (typeof val === 'number' && Number.isFinite(val)) {
      out[k.toLowerCase()] = Math.max(0, Math.min(10, val));
    } else if (val === 'Yes') out[k.toLowerCase()] = true;
    else if (val === 'No') out[k.toLowerCase()] = false;
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * Read a normalized 0–10 radar value from a log for a custom metric definition.
 * @param {Record<string, unknown>} log
 * @param {{ id: string, type: 'scale'|'boolean' }} def
 */
export function readCustomMetricRadarValue(log, def) {
  const bag = log?.customMetrics;
  if (!bag || typeof bag !== 'object') return null;
  const raw = bag[def.id];
  if (def.type === 'boolean') {
    if (typeof raw === 'boolean') return raw ? 10 : 0;
    if (raw === 'Yes') return 10;
    if (raw === 'No') return 0;
    return null;
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.max(0, Math.min(10, raw));
  return null;
}
