import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeBrokenGraphics,
  analyzeOffsetShift,
  analyzeDescriptionFit,
  analyzeLocationFit,
  analyzeStemPackCohesion,
  analyzeHumanAnatomy,
  analyzeAnimationCohesion,
  analyzeStethoscopeIntegrity,
  analyzeQrIntegrity,
  analyzeFlaggedSubjectIntegrity,
  analyzeNonTextContrast,
  matchSubjectContract,
  loadSubjectContracts,
  matchUserFocus,
  loadUserFocusList,
  looksLikeHumanFigure,
} from '../../../scripts/dev/visual-polish-screenshot-qa.mjs';

test('analyzeBrokenGraphics flags NaN and empty paths', () => {
  assert.ok(analyzeBrokenGraphics('<path d="" cx="NaN"/>').length >= 1);
  assert.equal(analyzeBrokenGraphics('<circle cx="12" cy="12" r="4"/>').length, 0);
});

test('analyzeBrokenGraphics flags truncated attribute quotes', () => {
  const bad = '<svg viewBox="0 0 64 64"><g class="rianell-avatar-part theme</svg>';
  assert.ok(analyzeBrokenGraphics(bad).some((r) => /truncat|quote|unclosed/i.test(r)));
});


test('analyzeOffsetShift detects large centroid move', () => {
  const a = '<circle cx="12" cy="12" r="4"/>';
  const shifted = '<circle cx="40" cy="40" r="4"/>';
  assert.ok(analyzeOffsetShift(a, shifted, '0 0 24 24').some((r) => /offset shift/i.test(r)));
  assert.equal(analyzeOffsetShift(a, a, '0 0 24 24').length, 0);
});

test('analyzeDescriptionFit expects chart geometry for chart ids', () => {
  const bad = analyzeDescriptionFit(
    { id: 'sprite:icon-chart-up', context: 'chart trend up' },
    '<circle cx="12" cy="12" r="8"/>',
  );
  assert.ok(bad.some((r) => /chart/i.test(r)));
});

