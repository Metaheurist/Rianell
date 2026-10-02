# LLM GPU V1 rollout runbook

## Pre-deploy

```bash
npm run sync:llm-pwa
npm run vendor:transformers
npm run verify:csp
npm run agentic:gpu-v1 -- --track pwa
```

Optional local GPU matrix (built PWA on port 8080):

```bash
GPU_MATRIX=1 PROBE_URL=http://127.0.0.1:8080/ npm run agentic:gpu-v1 -- --track pwa-gpu
```

Model probes need no `HF_TOKEN` (Apache-2.0 repos). Re-run the shortlist benchmark with `node scripts/models/benchmark-llm-shortlist.mjs` (headed Chromium; needs a WebGPU adapter).

## PWA load order

One engine: Transformers.js 4.3.0 in `workers/llm-worker.js`. The package is chosen once per session (`resolvePackageKey` in `summary-llm.js`):

1. **small** (Qwen3.5-0.8B, WebGPU q4f16) on phones, devices with 4 GB or less memory, AI safe mode, or tier 1-2.
2. **large** (Qwen3.5-2B-ONNX-OPT, WebGPU q4f16) on other WebGPU devices, or tier 3-5.
3. **wasm** (Qwen2.5-0.5B, q4) when WebGPU is unavailable. If a WebGPU load fails, the GPU is marked failed for this browser and the wasm package loads in a fresh worker.

## Settings

- **Performance tab:** Model status and download progress are always visible; manual tier, storage and maintenance live under **Advanced** (collapsed by default, auto-expands when overrides or download are active).
- **Backend label:** Shown in model status when loaded (e.g. “graphics acceleration”, “standard processing”).
- **CDN rollback:** `localStorage.rianellTransformersCdn=1`
- **Vendor rollback:** see `docs/research/transformers-js-v4-migration.md`.

## Cloudflare CSP

Keep LLM connect-src on `'self'` + `https://huggingface.co` + `https://cdn.jsdelivr.net`. `https://raw.githubusercontent.com` is no longer needed (it served the removed MLC engine's WASM libraries) and `verify-csp-connect-src` fails if it returns. Report-only violations are expected until headers are aligned - see `security/cloudflare-headers-recommended.md`. Run `npm run verify:csp` before deploy (includes live Report-Only header check on rianell.com; set `SKIP_CSP_LIVE=1` offline).

## Summary LLM timeouts (v1.92.3+)

- **Load:** 180s for first pipeline/model fetch (`LOAD_TIMEOUT_MS`).
- **Inference:** 45s per chat/suggest call after pipeline is ready (`raceChatInference`).
- Benign console noise (CSP Report-Only subframes, WebGPU skip, HF cache warnings) is filtered early in `index.html` / `app.js` - do not treat as regressions during GPU matrix probes.

## Manual CI

- WebGPU tier 5: `.github/workflows/llm-webgpu-manual.yml`
