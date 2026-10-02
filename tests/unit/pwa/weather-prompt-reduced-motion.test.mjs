import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../../../apps/pwa-webapp/styles.css', import.meta.url), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '');

/** Innermost `selector { declarations }` blocks; good enough for flat rules inside @media. */
function rules(source) {
  const out = [];
  for (const m of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    out.push({
      selectors: m[1].split(',').map((s) => s.trim().replace(/\s+/g, ' ')).filter(Boolean),
      body: m[2],
    });
  }
  return out;
}

function reducedMotionMediaBlocks(source) {
  const blocks = [];
  const re = /@media \(prefers-reduced-motion: reduce\) \{/g;
  let m;
  while ((m = re.exec(source))) {
    let depth = 1;
    let i = re.lastIndex;
    while (depth && i < source.length) {
      if (source[i] === '{') depth++;
      else if (source[i] === '}') depth--;
      i++;
    }
    blocks.push(source.slice(re.lastIndex, i - 1));
  }
  return blocks;
}

const loopingSelectors = [...new Set(
  rules(css)
    .filter((r) => /animation:[^;]*\binfinite\b/.test(r.body))
    .flatMap((r) => r.selectors)
    .filter((s) => s.startsWith('.home-weather-enable-prompt') && !s.includes(':hover')),
)];

function stopsAnimation(ruleList, selector) {
  return ruleList.some((r) => r.selectors.includes(selector) && /animation:\s*none/.test(r.body));
}

test('the weather prompt still has its looping attention animations', () => {
  for (const sel of [
    '.home-weather-enable-prompt',
    '.home-weather-enable-prompt::before',
    '.home-weather-enable-prompt__halo',
    '.home-weather-enable-prompt__spark',
    '.home-weather-enable-prompt__icon .home-weather-icon',
  ]) {
    assert.ok(loopingSelectors.includes(sel), `expected looping animation on ${sel}`);
  }
});

test('every looping weather prompt animation stops under the in-app Reduce motion setting', () => {
  const all = rules(css);
  for (const sel of loopingSelectors) {
    assert.ok(stopsAnimation(all, `body.reduce-motion ${sel}`), `body.reduce-motion must stop ${sel}`);
  }
});

test('every looping weather prompt animation stops under prefers-reduced-motion', () => {
  const mediaRules = reducedMotionMediaBlocks(css).flatMap(rules);
  for (const sel of loopingSelectors) {
    assert.ok(stopsAnimation(mediaRules, sel), `prefers-reduced-motion must stop ${sel}`);
  }
});
