import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSeamlessLoop } from '../../../scripts/dev/visual-polish-queue.mjs';

test('cyclic translateX wave passes seamless loop', () => {
  const css = `@keyframes glucoseWaveShift {
  from { transform: translateX(0); }
  to { transform: translateX(-24px); }
}`;
  assert.equal(analyzeSeamlessLoop(css, { kind: 'animation' }).length, 0);
});

test('closed 0%/100% opacity pulse passes', () => {
  const css = `@keyframes fabPulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.08); }
}`;
  assert.equal(analyzeSeamlessLoop(css, { kind: 'animation' }).length, 0);
});

test('from→to opacity snap is flagged by analyzeSeamlessLoop (QA soft-fails seam)', () => {
  const css = `@keyframes badFade {
  from { opacity: 1; }
  to { opacity: 0; }
}`;
  const r = analyzeSeamlessLoop(css, { kind: 'animation' });
  assert.ok(r.some((x) => /seam jump|restart/i.test(x)));
});

test('screenshot-qa soft-skips textual seam jumps in heuristicBroken', async () => {
  const fs = await import('fs');
  const src = fs.readFileSync('scripts/dev/visual-polish-screenshot-qa.mjs', 'utf8');
  assert.match(src, /loop seam jump/);
  assert.match(src, /soft — do not fail closed/);
  assert.match(src, /INCONCLUSIVE/);
  assert.match(src, /no failIds — sheet flagged/);
});

test('polish validatePolish soft-warns seam (does not hard-fail)', async () => {
  const fs = await import('fs');
  const src = fs.readFileSync('scripts/dev/visual-polish-queue.mjs', 'utf8');
  assert.match(src, /seam warning/);
  assert.match(src, /Phase 5: textual seam is a warning/);
  assert.doesNotMatch(src, /return \{ ok: false, reason: `non-seamless loop/);
});
