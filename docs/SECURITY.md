# Security model: web, React Native, Python server

## v1.53.0 credential hygiene (LLM upload + client config)

- **`supabase-config.js`** in git uses **placeholders only**; GitHub Actions injects `SUPABASE_URL` / `SUPABASE_ANON_KEY` on Pages deploy.
- **`verify-no-service-role-in-clients.mjs`** fails CI if tracked client files contain `sb_secret_*`, Postgres URLs with passwords, or hardcoded publishable keys.
- **LLM upload** uses **`SUPABASE_SERVICE_KEY`** from **`security/.env`** only — never commit service role or ONNX weight files. **`verify-no-model-weights-in-git`** CI gate allows only **`manifest.json`** + **`README.md`** under **`apps/pwa-webapp/models/`**; weights live on Supabase Storage (chunked).

This document describes how **Rianell** (this health app) handles health-related data across surfaces, operational defaults, and where to configure controls. It complements OWASP-style practice (see [OWASP Top 10:2025](https://owasp.org/Top10/2025/)).

## v1.134.0 DNS hygiene and AI crawler blocking

- **Dangling A records (Moderate):** External security scan (2026-06-22) found 4 DNS A records for `rianell.com` pointing to IPs that no longer respond to the hostname — subdomain takeover risk. Action: audit DNS A records in Cloudflare and remove any pointing to released IPs. See [cloudflare-headers-recommended.md → Dangling A records](../security/cloudflare-headers-recommended.md).
- **DMARC missing (Low):** No valid DMARC record at `_dmarc.rianell.com`. Add `v=DMARC1; p=quarantine; rua=mailto:security@rianell.com` TXT record. See [cloudflare-headers-recommended.md → DMARC](../security/cloudflare-headers-recommended.md).
- **AI crawler blocking:** Added `apps/pwa-webapp/robots.txt` declaring `Disallow: /` for 25+ AI training bots (GPTBot, Google-Extended, ClaudeBot, CCBot, Bytespider, etc.). Enable Cloudflare **Block AI bots** toggle for edge enforcement. See [cloudflare-headers-recommended.md → AI crawler blocking](../security/cloudflare-headers-recommended.md).

## v1.113.0 dependency and CVE review

- **`npm audit`** at release: **0** production vulnerabilities (Jun 2026).
- **Operator checklist:** If Apple or Azure OAuth is enabled on self-hosted Supabase Auth, confirm Auth **≥ 2.185.0** (CVE-2026-31813). Hosted Supabase projects: verify dashboard version.
- **Dev-only:** CVE-2025-11953 (Metro bundler RCE) affects React Native CLI tooling, not shipped app bundles; keep CLI updated on developer machines.
- **Patched in tree:** `@supabase/auth-js` 2.108.2 (CVE-2025-48370); `protobufjs` 7.6.4 (CVE-2026-41242). React Server Components / React2Shell (CVE-2025-55182) not applicable (no RSC).
- **Residual app-layer risks** (tracked, not closed in v1.113.0): plaintext `user_keys` in Supabase, CSP `unsafe-inline`/`unsafe-eval`, prefer `getUser()` over `getSession()` for auth decisions, dev-server encryption-key API, SecureStorage fail-open paths, anon `bug_reports` INSERT policy.

## v1.44.2 documentation sync

- App settings cloud backup now includes additional local setting keys beyond `rianellSettings`; treat those synced preferences as user data and cover them in your data handling/privacy review.

**README entry points:** [Security](../README.md#security) (overview) and [Security notes](../README.md#security-notes) (commit/deploy checklist). This file is the **detailed** reference.

## Related documentation

| Topic | Location |
|-------|----------|
| **Privacy program index** | [privacy/global-baseline.md](privacy/global-baseline.md) — [eu-gdpr.md](privacy/eu-gdpr.md), [dpia-health-sync.md](privacy/dpia-health-sync.md), [data-subject-rights.md](privacy/data-subject-rights.md), [subprocessors.md](privacy/subprocessors.md), [other-jurisdictions.md](privacy/other-jurisdictions.md), [ropa.json](privacy/ropa.json), [region-policy-execution-plan.md](privacy/region-policy-execution-plan.md) |
| Threat model | [threat-model.md](threat-model.md) |
| AI security | [ai-security.md](ai-security.md) |
| Incident response | [incident-response.md](incident-response.md) |
| Crypto roadmap | [crypto-roadmap.md](crypto-roadmap.md) |
| Key rotation (operators) | [../security/rotation-runbook.md](../security/rotation-runbook.md) |
| Security inventory (generated) | [security-inventory.md](security-inventory.md) — `npm run docs:security-inventory` |
| Environment variables | [security/.env.example](../security/.env.example), [Configuration](testing-and-configuration.md#nav-configuration), [Local secrets directory](#local-secrets-directory-security) below |
| Supabase schema (SQL) | [../supabase/Schema.sql](../supabase/Schema.sql) |
| Android network / cleartext (RN native builds) | [Android: cleartext and mixed content](#android-cleartext-and-mixed-content) below |
| Automated audits (CI) | Reusable [../.github/workflows/security-audit.yml](../.github/workflows/security-audit.yml) — **Security & supply-chain checks** job in [../.github/workflows/ci.yml](../.github/workflows/ci.yml). See [CI security matrix](#dependency-and-ci-scanning) below. Optional **manual** run: **Actions → Reusable security audits → Run workflow**. |
| Web CSP (meta tag) | [../apps/pwa-webapp/index.html](../apps/pwa-webapp/index.html), [edge header note](../security/cloudflare-headers-recommended.md) |

## Server logs

Log files under **`logs/`** may contain client IPs, sync metadata, and dashboard activity. They are intended for **local debugging**. Do not ship log files with identifiable health content; delete or redact before sharing machine access. The Python server uses a **rotating** file handler (size-capped with backups) so a single log file cannot grow without bound.

### Tk "Server Tinker" dashboard notes

- The Tk dashboard (`server/dashboard_ui.py`, launched from `server/main.py`) is a **local operator UI** for development/admin actions. It does not add remote network endpoints by itself.
- **Layout:** sidebar navigation in landscape; bottom tab bar in portrait/narrow windows (Overview · Data · Tools · Logs).
- The "Database Viewer" supports multi-row selection (`Treeview` extended mode). Selection is local UI state only; destructive actions still require explicit button actions and confirmation dialogs.
- **Supabase DNS:** startup warns when `SUPABASE_URL` host does not resolve; connection test surfaces actionable text instead of a raw traceback.
- Colored log rendering in the Tk pane is display-only (line/tag styling); it does not alter the underlying file log content or retention policy.

## Local secrets directory (`security/`)

- **`security/.env`** - preferred location for `PORT`, `HOST`, Supabase keys, and optional `ENCRYPTION_KEY`. Copy from **`security/.env.example`**. If this file is missing, the server still loads a **legacy** `.env` at the repository root (for existing checkouts).
- **`security/.encryption_key`** - preferred single-line encryption key file (gitignored). The server also checks the repo root for legacy `.encryption_key` / `encryption.key`, then may **create** `security/.encryption_key` automatically.

## Surfaces

| Surface | Data at risk | Primary controls |
|--------|----------------|------------------|
| **Web (PWA)** | `localStorage` / IndexedDB on the device | Browser same-origin policy, CSP ([../apps/pwa-webapp/index.html](../apps/pwa-webapp/index.html)), Supabase **RLS** ([../supabase/Schema.sql](../supabase/Schema.sql)) |
| **React Native (Expo)** | AsyncStorage (logs); **Supabase auth session in `expo-secure-store`** (v1.50.0) | `@supabase/supabase-js` with publishable key + **RLS**; bug reports via Supabase insert; RN CLI Android/iOS builds |
| **Python server** | LAN exposure, optional proxy to Supabase | Bind address ([../server/config.py](../server/config.py)), gated sensitive APIs, no TLS on dev server |

## Python server: bind address and threat model

- **Default `HOST`** is `127.0.0.1`: the HTTP server listens only on the loopback interface. Other machines on the LAN **cannot** connect unless you change this.
- To allow phones or other devices on the same network to open the app, set **`HOST=0.0.0.0`** in **`security/.env`** (or legacy root `.env`) so the server listens on all interfaces. That increases exposure: treat the network as a trust boundary or run behind a firewall.
- **Do not** expose the dev Python server directly to the internet without a reverse proxy, TLS, and authentication.

## Sensitive HTTP APIs (encryption key and anonymized training data)

These routes are intended for **local development** with the browser on the same machine:

- `GET /api/encryption-key` - returns the AES key material used for anonymised payload encryption when the Python server is in use.
- `GET /api/anonymized-data` - returns aggregated training-style data from Supabase via the server.

**Rules:**

1. Requests are allowed only from **loopback** addresses (`127.0.0.1`, `::1`), unless you explicitly set **`HEALTH_APP_SENSITIVE_APIS_ON_LAN=1`** in the environment. **When LAN mode is on, `HEALTH_APP_SENSITIVE_APIS_LAN_SECRET` is required** — the server refuses to start without it, and non-loopback clients must send header **`X-Rianell-LAN-Secret`** matching that value. **`POST /api/bug-report`** follows the same loopback/LAN+secret rules.
2. Use **`ENCRYPTION_KEY`** in **`security/.env`** or a **`.encryption_key`** file under **`security/`** for a stable, operator-controlled key; otherwise the server may **create** `security/.encryption_key` automatically on first use (see [security/.env.example](../security/.env.example)).
3. If **`security/.env`** is missing but a **legacy `.env`** at the repository root exists, the server loads it and logs a **warning** to prefer **`security/.env`**.

## Encryption key lifecycle

- Prefer **`ENCRYPTION_KEY`** in **`security/.env`** or a single-line **`security/.encryption_key`** (see [Local secrets directory](#local-secrets-directory-security) above). Legacy paths at the repo root are still supported.
- If neither env nor key file is present, the server **creates** **`security/.encryption_key`** with a random 32-byte hex value on first use. **Back up this file** if you need stable decryption across machines.
- The web client ([../apps/pwa-webapp/encryption-utils.js](../apps/pwa-webapp/encryption-utils.js)) syncs the key from the server when available; if the app runs without the Python server (e.g. GitHub Pages), it uses a **per-browser** random key stored in `localStorage` (not a shared global default string).
- **Encryption fail-closed:** `encryptAnonymizedData` and `encryptForStorage` **throw** on failure instead of uploading/storing plaintext JSON.

## Cloud backup keys (`user_keys` table)

Authenticated cloud sync stores a per-user AES key in Supabase **`user_keys.encryption_key`** as **plaintext hex** (client-generated). Blobs in **`health_data`** are encrypted with that key, but anyone with DB read access or overly permissive RLS can decrypt backups. **Future hardening:** client-derived keys (passphrase + KDF) or Supabase Vault — not yet implemented. RLS policies in [../supabase/Schema.sql](../supabase/Schema.sql) restrict rows to **`auth.uid() = user_id`**.

## Bug reports

- **PWA (static host):** inserts into **`bug_reports`** via Supabase anon/authenticated client when configured (`submitBugReportToSupabase` in [../apps/pwa-webapp/cloud-sync.js](../apps/pwa-webapp/cloud-sync.js)).
- **PWA (dev server):** `POST /api/bug-report` on loopback (or LAN+secret) uses the service role.
- **React Native:** [../apps/rn-app/src/utils/submitBugReport.ts](../apps/rn-app/src/utils/submitBugReport.ts) — same Supabase insert; requires `EXPO_PUBLIC_SUPABASE_*` at build time.
- RLS: **insert-only** for `anon`/`authenticated`; no public SELECT on reports.

## Supabase and Row Level Security (RLS)

The anon key is present in client bundles by design. **Authorization must be enforced in Supabase** with RLS and least-privilege policies. **Shipped schema:** [../supabase/Schema.sql](../supabase/Schema.sql) enables RLS on `anonymized_data`, `health_data`, `user_keys`, `user_privacy_profile`, `user_achievements`, and `bug_reports`. On login, **`user_privacy_profile` overwrites local privacy region** (see [privacy/region-policy-execution-plan.md](privacy/region-policy-execution-plan.md)).

### GraphQL schema exposure (Security Advisor lints 0026 / 0027)

Supabase ships the `pg_graphql` extension. When `anon` or `authenticated` hold `SELECT` on a table, `/graphql/v1` introspection exposes table and column names even if RLS returns zero rows. This app uses **PostgREST only** (supabase-js), not GraphQL.

To clear `pg_graphql_anon_table_exposed` and `pg_graphql_authenticated_table_exposed` on `anonymized_data`, `health_data`, `user_keys`, and `bug_reports`, run [../supabase/Schema.sql](../supabase/Schema.sql) in the SQL Editor (§3 drops `pg_graphql`, revokes `anon` access, and re-applies least-privilege grants). Re-run **Security Advisor** afterward to confirm the warnings are gone.

### Pool insight RPCs (Plan 13 RE1; Security Advisor lints 0028 / 0029)

Plan 13 k-anonymous pool insights use two **`SECURITY DEFINER`** functions in `public`: `get_k_anon_pool_insights` and `count_pool_contribution_days`. They aggregate **`research_facets`** across opted-in contributors (k≥5 suppression); they never decrypt `anonymized_log` blobs or return per-user rows.

| Control | Implementation |
|---------|----------------|
| **Why SECURITY DEFINER** | Cross-user cohort aggregation; per-user RLS would block reads under `SECURITY INVOKER`. |
| **`search_path`** | `SET search_path = public` on both functions. |
| **`anon`** | `REVOKE EXECUTE` — pool RPCs are **not** callable without sign-in (clears lint **0028**). |
| **`authenticated`** | `GRANT EXECUTE` on **`public.*` INVOKER wrappers** only — PostgREST calls the same RPC names; elevated work runs in **`private.*_impl`** (DEFINER, not exposed to REST). Clears lint **0029** on `public`. |
| **Client gates** | Research pool opt-in, medical condition set, 90-day contribution gate before RPC. |

Re-apply [../supabase/Schema.sql](../supabase/Schema.sql) §4 after schema changes; see [../supabase/APPLY.md](../supabase/APPLY.md).

## Data classification (v1.50.0)

| Class | Examples | Storage | Encryption | Retention |
|-------|----------|---------|------------|-----------|
| **Local health logs** | Daily metrics, notes, food/exercise | PWA `localStorage` / IDB; RN AsyncStorage | None at rest (device OS lock) | Until user clears |
| **Cloud backup** | Encrypted log blobs | Supabase `health_data` + key in `user_keys` | AES-GCM (client) | Until user deletes cloud data |
| **Anonymised contribution** | Pseudonymous encrypted payloads | Supabase `anonymized_data` | AES-GCM (client) | Until erasure request |
| **Auth session** | JWT / refresh tokens | PWA browser storage; RN **`expo-secure-store`** | OS secure enclave / Keychain | Until sign-out |
| **App settings sync** | Goals, preferences (non-health) | Supabase `health_data` settings blob | Same as backup key | With cloud account |
| **Bug reports** | Summary, console snapshot | Supabase `bug_reports` | TLS in transit | Until user cloud erasure |
| **Server logs** | IPs, sync metadata | Local `logs/` (dev server) | N/A | Rotating files |

Unified **Delete cloud data** removes user-linked rows from `health_data`, `user_keys`, `user_privacy_profile`, `user_achievements`, `anonymized_data`, and `bug_reports`. Achievement payloads contain notification timestamps only (non-PHI). See [data-model.md](data-model.md) and [privacy/data-subject-rights.md](privacy/data-subject-rights.md).

### React Native: Supabase auth in SecureStore (v1.50.0)

Since v1.50.0, **`apps/rn-app/src/cloud/secureStorageAdapter.ts`** persists Supabase auth tokens via **`expo-secure-store`** (Keychain / EncryptedSharedPreferences), not AsyncStorage. Health logs remain in AsyncStorage (plaintext at rest). Android builds set **`allowBackup: false`** in `app.json` to reduce token export via OS backup. See [react-native-setup.md](react-native-setup.md).

## Content Security Policy (CSP) and XSS

- The app CSP allows `'unsafe-inline'` and `'unsafe-eval'` for compatibility with inline bootstraps and ML libraries. Tightening this is a **tracked hardening goal**; removing `unsafe-eval` may require bundling or loading changes.
- **Nonce migration roadmap (v1.94+):** Phase 1 ships SRI on all pinned jsDelivr assets and `/.well-known/security.txt`. A future release will add CSP **nonces** for inline boot scripts, deploy **report-only** CSP at Cloudflare to collect violations, then remove `'unsafe-inline'` from `script-src` once violation rate is zero. Do not enforce nonce-only CSP until ML bootstrap paths are bundled or nonce-injected at build time.
- The meta policy also includes `'wasm-unsafe-eval'` and `worker-src` for blob/CDN workers (TensorFlow.js). If you add a **second** CSP via **HTTP headers** (e.g. Cloudflare “Content Security Policy”), browsers apply **both** policies: every directive must allow what the app needs, or Chrome will report **eval blocked** / **script-src blocked** even when the meta tag looks correct. **Operators:** do not set a **narrower** HTTP CSP than the meta tag; remove the duplicate header or align it fully — see [../security/cloudflare-headers-recommended.md](../security/cloudflare-headers-recommended.md). Set **`frame-ancestors 'self'`** via HTTP only (not meta).
- Prefer `textContent` / `createElement` over `innerHTML` where user-influenced strings are inserted.
- Client code uses **`escapeHTML()`** / **`sanitizeHTML()`** for many user-derived strings (e.g. log entries, AI anomaly lines). New UI that builds HTML from user input should use the same helpers-avoid raw **`innerHTML`** with unescaped strings.

### `connect-src` and third-party hosts

The meta CSP in [`apps/pwa-webapp/index.html`](../apps/pwa-webapp/index.html) **`connect-src`** includes Supabase (`*.supabase.co`), **jsDelivr**, **Hugging Face** (`huggingface.co`, `*.huggingface.co`, Xet bridge hosts, and regional `*.aws.cdn.hf.co` for ONNX weight downloads), **Open-Meteo** (`api.open-meteo.com`, `air-quality-api.open-meteo.com` for opt-in home weather), **Open Food Facts** (`world.openfoodfacts.org` for barcode food lookup), **Smartlook** (`web-sdk.smartlook.com`, `*.smartlook.com`, `*.smartlook.cloud` for opt-in session recording — also required in **`script-src`**), and PayPal when donations are enabled. If you **tighten CSP** or add **HTTP headers**, every required origin must remain allowed.

### Subresource Integrity (SRI)

Pinned CDN assets use SRI + `crossorigin="anonymous"`:

| Asset | Location |
|-------|----------|
| **ua-parser-js** | `index.html` `<script>` tag |
| **Font Awesome CSS** | `index.html` deferred `<link>` loader |
| **@supabase/supabase-js UMD** | `performance-utils.js` `ensureSupabaseLoaded()` |

Manifest: [`apps/pwa-webapp/cdn-manifest.json`](../apps/pwa-webapp/cdn-manifest.json). CI gate: `node scripts/verify/verify-sri-integrity.mjs` (unit-tests job). Dynamic imports (Transformers.js, ONNX weights) cannot use SRI — pin versions and monitor supply chain. When upgrading CDN packages, recompute hashes (`openssl dgst -sha384 -binary <file> | openssl base64 -A` prefixed with `sha384-`) and update manifest + loaders.

Responsible disclosure: [`apps/pwa-webapp/.well-known/security.txt`](../apps/pwa-webapp/.well-known/security.txt) ships with the PWA.

## Known residual risks and mitigations

These are **accepted or environmental** limitations called out so operators and reviewers can assess exposure.

| Risk | Mitigation / notes |
|------|---------------------|
| **CSP** allows `'unsafe-inline'` and `'unsafe-eval'` | Required for current bootstraps and ML stacks; treat XSS as high impact-avoid reflecting unsanitised user input into HTML/JS; prefer `textContent` and structured DOM. |
| **Third-party script and model loads** (e.g. CDNs for Transformers.js, model weights from Hugging Face) | Supply-chain and availability depend on those hosts; use Subresource Integrity where applicable for fixed scripts, pin dependency versions in CI, and monitor `npm audit`. |
| **No app-level encryption of health logs in browser storage** | Mitigate with device lock, OS updates, and org policy; see [Client-side storage](#client-side-storage-and-privacy). |
| **Python dev server without TLS** | Use only on loopback or a trusted LAN; never expose raw to the internet. |
| **GitHub Actions / static deploy secrets** | Production Supabase URL and anon key are injected at deploy from repository secrets; do not commit real secrets to the repo. |

## Android: cleartext and mixed content (React Native)

Primary Android builds come from **React Native CLI / Expo prebuild** (`apps/rn-app`). The native project under **`apps/rn-app/android/`** (after `npx expo prebuild`) should follow standard Android network security practice.

### Mixed content

The RN app loads remote HTTPS APIs (Supabase) and local bundled assets. Do **not** enable mixed HTTP subresources on HTTPS origins in production WebViews or embedded browsers.

### Cleartext traffic

Do **not** rely on **`android:usesCleartextTraffic="true"`** on `<application>` for production. Prefer **`network_security_config.xml`**: default **cleartext off**; optional **domain-scoped** cleartext for dev hosts only (e.g. `localhost`, `10.0.2.2`).

### Android release checklist

On each **release** build (or before tagging):

- Confirm **`usesCleartextTraffic`** is not set to **`true`** on `<application>` in `AndroidManifest.xml`.
- Confirm **`network_security_config.xml`** matches your policy (no accidental wide cleartext).
- Review **`android:exported`** on activities / providers / receivers (only what deep links require).
- Keep Supabase and API calls on **HTTPS** only in production builds.

> **Historical note:** Legacy Capacitor WebView builds were removed in v1.49.0. Old Capacitor-specific patch scripts and config paths no longer apply.

## Dependency and CI scanning

- **Reusable workflow (no duplicate runs):** [../.github/workflows/security-audit.yml](../.github/workflows/security-audit.yml) is **only** invoked from CI’s **`security-audit`** job (not a second workflow run on every push).

### v1.68.1 Gitleaks i18n allowlist

- **`.gitleaks.toml`:** Allowlists `scripts/lib/tier-a-exact-overrides.mjs` and `i18n-packs/` trees so translated UI strings containing “password” / “mot de passe” do not false-positive as `generic-api-key`.

### CI security matrix (v1.50.0 expanded)

| Step | Blocking | Notes |
|------|----------|-------|
| **Gitleaks** (working tree) | Yes | Secret scan; `.gitleaks.toml` allowlists |
| **Gitleaks history** | No | Scheduled / manual only; cleanup signal |
| **`verify-no-service-role-in-clients.mjs`** | Yes | Client bundles must not embed service_role |
| **`verify-rls-baseline.mjs`** | Yes | RLS SQL doc baseline intact |
| **`verify-privacy-docs.mjs`** | Yes | Privacy program docs + `ropa.json` |
| **`verify-csp-connect-src.mjs`** | Yes | CSP `connect-src` vs app needs |
| **`generate-security-inventory.mjs`** | PR only | Drift check on [security-inventory.md](security-inventory.md) |
| **`npm audit --omit=dev`** | Yes | High+ production npm vulnerabilities |
| **OSV-Scanner** | Yes | `package-lock.json` + `requirements.txt`; SARIF → GitHub Security |
| **CycloneDX SBOM** | No | `sbom.cdx.json` workflow artifact |
| **`pip-audit`** | Yes | Python deps |
| **Snyk** (optional) | No | When `SNYK_TOKEN` secret set |

Local equivalents: `npm run verify:privacy-docs`, `npm run verify:csp`, `npm run docs:security-inventory`. Security unit tests: `tests/unit/security/`.

- **Production dependency tree:** Root [../package.json](../package.json) uses **`overrides`** to pin patched versions of high-impact transitive packages (e.g. **`tar`**, **`handlebars`**, **`minimatch`** / **`brace-expansion`**, **`shell-quote`**, **`postcss`**, **`ws`**, **`uuid`**, **`basic-ftp`**, **`ip-address`**, **`tmp`**, **`@xmldom/xmldom@0.8.13`** on **`@expo/plist`**, **`plist`**, **`@trapezedev/project`**, **`mergexml`** (LTS line — **0.9.x** breaks Expo **`prebuild`** because **`@expo/plist`** omits **`mimeType`** on **`parseFromString`**). **`http-proxy-agent@5.0.0`** is overridden to **`7.0.2`** so **`jest-environment-jsdom`** → **`jsdom@20`** no longer pulls **`@tootallnate/once@2`** via the old v5 agent (Dependabot low-severity **GHSA-vpq2-c234-7xj6**). **`@tootallnate/once`** is also pinned to **`^3.0.1`**. **`@rianell/benchmark-runner → lighthouse → @sentry/node`** is overridden to **10.58.0** so dev-only Lighthouse telemetry resolves **`@opentelemetry/core@2.8.0`** (OSV **GHSA-8988-4f7v-96qf**). `npm ls` may show **`invalid`** next to **`http-proxy-agent`** under **`jsdom`** because **`jsdom`** still declares **`^5.0.0`** in its manifest; the installed v7 agent is API-compatible for Jest’s test environment and **`npm run test:mobile`** is the regression check. **`npm audit --omit=dev`** and a **full** **`npm audit`** are expected to report **no** vulnerabilities with the current lockfile—re-run after lockfile changes and triage any new **Dependabot** alerts. **Python:** **`requirements.txt`** floors include **`cryptography>=48.0.1`** (OSV **GHSA-537c-gmf6-5ccf**) and **`python-dotenv>=1.2.2`** for **OSV-Scanner** / **`pip-audit`**.
- **CI reference:** The **`security-audit`** job in [../.github/workflows/ci.yml](../.github/workflows/ci.yml) gates downstream mobile bundle jobs. Failures should be triaged like Dependabot alerts. Branch protection should require the **CI** workflow (or the **`Security & supply-chain checks`** job), not a separate duplicate workflow name.
- **CI caching (v1.89.2):** npm, pip, Playwright, and security-tool binaries are restored from GitHub Actions cache when lockfiles are unchanged — see [testing-and-configuration.md](testing-and-configuration.md) § CI dependency caching.

## Client-side storage and privacy

Health logs in the browser live in **`localStorage`** (and optionally IndexedDB) without an app-level passphrase. Anyone with **device access** or **malware on the device** may read that data. The in-app GDPR/consent flows describe cloud contribution; they do not replace **device security** (screen lock, OS updates) or organisational policies for regulated health data.

## Future hardening (not implemented)

- **App-level passphrase** or OS keystore integration for encrypting local logs at rest (major UX and engineering).
- **TLS for the Python dev server** (optional): prefer a reverse proxy (Caddy, nginx) or document `stunnel` for LAN HTTPS; do not expose the raw HTTP server to the internet.

## Contact and reporting

**General questions** about this security model or the project: **jan.andersson@rianell.com** (also LinkedIn: [Johan (typicaljohan)](https://www.linkedin.com/in/typicaljohan/)).

**Security vulnerabilities and incidents:** do **not** open a public GitHub issue for an undisclosed vulnerability. Contact **jan.andersson@rianell.com** privately so details can be triaged before public disclosure. See [incident-response.md](incident-response.md) for operator playbooks.
