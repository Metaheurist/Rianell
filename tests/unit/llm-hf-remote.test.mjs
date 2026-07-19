import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HF_REMOTE_HOST,
  HF_REMOTE_PATH_TEMPLATE,
  buildHuggingFaceModelFileUrl,
  resolveHfModelId,
  resolveModelsRemoteHost,
} from '../../packages/llm/src/index.mjs';

test('resolveModelsRemoteHost defaults to Hugging Face', () => {
  const r = resolveModelsRemoteHost({});
  assert.equal(r.source, 'huggingface');
  assert.equal(r.remoteHost, HF_REMOTE_HOST);
  assert.equal(r.remotePathTemplate, HF_REMOTE_PATH_TEMPLATE);
});

test('buildHuggingFaceModelFileUrl builds resolve/main URL', () => {
  const url = buildHuggingFaceModelFileUrl(
    'onnx-community/Qwen2.5-0.5B-Instruct',
    'main',
    'config.json'
  );
  assert.equal(
    url,
    'https://huggingface.co/onnx-community/Qwen2.5-0.5B-Instruct/resolve/main/config.json'
  );
});

test('resolveHfModelId prefers sourceRepo', () => {
  assert.equal(
    resolveHfModelId({ id: 'foo', sourceRepo: 'bar' }),
    'bar'
  );
  assert.equal(resolveHfModelId({ id: 'foo' }), 'foo');
});

