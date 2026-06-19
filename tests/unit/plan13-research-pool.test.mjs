import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildResearchFacetsFromLog,
  validateResearchFacets,
  flareToBit,
  POOL_INSIGHT_MIN_K,
  POOL_CONTRIBUTION_MIN_DAYS,
  canExportContributionHistory,
  canViewPoolInsights,
  buildUserCohortsFromFacets,
  buildSleepFlareInsight,
  computePoolInsightsFromFacets,
  formatContributionExport,
  CONTRIBUTION_EXPORT_FORMAT,
  buildAnonymizedLogPayload,
} from '@rianell/shared';

const SAMPLE_LOG = {
  date: '2026-06-01',
  sleep: 8,
  fatigue: 4,
  mood: 7,
  flare: 'No',
  notes: 'should not appear',
};

test('buildResearchFacetsFromLog keeps numeric fields only', () => {
  const facets = buildResearchFacetsFromLog(SAMPLE_LOG);
  assert.ok(facets);
  assert.equal(facets.date, '2026-06-01');
  assert.equal(facets.sleep, 8);
  assert.equal(facets.flare, 0);
  assert.equal(facets.notes, undefined);
  assert.equal(validateResearchFacets(facets), true);
});

test('buildAnonymizedLogPayload excludes notes and PII fields', () => {
  const payload = buildAnonymizedLogPayload({ ...SAMPLE_LOG, stressors: ['work'], userName: 'Ada' });
  assert.equal(payload.notes, undefined);
  assert.equal(payload.stressors, undefined);
  assert.equal(payload.userName, undefined);
  assert.equal(payload.sleep, 8);
});

test('canExportContributionHistory requires sign-in and opt-in', () => {
  assert.equal(canExportContributionHistory({ contributeAnonData: true, medicalCondition: 'RA' }, { signedIn: false }).allowed, false);
  assert.equal(canExportContributionHistory({ contributeAnonData: false, medicalCondition: 'RA' }, { signedIn: true }).reason, 'optIn');
  assert.equal(canExportContributionHistory({ contributeAnonData: true, medicalCondition: 'RA' }, { signedIn: true }).allowed, true);
});

test('canViewPoolInsights enforces 90-day pool gate', () => {
  const prefs = { contributeAnonData: true, medicalCondition: 'RA' };
  const blocked = canViewPoolInsights(prefs, { signedIn: true, poolDayCount: 10 });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.reason, 'minDays');
  assert.equal(blocked.minDays, POOL_CONTRIBUTION_MIN_DAYS);
  const ok = canViewPoolInsights(prefs, { signedIn: true, poolDayCount: 120 });
  assert.equal(ok.allowed, true);
});

test('computePoolInsightsFromFacets suppresses when cohorts below k', () => {
  const rows = [
    { user_id: 'u1', research_facets: { date: '2026-06-01', sleep: 8, flare: 0 } },
    { user_id: 'u2', research_facets: { date: '2026-06-02', sleep: 5, flare: 1 } },
  ];
  const out = computePoolInsightsFromFacets(rows, { kMin: POOL_INSIGHT_MIN_K });
  assert.equal(out.suppressed, true);
  assert.equal(out.insights.length, 0);
});

test('sleep-flare insight appears when k-anon cohorts diverge', () => {
  const rows = [];
  for (let i = 0; i < 6; i++) {
    rows.push({ user_id: 'high' + i, research_facets: { date: '2026-06-0' + (i + 1), sleep: 8, flare: 0 } });
    rows.push({ user_id: 'low' + i, research_facets: { date: '2026-06-1' + (i + 1), sleep: 5, flare: 1 } });
  }
  const cohorts = buildUserCohortsFromFacets(rows, 5);
  const insight = buildSleepFlareInsight(cohorts);
  assert.ok(insight);
  assert.equal(insight.id, 'sleep-flare');
  assert.ok(insight.highFlarePct < insight.lowFlarePct);
  const out = computePoolInsightsFromFacets(rows, { kMin: 5 });
  assert.equal(out.insights.length, 1);
});

test('formatContributionExport uses stable bundle format', () => {
  const bundle = formatContributionExport(
    [{ id: 1, created_at: '2026-06-01T00:00:00Z', medical_condition: 'RA', research_facets: { date: '2026-06-01', sleep: 7 }, decrypted: { sleep: 7 } }],
    { medicalCondition: 'RA' },
  );
  assert.equal(bundle.format, CONTRIBUTION_EXPORT_FORMAT);
  assert.equal(bundle.rowCount, 1);
  assert.match(bundle.retentionNote, /Opting out/);
});

test('flareToBit normalizes yes/no', () => {
  assert.equal(flareToBit('Yes'), 1);
  assert.equal(flareToBit('No'), 0);
  assert.equal(flareToBit('maybe'), null);
});
