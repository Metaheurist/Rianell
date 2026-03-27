import { AIEngine } from './engine';

test('predictFutureValues returns bounded forecast points', () => {
  const out = AIEngine.predictFutureValues([4, 5, 6, 5, 7], 5);
  expect(out).toHaveLength(5);
  expect(out[0].dayOffset).toBe(1);
  expect(out[4].dayOffset).toBe(5);
  out.forEach((p) => {
    expect(p.value).toBeGreaterThanOrEqual(0);
    expect(p.value).toBeLessThanOrEqual(10);
    expect(p.lower).toBeLessThanOrEqual(p.value);
    expect(p.upper).toBeGreaterThanOrEqual(p.value);
  });
});

test('suggestLogNote uses flare/sleep/fatigue hints', () => {
  const note = AIEngine.suggestLogNote({ flare: 'Yes', sleep: 3, fatigue: 8, mood: 3, steps: 1500 });
  expect(note.toLowerCase()).toContain('flare day');
});
