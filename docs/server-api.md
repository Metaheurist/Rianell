# Python dev server API

The local **`server/main.py`** handler serves static files from **`apps/pwa-webapp/`** (or the configured `WEB_DIR`) and exposes JSON endpoints for development, logging, and optional Supabase bridging. These routes are **not** available on the GitHub Pages production site unless you run the Python server locally or on your LAN.

## Sensitive endpoints (loopback / LAN)

When **`HEALTH_APP_SENSITIVE_APIS_ON_LAN=1`**, clients on the same LAN may call sensitive routes **only if** **`HEALTH_APP_SENSITIVE_APIS_LAN_SECRET`** is set and the request includes header **`X-Rianell-LAN-Secret`** with the matching value. Without LAN mode, these endpoints accept **loopback only** (`127.0.0.1` / `::1`).

| Method | Path | Purpose |
| :--- | :--- | :--- |
| GET | `/api/encryption-key` | Returns AES-256-GCM key hex for legacy client-server key sync |
| POST | `/api/bug-report` | Inserts bug report row into Supabase `bug_reports` |

Rate limits apply (`http_security` limiters in `server/`).

## LLM proxy payload (optional dev / LAN)

When a client POSTs to a configured LLM endpoint (React Native `llmEndpoint` extra), the JSON body **must** include an explicit BCP-47 **`locale`** field (for example `en-GB`, `de-DE`). Valid values match `SHIPPED_LOCALES` in `@rianell/shared`; invalid values are coerced to **`en-GB`** client-side before send.

| Field | Type | Notes |
| :--- | :--- | :--- |
| `feature` | string | `summary` · `suggestNote` · `motd` |
| `model` | string | Resolved model id (e.g. `Llama-3.2-1B-Instruct`) |
| `modelSize` | string | Tier hint (`tier1`–`tier5`) |
| `context` | string | JSON-serialized feature context (no raw UGC beyond what the feature needs) |
| `locale` | string | **B2 contract:** client UI locale from `resolveActiveLocale(prefs)` — server must **not** infer language from `Accept-Language`, geo-IP, or log text |

PWA on-device LLM (`summary-llm.js`) loads system prompts from `i18n-packs/prompt-packs/v1/{locale}.json` (or `window.__rianellPromptPack`) with `en-GB` fallback; it does not POST to the dev server unless a separate proxy is configured.

## Other JSON routes

| Method | Path | Purpose |
| :--- | :--- | :--- |
| GET | `/api/reload` | Server-Sent Events stream; pushes reload on file watch (dev only) |
| GET/POST | `/api/log` | Client log ingest to server log files |
| POST | `/api/sync-log` | Sync logging endpoint (health check / structured sync logs) |
| GET | `/api/supabase-status` | Connection probe for Supabase client |
| GET | `/api/anonymized-data` | Anonymized training data export (when configured) |

## Static / special pages

| Path | Notes |
| :--- | :--- |
| `/tutorial` | Serves `index.html` with tutorial auto-open for QA |
| `*.js`, `*.css`, assets | Static file server with optional gzip precompressed variants |

## Bug report payload (POST `/api/bug-report`)

JSON body fields (all optional except **`description`**):

- `title`, `description`, `steps`, `expected_behavior`, `actual_behavior`
- `console_output`, `app_theme`, `user_agent`
- `url` or `page_url`, `client_timestamp`

**Production PWA and React Native** submit bug reports **directly to Supabase** under RLS instead of this route when not on the dev server.

## Environment

See **`server/config.py`** and [SECURITY.md](SECURITY.md) for Supabase credentials, `WEB_DIR`, LAN secret variables, and logging formatters.

## Related

- [setup-and-usage.md](setup-and-usage.md) — running the Tkinter dashboard and server
- [data-model.md](data-model.md) — log schema
