import test from 'node:test';
import assert from 'node:assert/strict';
import { isHuggingFaceModelsRequest, isSupabaseLlmModelsRequest } from '../../packages/build-tools/src/probe-llm-assertions.mjs';

test('HF URL matcher accepts hub + cdn hosts', () => {
  assert.equal(isHuggingFaceModelsRequest('https://huggingface.co/onnx-community/x/resolve/main/config.json'), true);
  assert.equal(isHuggingFaceModelsRequest('https://cas-bridge.xethub.hf.co/x'), true);
  assert.equal(isHuggingFaceModelsRequest('https://cdn-lfs.hf.co/x'), true);
  assert.equal(isHuggingFaceModelsRequest('https://example.com/x'), false);
});

test('Supabase llm-models matcher detects public storage path', () => {
  assert.equal(
    isSupabaseLlmModelsRequest('https://abc.supabase.co/storage/v1/object/public/llm-models/models/x'),
    true
  );
  assert.equal(isSupabaseLlmModelsRequest('https://huggingface.co/x'), false);
});

