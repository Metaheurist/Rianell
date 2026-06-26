/** Plan 17 NU3 — per-food sensitivity detection from log correlation. */

function parseDate(iso) {
  const d = new Date(`${iso}T12:00:00Z`);
  return Number.isFinite(d.getTime()) ? d : null;
}

function hoursBetween(a, b) {
  return Math.abs(b.getTime() - a.getTime()) / 3_600_000;
}

function symptomScore(log) {
  const pain = Number(log?.pain ?? log?.stiffness ?? 0);
  const fatigue = Number(log?.fatigue ?? 0);
  const mood = Number(log?.mood ?? 5);
  const moodInverse = 10 - Math.min(10, Math.max(0, mood));
  return (pain + fatigue + moodInverse) / 3;
}

function collectFoodEvents(logs) {
  const events = [];
  for (const log of logs) {
    if (!log?.date) continue;
    const food = log.food;
    if (!food || typeof food !== 'object') continue;
    for (const meal of ['breakfast', 'lunch', 'dinner', 'snack']) {
      const items = food[meal];
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        const name = typeof item === 'string' ? item : item?.name;
        if (!name || typeof name !== 'string') continue;
        events.push({ food: name.trim().toLowerCase(), date: log.date, log });
      }
    }
  }
  return events;
}

/**
 * @param {Array<object>} logs
 * @returns {Array<{food:string,occurrences:number,deltaPct:number,confidence:'low'|'medium'|'high',suspected:boolean}>}
 */
export function detectFoodSensitivities(logs) {
  if (!Array.isArray(logs) || logs.length < 3) return [];
  const events = collectFoodEvents(logs);
  const byFood = new Map();
  for (const ev of events) {
    if (!byFood.has(ev.food)) byFood.set(ev.food, []);
    byFood.get(ev.food).push(ev);
  }

  const allScores = logs.map(symptomScore).filter((s) => Number.isFinite(s));
  const baseline = allScores.length
    ? allScores.reduce((a, b) => a + b, 0) / allScores.length
    : 5;

  const results = [];
  for (const [food, evs] of byFood) {
    if (evs.length < 3) continue;
    const postScores = [];
    for (const ev of evs) {
      const eaten = parseDate(ev.date);
      if (!eaten) continue;
      for (const log of logs) {
        const ld = parseDate(log.date);
        if (!ld) continue;
        const h = hoursBetween(eaten, ld);
        if (h > 0 && h <= 48) postScores.push(symptomScore(log));
      }
    }
    if (!postScores.length) continue;
    const postAvg = postScores.reduce((a, b) => a + b, 0) / postScores.length;
    const deltaPct = baseline > 0 ? ((postAvg - baseline) / baseline) * 100 : 0;
    const occurrences = evs.length;
    let confidence = 'low';
    if (occurrences >= 5) confidence = 'medium';
    if (occurrences >= 8 && deltaPct > 30) confidence = 'high';
    const suspected = deltaPct > 20;
    results.push({ food, occurrences, deltaPct: Math.round(deltaPct), confidence, suspected });
  }
  return results.filter((r) => r.suspected).sort((a, b) => b.deltaPct - a.deltaPct);
}
