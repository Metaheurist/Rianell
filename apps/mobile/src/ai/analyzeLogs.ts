import type { LogEntry } from '../storage/logs';

export type AiRange = 14 | 30 | 90 | 'all';

export type AiSummary = {
  totalLogs: number;
  rangeLabel: string;
  flareDays: number;
  avgMood: number | null;
  avgSleep: number | null;
  avgFatigue: number | null;
  topSymptoms: string[];
  topStressors: string[];
  whatYouLogged: string[];
  howYouAreDoing: string[];
  thingsToWatch: string[];
  important: string[];
  correlations: string[];
  groupsThatChangeTogether: string[];
  possibleFlareUp: {
    level: 'Low' | 'Medium' | 'High';
    matchingSignals: number;
    notes: string[];
  };
};

function toDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function topItems(logs: LogEntry[], key: 'symptoms' | 'stressors', limit = 3): string[] {
  const counts = new Map<string, number>();
  logs.forEach((log) => {
    const list = log[key];
    if (!Array.isArray(list)) return;
    list.forEach((x) => {
      if (typeof x !== 'string') return;
      const item = x.trim();
      if (!item) return;
      counts.set(item, (counts.get(item) ?? 0) + 1);
    });
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, count]) => `${name} (${count})`);
}

function pearson(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 3) return null;
  const n = xs.length;
  const avgX = xs.reduce((a, b) => a + b, 0) / n;
  const avgY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - avgX;
    const dy = ys[i] - avgY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  if (denX === 0 || denY === 0) return null;
  return num / Math.sqrt(denX * denY);
}

export function filterLogsByRange(logs: LogEntry[], range: AiRange): LogEntry[] {
  if (range === 'all') return logs;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (range - 1));
  return logs.filter((log) => {
    const d = toDate(log.date);
    return !!d && d >= start && d <= today;
  });
}

