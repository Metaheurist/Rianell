# Dependencies (full manifest by build)

This page lists **where dependencies are declared** for the Rianell monorepo: **npm workspaces** (single lockfile), **Python** for the desktop server, **runtime/CDN** assets for the static PWA, and **CI-only** tooling used to produce binaries and reports.

**Runtime expectations:** Node **>=24.14.1** ([`package.json`](../package.json) `engines`; [`.nvmrc`](../.nvmrc) pins **24.14.1** for local tooling). **Python 3.8+** for the server ([`requirements.txt`](../requirements.txt)).

**Build mapping (see main [README](../README.md)):** Web/PWA (GitHub Pages), React Native (Expo) CLI bundles for Android/iOS, Python server EXE (PyInstaller + optional PyArmor in CI), legacy Capacitor shell (npm manifests still present; CI no longer ships those artifacts by default).

## Authoritative sources

| Kind | Path |
|------|------|
| npm lockfile (all workspaces) | [`package-lock.json`](../package-lock.json) |
| Root workspace + overrides | [`package.json`](../package.json) |
| React Native (Expo) | [`apps/rn-app/package.json`](../apps/rn-app/package.json) |
| Legacy Capacitor shell | [`apps/capacitor-app/package.json`](../apps/capacitor-app/package.json) |
| Shared libraries | [`packages/shared/package.json`](../packages/shared/package.json), [`packages/tokens/package.json`](../packages/tokens/package.json) |
| Benchmarks | [`benchmarks/package.json`](../benchmarks/package.json) |
| Python server | [`requirements.txt`](../requirements.txt) |

The PWA under `apps/pwa-webapp/` has **no** `package.json`; it is bundled with **esbuild** from the root devDependencies via [`apps/pwa-webapp/build-site.mjs`](../apps/pwa-webapp/build-site.mjs).

---

## Root workspace ([`package.json`](../package.json))

**`devDependencies`**

| Package | Version |
|---------|---------|
| `@babel/generator` | ^7.26.5 |
| `@babel/parser` | ^7.26.7 |
| `@babel/traverse` | ^7.26.7 |
| `@babel/types` | ^7.26.7 |
| `@capacitor/cli` | 7.6.1 |
| `esbuild` | ^0.25.0 |
| `sharp` | ^0.33.5 |

**`overrides`** — 14 pin(s): `@capacitor/assets → @capacitor/cli`, `@tootallnate/once`, `@trapezedev/project → @xmldom/xmldom`, `@xmldom/xmldom`, `brace-expansion`, `handlebars`, `http-proxy-agent`, `http-proxy-agent@5.0.0`, `mergexml → @xmldom/xmldom`, `minimatch`, `replace → minimatch`, `semver`, `send`, `tar`. See the full `overrides` block in [`package.json`](../package.json).

**Workspaces:** `apps/*`, `packages/*`, `benchmarks`.

---

## Web / PWA (`apps/pwa-webapp/`)

### Build-time (Node, from root)

Uses root **esbuild**, Babel packages (`@babel/generator`, `@babel/parser`, `@babel/traverse`, `@babel/types`), **sharp**, and **@capacitor/cli** for scripts (`build:web`, icons, Capacitor-related automation). No separate npm manifest.

### Runtime — vendored / local

- **ApexCharts** — [`apps/pwa-webapp/apexcharts.min.js`](../apps/pwa-webapp/apexcharts.min.js) (loaded via [`performance-utils.js`](../apps/pwa-webapp/performance-utils.js) `ensureApexChartsLoaded()`, not from a CDN).

### Runtime — pinned CDNs (see [`apps/pwa-webapp/index.html`](../apps/pwa-webapp/index.html))

| Asset | Pinned reference |
|-------|------------------|
| Supabase JS (UMD) | `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/dist/umd/supabase.min.js` |
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
| `@react-native-async-storage/async-storage` | ^3.0.1 |
| `@react-navigation/bottom-tabs` | ^7.15.7 |
| `@react-navigation/core` | ^7.17.0 |
| `@react-navigation/native` | ^7.2.0 |
| `@react-navigation/native-stack` | ^7.14.8 |
| `@rianell/shared` | file:../../packages/shared |
| `@rianell/tokens` | file:../../packages/tokens |
| `@supabase/supabase-js` | ^2.100.1 |
| `@ungap/structured-clone` | ^1.3.0 |
| `expo` | ~55.0.8 |
| `expo-av` | ^16.0.8 |
| `expo-constants` | ~55.0.9 |
| `expo-modules-autolinking` | ^55.0.11 |
| `expo-speech` | ^55.0.9 |
| `expo-speech-recognition` | ^3.1.2 |
| `expo-status-bar` | ~55.0.4 |
| `react` | 19.2.4 |
| `react-freeze` | ^1.0.0 |
| `react-native` | 0.83.2 |
| `react-native-safe-area-context` | ^5.7.0 |
| `react-native-screens` | ^4.24.0 |
| `react-native-svg` | ^15.12.0 |
| `warn-once` | ^0.1.1 |

