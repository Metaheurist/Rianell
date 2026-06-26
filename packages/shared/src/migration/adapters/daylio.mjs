/** Plan 25 DM8 — Daylio CSV backup import. */

import { MigrationAdapter } from '../MigrationAdapter.mjs';

const ACTIVITY_MAP = {
  sleep: 'sleep',
  sport: 'exercise',
  exercise: 'exercise',
  meds: 'medication',
};

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQuotes = !inQuotes;
    else if (c === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else current += c;
  }
  values.push(current.trim());
  return values;
}

export class DaylioMigrationAdapter extends MigrationAdapter {
  static get id() {
    return 'daylio';
  }

  static get displayName() {
    return 'Daylio';
  }

  static get fileTypes() {
    return ['.csv'];
  }

  static get fieldMap() {
    return { date: 'date', mood: 'mood', note: 'notes', activities: 'tags' };
  }

  static async parse(fileContent) {
    const lines = String(fileContent || '').split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
    const logs = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = parseCsvLine(lines[i]);
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = vals[idx];
      });
      const date = String(row.date || '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      const moodRaw = Number.parseInt(row.mood, 10);
      const entry = { date };
      if (Number.isFinite(moodRaw)) entry.mood = Math.min(10, Math.max(1, moodRaw * 2));
      if (row.note) entry.notes = String(row.note).slice(0, 500);
      const acts = String(row.activities || '')
        .split(',')
        .map((a) => a.trim().toLowerCase())
        .filter(Boolean);
      for (const a of acts) {
        if (ACTIVITY_MAP[a]) entry[ACTIVITY_MAP[a]] = entry[ACTIVITY_MAP[a]] || true;
      }
      logs.push(entry);
    }
    return logs;
  }
}
