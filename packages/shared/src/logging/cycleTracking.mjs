/** Cycle tracking UI + normalization helpers (Plan 04 L7). */

export const CYCLE_DAY_MIN = 1;
export const CYCLE_DAY_TYPICAL_MAX = 28;
/** ACOG-cited typical upper bound — late messaging threshold (not phase-hint template). */
export const CYCLE_DAY_NORMAL_MAX = 35;
/** Default day-selector pill count in wizard UI. */
export const CYCLE_DAY_SELECTOR_MAX = 35;
/** Irregular / adolescent storage cap (Clue cites 21–45 for early cycles). */
export const CYCLE_DAY_MAX = 45;

export const CYCLE_PHASES = [
  { id: 'menstrual', i18n: 'wizard.cycle.phase.menstrual', tone: 'menstrual', icon: 'cycle-menstrual' },
  { id: 'follicular', i18n: 'wizard.cycle.phase.follicular', tone: 'follicular', icon: 'cycle-follicular' },
  { id: 'ovulation', i18n: 'wizard.cycle.phase.ovulation', tone: 'ovulation', icon: 'cycle-ovulation' },
  { id: 'luteal', i18n: 'wizard.cycle.phase.luteal', tone: 'luteal', icon: 'cycle-luteal' },
];

export const CYCLE_FLOW_LEVELS = [
  { id: 'none', i18n: 'wizard.cycle.flow.none', drops: 0 },
  { id: 'light', i18n: 'wizard.cycle.flow.light', drops: 1 },
  { id: 'medium', i18n: 'wizard.cycle.flow.medium', drops: 2 },
  { id: 'heavy', i18n: 'wizard.cycle.flow.heavy', drops: 3 },
];

const PHASE_IDS = new Set(CYCLE_PHASES.map((p) => p.id));
const FLOW_IDS = new Set(CYCLE_FLOW_LEVELS.map((f) => f.id));
const PERIOD_FLOW_IDS = new Set(['light', 'medium', 'heavy']);

function parseCycleDay(raw) {
  const day = typeof raw === 'number' ? raw : typeof raw === 'string' ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(day) || day < CYCLE_DAY_MIN) return undefined;
  return day;
}

function isBackwardCompatPeriodStart(cycle) {
  if (!cycle || typeof cycle !== 'object') return false;
  if (cycle.periodStart === true) return true;
  const day = parseCycleDay(cycle.cycleDay);
  if (day !== 1) return false;
  if (cycle.phase === 'menstrual') return true;
  return PERIOD_FLOW_IDS.has(cycle.flow);
}

/** Typical 28-day pattern — suggestion only; user can override. */
export function suggestCyclePhaseForDay(day) {
  const n = typeof day === 'number' ? day : typeof day === 'string' ? parseInt(day, 10) : NaN;
  if (!Number.isFinite(n) || n < CYCLE_DAY_MIN) return undefined;
  if (n <= 5) return 'menstrual';
  if (n <= 13) return 'follicular';
  if (n <= 16) return 'ovulation';
  return 'luteal';
}

/** Whole-day difference between ISO dates (YYYY-MM-DD). */
export function daysBetweenIsoDates(fromDate, toDate) {
  if (typeof fromDate !== 'string' || typeof toDate !== 'string') return NaN;
  const a = new Date(fromDate + 'T12:00:00');
  const b = new Date(toDate + 'T12:00:00');
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return NaN;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function daysSincePeriodStart(periodStartDate, targetDateIso) {
  const delta = daysBetweenIsoDates(periodStartDate, targetDateIso);
  if (!Number.isFinite(delta) || delta < 0) return null;
  return delta;
}

export function computeCycleDayFromPeriodStart(periodStartDate, targetDateIso) {
  const delta = daysBetweenIsoDates(periodStartDate, targetDateIso);
  if (!Number.isFinite(delta) || delta < 0) return null;
  return delta + 1;
}

export function isCycleDayLate(cycleDay) {
  const n = typeof cycleDay === 'number' ? cycleDay : typeof cycleDay === 'string' ? parseInt(cycleDay, 10) : NaN;
  if (!Number.isFinite(n)) return false;
  return n > CYCLE_DAY_NORMAL_MAX;
}

/**
 * Latest log entry that recorded a cycle day (by date descending).
 * @param {unknown[]} logs
 */
export function findLatestCycleAnchor(logs) {
  const list = Array.isArray(logs) ? logs : [];
  let best = null;
  for (const log of list) {
    if (!log || typeof log !== 'object') continue;
    const c = log.cycle;
    if (!c || typeof c !== 'object') continue;
    const day = parseCycleDay(c.cycleDay);
    if (day == null) continue;
    const date = typeof log.date === 'string' ? log.date : '';
    if (!date) continue;
    if (!best || date > best.date) {
      best = { date, cycleDay: day, phase: typeof c.phase === 'string' ? c.phase : '' };
    }
  }
  return best;
}

/**
 * Latest period-start anchor (explicit flag or backward-compat day-1 menstrual/bleeding).
 * @param {unknown[]} logs
 */
export function findLatestPeriodStart(logs) {
  const list = Array.isArray(logs) ? logs : [];
  let best = null;
  for (const log of list) {
    if (!log || typeof log !== 'object') continue;
    const c = log.cycle;
    if (!c || typeof c !== 'object') continue;
    if (!isBackwardCompatPeriodStart(c)) continue;
    const date = typeof log.date === 'string' ? log.date : '';
    if (!date) continue;
    if (!best || date > best.date) {
      best = {
        date,
        explicit: c.periodStart === true,
        phase: typeof c.phase === 'string' ? c.phase : '',
      };
    }
  }
  return best;
}

/**
 * Suggest cycle day + phase for a target log date from prior submissions.
 * @param {unknown[]} logs
 * @param {string} targetDateIso YYYY-MM-DD
 */
export function suggestCycleForDate(logs, targetDateIso) {
  if (typeof targetDateIso !== 'string' || !targetDateIso) return null;

  const periodStart = findLatestPeriodStart(logs);
  if (periodStart) {
    let cycleDay = computeCycleDayFromPeriodStart(periodStart.date, targetDateIso);
    if (cycleDay == null) return null;
    if (cycleDay > CYCLE_DAY_MAX) cycleDay = CYCLE_DAY_MAX;
    const phase = suggestCyclePhaseForDay(cycleDay) || '';
    return {
      cycleDay,
      phase,
      fromDate: periodStart.date,
      periodStartDate: periodStart.date,
      late: isCycleDayLate(cycleDay),
      suggested: true,
    };
  }

  const anchor = findLatestCycleAnchor(logs);
  if (!anchor) return null;
  const delta = daysBetweenIsoDates(anchor.date, targetDateIso);
  if (!Number.isFinite(delta) || delta < 0) return null;
  let cycleDay = anchor.cycleDay + delta;
  if (cycleDay > CYCLE_DAY_MAX) cycleDay = CYCLE_DAY_MAX;
  const phase = suggestCyclePhaseForDay(cycleDay) || '';
  return {
    cycleDay,
    phase,
    fromDate: anchor.date,
    late: isCycleDayLate(cycleDay),
    suggested: true,
  };
}

export function isValidCyclePhase(id) {
  return PHASE_IDS.has(id);
}

export function isValidCycleFlow(id) {
  return FLOW_IDS.has(id);
}