**`devDependencies`**

| Package | Version |
|---------|---------|
| `@react-native/babel-preset` | 0.83.2 |
| `@testing-library/jest-native` | ^5.4.3 |
| `@testing-library/react-native` | ^13.3.3 |
| `@types/jest` | ^30.0.0 |
| `@types/react` | ~19.2.2 |
| `babel-preset-expo` | ~55.0.12 |
| `jest` | ^29.7.0 |
| `jest-expo` | ~55.0.11 |
| `react-test-renderer` | 19.2.4 |
| `stacktrace-js` | ^2.0.2 |
| `typescript` | ~5.9.2 |

---

## Legacy Capacitor shell ([`apps/capacitor-app/package.json`](../apps/capacitor-app/package.json))

**`dependencies`**

| Package | Version |
|---------|---------|
| `@capacitor/app` | ^7.1.2 |
| `@capacitor/browser` | ^7.0.4 |
| `@capacitor/local-notifications` | ^7.0.6 |
| `react` | ^18.2.0 |
| `react-dom` | ^18.2.0 |

**`devDependencies`**

| Package | Version |
|---------|---------|
| `@capacitor/android` | ^7.6.0 |
| `@capacitor/assets` | ^3.0.5 |
| `@capacitor/cli` | ^7.6.0 |
| `@capacitor/core` | ^7.6.0 |
| `@capacitor/ios` | ^7.6.0 |
| `@types/react` | ^18.2.0 |
| `@types/react-dom` | ^18.2.0 |
| `@vitejs/plugin-react` | ^4.5.0 |
| `typescript` | ^5.3.0 |
| `vite` | ^6.4.2 |

---

## Workspace libraries

[`packages/shared/package.json`](../packages/shared/package.json) and [`packages/tokens/package.json`](../packages/tokens/package.json) declare **no npm `dependencies`** (local ESM/CJS exports only).

---

## Benchmarks ([`benchmarks/package.json`](../benchmarks/package.json))

Workspace **`@rianell/benchmark-runner`**.

**`devDependencies`**

| Package | Version |
|---------|---------|
| `@playwright/test` | ^1.49.1 |
| `chrome-launcher` | ^1.1.2 |
| `lighthouse` | ^12.2.1 |
| `playwright` | ^1.49.1 |
| `serve-handler` | ^6.1.6 |

---

## Python server ([`requirements.txt`](../requirements.txt))

| Package | Constraint | Role |
|---------|------------|------|
| `supabase` | >=2.0.0 | Supabase client |
| `watchdog` | >=3.0.0 | File watching / auto-reload (recommended) |
| `python-dotenv` | >=1.0.0 | `.env` loading |
| `cryptography` | >=46.0.7 | Encryption for anonymised data |
| `psycopg[binary]` | >=3.0.0 | PostgreSQL driver (optional path for direct SQL) |
| `psycopg2-binary` | >=2.9.0 | Alternate PostgreSQL driver |

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

### [`.github/workflows/expo-native-build.yml`](../.github/workflows/expo-native-build.yml)

| Tool | Role |
|------|------|
| `npm install -g eas-cli` | EAS CLI when that workflow runs |

### [`.github/workflows/security-audit.yml`](../.github/workflows/security-audit.yml) (reusable **only** — called from `ci.yml`; no separate `on: push` to avoid duplicate runs)

| Tool | Role |
|------|------|
| Gitleaks (pinned release binary) | Secret scan |
| `npm audit --audit-level=high --omit=dev` | npm advisory DB (production dependency tree; devDependency-only chains may still show in a local full `npm audit`) |
| OSV-Scanner (pinned binary) | [OSV.dev](https://osv.dev/) lockfile scan for `package-lock.json` and `requirements.txt` |
| `pip-audit` | PyPI vulnerability scan |

---

## Maintaining this doc

This file is **generated** by [`scripts/generate-dependencies-doc.mjs`](../scripts/generate-dependencies-doc.mjs). **CI** runs the generator on every workflow; pushes to **main** / **master** may commit updates automatically. On **pull requests**, CI fails if the committed file does not match the generator output — run `node scripts/generate-dependencies-doc.mjs` locally and commit `docs/dependencies.md` with manifest changes.
