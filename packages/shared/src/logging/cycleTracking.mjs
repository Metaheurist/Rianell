/** Cycle tracking UI + normalization helpers (Plan 04 L7). */

export const CYCLE_DAY_MIN = 1;
export const CYCLE_DAY_TYPICAL_MAX = 28;
export const CYCLE_DAY_MAX = 45;

export const CYCLE_PHASES = [
  { id: 'menstrual', i18n: 'wizard.cycle.phase.menstrual', tone: 'menstrual' },
  { id: 'follicular', i18n: 'wizard.cycle.phase.follicular', tone: 'follicular' },
  { id: 'ovulation', i18n: 'wizard.cycle.phase.ovulation', tone: 'ovulation' },
  { id: 'luteal', i18n: 'wizard.cycle.phase.luteal', tone: 'luteal' },
];

export const CYCLE_FLOW_LEVELS = [
  { id: 'none', i18n: 'wizard.cycle.flow.none', drops: 0 },
  { id: 'light', i18n: 'wizard.cycle.flow.light', drops: 1 },
  { id: 'medium', i18n: 'wizard.cycle.flow.medium', drops: 2 },
  { id: 'heavy', i18n: 'wizard.cycle.flow.heavy', drops: 3 },
];

const PHASE_IDS = new Set(CYCLE_PHASES.map((p) => p.id));
const FLOW_IDS = new Set(CYCLE_FLOW_LEVELS.map((f) => f.id));

/** Typical 28-day pattern — suggestion only; user can override. */
export function suggestCyclePhaseForDay(day) {
  const n = typeof day === 'number' ? day : typeof day === 'string' ? parseInt(day, 10) : NaN;
  if (!Number.isFinite(n) || n < CYCLE_DAY_MIN) return undefined;
  if (n <= 5) return 'menstrual';
  if (n <= 13) return 'follicular';
  if (n <= 16) return 'ovulation';
  return 'luteal';
}

export function isValidCyclePhase(id) {
  return PHASE_IDS.has(id);
}

export function isValidCycleFlow(id) {
  return FLOW_IDS.has(id);
}
