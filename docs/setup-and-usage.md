<a id="nav-installation"></a>

## ⚙️ Installation

### v1.46.14 documentation sync

- **Repository performance benchmarks** (Lighthouse, Expo bundle stats, history/compare Markdown) live under **`benchmarks/`** (npm workspace **`@rianell/benchmark-runner`**). From the repo root: **`npm ci`**, then **`npm run benchmark`** (see **`benchmarks/README.md`**). CI writes the same tree on **`main`** via **`commit-benchmarks`**.

### v1.45.41 documentation sync

- RN parity status references are aligned with the active plan/changelog: baseline AIEngine/LLM hooks, demo-mode lifecycle parity, and benchmark-tier model selection are implemented; deeper benchmark-detail UI parity remains open.
- Install/download controls are web/PWA-facing by product scope; RN app settings do not expose in-app install buttons.

### v1.44.2 documentation sync

- Local server startup keeps CI-parity web preprocessing (`server/launch-server.ps1`) so runtime theme and UI behaviour matches built artifacts more closely.
- Theme persistence now applies from first paint, including loading overlay visuals, when `rianellSettings.globalTheme` is present.

### v1.45.2 documentation sync

- Unified CI now includes a dedicated app functionality unit-test stage (`npm run test:unit`) before Android/iOS/server build and Pages deploy jobs.

### v1.45.3 documentation sync

- Unit tests now cover behaviour-level contracts in addition to markup wiring (theme apply flow, MOTD tab scoping, voice-input permission checks, and selected CSS contracts).
- Run locally from repo root:
  ```bash
  npm run test:unit
  ```

