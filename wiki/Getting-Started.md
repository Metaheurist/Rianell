# Getting Started

Rianell runs as a **web app (PWA)**, **Android/iOS native app**, or via a **local development server**. No account is required for local-only use.

---

## Option 1 — Web app (recommended)

1. Open **[rianell.com](https://rianell.com)** in Chrome, Firefox, Edge, or Safari.
2. **Install as PWA** (optional): use the browser’s “Install app” or “Add to Home Screen” prompt for offline-capable access.
3. Tap the green **+** button to open the **log wizard** and save your first day (date + flare is enough for a quick entry).

Cloud sync and AI model download are optional — you can use the app entirely offline with data stored in your browser.

---

## Option 2 — Android (alpha)

1. Download the latest APK from [[Downloads]] or [GitHub Releases](https://github.com/Metaheurist/Rianell/releases).
2. Enable “Install unknown apps” for your browser or file manager if prompted.
3. Install and open **Rianell**. Sign in only if you want cloud backup.

---

## Option 3 — iOS (alpha)

1. Download the latest Xcode project zip from [[Downloads]] or GitHub Releases.
2. Open in Xcode, select your team, and run on a device or simulator.
3. Alpha builds are for testers comfortable with sideloading or Xcode installs.

---

## Option 4 — Local development server

For contributors or self-hosting:

```bash
git clone https://github.com/Metaheurist/Rianell.git
cd Rianell
pip install -r requirements.txt
python -m server
```

Open `http://localhost:8080`. See [[Developer-Setup]] for Node, Supabase, and React Native setup.

---

## First steps in the app

1. **First-run setup** — confirm your privacy region, accept cookies, review **session recording** (on by default; you can turn it off), then take the quick tour — including optional **cycle tracking**. Medical condition and tracking profile are configured later in **Settings**.
2. **Log a day** — tap **+**, pick date and flare (Yes/No), add any vitals you track, then save.
3. **Explore tabs** — **Home** (summary), **View logs** (history), **Charts** (trends), **Mood**, **AI Analysis** (insights).
4. **Settings** (gear icon) — language, theme, goals, privacy, consent dashboard, and optional cloud sync.
5. **Demo mode** — try sample data without affecting your real logs (Settings → Data options).

---

## Optional: cloud sync and AI

- **Cloud backup** requires a Supabase account (sign-in in Settings). You’ll see a **health data consent** dialog before first sync. See [[Cloud-Sync-and-Backup]] and [[Privacy-and-Your-Data]].
- **On-device AI summaries** download a large model (~3.5 GB) once. Desktop shows progress near the **+** button; mobile may show a blocking download dialog. See [[Charts-and-AI]].

---

## Read more (technical)

- [Installation & usage](https://github.com/Metaheurist/Rianell/blob/main/docs/setup-and-usage.md)
- [App overview & features](https://github.com/Metaheurist/Rianell/blob/main/docs/app-and-features.md)
