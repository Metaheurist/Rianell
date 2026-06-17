# LLM GPU V1 rollout runbook

## Pre-deploy

```bash
npm run sync:llm-pwa
npm run vendor:transformers
npm run agentic:gpu-v1 -- --track pwa
```

Optional local GPU matrix (built PWA on port 8080):

```bash
GPU_MATRIX=1 PROBE_URL=http://127.0.0.1:8080/ npm run agentic:gpu-v1 -- --track pwa-gpu
```

Tier 5 Llama probes require `HF_TOKEN` in environment.

## PWA load order (tier 3–5)

1. **Path 1:** Transformers.js ONNX — WebGPU → WebNN → WASM  
2. **Path 2:** WebLLM MLC (`@mlc-ai/web-llm@0.2.84`) when Path 1 fails or `557856688` cached  
3. **Path 3:** GGUF spike (feature flag; not bundled in V1 default)  
4. **Fallback:** WASM SmolLM cap (`resolveWasmFallbackModelId`)

## Settings

- **Engine:** Settings → AI inference engine (`auto` | `onnx` | `mlc` | `gguf`)  
- **Backend label:** Shown in model status when loaded (`webgpu`, `wasm`, etc.)  
- **CDN rollback:** `localStorage.rianellTransformersCdn=1`  
- **Vendor rollback:** Re-run `npm run vendor:transformers` with pinned 3.3.2 tarball from runbook archive

## Manual CI

- WebGPU tier 5: `.github/workflows/llm-webgpu-manual.yml`  
- RN GPU: `.github/workflows/llm-rn-gpu-manual.yml`

## Cloudflare CSP

Keep LLM connect-src on `'self'` + `https://huggingface.co` + `https://cdn.jsdelivr.net`. Report-only violations are expected until headers are aligned — see `security/cloudflare-headers-recommended.md`.

## RN parity

```bash
npm run agentic:gpu-v1 -- --track rn-static
RN_DEVICE=1 npm run test:gpu-rn-matrix
```
