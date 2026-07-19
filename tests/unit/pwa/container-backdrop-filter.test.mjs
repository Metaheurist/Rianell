import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');

/**
 * Extract the declaration block for the first rule whose selector list exactly
 * matches `selector` (at column 0). Returns the text between `{` and the
 * matching `}`.
 */
function ruleBlock(source, selector) {
  const needle = `\n${selector} {`;
  const start = source.indexOf(needle);
  assert.notEqual(start, -1, `expected to find rule "${selector} {" in styles.css`);
  const open = source.indexOf('{', start);
  const close = source.indexOf('}', open);
  assert.notEqual(close, -1, `unterminated rule block for "${selector}"`);
  return source.slice(open + 1, close);
}

test('base .container rule does not declare backdrop-filter (dark-theme white-square regression)', () => {
  const block = ruleBlock(css, '.container');
  assert.doesNotMatch(
    block,
    /backdrop-filter\s*:/i,
    'base .container must not set backdrop-filter — it repaints as an opaque light layer on some GPUs after a tab switch, showing a white square behind Home cards in dark themes',
  );
});

test('light mode keeps the container glass blur', () => {
  const block = ruleBlock(css, 'body.light-mode .container');
  assert.match(block, /backdrop-filter\s*:\s*blur/i, 'body.light-mode .container should keep backdrop-filter');
  assert.match(block, /-webkit-backdrop-filter\s*:\s*blur/i, 'body.light-mode .container should keep -webkit-backdrop-filter');
});
