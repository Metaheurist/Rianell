/** Plan 06 D5 — map external app CSV columns to canonical log fields. */

const BEARABLE_ALIASES = {
  date: ['Date', 'date', 'Day'],
  mood: ['Mood', 'mood'],
  sleep: ['Sleep', 'sleep', 'Sleep quality'],
  fatigue: ['Energy', 'Fatigue', 'fatigue'],
  notes: ['Notes', 'Note', 'notes'],
  flare: ['Symptom severity', 'Flare', 'flare'],
};

const FLAREDOWN_ALIASES = {
  date: ['date', 'Date', 'entry_date'],
  mood: ['mood', 'Mood'],
  sleep: ['sleep', 'Sleep'],
  fatigue: ['fatigue', 'Fatigue', 'energy'],
  notes: ['notes', 'Notes', 'journal'],
  flare: ['flare', 'Flare', 'symptom_level'],
};

export const MIGRATION_SOURCES = [
  { id: 'bearable', labelKey: 'settings.import.migration.bearable' },
  { id: 'flaredown', labelKey: 'settings.import.migration.flaredown' },
  { id: 'generic', labelKey: 'settings.import.migration.generic' },
];

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
      } else inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else current += char;
  }
  values.push(current.trim());
  return values;
}

function mapRow(headers, values, aliasMap) {
  const fieldIndexes = {};
  headers.forEach((h, idx) => {
    const lower = h.trim().toLowerCase();
    for (const [id, aliases] of Object.entries(aliasMap)) {
      if (aliases.some((a) => a.toLowerCase() === lower)) {
        fieldIndexes[id] = idx;
        break;
      }
    }
  });
  const raw = {};
  for (const [id, idx] of Object.entries(fieldIndexes)) {
    if (values[idx] !== undefined) raw[id] = values[idx];
  }
  return raw;
}

function normalizeMigrationDate(raw) {
  const s = String(raw || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const dd = dmy[1].padStart(2, '0');
    const mm = dmy[2].padStart(2, '0');
    return `${dmy[3]}-${mm}-${dd}`;
  }
  return '';
}

function normalizeMigrationRow(raw) {
  const date = normalizeMigrationDate(raw.date);
  if (!date) return null;
  const mood = Number.parseInt(raw.mood, 10);
  const sleep = Number.parseInt(raw.sleep, 10);
  const fatigue = Number.parseInt(raw.fatigue, 10);
  const entry = {
    date,
    mood: Number.isFinite(mood) ? mood : undefined,
    sleep: Number.isFinite(sleep) ? sleep : undefined,
    fatigue: Number.isFinite(fatigue) ? fatigue : undefined,
    notes: typeof raw.notes === 'string' ? raw.notes.trim().slice(0, 500) : undefined,
    flare: raw.flare && Number(raw.flare) >= 7 ? 'Yes' : 'No',
  };
  Object.keys(entry).forEach((k) => {
    if (entry[k] === undefined) delete entry[k];
  });
  return entry;
}

export function parseMigrationCsv(text, sourceId = 'generic') {
  const lines = String(text || '').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error('Migration CSV must include a header row and data.');
  const headers = parseCsvLine(lines[0]);
  const aliasMap = sourceId === 'flaredown' ? FLAREDOWN_ALIASES : sourceId === 'bearable' ? BEARABLE_ALIASES : { ...BEARABLE_ALIASES, ...FLAREDOWN_ALIASES };
  const logs = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (!values.some((v) => v)) continue;
    const raw = mapRow(headers, values, aliasMap);
    const entry = normalizeMigrationRow(raw);
    if (entry) logs.push(entry);
  }
  if (!logs.length) throw new Error('No rows could be mapped. Check column headers for your export source.');
  return logs;
}
