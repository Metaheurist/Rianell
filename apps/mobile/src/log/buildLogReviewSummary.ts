import type { LogEntry } from '../storage/logs';

/** Plain-text summary for the Review step (web parity: log review before save). */
export function buildLogReviewSummary(entry: LogEntry): string {
  const lines: string[] = [];
  lines.push(`Date: ${entry.date}`);
  lines.push(`Flare: ${entry.flare ?? '—'}`);
  if (entry.bpm != null) lines.push(`BPM: ${entry.bpm}`);
  if (entry.weight) lines.push(`Weight (kg): ${entry.weight}`);
  if (entry.sleep != null) lines.push(`Sleep: ${entry.sleep}/10`);
  if (entry.mood != null) lines.push(`Mood: ${entry.mood}/10`);
  if (entry.fatigue != null) lines.push(`Fatigue: ${entry.fatigue}/10`);
  if (entry.steps != null) lines.push(`Steps: ${entry.steps}`);
  if (entry.hydration != null) lines.push(`Hydration: ${entry.hydration}`);
  if (entry.painLocation) lines.push(`Pain: ${entry.painLocation}`);
  if (entry.symptoms?.length) lines.push(`Symptoms: ${entry.symptoms.join(', ')}`);
  if (entry.energyClarity) lines.push(`Energy / clarity: ${entry.energyClarity}`);
  if (entry.stressors?.length) lines.push(`Stressors: ${entry.stressors.join(', ')}`);
  if (entry.dailyFunction != null) lines.push(`Daily function: ${entry.dailyFunction}/10`);
  if (entry.irritability != null) lines.push(`Irritability: ${entry.irritability}/10`);
  if (entry.weatherSensitivity != null) lines.push(`Weather sensitivity: ${entry.weatherSensitivity}/10`);
  const f = entry.food;
  if (f && typeof f === 'object') {
    const meals = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
    meals.forEach((m) => {
      const arr = (f as Record<string, unknown>)[m];
      if (Array.isArray(arr) && arr.length) lines.push(`${m}: ${arr.join(', ')}`);
    });
  }
  if (entry.exercise?.length) {
    lines.push(
      `Exercise: ${entry.exercise
        .map((e: { name: string; duration?: number }) =>
          e.duration != null ? `${e.name} (${e.duration} min)` : e.name
        )
        .join(', ')}`
    );
  }
  if (entry.medications?.length) {
    lines.push(
      `Medications: ${entry.medications.map((m: { name: string }) => m.name).join(', ')}`
    );
  }
  if (entry.notes) lines.push(`Notes: ${entry.notes}`);
  return lines.join('\n');
}

export function parseMedicationNamesCsv(value: string): Array<{ name: string; times: []; taken: boolean }> {
  return parseCsv(value).map((name) => ({ name, times: [] as [], taken: true }));
}

function parseCsv(value: string): string[] {
  return value
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 20);
}
