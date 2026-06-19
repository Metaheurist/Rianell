/** Plan 10 H6 — appointment countdown for clinician visit prep. */

export const APPOINTMENT_COUNTDOWN_DAYS = 14;

export function parseAppointmentDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
}

export function daysUntilAppointment(appointmentDate, todayStr) {
  const a = parseAppointmentDate(appointmentDate);
  const t = parseAppointmentDate(todayStr);
  if (!a || !t) return null;
  const ms = new Date(`${a}T12:00:00`).getTime() - new Date(`${t}T12:00:00`).getTime();
  return Math.round(ms / 86400000);
}

export function shouldShowAppointmentCard(appointmentDate, todayStr, maxDays = APPOINTMENT_COUNTDOWN_DAYS) {
  const days = daysUntilAppointment(appointmentDate, todayStr);
  if (days == null) return false;
  return days >= 0 && days <= maxDays;
}

export function appointmentCountdownLabelKey(days) {
  if (days === 0) return 'home.appointment.today';
  if (days === 1) return 'home.appointment.tomorrow';
  return 'home.appointment.inDays';
}
