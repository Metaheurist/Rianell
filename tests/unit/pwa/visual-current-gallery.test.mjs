import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCurrentGallery,
  loadVisualOverridesMap,
} from '../../../scripts/dev/visual-current-gallery.mjs';
import {
  stemFromId,
  teamRank,
  wrapSvg,
  uniqueIds,
  buildAnimStageHtml,
  keyframesFromSources,
  designatedAnimIcon,
} from '../../../scripts/dev/visual-gallery-shared.mjs';

test('visual-gallery-shared exports are importable (live-preview smoke)', () => {
  assert.equal(typeof stemFromId, 'function');
  assert.equal(typeof teamRank, 'function');
  assert.equal(typeof wrapSvg, 'function');
  assert.equal(typeof uniqueIds, 'function');
  assert.equal(typeof buildAnimStageHtml, 'function');
  assert.equal(typeof keyframesFromSources, 'function');
  assert.equal(stemFromId('fancy:icon-user:mint'), 'icon-user');
  assert.ok(teamRank('mint') < teamRank('rainbow'));
});

test('loadVisualOverridesMap parses OVERRIDES from generated file', () => {
  const map = loadVisualOverridesMap();
  assert.equal(typeof map, 'object');
  // Repo typically has applied overrides; if empty, still a valid map.
  if (Object.keys(map).length) {
    const first = Object.values(map)[0];
    assert.ok(first && typeof first.markup === 'string');
  }
});

test('buildCurrentGallery: override wins over register payload', () => {
  const register = {
    entries: [
      {
        id: 'sprite:icon-test-override',
        kind: 'sprite',
        genStatus: 'done',
        team: null,
        viewBox: '0 0 24 24',
        currentPayload: '<circle cx="12" cy="12" r="2"/>',
      },
    ],
  };
  const overridesMap = {
    'sprite:icon-test-override': {
      kind: 'sprite',
      viewBox: '0 0 24 24',
      markup: '<circle cx="12" cy="12" r="8" data-override="1"/>',
    },
  };
  const data = buildCurrentGallery({
    register,
    overridesMap,
    limit: 10,
    offset: 0,
  });
  assert.equal(data.counts.totalMatching, 1);
  assert.equal(data.items.length, 1);
  assert.equal(data.items[0].source, 'override');
  assert.match(data.items[0].current, /data-override="1"/);
  assert.doesNotMatch(data.items[0].current, /r="2"/);
});

test('buildCurrentGallery: genStatus skip is excluded', () => {
  const register = {
    entries: [
      {
        id: 'raster:app.png',
        kind: 'raster-catalog',
        genStatus: 'skip',
        team: null,
        currentPayload: '',
      },
      {
        id: 'sprite:icon-keep',
        kind: 'sprite',
        genStatus: 'done',
        team: null,
        viewBox: '0 0 24 24',
        currentPayload: '<circle cx="12" cy="12" r="4"/>',
      },
    ],
  };
  const data = buildCurrentGallery({
    register,
    overridesMap: {},
    limit: 0,
    offset: 0,
  });
  assert.equal(data.counts.totalMatching, 1);
  assert.equal(data.counts.skipped, 1);
  assert.equal(data.items[0].id, 'sprite:icon-keep');
  assert.equal(data.items[0].source, 'register');
});

test('buildCurrentGallery: animation items include static demo thumb + live stage', () => {
  const register = {
    entries: [
      {
        id: 'animation:pillSpin',
        kind: 'animation',
        genStatus: 'done',
        team: null,
        currentPayload: '@keyframes pillSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }',
      },
    ],
  };
  const data = buildCurrentGallery({
    register,
    overridesMap: {},
    limit: 1,
    offset: 0,
  });
  assert.equal(data.items.length, 1);
  const item = data.items[0];
  assert.equal(item.isAnimPreview, true);
  assert.ok(item.currentAnim, 'live CSS stage for Browser');
  assert.match(item.currentAnim, /@keyframes/);
  assert.ok(item.current, 'static demo SVG for Tk thumbs');
  assert.match(item.current, /<svg\b/i);
  assert.equal(item.missing, false);
});

test('buildCurrentGallery: achievement stub resolves when no override', () => {
  const register = {
    entries: [
      {
        id: 'achievement:exercise_logging',
        kind: 'achievement',
        genStatus: 'done',
        team: null,
        viewBox: '0 0 64 64',
        currentPayload: "achievementIconSvgMarkup('exercise_logging')",
      },
    ],
  };
  const data = buildCurrentGallery({
    register,
    overridesMap: {},
    limit: 1,
    offset: 0,
  });
  assert.equal(data.items.length, 1);
  assert.equal(data.items[0].source, 'register');
  assert.ok(
    data.items[0].current || data.items[0].currentAnim,
    'expected resolved SVG or anim preview',
  );
  if (data.items[0].current) {
    assert.match(data.items[0].current, /ach-icon--exercise_logging|ach-pool|ach-swimmer|path|circle/i);
  }
});

test('anim demos: pill spins in-place; pool wave is seamless period tile', () => {
  const pill = designatedAnimIcon('animation:achPillSpin');
  assert.equal(pill.kind, 'pill');
  assert.match(pill.label, /in-place/i);
  assert.match(pill.svg, /viewBox="0 0 64 64"/);

  const wave = designatedAnimIcon('animation:achPoolWave');
  assert.equal(wave.kind, 'wave');
  assert.match(wave.label, /seamless/i);
  assert.doesNotMatch(wave.label, /not fluid/i);

  const stage = buildAnimStageHtml(
    {
      name: 'achPoolWave',
      css: '@keyframes achPoolWave { 0% { transform: translateX(0); } 100% { transform: translateX(-8px); } }',
    },
    't1',
    'animation:achPoolWave',
  );
  assert.match(stage, /translateX\(-12px\)/);
  assert.doesNotMatch(stage, /transform-origin:\s*32px/);
  assert.match(stage, /seamless looping wave/i);

  const pillStage = buildAnimStageHtml(
    {
      name: 'achPillSpin',
      css: '@keyframes achPillSpin { 0% { transform: rotate(0deg); transform-origin: 32px 32px; } 100% { transform: rotate(360deg); transform-origin: 32px 32px; } }',
    },
    't2',
    'animation:achPillSpin',
  );
  // Keyframe origins stripped; host uses 32px 32px on 64 viewBox pill (in-place, not orbit).
  assert.match(pillStage, /@keyframes prev_t2_achPillSpin \{ 0% \{ transform: rotate\(0deg\);  \} 100% \{ transform: rotate\(360deg\);  \} \}/);
  assert.match(pillStage, /\.anim-target\{[^}]*transform-origin:32px 32px/);
});
