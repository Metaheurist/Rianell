/** Canonical CSV export columns (Plan 06 D1 parity with PWA export-utils). */

export const LOG_CSV_FIELD_IDS = [
  'date',
  'bpm',
  'weight',
  'fatigue',
  'stiffness',
  'backPain',
  'sleep',
  'jointPain',
  'mobility',
  'dailyFunction',
  'swelling',
  'flare',
  'mood',
  'irritability',
  'notes',
];

export const LOG_CSV_I18N_KEYS = {
  date: 'export.csv.date',
  bpm: 'export.csv.bpm',
  weight: 'export.csv.weight',
  fatigue: 'export.csv.fatigue',
  stiffness: 'export.csv.stiffness',
  backPain: 'export.csv.backPain',
  sleep: 'export.csv.sleep',
  jointPain: 'export.csv.jointPain',
  mobility: 'export.csv.mobility',
  dailyFunction: 'export.csv.dailyFunction',
  swelling: 'export.csv.swelling',
  flare: 'export.csv.flare',
  mood: 'export.csv.mood',
  irritability: 'export.csv.irritability',
  notes: 'export.csv.notes',
};

export const LOG_CSV_ENGLISH_HEADERS = {
  date: 'Date',
  bpm: 'BPM',
  weight: 'Weight',
  fatigue: 'Fatigue',
  stiffness: 'Stiffness',
  backPain: 'Back Pain',
  sleep: 'Sleep',
  jointPain: 'Joint Pain',
  mobility: 'Mobility',
  dailyFunction: 'Ability to do Daily activities',
  swelling: 'Swelling',
  flare: 'Flare',
  mood: 'Mood',
  irritability: 'Irritability',
  notes: 'Notes',
};

function escapeCsvCell(value) {
  const s = value == null ? '' : String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function logsToCsv(logs, labelForField) {
  const label = typeof labelForField === 'function'
    ? labelForField
    : (id) => LOG_CSV_ENGLISH_HEADERS[id] || id;
  const header = LOG_CSV_FIELD_IDS.map((id) => escapeCsvCell(label(id))).join(',');
  const rows = (Array.isArray(logs) ? logs : []).map((log) =>
    LOG_CSV_FIELD_IDS.map((id) => {
      let v = log && log[id];
      if (id === 'notes' && typeof v === 'string') v = v.replace(/,/g, ';');
      return escapeCsvCell(v ?? '');
    }).join(','),
  );
  return [header, ...rows].join('\n');
}

export const LOG_CSV_LEGACY_HEADER_ALIASES = {
  dailyFunction: ['Daily Function', 'Daily Activities'],
};

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function headerToFieldId(header, aliasMap) {
  const h = header.trim();
  if (!h) return null;
  const lower = h.toLowerCase();
  for (const id of LOG_CSV_FIELD_IDS) {
    const raw = aliasMap[id];
    const legacy = LOG_CSV_LEGACY_HEADER_ALIASES[id] || [];
    const aliases = Array.isArray(raw)
      ? [...raw, ...legacy]
      : (typeof raw === 'string' && raw
        ? [raw, LOG_CSV_ENGLISH_HEADERS[id], ...legacy]
        : [LOG_CSV_ENGLISH_HEADERS[id], ...legacy]);
    if (aliases.some((a) => a && a.toLowerCase() === lower)) return id;
  }
  return null;
}

export function parseLogsCsv(text, aliasMap = LOG_CSV_ENGLISH_HEADERS) {
  const lines = String(text || '').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error('CSV must include a header row and at least one data row.');
  const headers = parseCsvLine(lines[0]);
  const fieldIndexes = {};
  headers.forEach((h, idx) => {
    const id = headerToFieldId(h, aliasMap);
    if (id) fieldIndexes[id] = idx;
  });
  if (fieldIndexes.date === undefined) throw new Error('CSV header row must include a Date column.');
  const logs = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (!values.some((v) => v)) continue;
    const raw = {};
    LOG_CSV_FIELD_IDS.forEach((id) => {
      const idx = fieldIndexes[id];
      if (idx === undefined || values[idx] === undefined) return;
      let v = values[idx];
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).replace(/""/g, '"');
      raw[id] = v;
    });
    logs.push(raw);
  }
  return logs;
}
