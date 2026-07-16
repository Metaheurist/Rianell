import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const app = readFileSync('apps/pwa-webapp/app.js', 'utf8');
const summaryLlm = readFileSync('apps/pwa-webapp/summary-llm.js', 'utf8');

test('AI summary and chart refresh work is coalesced', () => {
  assert.match(app, /_aiSummaryInFlightMap/);
  assert.match(app, /AI generateAISummary \(joined in-flight\)/);
  assert.match(app, /AI generateAISummary \(cached no-op\)/);
  assert.match(app, /_chartsImmediateInFlight/);
  assert.match(app, /async function updateChartsImmediateImpl/);
});

test('developer Supabase API keys do not hit cloud in demo, local-only, or offline modes', () => {
  assert.match(app, /function getDevCloudUnavailableMessage/);
  assert.match(app, /appSettings\.demoMode \|\| appSettings\.localOnlyMode/);
  assert.match(app, /navigator\.onLine === false/);
  assert.match(app, /insertRes && insertRes\.error/);
  assert.doesNotMatch(app, /<h3>❌ Error<\/h3>/);
  assert.match(app, /tUi\('common\.error'\)/);
});

test('expected WebGPU fallback logs are informational, not warnings', () => {
  assert.match(summaryLlm, /retrying fallback/);
  assert.match(summaryLlm, /console\.info/);
  assert.match(summaryLlm, /GPU\/MLC attempts unavailable, trying WASM/);
  assert.doesNotMatch(summaryLlm, /GPU\/MLC attempts failed, trying WASM/);
});
