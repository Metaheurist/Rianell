# LLM rollout runbook (PWA)

## Pre-deploy

```powershell
npm ci
npm run sync:llm-pwa
npm run vendor:transformers
npm run agentic:llm-full-scope
```

## Bump cache when LLM assets change

1. Edit [`apps/pwa-webapp/sw.js`](../../apps/pwa-webapp/sw.js) — increment `CACHE_NAME` suffix.
2. Bump `llm-load-ladder-sync.js?v=` query in [`index.html`](../../apps/pwa-webapp/index.html) if ladder sync changed.

## Local smoke (Win11 Chrome)

```powershell
powershell -ExecutionPolicy Bypass -File .\server\launch-server.ps1 -NoCompile
$env:PROBE_URL='http://127.0.0.1:8080/'
node scripts/ci/probe-llm-download-live.mjs
npm run test:llm-hardware
node scripts/test/capture-browser-llm-env.mjs
```

Clear site data once after major LLM changes. Verify `chrome://gpu` WebGPU status.

## Production probe

```powershell
$env:VERIFY_URLS='https://rianell.com/'
node scripts/audit/verify-deploy-html.mjs
$env:PROBE_URL='https://rianell.com/'
$env:PROBE_TIER='1'
$env:PROBE_GPU_AVAILABLE='0'
node scripts/ci/probe-llm-download-live.mjs
```

**CI note:** GitHub Actions runs the HF download probe against the **`pages-site-probe` artifact** served locally (`http://127.0.0.1:9876/`). Cloudflare bot/challenge CSP on datacenter IPs can block same-origin scripts on `rianell.com` even when the app works in a real browser. The workflow still checks live deploy HTML and boot on `rianell.com` separately.

Pass criteria:

- `state: ready`, `inMemory: true`
- No console `Unsupported device: "webgl"`
- HF model requests present; no Supabase model bucket requests

## Web Push (optional)

1. Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` in server/Supabase secrets.
2. Expose public key to PWA as `window.RIANELL_VAPID_PUBLIC_KEY`.
3. Deploy `supabase/functions/push-notify` subscribe/send endpoints.
4. Test opt-in from Settings → Enable push notifications.

Payload schema:

```json
{ "type": "model_update", "message": "...", "minCacheVersion": "v2026-06-17-llm-webgpu-wasm-v3" }
```

## Rollback

- Set `localStorage.rianellTransformersCdn=1` to force jsDelivr Transformers CDN.
- Revert `CACHE_NAME` and redeploy previous `summary-llm.js` if needed.
