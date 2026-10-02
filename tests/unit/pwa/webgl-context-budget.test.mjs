import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const MODULES = {
  'weather-orb-3d.js': 'RianellWeatherOrb3D',
  'goals-progress-3d.js': 'RianellGoalsProgress3D',
  'discovery-orb-3d.js': 'RianellDiscoveryOrb3D',
  'webgl-scene.js': 'RianellWebGL',
};

function fakeWindow() {
  const stats = { getContext: 0, loseContext: 0 };
  const document = {
    body: { classList: { contains: () => false } },
    createElement: () => ({
      getContext: () => {
        stats.getContext += 1;
        return { getExtension: (name) => (name === 'WEBGL_lose_context' ? { loseContext: () => { stats.loseContext += 1; } } : null) };
      },
    }),
  };
  const window = {
    document,
    matchMedia: () => ({ matches: false }),
    DeviceBenchmark: { getTier: () => 'high' },
  };
  return { window, document, stats };
}

for (const [file, ns] of Object.entries(MODULES)) {
  test(`${file} probes WebGL once and releases the probe context`, () => {
    const src = readFileSync(`apps/pwa-webapp/modules/${file}`, 'utf8');
    const { window, document, stats } = fakeWindow();
    vm.runInNewContext(src, { window, globalThis: window, document, URL, Map, Set });
    const api = window[ns];
    assert.ok(api, `${ns} exported`);
    const probe = api.canUse3D || api.canUseWebGL;
    assert.equal(typeof probe, 'function', `${ns} exposes a capability probe`);
    assert.equal(probe(), true);
    assert.equal(probe(), true);
    assert.equal(probe(), true);
    assert.equal(stats.getContext, 1, 'getContext called once across repeated probes');
    assert.equal(stats.loseContext, 1, 'probe context released');
  });
}

test('every WebGL scene tears itself down on webglcontextlost', () => {
  for (const file of Object.keys(MODULES)) {
    const src = readFileSync(`apps/pwa-webapp/modules/${file}`, 'utf8');
    assert.match(src, /addEventListener\('webglcontextlost'/, `${file} handles context loss`);
  }
});

test('webgl-scene ambient canvas is skipped on constrained devices', () => {
  const src = readFileSync('apps/pwa-webapp/modules/webgl-scene.js', 'utf8');
  const { window, document, stats } = fakeWindow();
  window.RianellBootGuard = { isConstrainedDevice: () => true };
  vm.runInNewContext(src, { window, globalThis: window, document, URL, Map, Set });
  assert.equal(window.RianellWebGL.canUseWebGL(), false);
  assert.equal(stats.getContext, 0, 'no GL context created when constrained');
});

test('three.js scenes force context loss on dispose', () => {
  for (const file of ['weather-orb-3d.js', 'goals-progress-3d.js', 'discovery-orb-3d.js']) {
    const src = readFileSync(`apps/pwa-webapp/modules/${file}`, 'utf8');
    assert.match(src, /renderer\.forceContextLoss\(\)/, `${file} releases its GL context`);
  }
});
