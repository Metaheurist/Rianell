# Security model: web, Android (Capacitor), Python server

This document describes how **Rianell** (this health app) handles health-related data across surfaces, operational defaults, and where to configure controls. It complements OWASP-style practice (see [OWASP Top 10:2025](https://owasp.org/Top10/2025/)).

## v1.44.2 documentation sync

- App settings cloud backup now includes additional local setting keys beyond `rianellSettings`; treat those synced preferences as user data and cover them in your data handling/privacy review.

**README entry points:** [Security](../README.md#security) (overview) and [Security notes](../README.md#security-notes) (commit/deploy checklist). This file is the **detailed** reference.

## Related documentation

| Topic | Location |
|-------|----------|
| Environment variables | [security/.env.example](../security/.env.example), [Configuration](testing-and-configuration.md#nav-configuration), [Local secrets directory](#local-secrets-directory-security) below |
| Supabase RLS examples (SQL) | [supabase-rls-recommended.sql](supabase-rls-recommended.sql) |
| Android network / cleartext after `cap sync` | [Android: cleartext and mixed content](#android-cleartext-and-mixed-content) below |
| Automated audits (CI) | [../.github/workflows/ci.yml](../.github/workflows/ci.yml) (`security-audit` job) |
| Web CSP (meta tag) | [../web/index.html](../web/index.html) |

## Server logs

Log files under **`logs/`** may contain client IPs, sync metadata, and dashboard activity. They are intended for **local debugging**. Do not ship log files with identifiable health content; delete or redact before sharing machine access. The Python server uses a **rotating** file handler (size-capped with backups) so a single log file cannot grow without bound.

### Tk "Server Tinker" dashboard notes

- The Tk dashboard (`server/main.py`) is a **local operator UI** for development/admin actions. It does not add remote network endpoints by itself.
- The "Database Viewer" supports multi-row selection (`Treeview` extended mode). Selection is local UI state only; destructive actions still require explicit button actions and confirmation dialogs.
- Colored log rendering in the Tk pane is display-only (line/tag styling); it does not alter the underlying file log content or retention policy.

## Local secrets directory (`security/`)

- **`security/.env`** - preferred location for `PORT`, `HOST`, Supabase keys, and optional `ENCRYPTION_KEY`. Copy from **`security/.env.example`**. If this file is missing, the server still loads a **legacy** `.env` at the repository root (for existing checkouts).
- **`security/.encryption_key`** - preferred single-line encryption key file (gitignored). The server also checks the repo root for legacy `.encryption_key` / `encryption.key`, then may **create** `security/.encryption_key` automatically.

## Surfaces

| Surface | Data at risk | Primary controls |
|--------|----------------|------------------|
| **Web (PWA)** | `localStorage` / IndexedDB on the device | Browser same-origin policy, CSP ([../web/index.html](../web/index.html)), optional Supabase **RLS** |
| **Android (Capacitor)** | Same web assets in WebView + device storage | [../react-app/capacitor.config.ts](../react-app/capacitor.config.ts), Android manifest (after `cap sync`), [network security](#android-cleartext-and-mixed-content), user device security |
| **iOS (Capacitor)** | Same web assets in WKWebView + device storage | App Transport Security (HTTPS for remote content by default), Capacitor config, follow Apple signing and distribution guidelines |
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

1. Requests are allowed only from **loopback** addresses (`127.0.0.1`, `::1`), unless you explicitly set **`HEALTH_APP_SENSITIVE_APIS_ON_LAN=1`** in the environment. **Never enable this on untrusted or public Wi‑Fi**; it exposes key and training-style data to anyone who can reach your machine on the LAN. The server logs a **warning at startup** when LAN mode is on. Optional **`HEALTH_APP_SENSITIVE_APIS_LAN_SECRET`**: when set, non-loopback clients must send header **`X-Rianell-LAN-Secret`** matching that value (defense in depth for LAN testing).
2. Use **`ENCRYPTION_KEY`** in **`security/.env`** or a **`.encryption_key`** file under **`security/`** for a stable, operator-controlled key; otherwise the server may **create** `security/.encryption_key` automatically on first use (see [security/.env.example](../security/.env.example)).
3. If **`security/.env`** is missing but a **legacy `.env`** at the repository root exists, the server loads it and logs a **warning** to prefer **`security/.env`**.

## Encryption key lifecycle

- Prefer **`ENCRYPTION_KEY`** in **`security/.env`** or a single-line **`security/.encryption_key`** (see [Local secrets directory](#local-secrets-directory-security) above). Legacy paths at the repo root are still supported.
- If neither env nor key file is present, the server **creates** **`security/.encryption_key`** with a random 32-byte hex value on first use. **Back up this file** if you need stable decryption across machines.
- The web client ([../web/encryption-utils.js](../web/encryption-utils.js)) syncs the key from the server when available; if the app runs without the Python server (e.g. GitHub Pages), it uses a **per-browser** random key stored in `localStorage` (not a shared global default string).

## Supabase and Row Level Security (RLS)

The anon key is present in client bundles by design. **Authorization must be enforced in Supabase** with RLS and least-privilege policies. Recommended starting points are in [supabase-rls-recommended.sql](supabase-rls-recommended.sql). Apply and adjust to your schema in the Supabase SQL editor. **Operational check:** in the Supabase dashboard, confirm **RLS is enabled** on tables that hold user data and that policies match your deployment (the repo SQL is a starting point, not a substitute for verifying the live project). CI runs [`scripts/verify-rls-baseline.mjs`](../scripts/verify-rls-baseline.mjs) to ensure the recommended SQL doc is not gutted; it does **not** connect to your project.

## Content Security Policy (CSP) and XSS

- The app CSP allows `'unsafe-inline'` and `'unsafe-eval'` for compatibility with inline bootstraps and ML libraries. Tightening this is a **tracked hardening goal**; removing `unsafe-eval` may require bundling or loading changes.
- The meta policy also includes `'wasm-unsafe-eval'` and `worker-src` for blob/CDN workers (TensorFlow.js). If you add a **second** CSP via **HTTP headers** (e.g. Cloudflare “Content Security Policy”), browsers apply **both** policies: every directive must allow what the app needs, or Chrome will report **eval blocked** / **script-src blocked** even when the meta tag looks correct.
- Prefer `textContent` / `createElement` over `innerHTML` where user-influenced strings are inserted.
- Client code uses **`escapeHTML()`** / **`sanitizeHTML()`** for many user-derived strings (e.g. log entries, AI anomaly lines). New UI that builds HTML from user input should use the same helpers-avoid raw **`innerHTML`** with unescaped strings.

### `connect-src` and third-party hosts

The meta CSP in [`web/index.html`](../web/index.html) **`connect-src`** includes Supabase (`*.supabase.co`), **jsDelivr**, **Hugging Face** (`huggingface.co`, `*.huggingface.co`, Xet bridge hosts for models), and PayPal when donations are enabled. If you **tighten CSP** or add **HTTP headers**, every required origin must remain allowed. The **Supabase** script tag is **pinned** to a specific version with **Subresource Integrity (SRI)**; when upgrading `@supabase/supabase-js`, update **`src`**, **`integrity`**, and the comment in `index.html`.

## Known residual risks and mitigations

These are **accepted or environmental** limitations called out so operators and reviewers can assess exposure.

| Risk | Mitigation / notes |
|------|---------------------|
| **CSP** allows `'unsafe-inline'` and `'unsafe-eval'` | Required for current bootstraps and ML stacks; treat XSS as high impact-avoid reflecting unsanitized user input into HTML/JS; prefer `textContent` and structured DOM. |
| **Third-party script and model loads** (e.g. CDNs for Transformers.js, model weights from Hugging Face) | Supply-chain and availability depend on those hosts; use Subresource Integrity where applicable for fixed scripts, pin dependency versions in CI, and monitor `npm audit`. |
| **No app-level encryption of health logs in browser storage** | Mitigate with device lock, OS updates, and org policy; see [Client-side storage](#client-side-storage-and-privacy). |
| **Python dev server without TLS** | Use only on loopback or a trusted LAN; never expose raw to the internet. |
| **GitHub Actions / static deploy secrets** | Production Supabase URL and anon key are injected at deploy from repository secrets; do not commit real secrets to the repo. |

## Android: cleartext and mixed content

The Capacitor Android project lives under **`react-app/android/`** after `npx cap add android` and `npx cap sync`.

### Mixed content

[`react-app/capacitor.config.ts`](../react-app/capacitor.config.ts) sets **`allowMixedContent: false`** so the WebView does not load HTTP subresources on an HTTPS app origin.

### Cleartext traffic

Do **not** rely on **`android:usesCleartextTraffic="true"`** on `<application>` for production. Prefer **`network_security_config.xml`**: default **cleartext off**; optional **domain-scoped** cleartext for dev hosts only.

After **`npx cap sync android`**, run **`node react-app/patch-android-sdk.js`** (CI does this after sync). The script:

- Writes **`android/app/src/main/res/xml/network_security_config.xml`** (cleartext disabled in `<base-config>`, with a **commented** example `<domain-config>` for `localhost` / `10.0.2.2` if you need HTTP during local dev).
- Adds **`android:networkSecurityConfig="@xml/network_security_config"`** to `<application>`.
- Removes **`android:usesCleartextTraffic="true"`** if Capacitor or tooling added it.

To allow HTTP to a **specific** dev host, uncomment or extend the `<domain-config>` block in that XML (see [Android network security config](https://developer.android.com/privacy-and-security/security-ssl#ConfigCleartext)).

### Android release checklist

On each **release** build (or before tagging):

- Confirm **`usesCleartextTraffic`** is not set to **`true`** on `<application>` (patch script removes it; verify in `AndroidManifest.xml`).
- Confirm **`network_security_config.xml`** matches your policy (no accidental uncommented wide cleartext).
- Review **`android:exported`** on activities / providers / receivers (Capacitor defaults; only launcher/main should be exported as needed for deep links).
- Keep **`allowMixedContent: false`** in `capacitor.config.ts` unless you have a documented exception.

**Process:** after **`npx cap sync android`**, run **`node react-app/patch-android-sdk.js`** (CI does this on automated builds). See [Local setup (optional)](setup-and-usage.md#local-setup-optional) for the command sequence.

## Dependency and CI scanning

- GitHub Actions workflow [../.github/workflows/ci.yml](../.github/workflows/ci.yml) (`security-audit` job) runs **[Gitleaks](https://github.com/gitleaks/gitleaks)** on the **checked-out working tree** (with `--no-git` so the scan does not walk full git history), **`npm audit`** (root + react-app), and **`pip-audit`** on `requirements.txt`. Configuration: [`.gitleaks.toml`](../.gitleaks.toml) (path allowlists for templates, `node_modules`, local-only `security/.env`, and build dirs). Failures should be triaged like Dependabot alerts.

## Client-side storage and privacy

Health logs in the browser live in **`localStorage`** (and optionally IndexedDB) without an app-level passphrase. Anyone with **device access** or **malware on the device** may read that data. The in-app GDPR/consent flows describe cloud contribution; they do not replace **device security** (screen lock, OS updates) or organisational policies for regulated health data.

## Future hardening (not implemented)

- **App-level passphrase** or OS keystore integration for encrypting local logs at rest (major UX and engineering).
- **TLS for the Python dev server** (optional): prefer a reverse proxy (Caddy, nginx) or document `stunnel` for LAN HTTPS; do not expose the raw HTTP server to the internet.

## Contact and reporting

**General questions** about this security model or the project: reach out on LinkedIn: [Johan (typicaljohan)](https://www.linkedin.com/in/typicaljohan/).

**Security vulnerabilities:** do **not** open a public GitHub issue for an undisclosed vulnerability. Contact the maintainer **privately** (e.g. via LinkedIn with a clear subject line, or another channel you already use with the maintainer) so details can be triaged before any public disclosure.
