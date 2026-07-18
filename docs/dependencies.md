# Dependencies (full manifest by build)

This page lists **where dependencies are declared** for the Rianell monorepo: **npm workspaces** (single lockfile), **Python** for the desktop server, **runtime/CDN** assets for the static PWA, and **CI-only** tooling used to produce binaries and reports.

**Runtime expectations:** Node **>=24.14.1** ([`package.json`](../package.json) `engines`; [`.nvmrc`](../.nvmrc) pins **24.14.1** for local tooling). **Python 3.8+** for the server ([`requirements.txt`](../requirements.txt)).

**Build mapping (see main [README](../README.md)):** Web/PWA (GitHub Pages), Python server EXE (PyInstaller + optional PyArmor in CI).

## Authoritative sources

| Kind | Path |
|------|------|
| npm lockfile (all workspaces) | [`package-lock.json`](../package-lock.json) |
| Root workspace + overrides | [`package.json`](../package.json) |
| Shared libraries | [`packages/shared/package.json`](../packages/shared/package.json), [`packages/tokens/package.json`](../packages/tokens/package.json) |
| Benchmarks | [`benchmarks/package.json`](../benchmarks/package.json) |
| Python server | [`requirements.txt`](../requirements.txt) |

The PWA under `apps/pwa-webapp/` has **no** `package.json`; it is bundled with **esbuild** from the root devDependencies via [`apps/pwa-webapp/build-site.mjs`](../apps/pwa-webapp/build-site.mjs) and [`apps/pwa-webapp/fingerprint-assets.mjs`](../apps/pwa-webapp/fingerprint-assets.mjs). Production output uses **content-hashed** filenames (`app.<hash>.min.js`; `styles.<hash>.css` for `--site` and `.web-dist`) and `asset-manifest.json` (`mainJs`, optional `mainCss`).

---

## Root workspace ([`package.json`](../package.json))

**`devDependencies`**

| Package | Version |
|---------|---------|
| `@babel/core` | 7.29.7 |
| `@babel/generator` | ^7.26.5 |
| `@babel/parser` | ^7.26.7 |
| `@babel/traverse` | ^7.26.7 |
| `@babel/types` | ^7.26.7 |
| `@huggingface/transformers` | 3.3.2 |
| `@opentelemetry/core` | ^2.9.0 |
| `@sentry/node` | ^10.65.0 |
| `esbuild` | 0.28.1 |
| `jsdom` | ^29.1.1 |
| `sharp` | ^0.35.3 |
| `turbo` | ^2.10.5 |

**`overrides`** — 27 pin(s): `@babel/core`, `@huggingface/transformers`, `@istanbuljs/load-nyc-config → js-yaml`, `@opentelemetry/core`, `@sentry/node`, `@tootallnate/once`, `@xmldom/xmldom`, `basic-ftp`, `brace-expansion`, `esbuild`, `handlebars`, `http-proxy-agent`, `http-proxy-agent@5.0.0`, `ip-address`, `js-yaml`, `lighthouse → @sentry/node`, `minimatch`, `postcss`, `react-devtools-core → shell-quote`, `replace → minimatch`, `semver`, `send`, `shell-quote`, `tar`, `tmp`, `uuid`, `ws`. See the full `overrides` block in [`package.json`](../package.json).

**Workspaces:** `apps/pwa-webapp`, `packages/*`, `benchmarks`.

---

## Web / PWA (`apps/pwa-webapp/`)

### Build-time (Node, from root)

Uses root **esbuild**, Babel packages (`@babel/generator`, `@babel/parser`, `@babel/traverse`, `@babel/types`), and **sharp** for scripts (`build:web`, icons). Minified bundles are **fingerprinted** (SHA-256 prefix in filenames) for cache busting; see `fingerprint-assets.mjs`. No separate npm manifest under `apps/pwa-webapp/`.

### Runtime — vendored / local

