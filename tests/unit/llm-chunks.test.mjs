#!/usr/bin/env node
/** @test packages/llm chunk planning and manifest normalization */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CHUNK_BYTE_LIMIT,
  chunkPartPath,
  planFileChunks,
  normalizeModelFileEntries,
  logicalFilePaths,
  mergeArrayBuffers,
} from '../../packages/llm/src/chunks.mjs';

test('planFileChunks splits files above limit', () => {
  const size = DEFAULT_CHUNK_BYTE_LIMIT * 2 + 1024;
  const plan = planFileChunks(size);
  assert.equal(plan.chunks.length, 3);
  assert.equal(plan.chunks[0].sizeBytes, DEFAULT_CHUNK_BYTE_LIMIT);
  assert.equal(plan.chunks[2].sizeBytes, 1024);
});

test('planFileChunks leaves small files whole', () => {
  const plan = planFileChunks(1024);
  assert.equal(plan.chunks, null);
});

test('chunkPartPath uses zero-padded suffix', () => {
  assert.equal(chunkPartPath('onnx/model_q4.onnx', 0), 'onnx/model_q4.onnx.part000');
  assert.equal(chunkPartPath('onnx/model_q4.onnx', 12), 'onnx/model_q4.onnx.part012');
});

test('normalizeModelFileEntries accepts strings and chunk objects', () => {
  const model = {
    files: [
      'config.json',
      { path: 'onnx/model_q4.onnx', sizeBytes: 100, chunks: ['onnx/model_q4.onnx.part000'] },
    ],
  };
  const entries = normalizeModelFileEntries(model);
  assert.equal(entries.length, 2);
  assert.deepEqual(logicalFilePaths(model), ['config.json', 'onnx/model_q4.onnx']);
});

test('mergeArrayBuffers concatenates in order', () => {
  const a = new Uint8Array([1, 2]).buffer;
  const b = new Uint8Array([3]).buffer;
  const merged = new Uint8Array(mergeArrayBuffers([a, b]));
  assert.deepEqual([...merged], [1, 2, 3]);
});
