/** Plan 04 L3 — medication scheduler (local-only; reminders wired in plan 11). */

const MAX_SCHEDULE = 20;

function normalizeTime(value) {
  if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) return null;
  const [h, m] = value.split(':').map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return value;
}

export function normalizeMedScheduleEntry(value) {
  const v = value && typeof value === 'object' ? value : {};
  const drug = typeof v.drug === 'string' ? v.drug.trim().slice(0, 120) : '';
  const dose = typeof v.dose === 'string' ? v.dose.trim().slice(0, 80) : '';
  const times = Array.isArray(v.times)
    ? v.times.map(normalizeTime).filter(Boolean).slice(0, 8)
    : [];
  const id = typeof v.id === 'string' && v.id.trim() ? v.id.trim().slice(0, 40) : `med-${drug.slice(0, 20) || 'rx'}`;
  if (!drug && !times.length) return null;
  return { id, drug: drug || 'Medication', dose, times, enabled: v.enabled !== false };
}

export function normalizeMedSchedule(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = new Set();
  for (const row of raw) {
    const entry = normalizeMedScheduleEntry(row);
    if (!entry || seen.has(entry.id)) continue;
    seen.add(entry.id);
    out.push(entry);
    if (out.length >= MAX_SCHEDULE) break;
  }
  return out;
}

export function buildTodayMedDoseStatuses(schedule, dateIso, takenMap = {}) {
  const day = typeof dateIso === 'string' ? dateIso.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const entries = normalizeMedSchedule(schedule).filter((e) => e.enabled !== false);
  const doses = [];
  entries.forEach((entry) => {
    entry.times.forEach((time) => {
      const key = `${entry.id}@${day}T${time}`;
      const status = takenMap[key] === 'skipped' || takenMap[key] === 'missed' ? takenMap[key] : takenMap[key] === 'taken' ? 'taken' : 'pending';
      doses.push({
        drug: entry.drug,
        dose: entry.dose,
        scheduledAt: `${day}T${time}`,
        status,
        scheduleId: entry.id,
      });
    });
  });
  return doses;
}
