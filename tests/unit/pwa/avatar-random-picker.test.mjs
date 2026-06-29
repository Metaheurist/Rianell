import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGeneratedProfileAvatarId,
  generateAvatarNameFromSeed,
  isGeneratedProfileAvatar,
  normalizeProfileAvatar,
} from '@rianell/shared';

test('graphics-portfolio exposes random avatar picker helpers', () => {
  const js = readFileSync('apps/pwa-webapp/modules/graphics-portfolio.js', 'utf8');
  assert.match(js, /renderRandomAvatarPickerHTML/);
  assert.match(js, /bindRandomAvatarPicker/);
  assert.match(js, /avatarSymbolPathsFromSeed/);
  assert.match(js, /avatar-random-shuffle/);
  assert.match(js, /avatar-random-face-ring/);
});

test('graphics-portfolio.css styles random avatar picker', () => {
  const css = readFileSync('apps/pwa-webapp/css/graphics-portfolio.css', 'utf8');
  assert.match(css, /\.avatar-random-shell/);
  assert.match(css, /\.avatar-random-shuffle/);
  assert.match(css, /\.avatar-random-face-ring/);
});

test('guided onboarding uses intro random picker variant', () => {
  const js = readFileSync('apps/pwa-webapp/guided-onboarding.js', 'utf8');
  assert.match(js, /renderRandomAvatarPickerHTML\(bootAvatar, \{ variant: 'intro'/);
  assert.match(js, /bindRandomAvatarPicker/);
  assert.match(js, /profileAvatarName/);
});

test('generated avatar ids normalize and produce stable names', () => {
  const id = buildGeneratedProfileAvatarId('seed42');
  assert.ok(isGeneratedProfileAvatar(id));
  assert.equal(normalizeProfileAvatar(id), id);
  assert.equal(generateAvatarNameFromSeed('seed42'), generateAvatarNameFromSeed('seed42'));
  assert.notEqual(generateAvatarNameFromSeed('seed42'), generateAvatarNameFromSeed('seed99'));
});
