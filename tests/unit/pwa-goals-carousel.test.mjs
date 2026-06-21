import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const carouselPath = path.join(root, 'apps/pwa-webapp/modules/goals-carousel.js');
const htmlPath = path.join(root, 'apps/pwa-webapp/index.html');

test('goals-carousel.js is plain-script IIFE (not ES module export)', () => {
  const src = fs.readFileSync(carouselPath, 'utf8');
  assert.match(src, /\(function \(global\)/);
  assert.doesNotMatch(src, /^\s*export\s/m);
  assert.match(src, /global\.goalsCarouselGo/);
});

test('index.html loads goals-carousel without type=module', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.match(html, /modules\/goals-carousel\.js\?v=/);
  assert.doesNotMatch(html, /goals-carousel\.js[^"']*" type="module"/);
});

test('index.html defines goals modal carousel panes', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.match(html, /id="goalsModalOverlay"/);
  assert.match(html, /goals-carousel-pane--targets/);
  assert.match(html, /id="goalsCarouselDots"/);
});
