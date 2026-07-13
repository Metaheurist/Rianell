# Rianell - personal health dashboard

**Rianell** is a web-based health tracking app (live site **[rianell.com](https://rianell.com/)**). This repository builds the **PWA** (web/GitHub Pages) and **React Native (Expo)** mobile app, with data visualisation, analytics, and optional cloud sync.

**Latest changes:** **[CHANGELOG.md](CHANGELOG.md)** (current **v2.0.0** — production release: OAuth connectors, unified cycle timeline, vitals suggestions, log-wizard UX, desktop full benchmark, beta branding removed).

### Here's what we plan next

**[docs/next-phase-development-plan.md](docs/next-phase-development-plan.md)** — active roadmap for platform parity (Capacitor sunset complete; RN + PWA share `@rianell/*` packages). Shipped work is in the **[changelog](docs/CHANGELOG.md)** and **[app overview](docs/app-and-features.md)**.

### Tech stack

**Core**

[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla%20%2B%20modules-F7DF1E?style=flat-square&logo=javascript&logoColor=000)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24.14.1%20LTS-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-11.11.0-CB3837?style=flat-square&logo=npm&logoColor=white)](https://www.npmjs.com/)
[![Python](https://img.shields.io/badge/Python-server-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)

**Web / PWA**

[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react&logoColor=000)](https://react.dev/)
[![PWA](https://img.shields.io/badge/PWA-Service%20worker%20%26%20manifest-5A0FC8?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![esbuild](https://img.shields.io/badge/esbuild-0.28.1-FFCF00?style=flat-square&logo=esbuild&logoColor=000)](https://esbuild.github.io/)
[![ApexCharts](https://img.shields.io/badge/ApexCharts-charts-008FFB?style=flat-square)](https://apexcharts.com/)

**Mobile**

[![React%20Native](https://img.shields.io/badge/React%20Native-0.83.2-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2055-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/)
[![React%20Navigation](https://img.shields.io/badge/React%20Navigation-7.x-6B4FBB?style=flat-square&logo=react&logoColor=white)](https://reactnavigation.org/)

**AI / On-device inference**

[![Transformers.js](https://img.shields.io/badge/Transformers.js-3.3.2-FFD21E?style=flat-square&logo=huggingface&logoColor=000)](https://huggingface.co/docs/transformers.js)
[![ONNX%20Runtime](https://img.shields.io/badge/ONNX%20Runtime-1.22.0%20(RN)-gray?style=flat-square&logo=onnx&logoColor=white)](https://onnxruntime.ai/)
[![HuggingFace](https://img.shields.io/badge/HuggingFace-%40rianell%2Fai--engine-FFD21E?style=flat-square&logo=huggingface&logoColor=000)](https://huggingface.co/)

**Backend / Cloud**

[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%2017%20%26%20Auth-3FCF8E?style=flat-square&logo=supabase&logoColor=fff)](https://supabase.com/)
[![Supabase%20Edge](https://img.shields.io/badge/Supabase%20Edge%20Functions-Deno-3FCF8E?style=flat-square&logo=deno&logoColor=white)](https://supabase.com/docs/guides/functions)
[![supabase-js](https://img.shields.io/badge/supabase--js-2.100.1-3FCF8E?style=flat-square&logo=supabase&logoColor=fff)](https://github.com/supabase/supabase-js)

**OAuth Connectors**

[![Strava](https://img.shields.io/badge/Strava-connector-FC4C02?style=flat-square&logo=strava&logoColor=white)](https://developers.strava.com/)
[![Withings](https://img.shields.io/badge/Withings-connector-00B5AD?style=flat-square)](https://developer.withings.com/)
[![Google%20Sheets](https://img.shields.io/badge/Google%20Sheets-connector-34A853?style=flat-square&logo=googlesheets&logoColor=white)](https://developers.google.com/sheets)

**Tooling & CI**

[![Turbo](https://img.shields.io/badge/Turbo-2.9.18-EF4444?style=flat-square&logo=turborepo&logoColor=white)](https://turbo.build/)
[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-CI-2088FF?style=flat-square&logo=githubactions&logoColor=white)](https://github.com/features/actions)
[![Smartlook](https://img.shields.io/badge/Smartlook-Session%20recording%20(EU%20opt--in)-FF6B35?style=flat-square&logo=smartlook&logoColor=white)](https://www.smartlook.com/)
[![API](https://img.shields.io/badge/API-v1-blue)](docs/api/openapi.yaml)
[![FHIR R4](https://img.shields.io/badge/FHIR-R4-green)](docs/connectors/fasten-health.md)
[![n8n](https://img.shields.io/badge/n8n-node-orange)](https://www.npmjs.com/package/n8n-nodes-rianell)

**React Native (Expo) builds:** CI produces minified **Expo production bundles** for **iOS + Android** as a merge gate. **`npm run dev`** starts the Expo dev server (`apps/rn-app`).

### Session recording (Smartlook)

Optional **session recording** (Smartlook, EU region) helps improve usability on **PWA and React Native**. It is **off by default** and only runs after explicit opt-in under **Settings → Privacy & region**. Users can turn it off anytime or revoke consent from the **Consent dashboard**. Blocked while **local-only mode** is on. See **[docs/privacy/smartlook-session-recording.md](docs/privacy/smartlook-session-recording.md)** and the [subprocessor register](docs/privacy/subprocessors.md).

**Repository**: [github.com/Metaheurist/Rianell](https://github.com/Metaheurist/Rianell)

<!-- RIANELL_BUILD_INFO_START -->

[![CI builds](https://img.shields.io/badge/build-RN%20316%20%7C%20RN%20iOS%20316%20%7C%20Server%20669%20%7C%20Web%20669-2e7d32?style=flat-square)](https://github.com/Metaheurist/Rianell/actions/runs/29282111300)

**CI builds** (React Native CLI + server + web)

| Channel | Build |
| :--- | :---: |
| ![Alpha](https://img.shields.io/badge/Alpha-blue?style=flat-square&logoColor=white) **Android** APK (React Native CLI) | **316** |
| ![Alpha](https://img.shields.io/badge/Alpha-blue?style=flat-square&logoColor=white) **iOS** (Xcode project zip, RN CLI) | **316** |
| ![Beta](https://img.shields.io/badge/Beta-orange?style=flat-square&logoColor=white) **Server** EXE (x64) | **669** |
| ![Beta](https://img.shields.io/badge/Beta-orange?style=flat-square&logoColor=white) **Server** EXE (x86) | **669** |
| ![Beta](https://img.shields.io/badge/Beta-orange?style=flat-square&logoColor=white) **Web / PWA** (GitHub Pages deploy) | **669** |

Latest: [`artifacts/RNCLI-Android/app-debug-beta.apk`](artifacts/RNCLI-Android/latest.json) · [`artifacts/iOS/Health-Tracker-ios-alpha-build-316.zip`](artifacts/iOS/latest.json) · [`artifacts/Server/rianell-server-x64.exe`](artifacts/Server/latest.json) · [`artifacts/Server/rianell-server-x64.exe`](artifacts/Server/latest-x64.json) · [`artifacts/Server/rianell-server-x86.exe`](artifacts/Server/latest-x86.json) · [Workflow #669](https://github.com/Metaheurist/Rianell/actions/runs/29282111300) · `54b5b9a`

<!-- RIANELL_BUILD_INFO_END -->

---

### Documentation

Long-form sections live under **`docs/`** so the main README stays short. Open them from the repo’s file tree or use the links below. Icons are SVG assets under [`docs/icons/`](docs/icons/) (referenced with `<img>` for GitHub compatibility).

| | |
| :--- | :--- |
| <img src="docs/icons/lock.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Security](docs/SECURITY.md)** - threat model, controls, and v1.50 security program |
| <img src="docs/icons/shield.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Privacy program](docs/privacy/global-baseline.md)** - GDPR baseline, RoPA, data-subject rights (`docs/privacy/`) |
| <img src="docs/icons/shield.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Smartlook session recording](docs/privacy/smartlook-session-recording.md)** - opt-in EU session analytics (PWA + RN), consent and CSP |
| <img src="docs/icons/clipboard.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Privacy & region execution plan](docs/privacy/region-policy-execution-plan.md)** - Region gate, policy engine, UI localization (single Supabase project) |
| <img src="docs/icons/globe.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Infrastructure & edge security](docs/infrastructure-and-security-edge.md)** - DNS, Cloudflare, GitHub Pages (no secrets; safe for contributors) |
| <img src="docs/icons/home.svg" width="32" height="32" alt="" aria-hidden="true"> | **[App overview & features](docs/app-and-features.md)** - UI, behaviour, screenshots |
| <img src="docs/icons/settings.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Installation & usage](docs/setup-and-usage.md)** - server, GitHub Pages, React/Android |
| <img src="docs/icons/flask.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Testing & configuration](docs/testing-and-configuration.md)** |
| <img src="docs/icons/timer.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Performance benchmarks](benchmarks/README.md)** - reports and tooling under `benchmarks/`; run `npm run benchmark` |
| <img src="docs/icons/brain.svg" width="32" height="32" alt="" aria-hidden="true"> | **[AI architecture](docs/ai-architecture.md)** |
| <img src="docs/icons/folder.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Architecture standard](docs/architecture-standard.md)** - repo layout, workspaces, scripts, artifacts policy, migration log |
| <img src="docs/icons/folder.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Project reference](docs/project-reference.md)** - tree, deps, dev, GDPR, troubleshooting, security notes |
| <img src="docs/icons/paperclip.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Dependencies](docs/dependencies.md)** - generated inventory (`npm run docs:dependencies`; CI sync on `main`) — npm workspaces, Python, CDN/runtime, CI tooling |
| <img src="docs/icons/palette.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Styling](docs/styling.md)** - CSS layout, tokens, settings carousel, tile pickers, cache bust |
| <img src="docs/icons/smartphone.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Platform parity](docs/platform-parity.md)** - web/android/iOS feature contract and CI parity gates |
| <img src="docs/icons/user.svg" width="32" height="32" alt="" aria-hidden="true"> | **[About & support](docs/about-and-support.md)** |
| <img src="docs/icons/scroll.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Changelog](docs/CHANGELOG.md)** - version history and release notes |
| <img src="docs/icons/rocket.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Next phase development plan](docs/next-phase-development-plan.md)** - upcoming build: RN parity, theming, accessibility, AI acceleration |
| <img src="docs/icons/home.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Wiki](https://github.com/Metaheurist/Rianell/wiki)** - user guides and developer hub (source: `wiki/`) |

Support contact: **jan.andersson@rianell.com**

---

## App icons (favicon, PWA, Android source)

Master rasters live under **`apps/pwa-webapp/Icons/`** (`Icon-*.png`, **`logo-source.png`**). The PWA uses this production set in **`index.html`**, **`manifest.json`**, **`sw.js`**, and **`notifications.js`**.

Regenerate after editing the master source:

```bash
npm run icons:generate -- --source "C:/path/to/new-icon-source.png"
```

Optional beta-badge variants for preview builds: `npm run icons:beta` → **`apps/pwa-webapp/Icons/beta/`** (not used in v2 production deploy).

Native app icons are generated via Expo / RN CLI asset pipelines (`apps/rn-app`); PWA icons under **`apps/pwa-webapp/Icons/`** feed the web manifest and GitHub Pages deploy.

---

## Security

The authoritative guide is **[docs/SECURITY.md](docs/SECURITY.md)** (web app, Android, Python server, encryption, Supabase RLS, CSP). For local secrets, see **`security/`** and **`security/.env.example`**.

## Supabase Keys (Current Names)

Use Supabase's current naming in **`security/.env`**:

- **`SUPABASE_PUBLISHABLE_KEY`** (client-safe key used by web app/cloud sync)
- **`SUPABASE_SECRET_KEY`** (server-only secret; use the `service_role` key)

Legacy names still work as fallbacks:

- **`SUPABASE_ANON_KEY`** → publishable
- **`SUPABASE_SERVICE_KEY`** → secret/service role

For the PyQt6 server dashboard **Wipe Database** flow, rows are deleted in-app; sequence auto-reset needs DB SQL access and may fall back to manual SQL if not available.

## Security notes

Commit/deploy checklist and supplementary pointers (RLS, CI audits, “do not commit secrets”) are in **[docs/project-reference.md](docs/project-reference.md#nav-security-notes)** under **Security notes**.
