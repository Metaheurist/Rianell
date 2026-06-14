/**
 * Deterministic synthetic health logs for AI engine benchmarks (no PII).
 */

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * @param {number} count
 * @param {object} [opts]
 * @param {number} [opts.seed]
 * @param {boolean} [opts.sparse]
 * @param {boolean} [opts.denseSymptoms]
 */
export function generateLogs(count, opts = {}) {
  const seed = opts.seed ?? 42;
  const rand = mulberry32(seed);
  const sparse = !!opts.sparse;
  const denseSymptoms = !!opts.denseSymptoms;
  const logs = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const symptomsPool = ['Headache', 'Fatigue', 'Joint pain', 'Brain fog', 'Nausea', 'Stiffness'];
  const stressorsPool = ['Work', 'Weather', 'Poor sleep', 'Travel', 'Stress'];

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (count - 1 - i));
    const mood = Math.max(1, Math.min(10, Math.round(5 + (rand() - 0.5) * 4)));
    const sleep = Math.max(1, Math.min(10, Math.round(6 + (rand() - 0.5) * 3)));
    const fatigue = Math.max(1, Math.min(10, Math.round(5 + (rand() - 0.5) * 4)));
    const entry = {
      date: formatDate(d),
      mood,
      sleep,
      fatigue,
      stiffness: Math.round(rand() * 10),
      backPain: Math.round(rand() * 8),
      jointPain: Math.round(rand() * 8),
      mobility: Math.round(4 + rand() * 6),
      dailyFunction: Math.round(4 + rand() * 6),
      swelling: Math.round(rand() * 5),
      irritability: Math.round(rand() * 6),
      bpm: Math.round(60 + rand() * 40),
      weight: Math.round((70 + rand() * 5) * 10) / 10,
      steps: Math.round(2000 + rand() * 8000),
      hydration: Math.round(4 + rand() * 6),
      flare: rand() > 0.88 ? 'Yes' : 'No',
      symptoms: denseSymptoms
        ? symptomsPool.slice(0, 2 + Math.floor(rand() * 3))
        : [symptomsPool[Math.floor(rand() * symptomsPool.length)]],
      stressors: [stressorsPool[Math.floor(rand() * stressorsPool.length)]],
    };
    if (!sparse) {
      entry.food = [{ name: 'Oats', calories: 300 }];
      entry.exercise = [{ type: 'Walk', duration: 30 }];
    }
    logs.push(entry);
  }
  return logs;
}

/** @type {Record<string, object[]>} */
export const FIXTURES = {
  logs_30: generateLogs(30, { seed: 42 }),
  logs_365: generateLogs(365, { seed: 365 }),
  logs_1200: generateLogs(1200, { seed: 1200 }),
  sparse_no_food: generateLogs(30, { seed: 99, sparse: true }),
  dense_symptoms: generateLogs(90, { seed: 90, denseSymptoms: true }),
};

export const FIXTURE_IDS = Object.keys(FIXTURES);

export function getFixture(id) {
  return FIXTURES[id] ? JSON.parse(JSON.stringify(FIXTURES[id])) : null;
}

export function moodSeries(logs) {
  return logs.map((l, i) => ({ x: i + 1, y: Number(l.mood) || 0 }));
}

export function metricValues(logs, key) {
  return logs.map((l) => Number(l[key])).filter((v) => !Number.isNaN(v));
}
