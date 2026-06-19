/** Plan 11 R5 — gentle re-engagement after 7 days idle; max one nudge per idle period. */

export const RE_ENGAGEMENT_IDLE_DAYS = 7;

export function touchLastActiveAt(now = new Date()) {
  return now.toISOString();
}

export function daysSinceIso(iso, now = new Date()) {
  if (!iso || typeof iso !== 'string') return Infinity;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return Infinity;
  return (now.getTime() - t) / 86_400_000;
}

export function shouldFireReEngagementNudge(now = new Date(), opts = {}) {
  if (opts.enabled === false) return { fire: false, reason: 'disabled' };
  const lastActiveAt = opts.lastActiveAt;
  if (!lastActiveAt) return { fire: false, reason: 'no-activity-baseline' };
  const idleDays = daysSinceIso(lastActiveAt, now);
  if (idleDays < RE_ENGAGEMENT_IDLE_DAYS) {
    return { fire: false, reason: 'not-idle-enough', idleDays };
  }
  const lastNudge = opts.lastReEngagementNudgeAt;
  if (lastNudge && Date.parse(lastNudge) >= Date.parse(lastActiveAt)) {
    return { fire: false, reason: 'already-nudged', idleDays };
  }
  return { fire: true, reason: 'idle-7d', idleDays };
}

export function buildReEngagementNotificationContent() {
  return {
    title: 'We miss you',
    body: 'A quick check-in keeps your health trends useful. Tap to log today.',
    url: '/?quick=true',
  };
}