- **ApexCharts** — [`apps/pwa-webapp/apexcharts.min.js`](../apps/pwa-webapp/apexcharts.min.js) (loaded via [`performance-utils.js`](../apps/pwa-webapp/performance-utils.js) `ensureApexChartsLoaded()`, not from a CDN).

### Runtime — pinned CDNs (see [`apps/pwa-webapp/index.html`](../apps/pwa-webapp/index.html))

| Asset | Pinned reference |
|-------|------------------|
| Supabase JS (UMD) | `—` |
| ua-parser-js | `https://cdn.jsdelivr.net/npm/ua-parser-js@1.0.37/dist/ua-parser.min.js` |
| Font Awesome (CSS) | `https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.7.2/css/all.min.css` (deferred loader in page) |
| Google Fonts | Plus Jakarta Sans via `fonts.googleapis.com` / `fonts.gstatic.com` |

CSP and additional script hosts (e.g. ML/PayPal-related `connect-src` entries) are described in the same `index.html` meta **Content-Security-Policy** and related comments.

---

## Workspace libraries

[`packages/shared/package.json`](../packages/shared/package.json) and [`packages/tokens/package.json`](../packages/tokens/package.json) declare **no npm `dependencies`** (local ESM/CJS exports only).

---

## Benchmarks ([`benchmarks/package.json`](../benchmarks/package.json))

Workspace **`@rianell/benchmark-runner`**.

**`devDependencies`**

| Package | Version |
|---------|---------|
| `@playwright/test` | ^1.61.1 |
| `chrome-launcher` | ^1.1.2 |
| `lighthouse` | ^13.4.0 |
| `playwright` | ^1.61.1 |
| `serve-handler` | ^6.1.6 |

---

## Python server ([`requirements.txt`](../requirements.txt))

| Package | Constraint | Role |
|---------|------------|------|
| `supabase` | >=2.31.0 | Supabase client |
| `pydantic` | >=2.13.4,<3 | — |
| `websockets` | >=15.0.1,<16 | — |
| `watchdog` | >=6.0.0 | File watching / auto-reload (recommended) |
| `python-dotenv` | >=1.2.2 | `.env` loading |
| `cryptography` | >=49.0.0 | Encryption for anonymised data |
| `psycopg[binary]` | >=3.3.4 | PostgreSQL driver (optional path for direct SQL) |
| `psycopg2-binary` | >=2.9.12 | Alternate PostgreSQL driver |

Install: `pip install -r requirements.txt` (Python **3.8+** per file header).

---

## CI and packaging-only (not in `requirements.txt`)

These are installed or invoked in workflows **to build or test**; they are not necessarily application imports.

### [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) (representative)

| Tool / command | Role |
|----------------|------|
| `npx playwright install chromium --with-deps` | Browser for web benchmarks / automation |
| `pip install pyinstaller` | Build Windows server `.exe` |
| `pip install pyarmor` | Optional obfuscation step for server sources in CI (see workflow) |

### [`.github/workflows/security-audit.yml`](../.github/workflows/security-audit.yml) (reusable **only** — called from `ci.yml`; no separate `on: push` to avoid duplicate runs)

| Tool | Role |
|------|------|
| Gitleaks (pinned release binary) | Secret scan |
| `npm audit --audit-level=high --omit=dev` | npm advisory DB (production dependency tree; devDependency-only chains may still show in a local full `npm audit`) |
| OSV-Scanner (pinned binary) | [OSV.dev](https://osv.dev/) lockfile scan for `package-lock.json` and `requirements.txt` |
| `pip-audit` | PyPI vulnerability scan |

---

## Maintaining this doc

This file is **generated** by [`scripts/ci/generate-dependencies-doc.mjs`](../scripts/ci/generate-dependencies-doc.mjs). **CI** runs the generator on every workflow; pushes to **main** / **master** may commit updates automatically. On **pull requests**, CI fails if the committed file does not match the generator output — run `node scripts/ci/generate-dependencies-doc.mjs` locally and commit `docs/dependencies.md` with manifest changes.
