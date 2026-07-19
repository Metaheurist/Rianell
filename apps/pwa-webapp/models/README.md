# On-device LLM weights (HF-only)

Rianell downloads ONNX weights directly from **Hugging Face Hub** (onnx-community Qwen2.5 Transformers.js repos). Clients cache weights locally (browser cache/IndexedDB on web; filesystem on RN).

Download source: **Hugging Face only**.

Shipped models (Apache-2.0, multilingual - 29 languages incl. all offered UI locales):

| Tier | Repo | q4f16 (WebGPU) | q4 (WASM) |
|------|------|----------------|-----------|
| 1-2 (small) | `onnx-community/Qwen2.5-0.5B-Instruct` | ~483 MB | ~786 MB |
| 3-5 (base) | `onnx-community/Qwen2.5-1.5B-Instruct` | ~1.2 GB | ~1.8 GB |

## Local weight files are gitignored

`apps/pwa-webapp/models/onnx-community/` is **not committed**. Only `manifest.json` and this README are tracked.

## Manifest catalog

`apps/pwa-webapp/models/manifest.json` is a **catalog** for tier selection and file lists (for RN download UX). It is not a hosting manifest.

## Clients

| Client | Cache location |
|--------|----------------|
| **PWA** | IndexedDB (`transformers-cache`) + Cache API |
| **RN** | `documentDirectory/rianell-models/` |

GitHub Actions injects `SUPABASE_URL` / `SUPABASE_ANON_KEY` into `supabase-config.js` on Pages deploy for auth/sync only.

