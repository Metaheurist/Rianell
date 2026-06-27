# External setup — step-by-step instructions

**Purpose:** All steps that happen **outside the repo** (Supabase SQL, env vars, keys, OAuth consoles). Update this file when a plan adds new external dependencies.

**Policy:** [FREE-TIER-POLICY.md](./FREE-TIER-POLICY.md) — free providers only.

**Last verified:** 2026-06-18 (Firecrawl + Supabase docs)

---

## Quick index by plan

| Exec | Plan | External items |
|------|------|----------------|
| 01 | Platform | None |
| 02 | i18n | None |
| 03 | Settings | None |
| 04 | Logging | Open Food Facts only |
| 05 | Privacy | Policy markdown; WebAuthn RP ID |
| 06 | Cloud sync | **Supabase project + RLS SQL**; optional Edge Function (D6) |
| 07 | AI engine | None (on-device) |
| 08 | LLM | HF model cache paths (no API key for public models) |
| 09 | Charts | None |
| 10 | Home | Open-Meteo (no key); opt-in geolocation |
| 11 | Notifications | **VAPID key pair**; service worker |
| 12 | Clinician | None (uses P4 crypto locally) |
| 13 | Research | Supabase `anonymized_data` + aggregation |
| 14 | Cross-cutting | Crisis URLs in region packs |
| 19 | Connectors | **Strava / Withings / Google Sheets OAuth**; Supabase Edge secrets; [docs/connectors/SETUP.md](../connectors/SETUP.md) |

---

## § Global — one-time project setup

### 1. Supabase (plans 05, 06, 13)

**Status:** GitHub secrets `SUPABASE_URL` + `SUPABASE_ANON_KEY` set; rianell.com deploy injects credentials. **Apply SQL once** if not done:

1. Follow **[supabase/APPLY.md](../../supabase/APPLY.md)** — paste entire `supabase/Schema.sql` in SQL Editor (§0 test reset **commented out**).
2. Run §5 verification queries; check Security Advisor for cleared GraphQL lints.
3. Ensure **Authentication → Email** provider is enabled if users sign in.
4. Local dev only (gitignored `security/.env`):

   | Var | Where |
   |-----|-------|
   | `SUPABASE_URL` | PWA build env / RN `.env` |
   | `SUPABASE_PUBLISHABLE_KEY` or `SUPABASE_ANON_KEY` | PWA + RN clients only |

5. Run CI check: `npm run verify-no-service-role-in-clients`.

**Free-tier guardrails:** 500 MB DB; batch RE1 aggregation daily; compress encrypted blobs.

---

### 2. VAPID keys — Web Push (plans 11, 14 optional)

**When:** Before plan 11 R4 production push.

1. Generate a key pair (one-time):

   ```bash
   npx web-push generate-vapid-keys
   ```

2. Store:
   - **Public key** → client (`push-subscribe.js` or env injected at build)
   - **Private key** → server only (never in repo)

3. Wire service worker: `apps/pwa-webapp/sw.js`, `push-subscribe.js`.
4. Verify: `npm run verify:push-contract`
5. Reference: [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API/Using_the_Push_API) (cached: `.firecrawl/projects/web-push-mdn.md`).

---

### 3. WebAuthn app lock — PWA (plan 05 P7)

**When:** Before shipping P7 on production domain.

1. Set **RP ID** = production hostname (e.g. `app.example.com`).
2. Ensure **HTTPS** and correct `origin` in WebAuthn calls.
3. Test lock/unlock on desktop Chrome + mobile Safari.

---

## § Plan 04 — Logging & data capture

### L5 — Open Food Facts (barcode)

- **No API key.** HTTP GET to `https://world.openfoodfacts.org/api/v2/product/{barcode}`.
- SSRF allowlist: `openfoodfacts.org` only.
- Feature-flag barcode lookup in settings.

---

## § Plan 05 — Privacy & compliance

### P1 — Policy viewer

- Source markdown: `docs/privacy/*.md` (in repo; no external host required).
- If hosted separately later, use same static files on free static host (Cloudflare Pages free tier).

### P3 — Local-only gates

No external setup — toggles block Supabase sync, HF download, remote endpoints at network layer.

---

## § Plan 06 — Cloud sync

### D6 — Clinician read-only share link

1. Supabase **Edge Function** or signed URL pattern (free tier).
2. RLS: read-only policy for token-scoped rows; **no PHI in query strings**.
3. Time-limited tokens; security review before ship.

