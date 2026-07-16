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
    'oasisVeinDrift',
    'oasisVeinPulse',
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

test('styles.css motion tokens include dur-slower and legacy transition aliases', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /--dur-slower:\s*700ms/);
  assert.match(css, /--transition-fast:\s*var\(--dur-fast\)/);
});

test('styles.css body.reduce-motion disables webgl and hero stagger', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /body\.reduce-motion[\s\S]*\.rianell-webgl-canvas/);
  assert.match(css, /body\.reduce-motion[\s\S]*\.home-hero-stagger/);
});

test('app.js wires lazyLoadWebGL and syncReduceMotionBodyClass', () => {
  const js = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(js, /async function lazyLoadWebGL/);
  assert.match(js, /function syncReduceMotionBodyClass/);
  assert.match(js, /initWebGLSurfacesForTab/);
});

test('sw.js push icon uses beta contract path', () => {
  const sw = readFileSync('apps/pwa-webapp/sw.js', 'utf8');
  assert.match(sw, /Icons\/beta\/Icon-192\.png/);
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

test('oasis.css neural trace uses slow pulsing vein animations', () => {
  const css = readFileSync('apps/pwa-webapp/css/oasis.css', 'utf8');
  assert.match(css, /--oasis-neural-dur:\s*9s/);
  assert.match(css, /\.oasis-neural-vein--main[\s\S]*oasisVeinDrift/);
  assert.match(css, /\.oasis-neural-vein[\s\S]*oasisVeinPulse/);
  assert.doesNotMatch(css, /stroke-dashoffset:\s*-800/);
});

test('index.html nav symbols are polished multi-path icons', () => {
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  assert.match(html, /id="rianell-nav-home"[\s\S]*nav-icon-home-roof/);
  assert.match(html, /id="rianell-nav-logs"[\s\S]*nav-icon-logs-board/);
  assert.match(html, /id="rianell-nav-charts"[\s\S]*nav-icon-charts-bar--1/);
  assert.match(html, /id="rianell-nav-mood"[\s\S]*nav-icon-mood-eye--L/);
  assert.match(html, /id="rianell-nav-ai"[\s\S]*nav-icon-ai-head/);
  assert.match(html, /nav-icon-ai-scope-diaphragm/);
  assert.match(html, /id="rianell-nav-ai"[\s\S]*width="13\.8"/);
});

test('AI Analysis and Overview icons are sized for visibility', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /main-nav-tab\[data-tab="ai"\] \.tab-icon-svg[\s\S]*1\.22/);
  assert.match(css, /\.ai-chapter--overview \.ai-chapter-header \.ai-inline-icon[\s\S]*2\.05rem/);
  assert.match(css, /\.ai-chapter-header \.ai-inline-icon[\s\S]*1\.9rem/);
});

test('index.html AI chapter sprites include overview monitor and trends vitals', () => {
  const html = readFileSync('apps/pwa-webapp/index.html', 'utf8');
  const appJs = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(html, /id="icon-overview-monitor"/);
  assert.match(html, /overview-monitor-bezel/);
  assert.doesNotMatch(html, /overview-monitor-page|overviewMonitorScreenClip/);
  assert.match(html, /id="icon-trends-vitals"/);
  assert.match(html, /trends-vitals-heart-pulse/);
  assert.match(appJs, /wrapAIChapter\('overview', 'ai\.chapter\.overview', 'overview-monitor'/);
  assert.match(appJs, /wrapAIChapter\('trends', 'ai\.chapter\.trends', 'trends-vitals'/);
});
