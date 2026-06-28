import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('styles.css tab transitions use wider travel and motion tokens', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /tabEnterLeft[\s\S]*translateX\(-38px\)/);
  assert.match(css, /tabEnterRight[\s\S]*translateX\(38px\)/);
  assert.match(css, /\.tab-content--enter-left[\s\S]*var\(--ease-out-expo\)/);
});

test('styles.css AI stagger uses ease-out-expo and nth-child delays', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /\.ai-animate-in[\s\S]*aiSlideInFade 0\.42s var\(--ease-out-expo\)/);
  assert.match(css, /\.ai-summary-section\.ai-animate-in:nth-child\(2\)[\s\S]*animation-delay: 55ms/);
  assert.match(css, /\.ai-advice-card\.ai-animate-in:nth-child\(1\)[\s\S]*animation-delay: 0ms/);
  assert.match(css, /\.ai-list li\.ai-animate-in:nth-child\(3\)[\s\S]*animation-delay: 110ms/);
});

test('styles.css shimmer and nav icon polish', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /shimmerSweep 1\.5s ease-in-out infinite/);
  assert.match(
    css,
    /\.app-bottom-nav-btn\.active \.app-bottom-nav-icon[\s\S]*translateY\(-1px\)/,
  );
  assert.match(css, /\.boot-skeleton__bar--short[\s\S]*animation-delay: 0\.2s/);
});

test('styles.css aiSlideInFade uses refined vertical travel', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /@keyframes aiSlideInFade[\s\S]*translateY\(18px\)/);
});
