<a id="nav-repo-tree"></a>

## 🗂️ Project Structure

### v1.61.0 documentation sync (README icons)

- **README:** Documentation table uses **`docs/icons/*.svg`** (referenced via `<img>` for GitHub rendering).
- **i18n:** See v1.54–v1.60 segments in [CHANGELOG.md](CHANGELOG.md); canonical packs under **`i18n-packs/`**; **`npm run verify:i18n`**.

### v1.60.0 documentation sync (full UI localization)

- **i18n paths:** `i18n-packs/` — `locale-packs/v1/` (UI + policy strings), `prompt-packs/v1/` (LLM templates), `motd-packs/v1/` (offline quotes), `policy-packs/v1.json`; synced by **`scripts/sync-i18n-assets.mjs`**.
- **Shared runtime:** `packages/shared/src/i18n/` — `translate.mjs`, `resolveLocale.mjs`, `format.mjs`, `rtl.mjs`, `promptPack.mjs`, generated `promptPackData.mjs`.
- **PWA:** `apps/pwa-webapp/i18n-pwa.js` → `window.RianellI18n`; **RN:** `apps/rn-app/src/i18n/I18nProvider.tsx` → `useT()`.
- **Verify:** `scripts/verify-locale-packs.mjs`, `verify-prompt-packs.mjs`, `audit-hardcoded-strings.mjs`.

### v1.53.1 documentation sync (settings/privacy fixes)

- **PWA:** Settings carousel nine panes, policy HTML modal, benchmark **`global` → `window`** fix — see [CHANGELOG.md](CHANGELOG.md) v1.53.1.
- **RN:** Mobile typecheck fixes in **`sync.ts`**, **`AiModelDownloadGate.tsx`**, **`PolicyDocumentsModal.tsx`**.

### v1.53.0 documentation sync (LLM scripts + gitignore)

- **Model scripts (repo root):** `models:download`, `models:upload:supabase`, `models:verify` — see [testing-and-configuration.md](testing-and-configuration.md).
- **Gitignore:** `apps/pwa-webapp/models/**/onnx*` excluded; weights live on Supabase Storage only.

### v1.46.28 documentation sync (PWA content-hashed bundles)

- **Build:** Production PWA output uses **`app.<hash>.min.js`** and (for **`--site`** / **`.android-dist`**) **`styles.<hash>.css`**, with **`asset-manifest.json`** at the app root. Source **`index.html`** in git still uses **`app.js?v=`** / **`styles.css?v=`** for local development.

### v1.46.16 documentation sync (security header runs + MOTD)

- **CI security reports:** **`security/securityheaders-rianell.com.md`** and **`security/securityheaders-runs/run-*.md`** are described in **`security/README.md`** and **`docs/infrastructure-and-security-edge.md`**.
- **Web MOTD:** Home-tab **`.motd-spin-host`** tap spin (3D) — see **`docs/styling.md`**.

### v1.46.14 documentation sync (benchmarks folder)

- **Layout:** **`benchmarks/`** is the single workspace for **`@rianell/benchmark-runner`** (scripts, reporters, Playwright specs) and generated Markdown/JSON (**`web-pwa/`**, **`compare.md`**, etc.). See changelog v1.46.13.

### v1.46.11 documentation sync (RN README build vs workflow run)

- **CI:** README **Alpha RN** rows use the **sequential RN build** from **`rn-build-version`** (stored in **`App build/RNCLI-Android/latest.json`**). **Server** and **Web / PWA** rows still follow **`GITHUB_RUN_NUMBER`**. Metadata-only fallback commits keep JSON in sync when large binaries cannot be pushed.
- **Next-phase plan:** `docs/next-phase-development-plan.md` is a short status note (no active roadmap items).

### v1.46.10 documentation sync (CI RN build numbers)

- **CI:** (superseded by v1.46.11) RN `latest.json` briefly used **`github.run_number`**; restored sequential RN counter for correct README differentiation.
- **Tests:** `tests/unit/workflows-ci-rncli.test.mjs` guards the workflow shape.

### v1.46.4 documentation sync

