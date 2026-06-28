import test from 'node:test';
import assert from 'node:assert/strict';

function isDownloadVerified(final, hf, failedRequests, vendor) {
  const hfOnnxFetched = hf.some((u) => /model_q4\.onnx|\/onnx\/.*\.onnx/i.test(u));
  return Boolean(
    final && final.state === 'downloading' && (final.pct || 0) >= 100 &&
    hfOnnxFetched && failedRequests.length === 0 && vendor.length >= 2
  );
}

test('download verified when HF onnx fetched at 100% without failures', () => {
  const final = { state: 'downloading', pct: 100 };
  const hf = ['https://huggingface.co/onnx-community/x/resolve/main/onnx/model_q4.onnx'];
  const vendor = [
    'http://127.0.0.1:9876/vendor/transformers/transformers.min.js',
    'http://127.0.0.1:9876/vendor/transformers/ort-wasm-simd-threaded.jsep.wasm',
  ];
  assert.equal(isDownloadVerified(final, hf, [], vendor), true);
});

test('download not verified when pct below 100', () => {
  const final = { state: 'downloading', pct: 80 };
  const hf = ['https://huggingface.co/onnx-community/x/resolve/main/onnx/model_q4.onnx'];
  const vendor = ['a', 'b'];
  assert.equal(isDownloadVerified(final, hf, [], vendor), false);
});
