import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

test('home 3D modules lazy-load three.js from vendor', () => {
  for (const mod of ['goals-progress-3d.js', 'discovery-orb-3d.js', 'weather-orb-3d.js']) {
    const src = readFileSync(`apps/pwa-webapp/modules/${mod}`, 'utf8');
    assert.match(src, /vendor\/three\/three\.module\.min\.js/);
    assert.match(src, /prefers-reduced-motion|reduceMotion|reduce-motion/i);
  }
  assert.ok(existsSync('apps/pwa-webapp/vendor/three/three.module.min.js'));
  assert.ok(existsSync('apps/pwa-webapp/vendor/three/LICENSE'));
});

test('app.js wires goals and discovery 3D enhancement hooks', () => {
  const js = readFileSync('apps/pwa-webapp/app.js', 'utf8');
  assert.match(js, /lazyLoadGoalsProgress3D/);
  assert.match(js, /lazyLoadDiscoveryOrb3D/);
  assert.match(js, /scheduleHome3DEnhancement/);
  assert.match(js, /buildGoalsDailyPcts/);
  assert.match(js, /goals-3d-slot/);
  assert.match(js, /data-daily-pcts/);
});

test('goals progress styles include 3D slot depth', () => {
  const css = readFileSync('apps/pwa-webapp/styles.css', 'utf8');
  assert.match(css, /\.goals-3d-slot/);
  assert.match(css, /\.goals-metric-visual/);
  assert.match(css, /\.home-weather-enable-prompt/);
  assert.match(css, /prefers-reduced-motion/);
});
