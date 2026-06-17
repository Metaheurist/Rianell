import { buildRnLoadAttempts, LLM_MODEL_BASE_ID } from '@rianell/llm';
import { buildMotdPrompt } from '@rianell/shared';
import { getNativeActiveBackend } from './llmNative';

test('buildMotdPrompt uses shipped en-GB pack strings', () => {
  const { system, user } = buildMotdPrompt('en-GB');
  expect(system.toLowerCase()).toContain('quote');
  expect(user.length).toBeGreaterThan(5);
});

test('getNativeActiveBackend is null before pipeline init', () => {
  expect(getNativeActiveBackend()).toBeNull();
});

test('buildRnLoadAttempts prefers nnapi on Android', () => {
  const plans = buildRnLoadAttempts({ platformKind: 'rn_android', modelId: LLM_MODEL_BASE_ID });
  expect(plans[0].executionProviders[0]).toBe('nnapi');
});

test('buildRnLoadAttempts prefers coreml on iOS', () => {
  const plans = buildRnLoadAttempts({ platformKind: 'rn_ios', modelId: LLM_MODEL_BASE_ID });
  expect(plans[0].executionProviders[0]).toBe('coreml');
});
