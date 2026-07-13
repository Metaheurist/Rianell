# Dependencies (full manifest by build)

This page lists **where dependencies are declared** for the Rianell monorepo: **npm workspaces** (single lockfile), **Python** for the desktop server, **runtime/CDN** assets for the static PWA, and **CI-only** tooling used to produce binaries and reports.

**Runtime expectations:** Node **>=24.14.1** ([`package.json`](../package.json) `engines`; [`.nvmrc`](../.nvmrc) pins **24.14.1** for local tooling). **Python 3.8+** for the server ([`requirements.txt`](../requirements.txt)).

**Build mapping (see main [README](../README.md)):** Web/PWA (GitHub Pages), React Native (Expo) CLI bundles for Android/iOS, Python server EXE (PyInstaller + optional PyArmor in CI).

## Authoritative sources

| Kind | Path |
|------|------|
| npm lockfile (all workspaces) | [`package-lock.json`](../package-lock.json) |
| Root workspace + overrides | [`package.json`](../package.json) |
| React Native (Expo) | [`apps/rn-app/package.json`](../apps/rn-app/package.json) |
| Shared libraries | [`packages/shared/package.json`](../packages/shared/package.json), [`packages/tokens/package.json`](../packages/tokens/package.json) |
| Benchmarks | [`benchmarks/package.json`](../benchmarks/package.json) |
| Python server | [`requirements.txt`](../requirements.txt) |

The PWA under `apps/pwa-webapp/` has **no** `package.json`; it is bundled with **esbuild** from the root devDependencies via [`apps/pwa-webapp/build-site.mjs`](../apps/pwa-webapp/build-site.mjs) and [`apps/pwa-webapp/fingerprint-assets.mjs`](../apps/pwa-webapp/fingerprint-assets.mjs). Production output uses **content-hashed** filenames (`app.<hash>.min.js`; `styles.<hash>.css` for `--site` and `.android-dist`) and `asset-manifest.json` (`mainJs`, optional `mainCss`).

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
| `@opentelemetry/core` | ^2.9.0 |
| `@sentry/node` | ^10.65.0 |
| `esbuild` | 0.28.1 |
| `sharp` | ^0.35.3 |
| `turbo` | ^2.10.5 |

**`overrides`** — 34 pin(s): `@babel/core`, `@expo/plist → @xmldom/xmldom`, `@huggingface/transformers`, `@istanbuljs/load-nyc-config → js-yaml`, `@opentelemetry/core`, `@sentry/node`, `@tootallnate/once`, `@trapezedev/project → @xmldom/xmldom`, `@xmldom/xmldom`, `basic-ftp`, `brace-expansion`, `esbuild`, `expo-modules-core`, `handlebars`, `http-proxy-agent`, `http-proxy-agent@5.0.0`, `ip-address`, `js-yaml`, `lighthouse → @sentry/node`, `mergexml → @xmldom/xmldom`, `minimatch`, `plist → @xmldom/xmldom`, `postcss`, `react-devtools-core → shell-quote`, `react-native-screens`, `react-native-transformers → @huggingface/transformers`, `replace → minimatch`, `semver`, `send`, `shell-quote`, `tar`, `tmp`, `uuid`, `ws`. See the full `overrides` block in [`package.json`](../package.json).

**Workspaces:** `apps/*`, `packages/*`, `benchmarks`.

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

## React Native / Expo ([`apps/rn-app/package.json`](../apps/rn-app/package.json))

**`dependencies`**

| Package | Version |
|---------|---------|
| `@expo/vector-icons` | ^15.0.2 |
| `@huggingface/transformers` | 3.3.2 |
| `@react-native-async-storage/async-storage` | ^3.0.1 |
| `@react-native-community/netinfo` | ^11.4.1 |
| `@react-navigation/bottom-tabs` | ^7.18.8 |
| `@react-navigation/core` | ^7.21.2 |
| `@react-navigation/native` | ^7.2.0 |
| `@react-navigation/native-stack` | ^7.17.10 |
| `@rianell/ai-engine` | file:../../packages/ai-engine |
| `@rianell/cloud-sync` | file:../../packages/cloud-sync |
| `@rianell/llm` | file:../../packages/llm |
| `@rianell/shared` | file:../../packages/shared |
| `@rianell/tokens` | file:../../packages/tokens |
| `@supabase/supabase-js` | ^2.110.3 |
| `@ungap/structured-clone` | ^1.3.3 |
| `expo` | ~55.0.27 |
| `expo-av` | ^16.0.8 |
| `expo-constants` | ~55.0.9 |
| `expo-crypto` | ~55.0.16 |
| `expo-file-system` | ~55.0.22 |
| `expo-haptics` | ~55.0.15 |
| `expo-local-authentication` | ~55.0.15 |
| `expo-modules-autolinking` | ^55.0.11 |
| `expo-modules-core` | 55.0.25 |
| `expo-print` | ~55.0.16 |
| `expo-secure-store` | ~55.0.15 |
| `expo-sharing` | ~55.0.21 |
| `expo-speech` | ^55.0.15 |
| `expo-speech-recognition` | ^3.1.3 |
| `expo-status-bar` | ~55.0.4 |
| `onnxruntime-react-native` | ^1.22.0 |
| `react` | 19.2.7 |
| `react-freeze` | ^1.0.0 |
| `react-native` | 0.83.2 |
| `react-native-safe-area-context` | ^5.7.0 |
| `react-native-screens` | 4.25.2 |
| `react-native-smartlook-analytics` | ^2.1.21 |
| `react-native-svg` | ^15.15.5 |
| `react-native-transformers` | ^1.0.0 |
| `warn-once` | ^0.1.1 |

**`devDependencies`**

| Package | Version |
|---------|---------|
| `@react-native/babel-preset` | 0.83.10 |
| `@testing-library/jest-native` | ^5.4.3 |
| `@testing-library/react-native` | ^13.3.3 |
| `@types/jest` | ^30.0.0 |
| `@types/react` | ~19.2.17 |
| `babel-preset-expo` | ~55.0.12 |
| `jest` | ^29.7.0 |
| `jest-expo` | ~55.0.19 |
| `react-test-renderer` | 19.2.7 |
| `typescript` | ~5.9.2 |

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
| `npm install --no-save @rollup/rollup-linux-x64-gnu` | Linux native Rollup binding for Expo/RN bundle steps on Ubuntu |
| `npx playwright install chromium --with-deps` | Browser for web benchmarks / automation |
| `npx expo export` / `npx expo prebuild` | React Native production bundles and native project prep |
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
