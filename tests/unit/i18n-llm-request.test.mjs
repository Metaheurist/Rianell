import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLlmRequestPayload,
  buildMotdPrompt,
  buildSummaryPrompt,
  buildSuggestPrompt,
  loadPromptPack,
} from '../../packages/shared/src/i18n/promptPack.mjs';

test('buildLlmRequestPayload includes validated locale', () => {
  const payload = buildLlmRequestPayload({
    feature: 'summary',
    model: 'Llama-3.2-1B-Instruct',
    modelSize: 'tier3',
    context: '{"totalLogs":3}',
    locale: 'de-DE',
  });
  assert.equal(payload.feature, 'summary');
  assert.equal(payload.model, 'Llama-3.2-1B-Instruct');
  assert.equal(payload.modelSize, 'tier3');
  assert.equal(payload.context, '{"totalLogs":3}');
  assert.equal(payload.locale, 'de-DE');
});

test('buildLlmRequestPayload falls back to en-GB for invalid locale', () => {
  const payload = buildLlmRequestPayload({
    feature: 'motd',
    model: 'SmolLM2-360M-Instruct',
    modelSize: 'tier1',
    context: '{}',
    locale: 'not-a-locale',
  });
  assert.equal(payload.locale, 'en-GB');
});

test('loadPromptPack reads en-GB motd and summary strings', () => {
  const pack = loadPromptPack('en-GB');
  assert.equal(pack.locale, 'en-GB');
  assert.ok(typeof pack.strings['motd.system'] === 'string');
  assert.ok(typeof pack.strings['summary.system'] === 'string');
});

test('buildMotdPrompt returns system and user prompts', () => {
  const { system, user } = buildMotdPrompt('en-GB', 'sleep');
  assert.ok(system.includes('healthy living'));
  assert.ok(user.includes('sleep'));
});

test('buildSummaryPrompt wraps context in user message', () => {
  const { system, user } = buildSummaryPrompt('en-GB', '3 day(s) of data.');
  assert.ok(system.includes('summarise'));
  assert.equal(user, 'Data: 3 day(s) of data.');
});

test('buildSuggestPrompt wraps context in user message', () => {
  const { system, user } = buildSuggestPrompt('en-GB', 'Today: Mood 6.');
  assert.ok(system.includes('daily health log'));
  assert.equal(user, 'Data: Today: Mood 6.');
});
