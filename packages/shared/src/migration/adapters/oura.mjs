/** Plan 25 DM3 — Oura Ring CSV import. */

import { MigrationAdapter } from '../MigrationAdapter.mjs';

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

function parseCsv(text) {
  const lines = String(text || '').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCsvLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = vals[idx];
    });
    rows.push(row);
  }
  return rows;
}

export class OuraMigrationAdapter extends MigrationAdapter {
  static get id() {
    return 'oura';
  }

  static get displayName() {
    return 'Oura Ring';
  }

  static get fileTypes() {
    return ['.csv'];
  }

  static get fieldMap() {
    return {
      date: 'date',
      total_sleep_duration: 'sleepHours',
      hrv_average: 'hrv',
      steps: 'exercise.steps',
      score: 'ouraReadiness',
    };
  }

  static async parse(fileContent) {
    const rows = parseCsv(fileContent);
    const byDate = new Map();
    for (const row of rows) {
      const date = String(row.date || '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      const entry = byDate.get(date) || { date };
      if (row.total_sleep_duration) {
        const secs = Number(row.total_sleep_duration);
        if (Number.isFinite(secs)) entry.sleep = Math.min(10, Math.round((secs / 3600) * 2));
      }
      if (row.hrv_average) entry.hrv = Number(row.hrv_average);
      if (row.steps) entry.steps = Number(row.steps);
      if (row.score) entry.ouraReadiness = Number(row.score);
      byDate.set(date, entry);
    }
    return [...byDate.values()];
  }
}
