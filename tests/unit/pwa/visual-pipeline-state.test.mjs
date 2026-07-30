import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeRuntimeIds,
  classifyWorker,
} from '../../../scripts/dev/visual-pipeline-state.mjs';

test('computeRuntimeIds drops ids completed after broken snapshot', () => {
  const broken = {
    at: '2026-07-30T12:00:00.000Z',
    ids: ['a', 'b', 'c'],
  };
  const polishCp = {
    completed: {
      a: { at: '2026-07-30T13:00:00.000Z' },
      b: { at: '2026-07-30T11:00:00.000Z' },
      c: { at: '2026-07-30T13:30:00.000Z', qaPatched: true },
    },
  };
  const remaining = computeRuntimeIds(polishCp, broken);
  assert.deepEqual(remaining, ['b']);
});

test('computeRuntimeIds keeps unfinished broken ids', () => {
  const remaining = computeRuntimeIds({ completed: {} }, { ids: ['x', 'y'], at: '2026-07-30T12:00:00.000Z' });
  assert.deepEqual(remaining, ['x', 'y']);
});

test('classifyWorker detects qa-loop and repolish', () => {
  assert.equal(classifyWorker('node scripts/dev/visual-polish-qa-loop.mjs').kind, 'qa-loop');
  assert.equal(classifyWorker('node scripts/dev/visual-polish-queue.mjs --repolish-from-qa').kind, 'repolish');
  assert.equal(
    classifyWorker('node scripts/dev/visual-polish-queue.mjs --ids-file=artifacts/visual-gen/resume-ids.json').kind,
    'polish-queue',
  );
  assert.equal(classifyWorker('npm run visual:polish:live').kind, 'live-preview');
  assert.equal(classifyWorker('node scripts/dev/visual-polish-screenshot-qa.mjs --gemma-review').kind, 'screenshot-qa');
});

test('qa-loop supports --start-round', async () => {
  const fs = await import('fs');
  const src = fs.readFileSync('scripts/dev/visual-polish-qa-loop.mjs', 'utf8');
  assert.match(src, /--start-round=/);
  assert.match(src, /START_ROUND/);
  assert.match(src, /for \(let round = START_ROUND/);
});

test('repolish-from-qa preserves post-broken completions', async () => {
  const fs = await import('fs');
  const src = fs.readFileSync('scripts/dev/visual-polish-queue.mjs', 'utf8');
  assert.match(src, /qaPatched/);
  assert.match(src, /preserved/);
  assert.match(src, /already-fixed/);
});
