import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PROFILE_AVATAR_IDS,
  USER_VIBE_IDS,
  buildGeneratedProfileAvatarId,
  generateAvatarNameFromSeed,
  isGeneratedProfileAvatar,
  normalizeProfileAvatar,
  normalizeUserVibe,
} from '@rianell/shared';

test('PROFILE_AVATAR_IDS has twenty inclusive abstract entities', () => {
  assert.equal(PROFILE_AVATAR_IDS.length, 20);
  assert.ok(PROFILE_AVATAR_IDS.includes('voidorb'));
  assert.ok(PROFILE_AVATAR_IDS.includes('leafcircuit'));
  assert.equal(new Set(PROFILE_AVATAR_IDS).size, 20);
});

test('normalizeProfileAvatar maps legacy icons and defaults unknown', () => {
  assert.equal(normalizeProfileAvatar('leaf'), 'leafcircuit');
  assert.equal(normalizeProfileAvatar('star'), 'starlace');
  assert.equal(normalizeProfileAvatar('tidewarden'), 'tidewarden');
  assert.equal(normalizeProfileAvatar(''), 'voidorb');
  assert.equal(normalizeProfileAvatar('not-an-avatar'), 'voidorb');
});

test('normalizeProfileAvatar preserves generated companion ids', () => {
  const id = buildGeneratedProfileAvatarId('abc123');
  assert.ok(isGeneratedProfileAvatar(id));
  assert.equal(normalizeProfileAvatar(id), id);
  assert.match(generateAvatarNameFromSeed('abc123'), /\S+\s+\S+/);
});

test('normalizeUserVibe accepts five vibes and defaults calm', () => {
  assert.deepEqual(USER_VIBE_IDS, ['calm', 'energy', 'nature', 'clinical', 'dark']);
  assert.equal(normalizeUserVibe('energy'), 'energy');
  assert.equal(normalizeUserVibe('clinical'), 'clinical');
  assert.equal(normalizeUserVibe(''), 'calm');
  assert.equal(normalizeUserVibe('neon'), 'calm');
});
