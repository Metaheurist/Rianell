import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('graphics-portfolio renders scrollable companion carousel shell', () => {
  const js = readFileSync('apps/pwa-webapp/modules/graphics-portfolio.js', 'utf8');
  assert.match(js, /avatar-carousel-shell/);
  assert.match(js, /avatar-carousel-nav--prev/);
  assert.match(js, /avatar-carousel-nav--next/);
  assert.match(js, /avatarSymbolPathsForId/);
  assert.match(js, /avatar-carousel-shell--/);
});

test('graphics-portfolio.css styles companion carousel navigation', () => {
  const css = readFileSync('apps/pwa-webapp/css/graphics-portfolio.css', 'utf8');
  assert.match(css, /\.avatar-carousel-shell/);
  assert.match(css, /\.avatar-carousel-nav/);
  assert.match(css, /\.avatar-carousel__glyph-wrap/);
});

test('guided onboarding uses intro random picker variant', () => {
  const js = readFileSync('apps/pwa-webapp/guided-onboarding.js', 'utf8');
  assert.match(js, /renderRandomAvatarPickerHTML\(bootAvatar, \{ variant: 'intro'/);
});
