import { test, expect } from '@playwright/test';

const baseURL = process.env.PROBE_URL || 'http://127.0.0.1:9876/';
const PARTICLE_CEILING_MS = 1500;
const CONFETTI_COUNT = 14;

/** Plan inventory path — CI runs benchmarks/specs/oasis-particles.spec.ts (same assertions). */
test.describe('Oasis particle ceiling (e2e)', () => {
  test('triggerConfetti finishes within 1500ms', async ({ page }) => {
    await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.waitForFunction(() => document.body.classList.contains('loaded'), null, {
      timeout: 120_000,
    });

    const result = await page.evaluate(
      async ({ ceilingMs, count }) => {
        const w = window as typeof window & {
          OasisCanvas?: { triggerConfetti: (el: Element) => void };
        };
        if (!w.OasisCanvas?.triggerConfetti) {
          return { ok: false, reason: 'OasisCanvas.triggerConfetti missing' };
        }

        const start = performance.now();
        const ends: number[] = [];
        const onEnd = (e: AnimationEvent) => {
          const t = e.target as Element | null;
          if (t?.classList?.contains('oasis-particle')) ends.push(performance.now());
        };
        document.addEventListener('animationend', onEnd);
        w.OasisCanvas.triggerConfetti(document.body);

        await new Promise<void>((resolve) => {
          const deadline = start + ceilingMs + 600;
          const tick = () => {
            if (ends.length >= count || performance.now() > deadline) resolve();
            else requestAnimationFrame(tick);
          };
          tick();
        });

        document.removeEventListener('animationend', onEnd);
        const maxDelta = ends.length ? Math.max(...ends) - start : Infinity;
        return {
          ok: ends.length >= count - 1 && maxDelta <= ceilingMs,
          count: ends.length,
          maxDelta,
        };
      },
      { ceilingMs: PARTICLE_CEILING_MS, count: CONFETTI_COUNT },
    );

    expect(result.ok, JSON.stringify(result)).toBe(true);
  });
});
