/** Plan 11 R2 — L3 medication dose local reminders. */

import { buildTodayMedDoseStatuses, normalizeMedSchedule } from '../logging/medSchedule.mjs';
import { localDateStrFromNow } from './smartReminder.mjs';

export const MED_DOSE_SNOOZE_MINUTES = 15;
export const MED_DOSE_FIRE_WINDOW_MS = 60_000;

export function medDoseReminderNotificationId(scheduledAt) {
  const safe = String(scheduledAt || '').replace(/[^0-9A-Za-z]/g, '');
  return `rianell-med-dose-${safe || 'unknown'}`;
}

export function extractMedDoseTakenMap(logs, dateStr) {
  const map = {};
  if (!Array.isArray(logs) || !dateStr) return map;
  const log = logs.find((l) => l && l.date === dateStr);
  if (!log) return map;
  if (Array.isArray(log.medicationDoses)) {
    log.medicationDoses.forEach((d) => {
      if (!d?.scheduledAt || !d.status) return;
      if (d.status === 'taken' || d.status === 'skipped' || d.status === 'missed') {
        map[d.scheduledAt] = d.status;
      }
    });
  }
  return map;
}

function parseScheduledAt(scheduledAt) {
  if (typeof scheduledAt !== 'string' || !scheduledAt.includes('T')) return null;
  const [date, time] = scheduledAt.split('T');
  const m = /^(\d{2}):(\d{2})$/.exec(time || '');
  if (!m || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return { date, hour: Number(m[1]), minute: Number(m[2]) };
}

export function isMedDoseSnoozed(scheduledAt, snoozeUntilMap, now = new Date()) {
  if (!snoozeUntilMap || typeof snoozeUntilMap !== 'object') return false;
  const until = snoozeUntilMap[scheduledAt];
  if (typeof until !== 'string') return false;
  const t = new Date(until);
  return !Number.isNaN(t.getTime()) && t > now;
}

export function listTodayMedDoseReminders(schedule, logs, now = new Date(), opts = {}) {
  const todayStr = opts.todayStr ?? localDateStrFromNow(now);
  const takenFromLog = extractMedDoseTakenMap(logs, todayStr);
  const takenMap = { ...takenFromLog, ...(opts.takenMap || {}) };
  const doses = buildTodayMedDoseStatuses(schedule, todayStr, takenMap).filter((d) => d.status === 'pending');
  const notified = opts.notifiedAt || {};
  const snoozeUntil = opts.snoozeUntil || {};
  return doses
    .map((dose) => {
      const parsed = parseScheduledAt(dose.scheduledAt);
      if (!parsed) return null;
      const triggerAt = new Date(`${parsed.date}T${String(parsed.hour).padStart(2, '0')}:${String(parsed.minute).padStart(2, '0')}:00`);
      const snoozed = isMedDoseSnoozed(dose.scheduledAt, snoozeUntil, now);
      const alreadyNotified = notified[dose.scheduledAt] === todayStr;
      const fire = shouldFireMedDoseReminder(dose, now, { todayStr, snoozeUntil, notified, triggerAt });
      return {
        ...dose,
        triggerAt: triggerAt.toISOString(),
        fire: fire.fire,
        fireReason: fire.reason,
        schedule: fire.schedule,
        snoozed,
        alreadyNotified,
      };
    })
    .filter(Boolean);
}

export function shouldFireMedDoseReminder(dose, now = new Date(), opts = {}) {
  const todayStr = opts.todayStr ?? localDateStrFromNow(now);
  const scheduledAt = dose?.scheduledAt;
  if (!scheduledAt || dose.status !== 'pending') return { fire: false, schedule: false, reason: 'not-pending' };
  if (isMedDoseSnoozed(scheduledAt, opts.snoozeUntil, now)) {
    return { fire: false, schedule: false, reason: 'snoozed' };
  }
  const notified = opts.notifiedAt || {};
  if (notified[scheduledAt] === todayStr) return { fire: false, schedule: false, reason: 'already-notified' };

  const parsed = parseScheduledAt(scheduledAt);
  if (!parsed || parsed.date !== todayStr) return { fire: false, schedule: false, reason: 'not-today' };

  const triggerAt =
    opts.triggerAt instanceof Date
      ? opts.triggerAt
      : new Date(`${parsed.date}T${String(parsed.hour).padStart(2, '0')}:${String(parsed.minute).padStart(2, '0')}:00`);
  const delta = now.getTime() - triggerAt.getTime();

  if (delta < 0) return { fire: false, schedule: true, reason: 'upcoming', triggerAt: triggerAt.toISOString() };
  if (delta <= MED_DOSE_FIRE_WINDOW_MS) return { fire: true, schedule: false, reason: 'due-now', triggerAt: triggerAt.toISOString() };
  if (delta <= 30 * 60_000) return { fire: true, schedule: false, reason: 'overdue', triggerAt: triggerAt.toISOString() };
  return { fire: false, schedule: false, reason: 'missed-window' };
}

export function hasEnabledMedSchedule(schedule) {
  return normalizeMedSchedule(schedule).some((e) => e.enabled !== false && Array.isArray(e.times) && e.times.length > 0);
}

export function buildMedDoseNotificationContent(dose) {
  const label = dose?.dose ? `${dose.drug} (${dose.dose})` : dose?.drug || 'Medication';
  return {
    title: 'Medication reminder',
    body: `Time for ${label}. Mark taken when you log today.`,
    scheduledAt: dose.scheduledAt,
  };
}
