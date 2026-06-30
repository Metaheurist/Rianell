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

test('getTokens exposes spacing, surface, radius, and onAccent', () => {
  const tokens = getTokens({ team: 'mint', mode: 'dark' });
  assert.equal(tokens.spacing.base, 16);
  assert.equal(tokens.radius.lg, 16);
  assert.equal(tokens.color.onAccent, '#041008');
  assert.ok(tokens.surface.card.includes('rgba'));
});

test('resolveScreenBackground flattens light gradients', async () => {
  const { resolveScreenBackground, isLightGradientBackground } = await import('@rianell/tokens');
  const grad = 'linear-gradient(135deg, #a8e6cf 0%, #fff 100%)';
  assert.equal(isLightGradientBackground(grad), true);
  assert.equal(resolveScreenBackground({ background: grad }, 'light'), '#ffffff');
  assert.equal(resolveScreenBackground({ background: '#070807' }, 'dark'), '#070807');
});

test('VIBE_TOKENS defines five ambient personalities', async () => {
  const { VIBE_IDS, VIBE_TOKENS, getVibeIds, normalizeUserVibe, resolveAvatarThemeTokens } =
    await import('@rianell/tokens');
  assert.deepEqual(getVibeIds(), VIBE_IDS);
  assert.equal(VIBE_IDS.length, 5);
  for (const id of VIBE_IDS) {
    assert.ok(VIBE_TOKENS[id], `missing vibe token for ${id}`);
    assert.ok('motionMultiplier' in VIBE_TOKENS[id]);
  }
  assert.equal(normalizeUserVibe('dark'), 'dark');
  assert.equal(normalizeUserVibe('invalid'), 'calm');
  assert.ok(resolveAvatarThemeTokens('mint').primary);
  assert.ok(resolveAvatarThemeTokens('unknown-team').primary);
});

