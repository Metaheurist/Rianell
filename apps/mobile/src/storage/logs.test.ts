import { addLogEntry } from './logs';

test('addLogEntry prevents duplicate dates', () => {
  const a = { date: '2026-01-01', flare: 'No' as const };
  const b = { date: '2026-01-01', flare: 'Yes' as const };
  expect(() => addLogEntry([a as any], b as any)).toThrow(/Duplicate entry/);
});

