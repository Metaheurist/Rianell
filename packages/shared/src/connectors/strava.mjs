/** Map Strava activity payloads to partial daily log entries. */

function activityDate(activity) {
  const raw = activity.start_date_local || activity.start_date || '';
  return String(raw).slice(0, 10);
}

export function mapStravaActivitiesToPartialLogs(activities) {
  const byDate = new Map();
  for (const act of activities || []) {
    const date = activityDate(act);
    if (!date || date.length < 10) continue;
    const name = String(act.name || act.type || 'Activity').slice(0, 120);
    const seconds = Number(act.moving_time ?? act.elapsed_time ?? 0);
    const duration = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds / 60)) : 0;
    const exercise = { name, duration };
    const existing = byDate.get(date) || { date, exercise: [] };
    existing.exercise = [...(existing.exercise || []), exercise];
    byDate.set(date, existing);
  }
  return [...byDate.values()];
}
