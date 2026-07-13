# GPU Llama V1 baseline (June 2026)

Research baseline for PWA GPU LLM rollout. See [agentic-gpu-v1](../../scripts/ci/agentic-gpu-v1.mjs) and [gpu-llama-matrix](../../scripts/test/gpu-llama-matrix.mjs).

## Known production issues

### ORT WebGPU error `557856688` (Windows tier 5)

- **Symptom:** `navigator.gpu.requestAdapter()` succeeds; Transformers.js pipeline load with `device: 'webgpu'` fails with numeric ORT error `557856688`.
- **Impact:** Path 1 (ONNX WebGPU) cannot serve Llama 1B on GPU on affected Windows Chrome builds.
- **Mitigation:** Invalidate `rianell.webgpu.adapterOk` session cache on pipeline failure; route to Path 2 (WebLLM MLC) or WASM SmolLM cap.

### MLC Path 2 worker callback (v1.92.1)

- **Symptom:** `Failed to execute 'postMessage' on 'Worker': function … could not be cloned` when loading MLC after ORT WebGPU failure.
- **Cause:** Passing `initProgressCallback` inside `engineConfig` or wrong `CreateWebWorkerMLCEngine` argument order.
- **Fix:** `new WebWorkerMLCEngine(worker, {})`, then `setInitProgressCallback()` on main thread, then `reload(modelId)`. CSP must allow `raw.githubusercontent.com` for MLC WASM libs.

### Adapter probe vs pipeline success

Adapter probe (`probeWebGpuAdapterAsync`) is necessary but **not sufficient**. Pipeline errors must downgrade the cache and trigger alternate paths.

**Reference:** [ORT WebGPU EP](https://onnxruntime.ai/docs/tutorials/web/ep-webgpu.html), [ORT Web troubleshooting](https://onnxruntime.ai/docs/tutorials/web/trouble-shooting.html)

### WASM fallback tier cap

After GPU failure, tier 3-5 must not load full Llama on WASM CPU (`resolveWasmFallbackModelId` in `summary-llm.js`). Use SmolLM unless user opts into `preferredLlmForceLargeOnWasm` with ≥8 GB RAM.

## CSP (Cloudflare report-only)

- Live site may log **report-only** CSP violations for Hugging Face / jsDelivr - not blocking today.
- Enforcing narrow `'self'` connect-src would break model downloads. See [`security/cloudflare-headers-recommended.md`](../../security/cloudflare-headers-recommended.md).

## Vendor bundle (Transformers 3.3.2)

- Self-hosted: `apps/pwa-webapp/vendor/transformers/` via `npm run vendor:transformers`
- WebGPU EP is bundled inside `transformers.min.js` (jsep WASM); no separate `ort.webgpu` vendor file.
- ORT WASM paths pinned via `configureSelfHostedOrtWasm()` - required for CI/GHA (no jsDelivr fetch).

## WebNN (Stage 9)

- Transformers 3.3.2 supports `device: 'webnn-gpu'`, `webnn-npu`, `webnn-cpu` via pipeline API.
- Probe `navigator.ml` before attempting; skip silently when absent.
- Raw ORT WebNN may need `onnxruntime-web/all` - verify through Transformers bundle first.

## Verification commands

```bash
npm run agentic:gpu-v1 -- --track pwa
node scripts/test/gpu-llama-matrix.mjs --profile win11_chrome_tier5_webgpu --expect-fail-document
node scripts/test/capture-browser-llm-env.mjs
GPU_MATRIX=1 PROBE_URL=http://127.0.0.1:8080/ npm run agentic:gpu-v1 -- --track pwa-gpu
```
