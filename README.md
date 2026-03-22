# Rianell — personal health dashboard

**Rianell** is a web-based health tracking app (live site **[rianell.com](https://rianell.com/)**). This repository builds the same UI for web, PWA, and Capacitor (Android/iOS project zips), with data visualisation, analytics, and optional cloud sync.

**Repository**: [github.com/Metaheurist/Rianell](https://github.com/Metaheurist/Rianell)

<!-- RIANELL_BUILD_INFO_START -->

[![CI builds](https://img.shields.io/badge/build-iOS%2057%20%7C%20Android%2057%20%7C%20Web%2057-2e7d32?style=flat-square)](https://github.com/Metaheurist/Rianell/actions/runs/23415375502)

**CI builds**

| Channel | Build |
| :--- | :---: |
| ![Alpha](https://img.shields.io/badge/Alpha-blue?style=flat-square&logoColor=white) **iOS** (Xcode project zip) | **57** |
| ![Beta](https://img.shields.io/badge/Beta-orange?style=flat-square&logoColor=white) **Android** APK | **57** |
| ![Beta](https://img.shields.io/badge/Beta-orange?style=flat-square&logoColor=white) **Web / PWA** (GitHub Pages deploy) | **57** |

Latest: [`App build/Android/app-debug-beta-57.apk`](App%20build/Android/latest.json) · [`App build/iOS/Health-Tracker-ios-alpha-build-57.zip`](App%20build/iOS/latest.json) · [Workflow #57](https://github.com/Metaheurist/Rianell/actions/runs/23415375502) · `1190ed3`

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

## Security

The authoritative guide is **[docs/SECURITY.md](docs/SECURITY.md)** (web app, Android, Python server, encryption, Supabase RLS, CSP). For local secrets, see **`security/`** and **`security/.env.example`**.

## Security notes

Commit/deploy checklist and supplementary pointers (RLS, CI audits, “do not commit secrets”) are in **[docs/project-reference.md](docs/project-reference.md#nav-security-notes)** under **Security notes**.
