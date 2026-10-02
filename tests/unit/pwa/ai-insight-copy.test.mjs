import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadEngine() {
  const src = fs.readFileSync(new URL('../../../apps/pwa-webapp/AIEngine.js', import.meta.url), 'utf8');
  const ctx = { window: {}, console, Math, Date, JSON, setTimeout, clearTimeout };
  ctx.self = ctx.window;
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return ctx.window.AIEngine || ctx.AIEngine;
}

const engine = loadEngine();
const poorSleepDay = { sleep: '1', mood: '6', fatigue: '3', backPain: '2', mobility: '7', flare: 'No' };

test('anomaly counts use the singular for a one-day range', () => {
  const analysis = { anomalies: [] };
  engine.detectAnomalies([poorSleepDay], analysis);
  assert.deepEqual(analysis.anomalies, ['Poor sleep quality: 1 out of 1 day']);

  const week = { anomalies: [] };
  engine.detectAnomalies([poorSleepDay, poorSleepDay, { ...poorSleepDay, sleep: '8' }], week);
  assert.ok(week.anomalies.includes('Poor sleep quality: 2 out of 3 days'));
});

test('a one-day note opens with "Today" and every sentence is punctuated', () => {
  const note = engine.generateAnalysisNote(
    { wellbeingScore: 52, trends: {}, prioritisedInsights: ['Poor sleep quality: 1 out of 1 day'] },
    { dayCount: 1, logs: [] },
  );
  assert.equal(
    note,
    'Today, your overall wellbeing score is 52 (mixed). Poor sleep quality: 1 out of 1 day. '
      + 'Keep logging daily so patterns stay clear over the next week.',
  );
  assert.doesNotMatch(note, /Over today/);
});

test('multi-day notes keep the "Over the last N days" lead and existing punctuation', () => {
  const note = engine.generateAnalysisNote(
    { wellbeingScore: 80, trends: {}, advice: ['Try a short walk after lunch!'] },
    { dayCount: 14, logs: [] },
  );
  assert.equal(note, 'Over the last 14 days, your overall wellbeing score is 80 (strong). Try a short walk after lunch!');
});
