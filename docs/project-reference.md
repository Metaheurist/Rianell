<a id="nav-repo-tree"></a>

## 🗂️ Project Structure

### v1.44.2 documentation sync

- Added parity/testing references for `docs/platform-parity.md` and `docs/platform-parity.json` release metadata.
- Styling references now include settings mini-icon navigation and single-tone MOTD 3D title updates in `docs/styling.md`.

```
Rianell/
├── apps/
│   ├── pwa-webapp/         # Static PWA (GitHub Pages site root; parity reference)
│   │   ├── index.html      # Main application HTML
│   │   ├── app.js          # Core application logic
│   │   ├── app.min.js      # (generated) esbuild minify - gitignored; use npm run build:web
│   │   ├── build-site.mjs  # esbuild script → app.min.js
│   │   ├── logs-idb.js     # IndexedDB mirror for health logs (optional async backup)
│   │   ├── styles-charts.css
│   │   ├── sw.js
│   │   ├── workers/
│   │   ├── AIEngine.js
│   │   ├── styles.css
│   │   ├── Icons/
│   │   ├── cloud-sync.js
│   │   ├── supabase-config.js
│   │   ├── summary-llm.js
│   │   ├── notifications.js
│   │   └── …
│   ├── rn-app/             # React Native (Expo) CLI — primary native mobile surface
│   │   └── src/            # Tabs, Log wizard, Charts, AI, Settings, …
│   └── capacitor-app/      # Legacy Vite + Capacitor WebView shell
│       ├── src/
│       ├── android/
│       ├── copy-webapp.js  # Copies PWA into public/legacy
│       ├── patch-android-sdk.js
│       └── capacitor.config.ts
├── requirements.txt
├── package.json            # Workspaces: apps/*, packages/*
├── scripts/
├── docs/
├── .github/workflows/
├── App build/              # CI artifacts + latest.json (download links)
├── server/                 # Python HTTP server (serves apps/pwa-webapp by default)
├── security/
└── logs/
```

<a id="nav-dependencies"></a>

## 📦 Dependencies

### Python (server package)
- `supabase>=2.0.0` - Supabase client library
- `watchdog>=3.0.0` - File watching for auto-reload
- `python-dotenv>=1.0.0` - Environment variable management

### JavaScript (Frontend)
- No external dependencies required for the main web app (vanilla JavaScript)
- Uses browser APIs and Supabase JS client
- Font Awesome 6 (CDN) for icons

### Node.js (optional: React & Android)
- Used only for the React/Capacitor build and Android APK. See **React shell & Android APK**.
- Root `package.json`: scripts for `build`, `build:android`, `build:web` (minify `apps/pwa-webapp/app.js` → `app.min.js`), `sync`, `dev`
- `apps/capacitor-app/`: Vite 6, React, Capacitor 7; run `npm run build` from repo root

<a id="nav-development"></a>

## 🛠️ Development

### File Watching
The server automatically reloads when files change (if watchdog is installed):
```bash
pip install watchdog
```

### Logging
Server logs are saved to `logs/rianell_YYYYMMDD.log`. The `Rianell` logger uses these formatters in `server/config.py`:

- **`EmojiLogFormatter`** (handler: **file** only): each line starts with a level emoji (`🐛` DEBUG, `ℹ️` INFO, `⚠️` WARNING, `❌` ERROR, `💥` CRITICAL; anything else `📋`), **two spaces**, then the usual timestamp, level name, logger name, and message. Plain text so logs stay grep-friendly.
- **`ConsoleColorBracketFormatter`** (handler: **console** / `StreamHandler`): each line starts with a coloured **`[LEVEL]`** prefix (ANSI: e.g. blue for INFO, red for ERROR) when stdout is a TTY; **no** escape codes when `NO_COLOR` is set (or when not a TTY). Set **`FORCE_COLOR=1`** to force colour when piping if your terminal supports it.
- **`BracketLevelFormatter`** (handler: **Tkinter dashboard** `TextHandler` in `server/main.py` only): each line starts with **`[LEVEL]`** and two spaces, then the same timestamp / level / name / message body. The UI applies **colour tags** to the bracket so logs stay readable without relying on emoji in Tk’s `Text` widget (**Consolas** is used for the log pane).

### Browser Compatibility
- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (responsive design)

<a id="nav-gdpr"></a>

## 🛡️ GDPR Compliance

The app includes GDPR-compliant data sharing:
- Explicit user consent required
- Data anonymisation before upload
- Clear privacy agreement
- User can disable at any time

<a id="nav-troubleshooting"></a>

## 💡 Troubleshooting

### Server Issues

**Port already in use**:
- Change `PORT` in **`security/.env`** (or legacy root `.env`) or close the application using port 8080

**Supabase connection failed**:
- Verify credentials in **`security/.env`** (or legacy root `.env`) and `supabase-config.js`
- Check Supabase project is active
- Ensure using publishable key, not secret key

**Tkinter dashboard not opening**:
- Install tkinter: `sudo apt-get install python3-tk` (Linux)
- On Windows/Mac, tkinter usually comes with Python

### App Issues

**Data not saving**:
- Check browser console for errors
- Verify localStorage is enabled
- Check browser storage quota

**Charts not displaying**:
- Check browser console for JavaScript errors
- Ensure data entries exist
- Try clearing browser cache

**Console: `tabs:outgoing.message.ready`, `No Listener`, or `vendor.js` (VM…)**:
- Usually **browser extensions** injecting into the page, not the Health app. The app **suppresses** matching **`unhandledrejection`** events (see early script in `apps/pwa-webapp/index.html` and `apps/pwa-webapp/app.js`). If messages persist, try a **clean profile** or **disable extensions** on the site.

<a id="nav-security-notes"></a>

## 🔐 Security notes

Start with the full guide: **[SECURITY.md](SECURITY.md)** (see also [Security overview](../README.md#security) in the main README). Supplementary references: [supabase-rls-recommended.sql](supabase-rls-recommended.sql), CI workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) - `security-audit` job (Gitleaks, `npm audit`, `pip-audit`).

⚠️ **Important security considerations**:

1. **Never commit sensitive files**:
   - **`security/.env`** (or legacy root `.env`) - Supabase credentials
   - **`security/.encryption_key`** - encryption key material
   - `supabase-config.js` (contains API keys)

2. **Use environment variables** for production deployments

3. **Supabase Keys**: Always use PUBLISHABLE/ANON keys in frontend code, never secret keys

4. **Data Privacy**: Anonymised data sharing is opt-in only
