import test from 'node:test';
import assert from 'node:assert/strict';

import { getTeamIds, getTokens } from '@rianell/tokens';

test('tokens exist for every team in light/dark', () => {
  for (const team of getTeamIds()) {
    const dark = getTokens({ team, mode: 'dark' });
    const light = getTokens({ team, mode: 'light' });
    assert.ok(dark && dark.color && dark.color.accent, `${team} dark tokens missing`);
    assert.ok(light && light.color && light.color.accent, `${team} light tokens missing`);
  }
});

test('colorblind overrides change accent token', () => {
  const base = getTokens({ team: 'mint', mode: 'dark', colorblindMode: 'none' });
  const deut = getTokens({ team: 'mint', mode: 'dark', colorblindMode: 'deuteranopia' });
  const prot = getTokens({ team: 'mint', mode: 'dark', colorblindMode: 'protanopia' });
  const trit = getTokens({ team: 'mint', mode: 'dark', colorblindMode: 'tritanopia' });
  assert.notEqual(deut.color.accent, base.color.accent);
  assert.notEqual(prot.color.accent, base.color.accent);
  assert.notEqual(trit.color.accent, base.color.accent);
});

