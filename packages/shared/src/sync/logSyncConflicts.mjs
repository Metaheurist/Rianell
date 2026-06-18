/** Plan 06 D3 — detect same-date log divergence before cloud merge. */

const CONFLICT_KEYS = [
  'bpm', 'weight', 'fatigue', 'stiffness', 'backPain', 'sleep', 'jointPain',
  'mobility', 'dailyFunction', 'swelling', 'flare', 'mood', 'irritability', 'notes',
];

function snapshot(entry) {
  const out = {};
  for (const k of CONFLICT_KEYS) {
    const v = entry && entry[k];
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return JSON.stringify(out);
}

export function findLogSyncConflicts(localLogs, cloudLogs) {
  const cloudByDate = new Map();
  if (Array.isArray(cloudLogs)) {
    for (const log of cloudLogs) {
      if (log && log.date) cloudByDate.set(log.date, log);
    }
  }
  const conflicts = [];
  if (!Array.isArray(localLogs)) return conflicts;
  for (const local of localLogs) {
    if (!local || !local.date) continue;
    const cloud = cloudByDate.get(local.date);
    if (!cloud) continue;
    if (snapshot(local) !== snapshot(cloud)) {
      conflicts.push({ date: local.date, local, cloud });
    }
  }
  return conflicts;
}

/** Merge logs; for conflicting dates use `policy` ('local' | 'cloud') or per-date override map. */
export function mergeHealthLogsWithConflictPolicy(localLogs, cloudLogs, policy = 'local', perDate = {}) {
  const cloudMap = new Map();
  const localMap = new Map();
  if (Array.isArray(cloudLogs)) cloudLogs.forEach((l) => { if (l?.date) cloudMap.set(l.date, l); });
  if (Array.isArray(localLogs)) localLogs.forEach((l) => { if (l?.date) localMap.set(l.date, l); });
  const conflictDates = new Set(findLogSyncConflicts(localLogs, cloudLogs).map((c) => c.date));
  const dates = new Set([...cloudMap.keys(), ...localMap.keys()]);
  const merged = [];
  for (const date of dates) {
    const local = localMap.get(date);
    const cloud = cloudMap.get(date);
    if (local && cloud && conflictDates.has(date)) {
      const pick = perDate[date] === 'cloud' ? 'cloud' : (perDate[date] === 'local' ? 'local' : policy);
      merged.push(pick === 'cloud' ? cloud : local);
    } else {
      merged.push(local || cloud);
    }
  }
  merged.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return merged;
}
