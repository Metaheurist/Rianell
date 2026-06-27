import { LOG_CSV_FIELD_IDS } from '../export/logCsv.mjs';

/** Default column map: header label (lowercase) → log field id. */
export const DEFAULT_SHEET_COLUMN_MAP = Object.fromEntries(
  LOG_CSV_FIELD_IDS.map((id) => [id.toLowerCase(), id])
);

function normalizeHeader(h) {
  return String(h || '').trim().toLowerCase().replace(/\s+/g, '');
}

function cellToFieldValue(fieldId, raw) {
  const v = String(raw ?? '').trim();
  if (!v) return undefined;
  if (fieldId === 'date') return v.slice(0, 10);
  if (fieldId === 'bpm' || fieldId === 'fatigue' || fieldId === 'sleep') {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return v;
}

export function rowsToPartialLogs(rows, columnMap = DEFAULT_SHEET_COLUMN_MAP) {
  if (!Array.isArray(rows) || rows.length < 2) return [];
  const headers = (rows[0] || []).map(normalizeHeader);
  const fieldByCol = headers.map((h) => columnMap[h] || columnMap[h.replace(/_/g, '')] || null);
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const partial = {};
    fieldByCol.forEach((fieldId, i) => {
      if (!fieldId) return;
      const val = cellToFieldValue(fieldId, row[i]);
      if (val !== undefined && val !== '') partial[fieldId] = val;
    });
    if (partial.date) out.push(partial);
  }
  return out.slice(0, 500);
}

export function partialLogsToRows(logs, fieldIds = LOG_CSV_FIELD_IDS) {
  const header = [...fieldIds];
  const body = (logs || []).slice(0, 500).map((log) =>
    fieldIds.map((id) => {
      const v = log[id];
      if (v == null) return '';
      return String(v);
    })
  );
  return [header, ...body];
}

export function mergeSheetRoundTrip(logs) {
  const rows = partialLogsToRows(logs);
  return rowsToPartialLogs(rows);
}
