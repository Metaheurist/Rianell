# Transformers.js v4 migration notes

**Current production pin:** `@huggingface/transformers@4.3.0` (bundled `onnxruntime-web` checked by `vendor-transformers.mjs`)  
**Shipped:** 2026-10, together with the dedicated LLM worker  
**Previous pin:** `3.3.2` (restore from git history; see Rollback)

## What changed with v4

- **Runtime runs in a module worker.** `apps/pwa-webapp/workers/llm-worker.js` imports transformers.js and owns download, ONNX session compile and generation. `summary-llm.js` talks to it through `modules/llm-worker-client.js` (`window.RianellLlmWorkerClient`); the public `window.*` LLM API is unchanged. The main thread no longer imports transformers.js.
- **Vendored files.** `vendor/transformers/transformers.min.js` (self-contained ESM with the ORT WebGPU bundle inlined) plus `ort-wasm-simd-threaded.asyncify.{mjs,wasm}` (default) and `ort-wasm-simd-threaded.{mjs,wasm}` (Safari < 26 without WebGPU). The `jsep` files and source maps from 3.x are gone. `transformers.web*.js` is not usable here: it has bare `onnxruntime-web` imports.
- **Self-hosted WASM.** v4 points `env.backends.onnx.wasm.wasmPaths` at jsDelivr by default; the worker rebases those paths onto `vendor/transformers/`, keeping the variant (asyncify or plain) that transformers.js picked.
- **Pinned model revisions.** `MODEL_REVISIONS` in `summary-llm.js` maps each model to a 40-character commit SHA; the worker rejects anything else. v4 `pipeline()` does not forward `revision` to its file-list and progress-size pre-pass, so the worker wraps `env.fetch` (`pinModelRevision`) and rewrites `resolve/main/` URLs for the loaded model to the pinned SHA. Without that, every load also sent `config.json` and range probes to `main`.
- **Supply-chain checks.** `vendor-manifest.json` records `version`, `onnxruntimeWeb` and a sha256 per file. `scripts/verify/llm-security-contract.mjs` re-hashes every vendored file, checks the pins and fails if the main thread imports a runtime.

## Bumping the pin

1. Change `@huggingface/transformers` in root `package.json` (`devDependencies` and `overrides`), then `npm install`.
2. `npm run vendor:transformers` - copies the dist + ORT files, checks the ORT version matches, rewrites the manifest.
3. Update `TRANSFORMERS_PIN` in `llm-security-contract.mjs` and the CDN URL in `resolveTransformersImportUrl()` (`summary-llm.js`).
4. Check that the WASM file names transformers.js selects still exist in `vendor/transformers/` (`useSelfHostedWasm` keeps the file name).
5. Re-check whether `pipeline()` now forwards `revision` (see above); keep `pinModelRevision` until it does.
6. Gates: `npm run test:unit`, `node scripts/verify/llm-security-contract.mjs`, `npm run verify:csp`, `npm run audit:boot:strict`, then `PROBE_URL=http://127.0.0.1:8765/ PROBE_GPU_AVAILABLE=0 node scripts/ci/probe-llm-download-live.mjs` against a local server.

## Rollback

1. `git checkout <last 3.3.2 commit> -- apps/pwa-webapp/vendor/transformers scripts/build/vendor-transformers.mjs` and restore the `3.3.2` pin in `package.json`.
2. Revert `summary-llm.js`, `workers/llm-worker.js`, `modules/llm-worker-client.js` and `llm-security-contract.mjs` together; the 3.x code imported the runtime on the main thread.
3. Users can also force the jsDelivr runtime with `localStorage.rianellTransformersCdn = '1'` (the worker only accepts the version-pinned `@huggingface/transformers@` CDN prefix).