- **Infrastructure:** See **[infrastructure-and-security-edge.md](infrastructure-and-security-edge.md)** for DNS, Cloudflare, and GitHub Pages (public-safe; no account secrets).
- **Benchmarks:** `benchmarks/scripts/lib/` is part of the repo (see `.gitignore` root-only `/lib/` rule) so CI web benchmarks can import the static server and measurement helpers.

### v1.46.3 documentation sync

- **React Native:** `apps/rn-app/src/settings/SettingsAppInstallSection.tsx` provides the native **App installation** block in Settings → **Data management**; `apps/rn-app/src/screens/SettingsScreen.tsx` implements the eight-pane carousel aligned with the web settings overlay.

### v1.44.2 documentation sync

- Added parity/testing references for `docs/platform-parity.md` and `docs/platform-parity.json` release metadata.
- Styling references now include settings mini-icon navigation and single-tone MOTD 3D title updates in `docs/styling.md`.

```
Rianell/
├── apps/
│   ├── pwa-webapp/         # Static PWA (GitHub Pages site root; parity reference)
│   │   ├── index.html      # Main application HTML
│   │   ├── app.js          # Core application logic
│   │   ├── app.<hash>.min.js  # (generated) esbuild + content hash; gitignored — see asset-manifest.json
│   │   ├── asset-manifest.json  # (generated) { mainJs, mainCss? } — gitignored at repo root build
│   │   ├── build-site.mjs  # esbuild + fingerprint-assets.mjs
│   │   ├── fingerprint-assets.mjs  # hashes + index patch for --site
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
│   │   ├── model-chunk-loader.js  # Chunk download + fetch shim for Transformers.js
│   │   ├── models/                # manifest.json (committed); ONNX weights gitignored → Supabase
│   │   ├── notifications.js
│   │   └── …
│   ├── rn-app/             # React Native (Expo) CLI — primary native mobile surface
│   │   └── src/            # Tabs, Log wizard, Charts, AI, Settings, …
├── packages/               # @rianell/shared, ai-engine, cloud-sync, llm, tokens
├── benchmarks/             # @rianell/benchmark-runner — perf reports (CI + local), scripts, reporters
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

For a **complete dependency inventory by build** (workspaces, PWA CDNs, CI-only tools), see **[dependencies.md](dependencies.md)**. That page is **generated** from `package.json` files, `requirements.txt`, and PWA CDN URLs (`npm run docs:dependencies`); CI refreshes it on **main** when needed and **PRs** must match the generator output.

### Python (server package)
- `supabase>=2.0.0` - Supabase client library
- `watchdog>=3.0.0` - File watching for auto-reload
- `python-dotenv>=1.2.2` - Environment variable management ([OSV: GHSA-mf9w-mj56-hr94](https://osv.dev/GHSA-mf9w-mj56-hr94) fixed in 1.2.2)

### JavaScript (Frontend)
- No external dependencies required for the main web app (vanilla JavaScript)
- Uses browser APIs and Supabase JS client
- Font Awesome 6 (CDN) for icons

### Node.js (PWA minify, RN, benchmarks)
- **Minimum Node.js 24.14.1** (LTS); see root `package.json` `engines` and **`.nvmrc`**. Used for PWA minify, Expo/RN, benchmarks, and CI.
- Root `package.json`: scripts for `build:web`, `dev` (Expo), `parity:*`, workspace packages under `packages/*`
- `apps/rn-app/`: Expo SDK 55 / React Native; run `npm run dev` from repo root or `npx expo start` in `apps/rn-app`

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
- Explicit user consent required (including **Art. 9 health-data consent** modal on PWA + RN preference fields — see [data-subject-rights.md](privacy/data-subject-rights.md))
- Data anonymisation before upload
- Clear privacy agreement
- User can disable at any time

**Privacy program index:** [docs/privacy/global-baseline.md](privacy/global-baseline.md) — links to [eu-gdpr.md](privacy/eu-gdpr.md), [dpia-health-sync.md](privacy/dpia-health-sync.md), [data-subject-rights.md](privacy/data-subject-rights.md), [subprocessors.md](privacy/subprocessors.md), [other-jurisdictions.md](privacy/other-jurisdictions.md), and [ropa.json](privacy/ropa.json). Security cross-refs: [threat-model.md](threat-model.md), [incident-response.md](incident-response.md), [ai-security.md](ai-security.md).

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

**PWA / web: tab “restarts”, blank screen, or needing to reload (incl. mobile)**:

- **Not the Python dev auto-reload on GitHub Pages / rianell.com:** The local server’s **`/api/reload`** **SSE** stream is only enabled on **loopback** (`localhost`, `127.0.0.1`, `[::1]`). `index.html` sets `window.__rianellReloadStreamOk` accordingly **before** `app.js` loads, and `connectToReloadStream()` in `apps/pwa-webapp/app.js` returns immediately on **static / production** hosts. Production does **not** poll or subscribe to a dev reload signal.

- **`SES Removing unpermitted intrinsics` / `lockdown-install.js`:** Usually **browser extensions** (e.g. wallet / security tools), not Rianell. They often run again after a **full navigation** or tab restore, so the console can look “noisy” without the app logic repeating incorrectly.

- **Service worker:** On **rianell.com** and **\*.github.io**, `sw.js` registers for caching and updates. The page **reloads** only after you confirm **Update** in the in-app modal (after a new worker is waiting)—not silently in the background for every deploy.

- **Memory and mobile browsers:** On-device **Transformers.js / ONNX**, **ApexCharts**, and a large **log history** can push **heap use** high (hundreds of MB). Mobile Safari and Chrome may **terminate the tab** or reload under pressure—this can feel like a random “crash” or restart. Mitigations: **Settings → Performance → On-device AI model → Small** (lower memory), shorten **AI date ranges**, reduce data in view, or temporarily **disable AI** to confirm stability.

- **“Page did not load correctly” / styles overlay:** If `styles.css` fails to load (network blip), `index.html` shows a **reload** overlay. That is **not** the Python server; fix connectivity or cache and tap **Reload**.

- **Installed iOS PWA (Add to Home Screen) fails or shows a blank screen:** Safari/Chrome **standalone** mode has **no DevTools**. Open once with **`?debug=1`** to show a red **launch error panel** at the bottom of the screen (errors from first script onward); tap **Copy** and share the report. Debug is **off by default**; any old **`localStorage.rianellDebug`** flag is cleared on load. After a deploy, force-quit the home-screen icon and relaunch (or remove and re-add) so **`sw.js`** picks up the new **`CACHE_NAME`**.

**React Native / IDE: `File 'expo/tsconfig.base' not found` on `apps/rn-app/tsconfig.json`**:

- In this monorepo, **`expo`** is installed under **`apps/rn-app/node_modules`**, not the repo root. **`apps/rn-app/tsconfig.json`** extends **`./node_modules/expo/tsconfig.base.json`**; root **`tsconfig.json`** references the mobile app for IDE project discovery.
- Run **`npm install`** at the repo root, then **`npm run typecheck:mobile`**. If the squiggle persists in Cursor/VS Code, **Developer: Reload Window**.

<a id="nav-security-notes"></a>

## 🔐 Security notes

Start with the full guide: **[SECURITY.md](SECURITY.md)** (see also [Security overview](../README.md#security) in the main README). Supplementary references: [supabase-rls-recommended.sql](supabase-rls-recommended.sql), [../supabase/harden-graphql-exposure.sql](../supabase/harden-graphql-exposure.sql) (Security Advisor lints 0026/0027 on live projects), [privacy/global-baseline.md](privacy/global-baseline.md), CI workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) - `security-audit` job (Gitleaks, OSV SARIF, privacy doc verifier, security inventory, SBOM, `npm audit`, `pip-audit`).

⚠️ **Important security considerations**:

1. **Never commit sensitive files**:
   - **`security/.env`** (or legacy root `.env`) - Supabase credentials
   - **`security/.encryption_key`** - encryption key material
   - `supabase-config.js` (contains API keys)

2. **Use environment variables** for production deployments

3. **Supabase Keys**: Always use PUBLISHABLE/ANON keys in frontend code, never secret keys

4. **Data Privacy**: Anonymised data sharing is opt-in only
