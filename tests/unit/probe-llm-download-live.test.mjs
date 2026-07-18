import test from 'node:test';
import assert from 'node:assert/strict';

// Mirrors the download-verified acceptance in scripts/ci/probe-llm-download-live.mjs.
// The onnx compile/warmup is CPU-bound (single-threaded WASM on CI runners with
// no cross-origin isolation), so the *download* is accepted once the weights are
// fully transferred and the app enters ONNX prep (finalizing = downloading @ pct>=99),
// or when the poll loop's grace-window short-circuit sets weightsDownloadVerified.
function isDownloadVerified(final, hf, failedRequests, vendor, weightsDownloadVerified = false) {
  const hfOnnxFetched = hf.some((u) => /model_q4\.onnx|\/onnx\/.*\.onnx/i.test(u));
  return Boolean(
    weightsDownloadVerified ||
    (final && final.state === 'downloading' && (final.pct || 0) >= 99 &&
      hfOnnxFetched && failedRequests.length === 0 && vendor.length >= 2)
  );
}

const vendorOk = () => [
  'http://127.0.0.1:9876/vendor/transformers/transformers.min.js',
  'http://127.0.0.1:9876/vendor/transformers/ort-wasm-simd-threaded.jsep.wasm',
];
const hfOnnx = () => ['https://huggingface.co/onnx-community/x/resolve/main/onnx/model_q4.onnx'];

test('download verified when HF onnx fetched at 100% without failures', () => {
  assert.equal(isDownloadVerified({ state: 'downloading', pct: 100 }, hfOnnx(), [], vendorOk()), true);
});

test('download verified at finalizing (pct 99, weights in, ONNX compile pending)', () => {
  assert.equal(isDownloadVerified({ state: 'downloading', pct: 99 }, hfOnnx(), [], vendorOk()), true);
});

test('download verified via grace-window short-circuit flag even below 99', () => {
  assert.equal(isDownloadVerified({ state: 'downloading', pct: 50 }, hfOnnx(), [], vendorOk(), true), true);
});

test('download not verified when pct below finalizing threshold', () => {
  assert.equal(isDownloadVerified({ state: 'downloading', pct: 80 }, hfOnnx(), [], vendorOk()), false);
});

test('download not verified when a request failed even at finalizing', () => {
  assert.equal(isDownloadVerified({ state: 'downloading', pct: 99 }, hfOnnx(), ['x (net::ERR)'], vendorOk()), false);
});

// Mirrors isHfThrottledTimeoutOnly in scripts/ci/probe-llm-download-live.mjs.
function isHfThrottledTimeoutOnly(result) {
  if (!result || result.ok) return false;
  const jsErrors = (result.errors || []).filter(Boolean);
  if (jsErrors.length > 0) return false;
  if (result.error) return false;
  if ((result.failedRequestCount || 0) > 0) return false;
  const status = result.finalStatus;
  if (!status || status.state !== 'failed') return false;
  if (!/prepar\w*\s+timed out|timed out/i.test(String(status.error || ''))) return false;
  const reachedHf = Array.isArray(result.hfRequests) && result.hfRequests.length > 0;
  const vendorOk = Array.isArray(result.vendorRequests) && result.vendorRequests.length >= 2;
  return reachedHf && result.hfOnnxFetched === true && vendorOk;
}

const healthyThrottle = () => ({
  ok: false,
  errors: [],
  failedRequestCount: 0,
  hfOnnxFetched: true,
  finalStatus: { state: 'failed', error: 'Model preparation timed out. Please retry.' },
  hfRequests: ['https://huggingface.co/onnx-community/x/resolve/main/onnx/model_q4.onnx'],
  vendorRequests: ['a', 'b'],
});

test('soft-pass when HF throttles weights past model-prep timeout, path healthy', () => {
  assert.equal(isHfThrottledTimeoutOnly(healthyThrottle()), true);
});

test('no soft-pass when a network request failed', () => {
  assert.equal(isHfThrottledTimeoutOnly({ ...healthyThrottle(), failedRequestCount: 1 }), false);
});

test('no soft-pass when JS errors were raised', () => {
  assert.equal(isHfThrottledTimeoutOnly({ ...healthyThrottle(), errors: ['boom'] }), false);
});

test('no soft-pass when onnx weight request was never issued', () => {
  assert.equal(isHfThrottledTimeoutOnly({ ...healthyThrottle(), hfOnnxFetched: false }), false);
});

test('no soft-pass for a non-timeout failure', () => {
  const r = { ...healthyThrottle(), finalStatus: { state: 'failed', error: 'checksum mismatch' } };
  assert.equal(isHfThrottledTimeoutOnly(r), false);
});

test('no soft-pass when the model actually became ready', () => {
  assert.equal(isHfThrottledTimeoutOnly({ ...healthyThrottle(), ok: true }), false);
});