export function summarizeLogsForAi(logs: LogEntry[], range: AiRange): AiSummary {
  const selected = filterLogsByRange(logs, range);
  const rangeLabel = range === 'all' ? 'All time' : `Last ${range} days`;
  const flareDays = selected.filter((x) => x.flare === 'Yes').length;
  const mood = selected.map((x) => x.mood).filter((x): x is number => x != null);
  const sleep = selected.map((x) => x.sleep).filter((x): x is number => x != null);
  const fatigue = selected.map((x) => x.fatigue).filter((x): x is number => x != null);
  const moodAvg = mean(mood);
  const sleepAvg = mean(sleep);
  const fatigueAvg = mean(fatigue);
  const daysWithFood = selected.filter((x) => {
    const f = x.food;
    if (!f || typeof f !== 'object') return false;
    return ['breakfast', 'lunch', 'dinner', 'snack'].some((k) => Array.isArray((f as Record<string, unknown>)[k]) && ((f as Record<string, unknown>)[k] as unknown[]).length > 0);
  }).length;
  const daysWithExercise = selected.filter((x) => Array.isArray(x.exercise) && x.exercise.length > 0).length;
  const whatYouLogged = [
    `${selected.length} logged day(s) in ${rangeLabel.toLowerCase()}`,
    `${flareDays} flare day(s)`,
    `${daysWithFood} day(s) with food entries`,
    `${daysWithExercise} day(s) with exercise entries`,
  ];

  const howYouAreDoing: string[] = [];
  if (moodAvg != null) howYouAreDoing.push(`Mood average: ${moodAvg.toFixed(1)} / 10`);
  if (sleepAvg != null) howYouAreDoing.push(`Sleep average: ${sleepAvg.toFixed(1)} / 10`);
  if (fatigueAvg != null) howYouAreDoing.push(`Fatigue average: ${fatigueAvg.toFixed(1)} / 10`);
  if (!howYouAreDoing.length) howYouAreDoing.push('Not enough scored metrics yet.');

  const thingsToWatch: string[] = [];
  if (flareDays > 0 && selected.length > 0 && flareDays / selected.length >= 0.4) {
    thingsToWatch.push('Flare frequency is elevated in this range.');
  }
  if (fatigueAvg != null && fatigueAvg >= 7) thingsToWatch.push('Fatigue trend is high (7+).');
  if (sleepAvg != null && sleepAvg <= 4) thingsToWatch.push('Sleep trend is low (4 or below).');
  if (moodAvg != null && moodAvg <= 4) thingsToWatch.push('Mood trend is low (4 or below).');
  if (!thingsToWatch.length) thingsToWatch.push('No strong warning signals in current range.');

  const important: string[] = [];
  const sortedByDate = [...selected].sort((a, b) => a.date.localeCompare(b.date));
  const last = sortedByDate[sortedByDate.length - 1];
  const prev = sortedByDate.length > 1 ? sortedByDate[sortedByDate.length - 2] : null;
  if (last && prev) {
    if (last.fatigue != null && prev.fatigue != null && last.fatigue - prev.fatigue >= 3) {
      important.push('Fatigue rose sharply since your previous log.');
    }
    if (last.sleep != null && prev.sleep != null && prev.sleep - last.sleep >= 3) {
      important.push('Sleep dropped sharply since your previous log.');
    }
    if (last.mood != null && prev.mood != null && prev.mood - last.mood >= 3) {
      important.push('Mood dropped sharply since your previous log.');
    }
  }
  if (!important.length) important.push('No sudden changes detected between recent logs.');

  const correlations: string[] = [];
  const moodSleepPairs = selected
    .filter((x) => x.mood != null && x.sleep != null)
    .map((x) => ({ x: x.mood as number, y: x.sleep as number }));
  const sleepFatiguePairs = selected
    .filter((x) => x.sleep != null && x.fatigue != null)
    .map((x) => ({ x: x.sleep as number, y: x.fatigue as number }));
  const moodFatiguePairs = selected
    .filter((x) => x.mood != null && x.fatigue != null)
    .map((x) => ({ x: x.mood as number, y: x.fatigue as number }));

  const cMoodSleep = pearson(
    moodSleepPairs.map((p) => p.x),
    moodSleepPairs.map((p) => p.y)
  );
  const cSleepFatigue = pearson(
    sleepFatiguePairs.map((p) => p.x),
    sleepFatiguePairs.map((p) => p.y)
  );
  const cMoodFatigue = pearson(
    moodFatiguePairs.map((p) => p.x),
    moodFatiguePairs.map((p) => p.y)
  );
  if (cMoodSleep != null && Math.abs(cMoodSleep) >= 0.35) {
    correlations.push(`Mood vs sleep: ${cMoodSleep > 0 ? 'positive' : 'negative'} link (${cMoodSleep.toFixed(2)}).`);
  }
  if (cSleepFatigue != null && Math.abs(cSleepFatigue) >= 0.35) {
    correlations.push(`Sleep vs fatigue: ${cSleepFatigue > 0 ? 'positive' : 'negative'} link (${cSleepFatigue.toFixed(2)}).`);
  }
  if (cMoodFatigue != null && Math.abs(cMoodFatigue) >= 0.35) {
    correlations.push(`Mood vs fatigue: ${cMoodFatigue > 0 ? 'positive' : 'negative'} link (${cMoodFatigue.toFixed(2)}).`);
  }
  if (!correlations.length) correlations.push('No strong metric correlations detected in this range yet.');

  const groupsThatChangeTogether: string[] = [];
  if (cMoodSleep != null && Math.abs(cMoodSleep) >= 0.35) {
    groupsThatChangeTogether.push(
      cMoodSleep > 0
        ? 'Mood and sleep tend to move together.'
        : 'Mood and sleep tend to move in opposite directions.'
    );
  }
  if (cSleepFatigue != null && Math.abs(cSleepFatigue) >= 0.35) {
    groupsThatChangeTogether.push(
      cSleepFatigue > 0
        ? 'Sleep and fatigue rise/fall together.'
        : 'Better sleep tends to pair with lower fatigue.'
    );
  }
  if (cMoodFatigue != null && Math.abs(cMoodFatigue) >= 0.35) {
    groupsThatChangeTogether.push(
      cMoodFatigue > 0
        ? 'Mood and fatigue increase/decrease together.'
        : 'Lower fatigue tends to pair with better mood.'
    );
  }
  if (!groupsThatChangeTogether.length) {
    groupsThatChangeTogether.push('Not enough linked movement to form a strong group yet.');
  }

  let matchingSignals = 0;
  const flareNotes: string[] = [];
  if (fatigueAvg != null && fatigueAvg >= 7) {
    matchingSignals += 1;
    flareNotes.push('Fatigue is elevated.');
  }
  if (sleepAvg != null && sleepAvg <= 4) {
    matchingSignals += 1;
    flareNotes.push('Sleep score is low.');
  }
  if (moodAvg != null && moodAvg <= 4) {
    matchingSignals += 1;
    flareNotes.push('Mood score is low.');
  }
  const topSymOnce = topItems(selected, 'symptoms', 1);
  if (topSymOnce.length > 0) {
    const topSym = topSymOnce[0] ?? '';
    if (/\((\d+)\)$/.test(topSym)) {
      const m = topSym.match(/\((\d+)\)$/);
      const count = m ? Number(m[1]) : 0;
      if (count >= 3) {
        matchingSignals += 1;
        flareNotes.push('One symptom appears frequently.');
      }
    }
  }
  if (selected.length > 0 && flareDays / selected.length >= 0.4) {
    matchingSignals += 1;
    flareNotes.push('Recent flare frequency is elevated.');
  }
  const level: 'Low' | 'Medium' | 'High' =
    matchingSignals >= 4 ? 'High' : matchingSignals >= 2 ? 'Medium' : 'Low';
  if (!flareNotes.length) flareNotes.push('No strong flare-up indicators in this range.');

  return {
    totalLogs: selected.length,
    rangeLabel,
    flareDays,
    avgMood: moodAvg,
    avgSleep: sleepAvg,
    avgFatigue: fatigueAvg,
    topSymptoms: topItems(selected, 'symptoms'),
    topStressors: topItems(selected, 'stressors'),
    whatYouLogged,
    howYouAreDoing,
    thingsToWatch,
    important,
    correlations,
    groupsThatChangeTogether,
    possibleFlareUp: {
      level,
      matchingSignals,
      notes: flareNotes,
    },
  };
}
