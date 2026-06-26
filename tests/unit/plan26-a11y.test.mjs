import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  contrastRatioPasses,
  getBrainFogFontScale,
  MIN_TOUCH_TARGET_PX,
  WCAG_BODY_TEXT_MIN_CONTRAST,
} from '@rianell/shared';

const root = join(import.meta.dirname, '..', '..');

test('contrastRatioPasses enforces WCAG 4.5:1 body text', () => {
  assert.equal(contrastRatioPasses(4.5), true);
  assert.equal(contrastRatioPasses(4.4), false);
  assert.equal(contrastRatioPasses(3, true), true);
});

test('brain fog mode increases font scale', () => {
  assert.equal(getBrainFogFontScale(true), 1.2);
  assert.equal(getBrainFogFontScale(false), 1);
});

test('a11y token verify script exists', () => {
  const src = readFileSync(join(root, 'scripts/verify/verify-a11y-tokens.mjs'), 'utf8');
  assert.match(src, /MIN_TOUCH|touch|a11y/i);
});

test('axe CI contract script exists', () => {
  const src = readFileSync(join(root, 'scripts/verify/verify-axe-ci.mjs'), 'utf8');
  assert.match(src, /axe|A11Y/i);
});

test('WCAG body contrast constant is 4.5', () => {
  assert.equal(WCAG_BODY_TEXT_MIN_CONTRAST, 4.5);
  assert.ok(MIN_TOUCH_TARGET_PX >= 44);
});
