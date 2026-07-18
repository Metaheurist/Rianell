# Downloads

Rianell is a **web app (PWA)** - there is nothing to download to use it. The optional Windows **server** build is produced by GitHub Actions and published with each release (labelled **Beta**).

---

## Build channels

| Channel | Platform | Artifact |
|---------|----------|----------|
| **Beta** | Web / PWA | Live at [rianell.com](https://rianell.com); also GitHub Pages |
| **Beta** | Windows server | x64 and x86 EXE (local dev server + dashboard) |

---

## Web / PWA

No download required - use **[rianell.com](https://rianell.com)**. Install to your home screen for an app-like experience (service worker + manifest). See [[Getting-Started]].

---

## Windows server EXE

The Python server packaged with PyInstaller for local hosting:

- **x64** - most modern PCs
- **x86** - older 32-bit Windows

Run the EXE to serve the PWA locally with a Tk dashboard. For development, `python -m server` from a git clone is equivalent. See [[Developer-Setup]].

Artifacts are published on the [Releases page](https://github.com/Metaheurist/Rianell/releases) and in `artifacts/Server/` (`rianell-server-x64.exe`, `rianell-server-x86.exe`).

---

## Version info

Current app version is in [package.json](https://github.com/Metaheurist/Rianell/blob/main/package.json). Release highlights: [[Release-Notes]].
