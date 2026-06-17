# Transformers.js device fact-check (2026-06)

**Pinned runtime:** `@huggingface/transformers@3.3.2`

## Browser pipeline devices

From `node_modules/@huggingface/transformers/src/backends/onnx.js` (browser):

- Supported: **`webgpu`**, **`wasm`** (+ WebNN variants when available)
- **Not supported:** `webgl` — throws `Unsupported device: "webgl". Should be one of: webgpu, wasm.`

## Official docs (v3.8.1 API, same device model)

- GPU: `{ device: "webgpu" }` via ONNX Runtime Web
- Default browser path: WASM/CPU
- WebGPU is experimental; WASM fallback is documented

See also: [transformers-js-webgpu-snapshot.md](./transformers-js-webgpu-snapshot.md)

## Rianell policy (v1.91.0)

- PWA load ladder: WebGPU (q4f16 → q4) → WASM q4
- Never pass `device: 'webgl'` to Transformers.js pipelines
- TF.js WebGL (`AIEngine.js`) is unrelated to Transformers device selection
