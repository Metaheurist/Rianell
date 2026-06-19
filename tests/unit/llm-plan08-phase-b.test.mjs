import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isInstantLlmFeature,
  resolveLlmModelSizeForFeature,
} from '../../packages/llm/src/instant-tier.mjs';
import {
  normalizeLlmCoachPersona,
  coachPersonaPromptKey,
  LLM_COACH_PERSONAS,
} from '../../packages/shared/src/ai/llmCoachPersona.mjs';
import {
  MAX_WEEK_CHAT_TURNS,
  canSendWeekChatTurn,
  buildWeekChatContext,
  formatWeekChatHistory,
  buildWeekChatUserPayload,
  buildWeekChatFallback,
} from '../../packages/shared/src/ai/weekChat.mjs';
import { buildWeekChatPrompt, buildMotdPrompt } from '../../packages/shared/src/i18n/promptPack.mjs';

test('isInstantLlmFeature routes motd and suggestNote to tier1', () => {
  assert.equal(isInstantLlmFeature('motd'), true);
  assert.equal(isInstantLlmFeature('suggestNote'), true);
  assert.equal(isInstantLlmFeature('summary'), false);
  assert.equal(resolveLlmModelSizeForFeature('tier5', 'motd'), 'tier1');
  assert.equal(resolveLlmModelSizeForFeature('tier5', 'summary'), 'tier5');
});

test('normalizeLlmCoachPersona defaults unknown values to encouraging', () => {
  assert.equal(normalizeLlmCoachPersona('clinical'), 'clinical');
  assert.equal(normalizeLlmCoachPersona('unknown'), 'encouraging');
  assert.deepEqual(LLM_COACH_PERSONAS, ['encouraging', 'clinical', 'minimal']);
  assert.equal(coachPersonaPromptKey('minimal'), 'persona.minimal');
});

test('week chat enforces five-turn cap', () => {
  assert.equal(MAX_WEEK_CHAT_TURNS, 5);
  assert.equal(canSendWeekChatTurn(0), true);
  assert.equal(canSendWeekChatTurn(4), true);
  assert.equal(canSendWeekChatTurn(5), false);
});

test('buildWeekChatContext includes scoped metrics', () => {
  const ctx = buildWeekChatContext({
    analysis: { totalLogs: 8, flareDays: 1, avgMood: 6.5, topSymptoms: ['Headache (30%)'] },
    rangeLabel: 'Last 14 days',
  });
  assert.ok(ctx.includes('8 logged day'));
  assert.ok(ctx.includes('Flares: 1'));
  assert.ok(ctx.length <= 720);
});

test('formatWeekChatHistory serialises prior turns', () => {
  const hist = formatWeekChatHistory([
    { user: 'How was sleep?', assistant: 'Sleep averaged 6/10.' },
  ]);
  assert.ok(hist.includes('Turn 1'));
  assert.ok(hist.includes('How was sleep?'));
});

test('buildWeekChatUserPayload merges context history and message', () => {
  const payload = buildWeekChatUserPayload({
    baseContext: 'Week scope: 14 days.',
    history: 'Turn 1:\nUser: Hi\nAssistant: Hello',
    userMessage: 'What helped?',
  });
  assert.ok(payload.includes('Week scope'));
  assert.ok(payload.includes('What helped?'));
});

test('buildWeekChatFallback handles sparse logs', () => {
  assert.ok(buildWeekChatFallback({ totalLogs: 1 }).includes('few more days'));
  assert.ok(buildWeekChatFallback({ totalLogs: 10, flareDays: 2 }).includes('flare'));
});

test('buildWeekChatPrompt applies coach persona suffix', () => {
  const packs = {
    'en-GB': {
      locale: 'en-GB',
      strings: {
        'weekChat.system': 'Wellness coach only.',
        'persona.clinical': 'Use a neutral tone.',
      },
    },
  };
  const { system } = buildWeekChatPrompt('en-GB', 'User: hi', { packs, persona: 'clinical' });
  assert.ok(system.includes('Wellness coach'));
  assert.ok(system.includes('neutral tone'));
});

test('buildMotdPrompt accepts coach persona option', () => {
  const packs = {
    'en-GB': {
      locale: 'en-GB',
      strings: {
        'motd.system': 'Write a quote.',
        'persona.minimal': 'Be brief.',
      },
    },
  };
  const { system } = buildMotdPrompt('en-GB', 'water', { packs, persona: 'minimal' });
  assert.ok(system.includes('Be brief'));
});
