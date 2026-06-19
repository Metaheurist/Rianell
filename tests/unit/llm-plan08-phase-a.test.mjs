import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildClinicianBriefContext,
  buildClinicianBriefFallback,
} from '../../packages/shared/src/ai/clinicianBriefContext.mjs';
import {
  buildExplainChartContext,
  buildExplainChartFallback,
} from '../../packages/shared/src/ai/explainChartContext.mjs';
import { isLlmInferenceAllowed } from '../../packages/shared/src/ai/llmCapability.mjs';
import {
  parseStructuredLlmOutput,
  formatStructuredLlmOutput,
} from '../../packages/shared/src/ai/structuredLlmOutput.mjs';
import {
  buildClinicianBriefPrompt,
  buildExplainChartPrompt,
  buildStructuredSummaryPrompt,
} from '../../packages/shared/src/i18n/promptPack.mjs';

test('isLlmInferenceAllowed blocks ar ui-only locale', () => {
  assert.equal(isLlmInferenceAllowed('ar'), false);
  assert.equal(isLlmInferenceAllowed('en-GB'), true);
});

test('buildClinicianBriefContext caps length and includes flare data', () => {
  const ctx = buildClinicianBriefContext({
    analysis: { totalLogs: 12, flareDays: 2, avgFatigue: 6.5, topSymptoms: ['Headache (40%)'] },
    rangeLabel: 'Last 30 days',
  });
  assert.ok(ctx.includes('12 logged day'));
  assert.ok(ctx.includes('Flare days: 2'));
  assert.ok(ctx.length <= 900);
});

test('buildClinicianBriefFallback returns readable summary', () => {
  const text = buildClinicianBriefFallback({ totalLogs: 5, flareDays: 1, rangeLabel: 'Last 14 days' });
  assert.ok(text.includes('5 logged days'));
});

test('buildExplainChartContext includes trend lines', () => {
  const ctx = buildExplainChartContext({
    rangeLabel: 'Last 7 days',
    viewMode: 'balance',
    trends: [{ label: 'Mood', average: 6.2, current: 7, delta: 0.8, points: 5 }],
    totalLogs: 5,
  });
  assert.ok(ctx.includes('Mood'));
  assert.ok(ctx.includes('Last 7 days'));
});

test('buildExplainChartFallback handles empty trends', () => {
  assert.ok(buildExplainChartFallback({ trends: [] }).includes('Not enough'));
});

test('parseStructuredLlmOutput validates schema', () => {
  const ok = parseStructuredLlmOutput(
    '{"insights":["Sleep dipped"],"actions":["Rest earlier"],"confidence":0.72}'
  );
  assert.deepEqual(ok?.insights, ['Sleep dipped']);
  assert.equal(ok?.actions.length, 1);
  assert.equal(ok?.confidence, 0.72);
  assert.equal(parseStructuredLlmOutput('not json'), null);
  assert.equal(parseStructuredLlmOutput('{"insights":[]}'), null);
});

test('formatStructuredLlmOutput renders bullet sections', () => {
  const text = formatStructuredLlmOutput({
    insights: ['A'],
    actions: ['B'],
    confidence: 0.8,
  });
  assert.ok(text.includes('Insights:'));
  assert.ok(text.includes('Actions:'));
  assert.ok(text.includes('80%'));
});

test('new prompt pack builders exist for Plan 08 intents', () => {
  const brief = buildClinicianBriefPrompt('en-GB', 'Range: 30 days.');
  assert.ok(brief.system.toLowerCase().includes('clinician'));
  assert.ok(brief.user.includes('Patient data:'));
  const chart = buildExplainChartPrompt('en-GB', 'Chart range: 7 days.');
  assert.ok(chart.system.toLowerCase().includes('chart'));
  const structured = buildStructuredSummaryPrompt('en-GB', '{"totalLogs":3}');
  assert.ok(structured.system.includes('JSON'));
});
