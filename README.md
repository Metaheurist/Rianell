# Rianell - personal health dashboard

**Rianell** is a web-based health tracking app (live site **[rianell.com](https://rianell.com/)**). This repository builds the **PWA** (web/GitHub Pages) and **React Native (Expo)** mobile app, with data visualisation, analytics, and optional cloud sync.

**Latest changes:** **[CHANGELOG.md](docs/CHANGELOG.md)** (current **v1.88.0** — CI AI benchmark navigation + RN typecheck; **v1.85.0–v1.87.0** locale refresh, model clear/redownload, pl-PL i18n; **v1.78.0–v1.84.0** benchmark toolkit and AI engine CI).

### Tech stack

[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla%20%2B%20modules-F7DF1E?style=flat-square&logo=javascript&logoColor=000)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=000)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React%20Native](https://img.shields.io/badge/React%20Native-0.83-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2055-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-24.14.1%20LTS-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-server-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20Auth-3FCF8E?style=flat-square&logo=supabase&logoColor=fff)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-Service%20worker%20%26%20manifest-5A0FC8?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![esbuild](https://img.shields.io/badge/esbuild-bundle-FFCF00?style=flat-square&logo=esbuild&logoColor=000)](https://esbuild.github.io/)
[![ApexCharts](https://img.shields.io/badge/ApexCharts-charts-008FFB?style=flat-square)](https://apexcharts.com/)
[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-CI-2088FF?style=flat-square&logo=githubactions&logoColor=white)](https://github.com/features/actions)

**React Native (Expo) builds:** CI produces minified **Expo production bundles** for **iOS + Android** as a merge gate. **`npm run dev`** starts the Expo dev server (`apps/rn-app`).

**Repository**: [github.com/Metaheurist/Rianell](https://github.com/Metaheurist/Rianell)

<!-- RIANELL_BUILD_INFO_START -->

[![CI builds](https://img.shields.io/badge/build-RN%20226%20%7C%20RN%20iOS%20226%20%7C%20Server%20275%20%7C%20Web%20280-2e7d32?style=flat-square)](https://github.com/Metaheurist/Rianell/actions/runs/27500533993)

**CI builds** (React Native CLI + server + web)

| Channel | Build |
| :--- | :---: |
| ![Alpha](https://img.shields.io/badge/Alpha-blue?style=flat-square&logoColor=white) **Android** APK (React Native CLI) | **226** |
| ![Alpha](https://img.shields.io/badge/Alpha-blue?style=flat-square&logoColor=white) **iOS** (Xcode project zip, RN CLI) | **226** |
| ![Beta](https://img.shields.io/badge/Beta-orange?style=flat-square&logoColor=white) **Server** EXE (x64) | **275** |
| ![Beta](https://img.shields.io/badge/Beta-orange?style=flat-square&logoColor=white) **Server** EXE (x86) | **275** |
| ![Beta](https://img.shields.io/badge/Beta-orange?style=flat-square&logoColor=white) **Web / PWA** (GitHub Pages deploy) | **280** |

Latest: [`App build/RNCLI-Android/app-debug-beta.apk`](App%20build/RNCLI-Android/latest.json) · [`App build/iOS/Health-Tracker-ios-alpha-build-226.zip`](App%20build/iOS/latest.json) · [`App build/Server/rianell-server-x64.exe`](App%20build/Server/latest.json) · [`App build/Server/rianell-server-x64.exe`](App%20build/Server/latest-x64.json) · [`App build/Server/rianell-server-x86.exe`](App%20build/Server/latest-x86.json) · [Workflow #280](https://github.com/Metaheurist/Rianell/actions/runs/27500533993) · `f58257b`

<!-- RIANELL_BUILD_INFO_END -->

---

### Documentation

Long-form sections live under **`docs/`** so the main README stays short. Open them from the repo’s file tree or use the links below. Icons are coloured SVG assets under [`docs/icons/`](docs/icons/) (32×32 display, tinted tiles for GitHub light and dark mode; referenced with `<img>` for GitHub compatibility).

| | |
| :--- | :--- |
| <img src="docs/icons/lock.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Security](docs/SECURITY.md)** - threat model, controls, and v1.50 security program |
| <img src="docs/icons/shield.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Privacy program](docs/privacy/global-baseline.md)** - GDPR baseline, RoPA, data-subject rights (`docs/privacy/`) |
| <img src="docs/icons/clipboard.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Privacy & region execution plan](docs/privacy/region-policy-execution-plan.md)** - Region gate, policy engine, UI localization (single Supabase project) |
| <img src="docs/icons/globe.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Infrastructure & edge security](docs/infrastructure-and-security-edge.md)** - DNS, Cloudflare, GitHub Pages (no secrets; safe for contributors) |
| <img src="docs/icons/home.svg" width="32" height="32" alt="" aria-hidden="true"> | **[App overview & features](docs/app-and-features.md)** - UI, behaviour, screenshots |
| <img src="docs/icons/settings.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Installation & usage](docs/setup-and-usage.md)** - server, GitHub Pages, React/Android |
| <img src="docs/icons/flask.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Testing & configuration](docs/testing-and-configuration.md)** |
| <img src="docs/icons/timer.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Performance benchmarks](benchmarks/README.md)** - reports and tooling under `benchmarks/`; run `npm run benchmark` or **`npm run benchmark:tier-matrix`** for tier 1–5 perf matrix |
| <img src="docs/icons/brain.svg" width="32" height="32" alt="" aria-hidden="true"> | **[AI architecture](docs/ai-architecture.md)** |
| <img src="docs/icons/folder.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Project reference](docs/project-reference.md)** - tree, deps, dev, GDPR, troubleshooting, security notes |
| <img src="docs/icons/paperclip.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Dependencies](docs/dependencies.md)** - generated inventory (`npm run docs:dependencies`; CI sync on `main`) — npm workspaces, Python, CDN/runtime, CI tooling |
| <img src="docs/icons/palette.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Styling](docs/styling.md)** - CSS layout, tokens, settings carousel, tile pickers, cache bust |
| <img src="docs/icons/smartphone.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Platform parity](docs/platform-parity.md)** - web/android/iOS feature contract and CI parity gates |
| <img src="docs/icons/user.svg" width="32" height="32" alt="" aria-hidden="true"> | **[About & support](docs/about-and-support.md)** |
| <img src="docs/icons/scroll.svg" width="32" height="32" alt="" aria-hidden="true"> | **[Changelog](docs/CHANGELOG.md)** - version history and release notes |

Support contact: **jan.andersson@rianell.com**

---

## App icons (favicon, PWA, Android source)

Master rasters live under **`apps/pwa-webapp/Icons/`** (`Icon-*.png`, **`logo-source.png`**) without a beta badge.

A separate **beta** set is generated into **`apps/pwa-webapp/Icons/beta/`** with the same filenames and a theme-green **BETA** badge placed in the **top-right** corner (matching the floating **+** beta chip style). The web app currently points **`index.html`**, **`manifest.json`**, and **`notifications.js`** at this beta set. Regenerate after editing masters:

```bash
npm run icons:generate -- --source "C:/path/to/new-icon-source.png"
npm run icons:beta
```

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