### Prerequisites
- Python 3.8 or higher
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Supabase account (for cloud sync features)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Metaheurist/Rianell.git
   cd Rianell
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   - Copy [`security/.env.example`](../security/.env.example) to **`security/.env`** (see [SECURITY.md](SECURITY.md#local-secrets-directory-security)). If that file is missing, the server still loads a legacy `.env` at the repo root.
   - Edit **`security/.env`** and add your Supabase credentials:
     ```env
     PORT=8080
     HOST=127.0.0.1
     SUPABASE_URL=your_supabase_url_here
     SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
     # Legacy: SUPABASE_ANON_KEY=… still works if PUBLISHABLE is unset
     ```
  - **React Native parity:** `apps/rn-app/app.config.js` reads the same names (`SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY`, legacy `SUPABASE_ANON_KEY`) and also supports `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`. You can copy these into `apps/rn-app/.env` for local RN builds.
  - **RN LLM endpoint (optional):** for AI summary note / MOTD generation in RN, set `EXPO_PUBLIC_LLM_ENDPOINT` (or `LLM_ENDPOINT`) in `apps/rn-app/.env`. If unset or unavailable, RN falls back to deterministic AIEngine note generation.

4. **Configure Supabase (for frontend)**
   - Edit `supabase-config.js` with your Supabase credentials
   - ⚠️ **Important**: Use the **Publishable** key only in the client, never a **Secret** key (e.g. service_role).


<a id="nav-usage"></a>

## 🚀 Usage

### Running the Server

Start the development server from the **repository root** (so the `server` package resolves correctly):

```bash
python -m server
```

On **Windows**, you can use the helper script (same behaviour as `python -m server`):

```powershell
powershell -ExecutionPolicy Bypass -File .\server\launch-server.ps1
```

If you use PowerShell 7+:

```powershell
pwsh -File .\server\launch-server.ps1
```

For local **non-compiled** mode (serve **`apps/pwa-webapp/`** directly), use:

```powershell
powershell -ExecutionPolicy Bypass -File .\server\launch-server.ps1 -NoCompile
```

In `-NoCompile` mode, the launcher runs unit tests (`tests/unit/app-functionality.test.mjs`) before starting the server. To skip this gate:

```powershell
powershell -ExecutionPolicy Bypass -File .\server\launch-server.ps1 -NoCompile -SkipUnitTests
```

Optional port:

```powershell
$env:PORT = "9000"
powershell -ExecutionPolicy Bypass -File .\server\launch-server.ps1
```

The server will:
- Start on `http://localhost:8080` (or your configured PORT)
- Open your browser automatically
- Display a Tkinter dashboard for server controls
- Enable file watching for auto-reload (if watchdog is installed)

### Accessing the App

1. **Local Development**: Open `http://localhost:8080` in your browser
2. **Network Access**: The server defaults to **loopback** (`127.0.0.1`). To open the app from another device on your LAN, set **`HOST=0.0.0.0`** in **`security/.env`** (or legacy root `.env`) and use your PC’s LAN IP (see [SECURITY.md](SECURITY.md)). For sensitive dev APIs from non-loopback clients, set **`HEALTH_APP_SENSITIVE_APIS_ON_LAN=1`** (trusted networks only). Optional **`HEALTH_APP_SENSITIVE_APIS_LAN_SECRET`**: when set, clients must send **`X-Rianell-LAN-Secret`** for those APIs. Server logs use **rotation** (size-capped); see [SECURITY.md](SECURITY.md).
3. **Production**: Deploy files to a web server (no local server needed)

**Install manifest URLs (Android / iOS `latest.json`):** On `localhost`, `127.0.0.1`, and `::1`, the app does **not** fetch `App build/Android/latest.json` or `App build/iOS/latest.json`, because those files are produced by CI and deployed with the site. Default install links still point at fallback paths. To test manifest-driven links locally, open the devtools console and run `sessionStorage.setItem('forceAppBuildManifest','1')`, then reload.

<a id="github-pages-app-at-repo-root"></a>

### GitHub Pages (app at repo root)

The app lives in **`apps/pwa-webapp/`**, so GitHub Pages will not see `index.html` if the source is the repo root. The public site is **[rianell.com](https://rianell.com/)**; GitHub Actions can also deploy the same build to Pages (e.g. `https://<user>.github.io/Rianell/`).

1. In the repo: **Settings → Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. The unified workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs the **`deploy-pages`** job on push to `main`/`master` and deploys a prepared **`site/`** folder as the site root (copy of **`apps/pwa-webapp/`** plus `App build/` if present), so `index.html` is served correctly. The job runs **`npm ci`** (with lockfile cache), then **`node apps/pwa-webapp/build-site.mjs --site site`** - same pipeline as local **`npm run build:web`**: instrument first-party JS (optional function trace hooks), minify **`app.js`** → **`app.min.js`** - then rewrites **`index.html`** to load the minified bundle for smaller downloads.

**Custom domain (`rianell.com`):** In **Settings → Pages**, set the custom domain and keep **Enforce HTTPS** on. At your DNS provider, use GitHub’s documented records (apex: four **A** records to `185.199.108.153`–`185.199.111.153`; **www**: **CNAME** to `<user>.github.io`). This repo includes **`apps/pwa-webapp/CNAME`** (contents: `rianell.com`) so each deploy publishes the domain hint at the site root, alongside the GitHub UI setting.

If the site works elsewhere but your PC shows **`ERR_CONNECTION_REFUSED`**, DNS is often fine globally while your machine still has a stale cache, a bad **AAAA**, or a firewall/VPN path. Run **`powershell -ExecutionPolicy Bypass -File .\scripts\check-rianell-dns.ps1`** from the repo to verify **A**/**AAAA**/**www**, then try **`ipconfig /flushdns`**, another network (e.g. phone on cellular), or remove incorrect **AAAA** records for the apex.

**Cloud sync on the live site:** To use Supabase (login, cloud backup, anonymised data) on the GitHub Pages site, add **Repository secrets** (or **Environment secrets** for the `pages` environment): **`SUPABASE_URL`** (your project URL, e.g. `https://xxxx.supabase.co`) and **`SUPABASE_ANON_KEY`** (your **Publishable** key from the Dashboard; the workflow variable name is legacy). The deploy workflow injects these into the built site at deploy time so they are never committed. If these secrets are not set, the site still deploys; cloud features will work only after you add them.

After the first push (or a manual **Run workflow**), the deployed site will show **Rianell** instead of the README.

<a id="nav-react-android"></a>

## 📱 React shell & Android APK

The app can be run as a **React (Vite) app** that wraps the existing web UI and be built into an **Android APK** via Capacitor. **On the APK**, the WebView loads **`legacy/index.html` directly** (single document) for better scroll and memory behaviour than embedding legacy inside a React iframe. **In the browser**, the same build still uses the React shell + iframe at `/legacy/` for local preview. The GitHub Action **Build Android APK** runs on every push to `main`/`master`, output to **`App build/Android/`** and **`App build/iOS/`**, and makes it available in the app’s Settings.

### In-app installation (Settings)

- **Install web app** (globe icon): Install the app as a PWA / standalone web app.
- **Install on Android** (Android icon): Download the latest Android APK. When the app is served from the same origin (e.g. GitHub Pages), the link uses the newest build from **`App build/Android/`** (see `latest.json`).
- **Install on iOS / iPhone / iPad**: On iPhone or iPad, open the site in Safari and use **“Install on this iPhone”** or **“Install on this iPad”** in Settings to add the app to your Home Screen (one-tap flow; works offline like a native app). Alternatively, download the Xcode project zip from **Install on iOS** and build to your device in Xcode. If a signed .ipa is provided in **`App build/iOS/`** (with `installUrl` in `latest.json`), **Install on iOS** becomes a one-tap native install from the site.

<a id="local-setup-optional"></a>

### Local setup (optional)

- **Node.js 24.14.1+** (LTS; see root [`package.json`](../package.json) `engines` and [`.nvmrc`](../.nvmrc))
- From repo root:
  ```bash
  npm install
  cd apps/capacitor-app && npm install
  npm run copy-webapp   # copies PWA into apps/capacitor-app/public/legacy
  npm run build        # builds React app into apps/capacitor-app/dist
  ```
- To add the Android project (one-time, then commit `apps/capacitor-app/android/` if you want):
  ```bash
  cd apps/capacitor-app && npx cap add android
  npx cap sync android
  node patch-android-sdk.js   # minSdk/targetSdk/compileSdk, R8, notifications, portrait, hardwareAccelerated, network_security_config + manifest cleartext cleanup
  ```
- **Launcher icon & splash (APK / iOS):** Raster PWA icons live under **`apps/pwa-webapp/Icons/`** (generated from **`logo-source.png`** and committed). They are **not** copied into native projects by `cap sync`. **`npm run build:android`** runs **`scripts/prepare-android-assets.mjs`** (builds **`apps/capacitor-app/assets/logo.png`**) then **`@capacitor/assets`** for Android mipmaps/splash before **`cap sync`**. For iOS, add the platform and run **`cd apps/capacitor-app && npx @capacitor/assets generate --ios`** (with **`logo.png`** present) or align assets in Xcode.
- **Performance (APK):** Use **`npm run build:apk`** (or **`npm run build:android`**) so **`apps/pwa-webapp/build-site.mjs --skip-trace`** writes **`apps/pwa-webapp/app.min.js`** and a full **`apps/pwa-webapp/.android-dist/`** tree: every first-party **`.js`** (except **`app.js`**, which is replaced by **`app.min.js`**) and **`.css`** file is **esbuild-minified** for smaller parse and transfer. **`apps/capacitor-app/copy-webapp.js --min`** copies from **`.android-dist`** when present (otherwise falls back to **`apps/pwa-webapp/`** + HTML patch for **`app.min.js`** only). The same **`--skip-trace`** path runs in **GitHub Actions** for the **`android`** / **`ios`** jobs. **`apps/capacitor-app/patch-android-sdk.js`** adds **`network_security_config.xml`** (cleartext off by default), wires it in **`AndroidManifest.xml`**, strips **`usesCleartextTraffic="true"`** if present, sets **`android:hardwareAccelerated="true"`** on **`<application>`** when missing, enables **R8** (`minifyEnabled true`) and **resource shrinking** for the **release** Gradle build type, and appends **ProGuard** keep rules for Capacitor. **CI publishes a debug APK** (`assembleDebug`); for **smaller/faster runtime** builds locally, run **`./gradlew assembleRelease`** in **`apps/capacitor-app/android`** with your signing config. For Play Store, prefer **`./gradlew bundleRelease`** (AAB). GitHub Pages / default **`npm run build`** keeps function-trace for the deployed site; **`apps/pwa-webapp/.android-dist/`** is gitignored.
- **APK update prompt:** Handled in **`apps/pwa-webapp/android-update-check.js`** (Android native only), comparing **`App.getInfo().build`** to **`apk/latest.json`** on the update host (default **`https://rianell.com/`**).
- **Profiling (WebView vs Chrome):** On device, enable USB debugging and use Chrome **Remote devices** / **inspect** for the WebView; compare **Performance** recordings (LCP, long tasks) with desktop Chrome on the same flows. **`PerformanceUtils.isRianellCapacitorAndroid()`** is exposed for feature checks in the console.
- **Regression checklist (after native entry changes):** (1) Browser: **`npm run dev`** - legacy loads in iframe, settings and charts work. (2) **`npm run build`** + static preview - same. (3) Android APK - cold start opens dashboard directly (no double shell), **local notifications**, optional **PayPal** / **ML** paths if you use them, **system back** exits as expected. (4) Keep **Android System WebView** (or Chrome as WebView provider) updated on test devices.
- Open in Android Studio: `cd apps/capacitor-app && npx cap open android`

### Android targets

- **minSdk 22** (Android 5.1) for broad device support.
- **targetSdk 34** (Android 14) for current store requirements.  
Controlled in `apps/capacitor-app/android/variables.gradle` (or via `apps/capacitor-app/patch-android-sdk.js`).

### CI: App builds on each commit

- **Android / iOS** CI: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) - `android` and `ios` jobs (PR builds; on `main`/`master` pushes also commit `App build/`, release assets, and Pages). iOS builds a **simulator .app** (no Apple account; test in Xcode Simulator on a Mac) and zips the Xcode project to `App build/iOS/` for device sideloading (open in Xcode, sign with your Apple ID). Device signing for direct install (OTA) requires an Apple Developer account ($99/year).
- On **push** or **pull_request** to `main` or `master`: builds the web app, syncs Capacitor, builds a **debug APK** (Beta) via **`assembleDebug`**, copies it into **`App build/Android/`** as **`app-debug-beta.apk`** (and a run-numbered copy), and uploads the **android** artifact. To ship a **signed release** APK/AAB from CI, add Gradle **`signingConfigs.release`** and a workflow step **`./gradlew assembleRelease`** or **`bundleRelease`** (store signing secrets in GitHub Actions); release builds are smaller and typically snappier than debug. iOS outputs **Alpha** Xcode project zips: **`Health-Tracker-ios-alpha-build-{run}.zip`**, **`Health-Tracker-ios-alpha-latest.zip`**, optional **`Health-Tracker-simulator-alpha-{run}.zip`** (`{run}` = workflow run number).
- On **push** (not PR) to `main`/`master`: the workflow also **commits** the `App build/Android/` folder to the repo with `[skip ci]`, so the “Install on Android” link in Settings works when the app is served from the same repo (e.g. GitHub Pages).
- Download the APK from the run’s **Summary → Artifacts** (name **android**), or use **Settings → Install on Android / Install on iOS** in the deployed app.

### Using Rianell

1. **Add Daily Entries**:
   - Click "Add Entry" button
   - Fill in health metrics for the day
   - Add food items and exercises
   - Save the entry

2. **View Analytics**:
   - Navigate to the Analytics section
   - View charts showing trends
   - Analyse correlations between metrics

3. **Manage Data**:
   - Export data: Settings → Export Data
   - Import data: Settings → Import Data
   - Clear all data: Settings → Clear All Data

4. **Cloud Sync**:
   - Enable "Contribute anonymised data" in Settings
   - Accept GDPR agreement
   - Data will be anonymised and synced to Supabase

<a id="server-dashboard-features"></a>

### Server Dashboard Features

![Rianell Server Dashboard - local URL, Supabase connection, database viewer, and live server logs](images/server-dashboard.png)

The Tkinter dashboard provides:

1. **Server Status**:
   - View server URL and status
   - Restart server without closing dashboard

2. **Supabase Database Management**:
   - **Search**: Search anonymised data by medical condition
   - **Delete**: Remove data (all, by condition, or specific IDs)
   - **Export**: Export data to CSV files
   - **Viewer**: Real-time database viewer showing last 100 records

3. **Server Logs**: Real-time log viewer using **`[DEBUG]`** / **`[INFO]`** / **`[WARNING]`** / **`[ERROR]`** / **`[CRITICAL]`** at the start of each line (two spaces after the bracket), with colour on that tag (e.g. blue for `[INFO]`, red bold for `[ERROR]`). The terminal and `logs/*.log` files still use **emoji** prefixes-see [Logging](project-reference.md#logging).
