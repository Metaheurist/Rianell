/** Plan 25 - Cara Care CSV import (gut health diary). */

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

export class CaraMigrationAdapter extends MigrationAdapter {
  static get id() {
    return 'cara';
  }

  static get displayName() {
    return 'Cara Care';
  }

  static get fileTypes() {
    return ['.csv'];
  }

  static get fieldMap() {
    return {
      Date: 'date',
      Symptoms: 'symptoms',
      Mood: 'mood',
      Notes: 'notes',
      Pain: 'jointPain',
    };
  }

  static async parse(fileContent) {
    const lines = String(fileContent || '').split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = parseCsvLine(lines[0]);
    const lowerHeaders = headers.map((h) => h.toLowerCase());
    const logs = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = parseCsvLine(lines[i]);
      const row = {};
      lowerHeaders.forEach((h, idx) => {
        row[h] = vals[idx];
      });
      const dateRaw = row.date || row.day;
      const date = String(dateRaw || '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      const entry = { date };
      const mood = Number.parseInt(row.mood, 10);
      if (Number.isFinite(mood)) entry.mood = Math.min(10, mood);
      const pain = Number.parseInt(row.pain, 10);
      if (Number.isFinite(pain)) entry.jointPain = Math.min(10, pain);
      const notes = [row.notes, row.symptoms].filter(Boolean).join(' - ');
      if (notes) entry.notes = notes.slice(0, 500);
      logs.push(entry);
    }
    return logs;
  }
}
