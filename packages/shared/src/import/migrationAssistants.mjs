/** Plan 06 D5 + Plan 25 DM1–DM9 — map external app exports to canonical log fields. */

import { CaraMigrationAdapter } from '../migration/adapters/cara.mjs';
import { DaylioMigrationAdapter } from '../migration/adapters/daylio.mjs';
import { OuraMigrationAdapter } from '../migration/adapters/oura.mjs';
import { detectImportConflicts, listMigrationAdapters } from '../migration/MigrationAdapter.mjs';

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

const CARA_ALIASES = {
  date: ['Date', 'date', 'Day'],
  mood: ['Mood', 'mood'],
  pain: ['Pain', 'pain', 'Symptoms', 'jointPain'],
  notes: ['Notes', 'Note', 'notes'],
};

export const MIGRATION_ADAPTERS = [CaraMigrationAdapter, DaylioMigrationAdapter, OuraMigrationAdapter];

export const MIGRATION_SOURCES = [
  { id: 'bearable', labelKey: 'settings.import.migration.bearable' },
  { id: 'flaredown', labelKey: 'settings.import.migration.flaredown' },
  { id: 'cara', labelKey: 'settings.import.migration.cara' },
  { id: 'oura', labelKey: 'settings.import.migration.oura' },
  { id: 'daylio', labelKey: 'settings.import.migration.daylio' },
  { id: 'generic', labelKey: 'settings.import.migration.generic' },
];

export { detectImportConflicts, listMigrationAdapters };

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
  const pain = Number.parseInt(raw.pain ?? raw.jointPain, 10);
  const entry = {
    date,
    mood: Number.isFinite(mood) ? mood : undefined,
    sleep: Number.isFinite(sleep) ? sleep : undefined,
    fatigue: Number.isFinite(fatigue) ? fatigue : undefined,
    jointPain: Number.isFinite(pain) ? pain : undefined,
    notes: typeof raw.notes === 'string' ? raw.notes.trim().slice(0, 500) : undefined,
    flare: raw.flare && Number(raw.flare) >= 7 ? 'Yes' : 'No',
  };
  Object.keys(entry).forEach((k) => {
    if (entry[k] === undefined) delete entry[k];
  });
  return entry;
}

function resolveAliasMap(sourceId) {
  if (sourceId === 'flaredown') return FLAREDOWN_ALIASES;
  if (sourceId === 'bearable') return BEARABLE_ALIASES;
  if (sourceId === 'cara') return CARA_ALIASES;
  return { ...BEARABLE_ALIASES, ...FLAREDOWN_ALIASES, ...CARA_ALIASES };
}

export async function parseMigrationFile(text, sourceId = 'generic') {
  const adapter = MIGRATION_ADAPTERS.find((A) => A.id === sourceId);
  if (adapter) return adapter.parse(text);
  return parseMigrationCsv(text, sourceId);
}

export function parseMigrationCsv(text, sourceId = 'generic') {
  const lines = String(text || '').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error('Migration CSV must include a header row and data.');
  const headers = parseCsvLine(lines[0]);
  const aliasMap = resolveAliasMap(sourceId);
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

export function listMigrationSources() {
  return MIGRATION_SOURCES;
}
