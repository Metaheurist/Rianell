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

test('from→to opacity snap fails seamless loop', () => {
  const css = `@keyframes badFade {
  from { opacity: 1; }
  to { opacity: 0; }
}`;
  const r = analyzeSeamlessLoop(css, { kind: 'animation' });
  assert.ok(r.some((x) => /seam jump|restart/i.test(x)));
});
