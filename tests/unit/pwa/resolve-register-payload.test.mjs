import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRegisterPayload } from '../../../scripts/dev/visual-polish-queue.mjs';

test('resolveRegisterPayload expands achievementIconSvgMarkup stubs', () => {
  const r = resolveRegisterPayload({
    id: 'achievement:exercise_logging',
    currentPayload: "achievementIconSvgMarkup('exercise_logging')",
  });
  assert.equal(r.kind, 'svg-resolved');
  assert.match(r.text, /ach-icon--exercise_logging|ach-pool|ach-swimmer/);
});
