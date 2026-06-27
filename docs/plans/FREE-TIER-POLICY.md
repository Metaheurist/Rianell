# Free-tier policy — all plans

**Mandatory for every execution plan.** No paid third-party APIs, commercial API keys, or metered SaaS tokens in product code or default configuration.

**Verified:** 2026-06-18 via Firecrawl (`.firecrawl/projects/`)

---

## Rules

1. **On-device first** — LLM, STT, TTS, chart rendering, and deterministic AI run locally unless the user explicitly opts into a feature that requires network (and that feature must still use a free provider).
2. **No paid API keys in repo** — Gitleaks + CI must stay clean. Secrets for self-hosted infra (VAPID private key, Supabase publishable key) are env-only, never committed.
3. **Supabase free tier** — single dev/staging project for sync, share links, and anonymized pool. Stay within [Supabase free limits](https://supabase.com/pricing): 500 MB DB, 50k MAU, Edge Functions quota. Batch aggregation (RE1) daily, not per-request.
4. **Approved external providers** — use only providers in the table below. Adding a new provider requires updating this file + `EXTERNAL-SETUP.md`.
5. **Defer or stub** — if no free provider exists, defer the feature or ship a local-only stub (document in plan `scope.md`).

---

## Approved providers (free)

| Use case | Provider | Cost | Plans | Notes |
|----------|----------|------|-------|-------|
| Cloud DB + auth + RLS | [Supabase](https://supabase.com/pricing) free tier | $0 | 05, 06, 13 | Publishable key + RLS only; never `service_role` in clients |
| Weather + barometric pressure | [Open-Meteo](https://open-meteo.com/) | $0, no API key | 10 (H5) | `api.open-meteo.com/v1/forecast`; CC BY 4.0 attribution in settings |
| Air quality (AQI) | [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api) | $0, no API key | 10 (H5) | Same host; opt-in only |
| Barcode nutrition lookup | [Open Food Facts](https://world.openfoodfacts.org/data) | $0 | 04 (L5) | Allowlist `openfoodfacts.org` only; SSRF guard |
| On-device LLM | Hugging Face model files + Transformers.js / ONNX / GGUF | $0 download | 08 | Pin `@huggingface/transformers` 3.3.2; gated by P3 local-only |
| Web Push | VAPID (self-generated) | $0 | 11, 14 | Private key server-side only |
| Session recording (opt-in) | [Smartlook](https://www.smartlook.com/) free tier | $0 | All | EU region; off by default; consent-gated in Settings |
| User cloud backup | WebDAV (user's own server) | $0 to user | 06 (D7) | Google Drive / iCloud OAuth **deferred** |
| Strava activity import | [Strava API](https://developers.strava.com/) developer app | $0 dev tier | 19 (CN4) | OAuth; rate limits ~200/15min; manual sync only |
| Withings vitals import | [Withings Health API](https://developer.withings.com/) | $0 dev tier | 19 (CN5) | OAuth; batch fetch since last sync |
| Google Sheets sync | [Google Sheets API](https://developers.google.com/sheets/api) | $0 quota | 19 (CN6) | User-owned spreadsheet import+export; not Drive backup (D7) |

---

## Explicitly prohibited (default path)

| Item | Reason | Plan | Mitigation |
|------|--------|------|------------|
| Commercial LLM APIs (OpenAI, Anthropic, etc.) | Paid per token | 08 (N11) | **N11 restricted to on-device parity only**; no user-supplied paid endpoint in UI |
| Paid weather APIs (OpenWeather paid tier, etc.) | Cost + API key | 10 (H5) | Use Open-Meteo |
| Wearables / HealthKit / Fitbit | Xcode + Apple Developer; platform OAuth | 04 (L10), 08 (N8) | **Excluded (NR)** — not in scope |
| `service_role` Supabase key in client | Full DB bypass | 05, 06 | `verify-no-service-role-in-clients` |
| Third-party analytics / crash SDKs with paid tiers | Cost + PHI risk | All | Smartlook free tier allowed **only** with explicit opt-in + local-only block; no default tracking |

---

## Firecrawl verification cache

| Topic | Cache file |
|-------|------------|
| Supabase RLS | `.firecrawl/projects/supabase-rls.md` |
| Supabase free tier | `.firecrawl/projects/supabase-free-tier.json` |
| Open-Meteo (no key) | `.firecrawl/projects/open-meteo-weather.json` |
| Web Push (MDN) | `.firecrawl/projects/web-push-mdn.md` |
| Open Food Facts | `.firecrawl/projects/openfoodfacts.json` |
| OWASP MASVS | `.firecrawl/projects/owasp-masvs-health.json` |
| Transformers.js local | `.firecrawl/projects/transformers-js-local.json` |

Refresh before major dependency bumps:

```bash
firecrawl search "<topic>" --limit 3 --scrape -o .firecrawl/projects/<name>.json
```

---

## Per-plan compliance checklist

Before marking any plan `done`:

- [ ] No new paid API dependencies in `package.json` or runtime config
- [ ] External calls use approved providers only
- [ ] `EXTERNAL-SETUP.md` updated if new env vars or SQL required
- [ ] `security-performance.md` notes free-tier limits where relevant