test('analyzeStemPackCohesion flags missing sibling glyph', () => {
  const siblings = [
    { id: 'sprite:icon-target', currentPayload: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/>' },
    { id: 'fancy:icon-target:mint', team: 'mint', currentPayload: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/>' },
  ];
  const map = new Map([
    ['sprite:icon-target', '<g><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/></g>'],
    ['fancy:icon-target:mint', '<circle cx="12" cy="12" r="8"/>'],
  ]);
  const findings = analyzeStemPackCohesion('icon-target', siblings, map);
  assert.ok(findings.length >= 1);
});

test('analyzeLocationFit flags loader on non-loading control', () => {
  const r = analyzeLocationFit(
    { id: 'sprite:icon-user', context: 'profile avatar', kind: 'sprite' },
    '<g class="loader-spinner"><circle/></g>',
  );
  assert.ok(r.some((x) => /loader/i.test(x)));
});

test('looksLikeHumanFigure detects person subjects', () => {
  assert.equal(looksLikeHumanFigure({ id: 'achievement:swimmer-drown', context: 'person in water' }), true);
  assert.equal(looksLikeHumanFigure({ id: 'sprite:icon-user', context: 'profile' }), true);
  assert.equal(looksLikeHumanFigure({ id: 'avatar:glasswave', context: 'Abstract creature friendly' }), false);
});

test('analyzeHumanAnatomy fails four stick-arms under a head', () => {
  const bad = [
    '<circle cx="32" cy="18" r="4"/>',
    '<line x1="32" y1="22" x2="20" y2="36"/>',
    '<line x1="32" y1="22" x2="28" y2="38"/>',
    '<line x1="32" y1="22" x2="36" y2="38"/>',
    '<line x1="32" y1="22" x2="44" y2="36"/>',
  ].join('');
  const reasons = analyzeHumanAnatomy(
    { id: 'achievement:pool-drown', context: 'human figure drowning in waves' },
    bad,
  );
  assert.ok(reasons.some((r) => /extra limbs|anatomy/i.test(r)));
});

test('analyzeHumanAnatomy ignores non-human icons', () => {
  const svg = '<circle cx="12" cy="12" r="4"/><line x1="1" y1="1" x2="2" y2="2"/><line x1="3" y1="3" x2="4" y2="4"/><line x1="5" y1="5" x2="6" y2="6"/><line x1="7" y1="7" x2="8" y2="8"/>';
  assert.equal(analyzeHumanAnatomy({ id: 'sprite:icon-chart-up', context: 'chart' }, svg).length, 0);
});

test('analyzeAnimationCohesion flags scale blow-up and seam jumps', () => {
  const big = analyzeAnimationCohesion(
    '@keyframes boom { from { transform: scale(1); } to { transform: scale(2.5); } }',
    { id: 'animation:boom', kind: 'animation' },
  );
  assert.ok(big.some((r) => /scale|seam|clip/i.test(r)));
});

test('analyzeStethoscopeIntegrity fails fill-only stroke strip', () => {
  const bad = '<g class="rianell-polish theme-fx-target icon-fill" fill="currentColor" stroke="none" data-polish="wrap"><path d="M7 5.5a2.5 2.5 0 1 1 5 0"/><path d="M9.5 8v5.5a4 4 0 0 0 8 0V9"/><circle cx="19" cy="17" r="2.8"/></g>';
  const r = analyzeStethoscopeIntegrity({ id: 'sprite:icon-stethoscope' }, bad);
  assert.ok(r.some((x) => /stethoscope-broken|stroke stripped/i.test(x)));
});

test('analyzeStethoscopeIntegrity passes stroke wrap', () => {
  const good = '<g class="rianell-polish" fill="none" stroke="currentColor" data-polish="wrap-stroke"><path d="M7 5.5a2.5 2.5 0 1 1 5 0"/><path d="M9.5 8v5.5a4 4 0 0 0 8 0V9"/><circle cx="19" cy="17" r="2.8"/></g>';
  assert.equal(analyzeStethoscopeIntegrity({ id: 'sprite:icon-stethoscope' }, good).length, 0);
});

test('analyzeQrIntegrity passes classic 3-eye QR glyph', () => {
  const good = '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 14h2v6h-2zM14 18h2v2h-2z"/>';
  assert.equal(analyzeQrIntegrity({ id: 'sprite:icon-qr' }, good).length, 0);
});

test('analyzeQrIntegrity fails single-square / bar QR', () => {
  const bad = '<rect x="4" y="4" width="10" height="10"/><path d="M16 14v8M20 14v8"/>';
  const r = analyzeQrIntegrity({ id: 'fancy:icon-qr:mint', context: 'QR handoff' }, bad);
  assert.ok(r.some((x) => /qr-weak|qr-broken/i.test(x)));
});

test('analyzeFlaggedSubjectIntegrity fails shark-fin pizza', () => {
  const bad = '<path d="M4 20 Q12 2 20 20 Z"/>';
  const r = analyzeFlaggedSubjectIntegrity({ id: 'fa-replace:fa-solid_fa-pizza-slice' }, bad);
  assert.ok(r.some((x) => /pizza-weak/i.test(x)));
});

test('analyzeFlaggedSubjectIntegrity fails cycle_tracker tee marker', () => {
  const bad = '<line x1="4" y1="20" x2="20" y2="20"/><line x1="12" y1="20" x2="12" y2="8"/><circle cx="12" cy="6" r="2"/>';
  const r = analyzeFlaggedSubjectIntegrity({ id: 'achievement:cycle_tracker' }, bad);
  assert.ok(r.some((x) => /cycle-tracker-mismatch/i.test(x)));
});

test('analyzeFlaggedSubjectIntegrity fails ashspiral comma blob', () => {
  const bad = '<path d="M12 8 C14 8 14 12 12 12"/>';
  const r = analyzeFlaggedSubjectIntegrity({ id: 'avatar:ashspiral' }, bad);
  assert.ok(r.some((x) => /ashspiral-unreadable/i.test(x)));
});

test('subject-contracts.json drives match + reason labels', () => {
  const pack = loadSubjectContracts();
  assert.ok(pack.subjects?.stethoscope);
  const hit = matchSubjectContract({ id: 'sprite:icon-stethoscope' });
  assert.equal(hit?.name, 'stethoscope');
  assert.ok(hit.spec.reasons?.fail);
});

test('analyzeNonTextContrast flags near-invisible ink on dark stage', () => {
  const r = analyzeNonTextContrast('<path stroke="#1f2a26" fill="none" d="M1 1"/>');
  assert.ok(r.some((x) => /non-text contrast/i.test(x)));
});

test('matchUserFocus hits pizza and accessibility prefix', () => {
  const focus = {
    items: [
      { id: 'fa-replace:fa-solid_fa-pizza-slice', reason: 'not pizza' },
      { idPrefix: 'fancy:icon-accessibility:', reason: 'a11y pack' },
    ],
  };
  const pizza = matchUserFocus('fa-replace:fa-solid_fa-pizza-slice', focus);
  assert.equal(pizza.matched, true);
  assert.ok(pizza.reasons.some((r) => /user-qa-focus/i.test(r)));
  const a11y = matchUserFocus('fancy:icon-accessibility:rainbow', focus);
  assert.equal(a11y.matched, true);
  assert.equal(matchUserFocus('sprite:icon-food', focus).matched, false);
});

test('loadUserFocusList includes pizza primary and batch-2 packs', () => {
  const list = loadUserFocusList();
  assert.ok(list.items.some((it) => it.id === 'fa-replace:fa-solid_fa-pizza-slice'));
  assert.ok(list.items.some((it) => it.id === 'achievement:cycle_tracker'));
  assert.ok(list.items.some((it) => it.id === 'avatar:ashspiral'));
  assert.ok(list.items.some((it) => it.id === 'sprite:icon-stethoscope'));
  assert.ok(list.items.some((it) => it.id === 'avatar:moonthread'));
  assert.ok(list.items.some((it) => it.idPrefix === 'fancy:icon-save:'));
});
