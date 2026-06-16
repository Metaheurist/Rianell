# On-device LLM weights (HF-only)

Rianell downloads ONNX weights directly from **Hugging Face Hub** (onnx-community `*-ONNX` repos). Clients cache weights locally (browser cache/IndexedDB on web; filesystem on RN).

Download source: **Hugging Face only**.

## Local weight files are gitignored

`apps/pwa-webapp/models/onnx-community/` is **not committed**. Only `manifest.json` (with chunk metadata) and this README are tracked.

## Manifest catalog

`apps/pwa-webapp/models/manifest.json` is a **catalog** for tier selection and file lists (for RN download UX). It is not a hosting manifest.

## Clients

| Client | Cache location |
|--------|----------------|
| **PWA** | IndexedDB (`transformers-cache`) + Cache API |
| **RN** | `documentDirectory/rianell-models/` |

GitHub Actions injects `SUPABASE_URL` / `SUPABASE_ANON_KEY` into `supabase-config.js` on Pages deploy for auth/sync only.

