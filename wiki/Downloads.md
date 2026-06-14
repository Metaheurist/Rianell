# Downloads

Official builds are produced by GitHub Actions and published with each release. Channels are labelled **Alpha** (mobile) or **Beta** (server and web).

---

## Build channels

| Channel | Platform | Artifact |
|---------|----------|----------|
| **Beta** | Web / PWA | Live at [rianell.com](https://rianell.com); also GitHub Pages |
| **Alpha** | Android | React Native CLI debug APK |
| **Alpha** | iOS | Xcode project zip (RN CLI) |
| **Beta** | Windows server | x64 and x86 EXE (local dev server + dashboard) |

---

## Where to download

1. **Releases page** — [github.com/Metaheurist/Rianell/releases](https://github.com/Metaheurist/Rianell/releases) (attached assets).
2. **App build folder** in the repo (CI-updated `latest.json` pointers):
   - Android: `App build/RNCLI-Android/` — see `latest.json` for current APK filename
   - iOS: `App build/iOS/` — see `latest.json` for current zip
   - Server: `App build/Server/` — `rianell-server-x64.exe`, `rianell-server-x86.exe`

Check the root [README](https://github.com/Metaheurist/Rianell/blob/main/README.md) CI build table for the latest build numbers.

---

## Web / PWA

No download required — use **[rianell.com](https://rianell.com)**. Install to your home screen for an app-like experience (service worker + manifest).

---

## Android APK

1. Download the latest `app-debug-beta.apk` (or name from `latest.json`).
2. Install on device (unknown sources may need enabling).
3. For updates, download a newer build or watch GitHub Releases.

---

## iOS

Alpha iOS builds ship as a **zip** containing an Xcode project. You need Xcode and an Apple developer team to run on a physical device. This is intended for testers, not App Store distribution yet.

---

## Windows server EXE

The Python server packaged with PyInstaller for local hosting:

- **x64** — most modern PCs
- **x86** — older 32-bit Windows

Run the EXE to serve the PWA locally with a Tk dashboard. For development, `python -m server` from a git clone is equivalent. See [[Developer-Setup]].

---

## Version info

Current app version is in [package.json](https://github.com/Metaheurist/Rianell/blob/main/package.json). Release highlights: [[Release-Notes]].
