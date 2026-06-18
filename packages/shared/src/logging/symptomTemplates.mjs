/** Plan 04 L6 — user-learned symptom chip templates per condition. */

const MAX_TEMPLATES = 12;
const MAX_CHIPS = 40;

export function normalizeSymptomTemplates(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const row of value) {
    if (!row || typeof row !== 'object') continue;
    const condition = typeof row.condition === 'string' ? row.condition.trim().slice(0, 120) : '';
    const chips = Array.isArray(row.chips)
      ? row.chips.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim().slice(0, 80)).slice(0, MAX_CHIPS)
      : [];
    if (!condition && !chips.length) continue;
    out.push({ condition: condition || 'General', chips });
    if (out.length >= MAX_TEMPLATES) break;
  }
  return out;
}

export function getSymptomChipsForCondition(templates, condition) {
  const list = normalizeSymptomTemplates(templates);
  const needle = (condition || '').trim().toLowerCase();
  if (!needle) return list[0]?.chips || [];
  const exact = list.find((t) => t.condition.toLowerCase() === needle);
  if (exact) return exact.chips;
  const partial = list.find((t) => t.condition.toLowerCase().includes(needle) || needle.includes(t.condition.toLowerCase()));
  return partial?.chips || list[0]?.chips || [];
}

export function upsertSymptomTemplate(templates, condition, chips) {
  const list = normalizeSymptomTemplates(templates);
  const cond = (condition || 'General').trim().slice(0, 120);
  const chipList = Array.isArray(chips)
    ? chips.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim().slice(0, 80)).slice(0, MAX_CHIPS)
    : [];
  const idx = list.findIndex((t) => t.condition.toLowerCase() === cond.toLowerCase());
  if (idx >= 0) {
    const next = [...list];
    next[idx] = { condition: cond, chips: chipList };
    return next;
  }
  return [...list, { condition: cond, chips: chipList }].slice(-MAX_TEMPLATES);
}