### D7 — User-owned cloud backup (deferrable)

- **MVP:** WebDAV URL + credentials (user-provided, free self-host).
- Google Drive / iCloud OAuth: **deferred** per [FREE-TIER-POLICY.md](./FREE-TIER-POLICY.md).

---

## § Plan 08 — On-device LLM

### Model files (no paid HF API)

- Download public GGUF/ONNX models to app cache or bundle tier manifests.
- No `HF_TOKEN` required for public model weights.
- **N11:** On-device parity only — **do not** expose user-configurable commercial LLM URL (free-tier policy).

---

## § Plan 10 — Home dashboard

### H5 — Weather & environment strip

**Provider:** [Open-Meteo](https://open-meteo.com/) — no API key.

Example forecast (lat/lon from opt-in geolocation, rounded to 2 decimals):

```
GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=pressure_msl,temperature_2m&hourly=pressure_msl
```

Air quality (opt-in):

```
GET https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&current=us_aqi
```

**UX:** Opt-in geolocation consent; store coarse coords only; attribution link in settings (CC BY 4.0).

**No server proxy required** (no secret to protect). Rate-limit client requests (e.g. 1/hour per device).

---

## § Plan 11 — Notifications

See **§ Global VAPID** above.

RN: `expo-notifications` — request permissions in Settings; document iOS delivery variance.

---

## § Plan 13 — Research pool

1. Run `supabase/Schema.sql` in SQL Editor (tables, `research_facets`, RLS, grants, RE1 RPCs — one file).
2. Enable Email auth in Supabase Dashboard if users must sign in before contributing.
4. k-anonymized aggregation runs client-side via RPC (`get_k_anon_pool_insights`, k≥5); no separate cron required for MVP.
5. Legal/privacy review before production copy (not a technical token step).

---

## § Plan 14 — Cross-cutting

### X14.5 — Crisis resources

- Maintain HTTPS crisis URLs in `privacy-region.js` / locale policy packs.
- No external API — static URLs only.

---

## § Plan 19 — Third-party connectors (CN4–CN7)

Operator guide: [docs/connectors/SETUP.md](../connectors/SETUP.md)

### Secrets (Supabase Edge only)

| Secret | Purpose |
|--------|---------|
| `CONNECTOR_TOKEN_SECRET` | AES-256-GCM key for OAuth tokens (32-byte base64) |
| `CONNECTOR_STATE_SECRET` | HMAC key for OAuth CSRF state |
| `STRAVA_CLIENT_ID` / `STRAVA_CLIENT_SECRET` | Strava developer app |
| `WITHINGS_CLIENT_ID` / `WITHINGS_CLIENT_SECRET` | Withings developer app |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth (Sheets API) |
| `CONNECTOR_SUCCESS_REDIRECT` | PWA: `https://<host>/connector-success.html`; RN: `rianell://connector/callback` |

### SQL

Apply migration `supabase/migrations/20260627100000_connectors_hardening.sql` (or fresh install `Schema-fresh-install.sql`).

### Deploy

```bash
supabase functions deploy connector-auth connector-callback connector-disconnect \
  connector-strava connector-withings connector-google-sheets
```

### Callback URLs (exact)

| Provider | Redirect URI |
|----------|--------------|
| Strava | `https://<project-ref>.supabase.co/functions/v1/connector-callback?provider=strava` |
| Withings | `https://<project-ref>.supabase.co/functions/v1/connector-callback?provider=withings` |
| Google Sheets | `https://<project-ref>.supabase.co/functions/v1/connector-callback?provider=google-sheets` |

---

## Environment variable summary

| Variable | Required for | Secret? |
|----------|--------------|---------|
| `SUPABASE_URL` | Sync, pool | No |
| `SUPABASE_ANON_KEY` | Sync, pool | Public (RLS protects) |
| `VAPID_PUBLIC_KEY` | Web push | No |
| `VAPID_PRIVATE_KEY` | Web push server | **Yes** |
| `WEBAUTHN_RP_ID` | PWA lock | No |

**Never in repo:** `service_role`, VAPID private key, OAuth refresh tokens.

---

## Agent workflow

When implementing a plan that needs external setup:

1. Complete relevant § above before manual smoke tests.
2. Add plan-specific notes to this file if steps differ from template.
3. Tick external steps in plan `plan.md` completion gates.
4. Record completion in CHANGELOG (no secrets).
