# Rianell - personal health dashboard

**Rianell** is a web-based health tracking app (live site **[rianell.com](https://rianell.com/)**). This repository builds the same UI for web, PWA, and Capacitor (Android/iOS project zips), with data visualisation, analytics, and optional cloud sync.

**Latest changes:** **[CHANGELOG.md](docs/CHANGELOG.md)** (current **v1.46.3** - React Native settings carousel parity, native app installation section, log wizard suggest note).

### Here’s what we plan next

Roadmap for the next phase—**web + React Native** split, **system-aware themes** with per-team light/dark tokens, **accessibility** (settings, font scale, TTS, colorblind options), and **AI inference** scaffolding for on-device and browser acceleration—is in **[docs/next-phase-development-plan.md](docs/next-phase-development-plan.md)**.

### Tech stack

[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla%20%2B%20modules-F7DF1E?style=flat-square&logo=javascript&logoColor=000)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=000)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React%20Native](https://img.shields.io/badge/React%20Native-0.83-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2055-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/)
[![Capacitor%20(legacy)](https://img.shields.io/badge/Capacitor-legacy-119EFF?style=flat-square&logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A520-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-server-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20Auth-3FCF8E?style=flat-square&logo=supabase&logoColor=fff)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-Service%20worker%20%26%20manifest-5A0FC8?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![esbuild](https://img.shields.io/badge/esbuild-bundle-FFCF00?style=flat-square&logo=esbuild&logoColor=000)](https://esbuild.github.io/)
[![ApexCharts](https://img.shields.io/badge/ApexCharts-charts-008FFB?style=flat-square)](https://apexcharts.com/)
[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-CI-2088FF?style=flat-square&logo=githubactions&logoColor=white)](https://github.com/features/actions)

**React Native (Expo) builds:** CI produces minified **Expo production bundles** for **iOS + Android** as a merge gate.

**Android APK (Capacitor, legacy):** The WebView opens the **legacy dashboard directly** (`legacy/index.html`) so you get a **single document**-smoother scrolling and lower overhead than nesting the app inside a React iframe. **Capacitor is legacy** during the transition to **React Native (Expo)**; CI no longer rebuilds Capacitor artifacts, but existing legacy builds remain available in releases/history.

**Repository**: [github.com/Metaheurist/Rianell](https://github.com/Metaheurist/Rianell)

<!-- RIANELL_BUILD_INFO_START -->

[![CI builds](https://img.shields.io/badge/build-RN%20%E2%80%94%20%7C%20RN%20iOS%20%E2%80%94%20%7C%20Server%20106%20%7C%20Web%20204-2e7d32?style=flat-square)](https://github.com/Metaheurist/Rianell/actions/runs/23685744776)

**CI builds** (React Native CLI + server + web)

| Channel | Build |
| :--- | :---: |
| ![Alpha](https://img.shields.io/badge/Alpha-blue?style=flat-square&logoColor=white) **Android** APK (React Native CLI) | **—** |
| ![Alpha](https://img.shields.io/badge/Alpha-blue?style=flat-square&logoColor=white) **iOS** (Xcode project zip, RN CLI) | **—** |
| ![Beta](https://img.shields.io/badge/Beta-orange?style=flat-square&logoColor=white) **Server** EXE (x64) | **106** |
| ![Beta](https://img.shields.io/badge/Beta-orange?style=flat-square&logoColor=white) **Server** EXE (x86) | **106** |
| ![Beta](https://img.shields.io/badge/Beta-orange?style=flat-square&logoColor=white) **Web / PWA** (GitHub Pages deploy) | **204** |

**Legacy builds** (Capacitor — no longer produced by CI; metadata only)

| Channel | Build |
| :--- | :---: |
| ![Beta](https://img.shields.io/badge/Beta-orange?style=flat-square&logoColor=white) **Android** APK (Capacitor) | **96** |
| ![Alpha](https://img.shields.io/badge/Alpha-blue?style=flat-square&logoColor=white) **iOS** (Xcode project zip, Capacitor) | **96** |

Latest: [`App build/RNCLI-Android/latest.json`](App%20build/RNCLI-Android/latest.json) · [`App build/iOS/latest.json`](App%20build/iOS/latest.json) · [`App build/Server/rianell-server-x64.exe`](App%20build/Server/latest.json) · [`App build/Server/rianell-server-x64.exe`](App%20build/Server/latest-x64.json) · [`App build/Server/rianell-server-x86.exe`](App%20build/Server/latest-x86.json) · legacy Capacitor Android [`App build/Android/app-debug-beta-96.apk`](App%20build/Android/latest.json) · legacy Capacitor iOS [`App build/Legacy/Capacitor-iOS/Health-Tracker-ios-alpha-build-96.zip`](App%20build/Legacy/Capacitor-iOS/latest.json) · [Workflow #204](https://github.com/Metaheurist/Rianell/actions/runs/23685744776) · `50a272d`

<!-- RIANELL_BUILD_INFO_END -->

---

### Documentation

Long-form sections live under **`docs/`** so the main README stays short. Open them from the repo’s file tree or use the links below.

| | |
| :--- | :--- |
| 🔒 | **[Security](docs/SECURITY.md)** - full threat model and controls |
| 🏠 | **[App overview & features](docs/app-and-features.md)** - UI, behaviour, screenshots |
| ⚙️ | **[Installation & usage](docs/setup-and-usage.md)** - server, GitHub Pages, React/Android |
| 🧪 | **[Testing & configuration](docs/testing-and-configuration.md)** |
| ⏱️ | **[Performance benchmarks](Benchmarks/README.md)** — latest CI/local Markdown under `Benchmarks/` (tooling lives in `benchmark-runner/`); run `npm run benchmark` |
| 🧠 | **[AI architecture](docs/ai-architecture.md)** |
| 🗂️ | **[Project reference](docs/project-reference.md)** - tree, deps, dev, GDPR, troubleshooting, security notes |
| 🎨 | **[Styling](docs/styling.md)** - CSS layout, tokens, settings carousel, tile pickers, cache bust |
| 📱 | **[Platform parity](docs/platform-parity.md)** - web/android/iOS feature contract and CI parity gates |
| 👤 | **[About & support](docs/about-and-support.md)** |
| 📜 | **[Changelog](docs/CHANGELOG.md)** - version history and release notes |
| 🚀 | **[Next phase development plan](docs/next-phase-development-plan.md)** - upcoming build: RN parity, theming, accessibility, AI acceleration |

Support contact: **jan.andersson@rianell.com**

---

## App icons (favicon, PWA, Android source)

Master rasters live under **`apps/pwa-webapp/Icons/`** (`Icon-*.png`, **`logo-source.png`**) without a beta badge.

A separate **beta** set is generated into **`apps/pwa-webapp/Icons/beta/`** with the same filenames and a theme-green **BETA** badge placed in the **top-right** corner (matching the floating **+** beta chip style). The web app currently points **`index.html`**, **`manifest.json`**, and **`notifications.js`** at this beta set. Regenerate after editing masters:

```bash
npm run icons:generate -- --source "C:/path/to/new-icon-source.png"
npm run icons:beta
```

**`scripts/prepare-android-assets.mjs`** prefers **`apps/pwa-webapp/Icons/beta/logo-source.png`** (then non-beta masters) when building **`apps/capacitor-app/assets/logo.png`** for Capacitor Android icons.

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
