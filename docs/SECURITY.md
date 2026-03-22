# Security model: web, Android (Capacitor), Python server

This document describes how the Health App handles health-related data across surfaces, operational defaults, and where to configure controls. It complements OWASP-style practice (see [OWASP Top 10:2025](https://owasp.org/Top10/2025/)).

**README entry points:** [Security](../README.md#security) (overview) and [Security notes](../README.md#security-notes) (commit/deploy checklist). This file is the **detailed** reference.

## Related documentation

| Topic | Location |
|-------|----------|
| Environment variables | [Security/.env.example](../Security/.env.example), [Security/README.md](../Security/README.md), [README — Configuration](../README.md#configuration) |
| Supabase RLS examples (SQL) | [supabase-rls-recommended.sql](supabase-rls-recommended.sql) |
| Android network / cleartext after `cap sync` | [android-network-security-notes.md](android-network-security-notes.md) |
| Automated audits (CI) | [../.github/workflows/security-audit.yml](../.github/workflows/security-audit.yml) |
| Web CSP (meta tag) | [../web/index.html](../web/index.html) |

## Server logs

Log files under **`logs/`** may contain client IPs, sync metadata, and dashboard activity. They are intended for **local debugging**. Do not ship log files with identifiable health content; rotate or delete old files on shared machines.

## Local secrets directory (`Security/`)

- **`Security/.env`** — preferred location for `PORT`, `HOST`, Supabase keys, and optional `ENCRYPTION_KEY`. Copy from **`Security/.env.example`**. If this file is missing, the server still loads a **legacy** `.env` at the repository root (for existing checkouts).
- **`Security/.encryption_key`** — preferred single-line encryption key file (gitignored). The server also checks the repo root for legacy `.encryption_key` / `encryption.key`, then may **create** `Security/.encryption_key` automatically.

## Surfaces

| Surface | Data at risk | Primary controls |
|--------|----------------|------------------|
| **Web (PWA)** | `localStorage` / IndexedDB on the device | Browser same-origin policy, CSP ([../web/index.html](../web/index.html)), optional Supabase **RLS** |
| **Android (Capacitor)** | Same web assets in WebView + device storage | [../react-app/capacitor.config.ts](../react-app/capacitor.config.ts), Android manifest (after `cap sync`), user device security |
| **Python server** | LAN exposure, optional proxy to Supabase | Bind address ([../server/config.py](../server/config.py)), gated sensitive APIs, no TLS on dev server |

## Python server: bind address and threat model

- **Default `HOST`** is `127.0.0.1`: the HTTP server listens only on the loopback interface. Other machines on the LAN **cannot** connect unless you change this.
- To allow phones or other devices on the same network to open the app, set **`HOST=0.0.0.0`** in **`Security/.env`** (or legacy root `.env`) so the server listens on all interfaces. That increases exposure: treat the network as a trust boundary or run behind a firewall.
- **Do not** expose the dev Python server directly to the internet without a reverse proxy, TLS, and authentication.

## Sensitive HTTP APIs (encryption key and anonymized training data)

These routes are intended for **local development** with the browser on the same machine:

- `GET /api/encryption-key` — returns the AES key material used for anonymised payload encryption when the Python server is in use.
- `GET /api/anonymized-data` — returns aggregated training-style data from Supabase via the server.

**Rules:**

1. Requests are allowed only from **loopback** addresses (`127.0.0.1`, `::1`), unless you explicitly set **`HEALTH_APP_SENSITIVE_APIS_ON_LAN=1`** in the environment (dangerous on shared LANs; use only when you understand the risk).
2. Use **`ENCRYPTION_KEY`** in **`Security/.env`** or a **`.encryption_key`** file under **`Security/`** for a stable, operator-controlled key; otherwise the server may **create** `Security/.encryption_key` automatically on first use (see [Security/.env.example](../Security/.env.example)).

## Encryption key lifecycle

- Prefer **`ENCRYPTION_KEY`** in **`Security/.env`** or a single-line **`Security/.encryption_key`** (see [Security/README.md](../Security/README.md)). Legacy paths at the repo root are still supported.
- If neither env nor key file is present, the server **creates** **`Security/.encryption_key`** with a random 32-byte hex value on first use. **Back up this file** if you need stable decryption across machines.
- The web client ([../web/encryption-utils.js](../web/encryption-utils.js)) syncs the key from the server when available; if the app runs without the Python server (e.g. GitHub Pages), it uses a **per-browser** random key stored in `localStorage` (not a shared global default string).

## Supabase and Row Level Security (RLS)

The anon key is present in client bundles by design. **Authorization must be enforced in Supabase** with RLS and least-privilege policies. Recommended starting points are in [supabase-rls-recommended.sql](supabase-rls-recommended.sql). Apply and adjust to your schema in the Supabase SQL editor.

## Content Security Policy (CSP) and XSS

- The app CSP allows `'unsafe-inline'` and `'unsafe-eval'` for compatibility with inline bootstraps and ML libraries. Tightening this is a **tracked hardening goal**; removing `unsafe-eval` may require bundling or loading changes.
- Prefer `textContent` / `createElement` over `innerHTML` where user-influenced strings are inserted.

## Android: cleartext and mixed content

- **`allowMixedContent`** is set to **`false`** in Capacitor config so WebView does not load passive/active HTTP on an HTTPS app origin.
- After `npx cap sync android`, review **`android/app/src/main/AndroidManifest.xml`** for `usesCleartextTraffic` and consider a **network security config** for production (see [android-network-security-notes.md](android-network-security-notes.md)).

## Dependency and CI scanning

- GitHub Actions workflow [../.github/workflows/security-audit.yml](../.github/workflows/security-audit.yml) runs `npm audit` (root + react-app) and **`pip-audit`** on `requirements.txt`. Failures should be triaged like Dependabot alerts.

## Client-side storage and privacy

Health logs in the browser live in **`localStorage`** (and optionally IndexedDB) without an app-level passphrase. Anyone with **device access** or **malware on the device** may read that data. The in-app GDPR/consent flows describe cloud contribution; they do not replace **device security** (screen lock, OS updates) or organisational policies for regulated health data.

## Reporting issues

Do not open public issues for undisclosed vulnerabilities. Contact the maintainer privately if you believe you have found a serious flaw.
