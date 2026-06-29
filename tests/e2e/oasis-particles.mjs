/**
 * Oasis particle animation ceiling — validates CSS + JS constants (≤ 1500ms gate).
 * Run: node tests/e2e/oasis-particles.mjs
 */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const css = readFileSync('apps/pwa-webapp/css/oasis.css', 'utf8');
const js = readFileSync('apps/pwa-webapp/modules/oasis-canvas.js', 'utf8');

const durMatch = css.match(/--oasis-particle-dur:\s*(\d+)ms/);
assert.ok(durMatch, '--oasis-particle-dur missing');
const particleDur = parseInt(durMatch[1], 10);
assert.ok(particleDur <= 1500, `CSS particle duration ${particleDur}ms > 1500ms`);

const countMatch = js.match(/CONFETTI_COUNT\s*=\s*(\d+)/);
assert.ok(countMatch, 'CONFETTI_COUNT missing');
const count = parseInt(countMatch[1], 10);
const delayMatch = js.match(/p\.style\.animationDelay = \(i \* (\d+)\)/);
assert.ok(delayMatch, 'per-particle stagger missing');
const stagger = parseInt(delayMatch[1], 10);
const maxEnd = (count - 1) * stagger + particleDur;
assert.ok(maxEnd <= 1500, `Worst-case particle end ${maxEnd}ms > 1500ms`);

console.log(`oasis-particles: PASS (dur=${particleDur}ms, count=${count}, maxEnd=${maxEnd}ms)`);
