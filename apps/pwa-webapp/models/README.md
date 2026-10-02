# On-device LLM weights (HF-only)

Rianell downloads ONNX weights directly from **Hugging Face Hub** at pinned commit SHAs, through Transformers.js in `workers/llm-worker.js`. Weights are cached in the browser (Cache API).

Download source: **Hugging Face only**.

Shipped packages (`LLM_PACKAGES` in `summary-llm.js`; Apache-2.0; the declared language set covers all offered UI locales):

| Package | Repo | Device / dtype | Download | Used when |
|------|------|----------------|-----------|-----------|
| small | `onnx-community/Qwen3.5-0.8B-Text-ONNX` | WebGPU q4f16 | ~470 MB | Phone, 4 GB or less memory, AI safe mode, or tier 1-2 |
| large | `onnx-community/Qwen3.5-2B-ONNX-OPT` | WebGPU q4f16 | ~1.3 GB | Other WebGPU devices, or tier 3-5 |
| wasm | `onnx-community/Qwen2.5-0.5B-Instruct` | WASM q4 | ~760 MB | No usable WebGPU |

Qwen3.5's quantized graphs need WebGPU (ONNX Runtime Web has no WASM `GatherBlockQuantized` kernel), hence the separate WASM package. Benchmark and rationale: [`docs/research/llm-shortlist-2026-10.md`](../../../docs/research/llm-shortlist-2026-10.md).

## Local weight files are gitignored

`apps/pwa-webapp/models/onnx-community/` is **not committed**. Only `manifest.json` and this README are tracked.

## Manifest catalog

`apps/pwa-webapp/models/manifest.json` lists each package's repo, pinned revision and the files it loads. It drives `scripts/models/download-llm-models.mjs --model small|large|wasm` (optional local mirror) and must match `LLM_PACKAGES` (`tests/unit/llm-models-manifest.test.mjs`). It is not a hosting manifest.

GitHub Actions injects `SUPABASE_URL` / `SUPABASE_ANON_KEY` into `supabase-config.js` on Pages deploy for auth/sync only.
