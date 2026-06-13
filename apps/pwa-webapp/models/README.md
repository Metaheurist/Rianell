# Self-hosted on-device LLM weights

Rianell serves Transformers.js ONNX weights from **Supabase Storage** (bucket `llm-models`). Large files are split into **47 MB chunks** (`.part000`, …) to fit Supabase free tier (50 MB/object). Clients download chunks and reassemble into on-device cache.

Fallback order: **Supabase → same-origin `/models/` → Hugging Face**.

## Local weight files are gitignored

`apps/pwa-webapp/models/onnx-community/` is **not committed**. Only `manifest.json` (with chunk metadata) and this README are tracked.

## Setup

1. Apply `supabase/Schema.sql` on your Supabase project (storage bucket section).

2. Put credentials in `security/.env` (gitignored):

   ```
   SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   SUPABASE_SERVICE_KEY=your_service_role_key
   ```

3. Download weights locally (once, ~3.5 GB):

   ```bash
   npm run models:download
   npm run models:verify
   ```

4. Upload to Supabase (chunks large files automatically; skips already-uploaded parts):

   ```bash
   npm run models:upload:supabase -- --purge-local
   ```

   `--purge-local` deletes local `.onnx` / `.onnx_data` after a successful upload so they cannot be committed.

5. Commit the updated `manifest.json` (contains chunk paths). **Never commit service role keys.**

## Public URLs

```
https://YOUR_PROJECT.supabase.co/storage/v1/object/public/llm-models/models/onnx-community/.../config.json
https://YOUR_PROJECT.supabase.co/storage/v1/object/public/llm-models/models/onnx-community/.../onnx/model_q4.onnx.part000
```

## Clients

| Client | Cache location | Chunk assembly |
|--------|----------------|----------------|
| **PWA** | Cache API + blob URLs for Transformers.js fetch | `model-chunk-loader.js` |
| **RN** | `documentDirectory/rianell-models/` | `expo-file-system` File.append |

PWA uses `SUPABASE_CONFIG.url` + `modelsStorageBucket`. RN uses `EXPO_PUBLIC_SUPABASE_URL` or `EXPO_PUBLIC_MODELS_BASE_URL`.

GitHub Actions injects `SUPABASE_URL` / `SUPABASE_ANON_KEY` into `supabase-config.js` on Pages deploy — use placeholders in the repo.
