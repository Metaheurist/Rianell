import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSelfHostedModelFileUrl,
  LLM_MODEL_SMALL_ID,
  modelIdFromTier,
} from '../../packages/llm/src/index.mjs';

test('modelIdFromTier returns full onnx-community ids', () => {
  assert.equal(modelIdFromTier('tier1'), LLM_MODEL_SMALL_ID);
  assert.equal(modelIdFromTier('tier3'), 'onnx-community/Llama-3.2-1B-Instruct');
});

test('buildSelfHostedModelFileUrl matches PWA /models/ layout', () => {
  const url = buildSelfHostedModelFileUrl(
    'https://example.github.io/Health-app/',
    LLM_MODEL_SMALL_ID,
    'main',
    'config.json'
  );
  assert.equal(
    url,
    'https://example.github.io/Health-app/models/onnx-community/SmolLM2-360M-Instruct/resolve/main/config.json'
  );
});

test('buildSupabaseModelsPublicBase matches Storage public URL layout', async () => {
  const { buildSupabaseModelsPublicBase } = await import('../../packages/llm/src/index.mjs');
  const base = buildSupabaseModelsPublicBase('https://abc.supabase.co', 'llm-models');
  assert.equal(base, 'https://abc.supabase.co/storage/v1/object/public/llm-models/');
  const file = buildSelfHostedModelFileUrl(base, LLM_MODEL_SMALL_ID, 'main', 'config.json');
  assert.equal(
    file,
    'https://abc.supabase.co/storage/v1/object/public/llm-models/models/onnx-community/SmolLM2-360M-Instruct/resolve/main/config.json'
  );
});
