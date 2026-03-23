# Rianell — personal health dashboard

**Rianell** is a web-based health tracking app (live site **[rianell.com](https://rianell.com/)**). This repository builds the same UI for web, PWA, and Capacitor (Android/iOS project zips), with data visualisation, analytics, and optional cloud sync.

**Android APK (Capacitor):** The WebView opens the **legacy dashboard directly** (`legacy/index.html`) so you get a **single document**—smoother scrolling and lower overhead than nesting the app inside a React iframe. **Browser and `npm run dev`** still use the **React (Vite) shell + iframe** for the same UI at `/legacy/`. Production APK builds: **`npm run build:apk`** then Capacitor sync (see **[Installation & usage](docs/setup-and-usage.md#nav-react-android)**). CI publishes a **debug** beta APK; for a smaller, snappier install, build **release** or **AAB** locally as described in that doc.

**Repository**: [github.com/Metaheurist/Rianell](https://github.com/Metaheurist/Rianell)

<!-- RIANELL_BUILD_INFO_START -->

[![CI builds](https://img.shields.io/badge/build-iOS%2060%20%7C%20Android%2060%20%7C%20Web%2060-2e7d32?style=flat-square)](https://github.com/Metaheurist/Rianell/actions/runs/23444762177)

**CI builds**

| Channel | Build |
| :--- | :---: |
| ![Alpha](https://img.shields.io/badge/Alpha-blue?style=flat-square&logoColor=white) **iOS** (Xcode project zip) | **60** |
| ![Beta](https://img.shields.io/badge/Beta-orange?style=flat-square&logoColor=white) **Android** APK | **60** |
| ![Beta](https://img.shields.io/badge/Beta-orange?style=flat-square&logoColor=white) **Web / PWA** (GitHub Pages deploy) | **60** |

Latest: [`App build/Android/app-debug-beta-60.apk`](App%20build/Android/latest.json) · [`App build/iOS/Health-Tracker-ios-alpha-build-60.zip`](App%20build/iOS/latest.json) · [Workflow #60](https://github.com/Metaheurist/Rianell/actions/runs/23444762177) · `03882be`

<!-- RIANELL_BUILD_INFO_END -->

---

### Documentation

Long-form sections live under **`docs/`** so the main README stays short. Open them from the repo’s file tree or use the links below.

| | |
| :--- | :--- |
| 🔒 | **[Security](docs/SECURITY.md)** — full threat model and controls |
| 🏠 | **[App overview & features](docs/app-and-features.md)** — UI, behaviour, screenshots |
| ⚙️ | **[Installation & usage](docs/setup-and-usage.md)** — server, GitHub Pages, React/Android |
| 🧪 | **[Testing & configuration](docs/testing-and-configuration.md)** |
| 🧠 | **[AI architecture](docs/ai-architecture.md)** |
| 🗂️ | **[Project reference](docs/project-reference.md)** — tree, deps, dev, GDPR, troubleshooting, security notes |
| 👤 | **[About & support](docs/about-and-support.md)** |
| 📜 | **[Changelog](docs/CHANGELOG.md)** |

---

## App icons (favicon, PWA, Android source)

Master rasters live under **`web/Icons/`** (`Icon-*.png`, **`logo-source.png`**) without a beta badge.

A separate **beta** set is generated into **`web/Icons/beta/`** with the same filenames and an orange **BETA** pill matching the floating **+** control. The web app currently points **`index.html`**, **`manifest.json`**, and **`notifications.js`** at this beta set. Regenerate after editing masters:

```bash
npm run icons:beta
```

**`scripts/prepare-android-assets.mjs`** prefers **`web/Icons/beta/logo-source.png`** (then non-beta masters) when building **`react-app/assets/logo.png`** for Capacitor Android icons.

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

For the Tk server dashboard **Wipe Database** flow, rows are deleted in-app; sequence auto-reset needs DB SQL access and may fall back to manual SQL if not available.

## Security notes

Commit/deploy checklist and supplementary pointers (RLS, CI audits, “do not commit secrets”) are in **[docs/project-reference.md](docs/project-reference.md#nav-security-notes)** under **Security notes**.
