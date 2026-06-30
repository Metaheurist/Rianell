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
  assert.match(css, /@keyframes navIconHome/);
  assert.match(css, /@keyframes navIconAi/);
  assert.match(css, /\.boot-skeleton__bar--short[\s\S]*animation-delay: 0\.2s/);
});

test('styles.css aiSlideInFade uses refined vertical travel', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /@keyframes aiSlideInFade[\s\S]*translateY\(18px\)/);
});

test('oasis.css: oasisBreath1 keyframe exists', () => {
  const css = readFileSync('apps/pwa-webapp/css/oasis.css', 'utf8');
  assert.ok(css.includes('@keyframes oasisBreath1'), 'oasisBreath1 keyframe missing');
});

test('oasis.css: oasisParticleFly keyframe exists', () => {
  const css = readFileSync('apps/pwa-webapp/css/oasis.css', 'utf8');
  assert.ok(css.includes('@keyframes oasisParticleFly'), 'oasisParticleFly keyframe missing');
});

test('oasis.css: calmGlow keyframe exists', () => {
  const css = readFileSync('apps/pwa-webapp/css/oasis.css', 'utf8');
  assert.ok(css.includes('@keyframes calmGlow'), 'calmGlow keyframe missing');
});

test('oasis.css: particle duration <= 1500ms', () => {
  const css = readFileSync('apps/pwa-webapp/css/oasis.css', 'utf8');
  const match = css.match(/--oasis-particle-dur:\s*(\d+)ms/);
  assert.ok(match, '--oasis-particle-dur variable missing');
  const ms = parseInt(match[1], 10);
  assert.ok(ms <= 1500, `Particle duration ${ms}ms exceeds 1500ms ceiling`);
});

test('oasis.css: keyframes guarded by prefers-reduced-motion', () => {
  const css = readFileSync('apps/pwa-webapp/css/oasis.css', 'utf8');
  const keyframes = [
    'oasisBreath1',
    'oasisBreath2',
    'oasisBreath3',
    'calmGlow',
    'oasisCountFlip',
    'oasisNeuralDraw',
    'oasisCharReveal',
    'oasisStreamFly',
    'oasisHoloSweep',
    'oasisParticleFly',
  ];
  keyframes.forEach((name) => {
    const kfIdx = css.indexOf('@keyframes ' + name);
    assert.ok(kfIdx >= 0, `${name} missing`);
    const mediaBefore = css.lastIndexOf('@media (not (prefers-reduced-motion: reduce))', kfIdx);
    assert.ok(mediaBefore >= 0 && mediaBefore < kfIdx, `${name} not inside reduced-motion guard`);
  });
});

test('OASIS_TOKENS exported from packages/tokens/src/index.mjs', () => {
  const src = readFileSync('packages/tokens/src/index.mjs', 'utf8');
  assert.ok(src.includes('export const OASIS_TOKENS'), 'OASIS_TOKENS not exported');
});

test('OASIS_TOKENS: all 4 team themes have ambient colours', async () => {
  const { OASIS_TOKENS } = await import('../../../packages/tokens/src/index.mjs');
  ['mint', 'red-black', 'mono', 'rainbow'].forEach((team) => {
    assert.ok(OASIS_TOKENS.ambient[team]?.blob1, `ambient.${team}.blob1 missing`);
    assert.ok(OASIS_TOKENS.ambient[team]?.glow, `ambient.${team}.glow missing`);
  });
});

test('oasis-canvas.js exports OasisCanvas API', () => {
  const src = readFileSync('apps/pwa-webapp/modules/oasis-canvas.js', 'utf8');
  const css = readFileSync('apps/pwa-webapp/css/oasis.css', 'utf8');
  assert.ok(src.includes('global.OasisCanvas'), 'OasisCanvas not exported to global');
  assert.ok(src.includes('triggerConfetti'), 'triggerConfetti missing');
  assert.ok(src.includes('morphThinkingText'), 'morphThinkingText missing');
  assert.match(src, /buildNeuralTraceSvg/);
  assert.match(src, /data-oasis-neural-v/);
  assert.match(css, /\.oasis-neural-trace[\s\S]*inset: 0/);
  assert.match(css, /#aiTab[\s\S]*position: relative/);
});

test('oasis.css neural trace uses slower reversed dash animation', () => {
  const css = readFileSync('apps/pwa-webapp/css/oasis.css', 'utf8');
  assert.match(css, /--oasis-neural-dur:\s*9s/);
  assert.match(css, /stroke-dashoffset:\s*-800[\s\S]*stroke-dashoffset:\s*800/);
});

test('index.html nav symbols are polished multi-path icons', () => {
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  assert.match(html, /id="rianell-nav-home"[\s\S]*nav-icon-home-roof/);
  assert.match(html, /id="rianell-nav-logs"[\s\S]*nav-icon-logs-board/);
  assert.match(html, /id="rianell-nav-charts"[\s\S]*nav-icon-charts-bar--1/);
  assert.match(html, /id="rianell-nav-mood"[\s\S]*nav-icon-mood-eye--L/);
  assert.match(html, /id="rianell-nav-ai"[\s\S]*nav-icon-ai-star/);
});
