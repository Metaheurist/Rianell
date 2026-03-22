# Health App - Personal Health Dashboard

A comprehensive web-based health tracking application with data visualisation, analytics, and cloud synchronisation capabilities.

**Repository**: [https://github.com/Metaheurist/Health-app](https://github.com/Metaheurist/Health-app)

## App overview

```mermaid
%%{init: {'themeVariables': {'fontSize': '14px'}, 'flowchart': {'useMaxWidth': false, 'nodeSpacing': 50, 'rankSpacing': 45}}}%%
flowchart LR
  subgraph tabs [Main tabs]
    Log[Log entry]
    View[View logs]
    Charts[Charts]
    AI[AI Analysis]
  end
  subgraph data [Data]
    Local[localStorage / IndexedDB]
    Cloud[Supabase optional]
  end
  Log --> Local
  View --> Local
  Charts --> Local
  AI --> Local
  Local -.-> Cloud
  Goals[Goals & targets] --> Log
  Settings[Settings] --> Log
  Settings --> Cloud
```

## Features

### Health data tracking
- **Daily log entry**: Record per-day health metrics: resting heart rate (BPM), weight, fatigue, stiffness, back pain, sleep quality, joint pain, mobility, daily function, joint swelling, mood, irritability, weather sensitivity, steps, hydration (glasses).
- **Structured data**: Flare (yes/no), stressors, symptoms, pain location, notes; food log (meals with items); exercise log (activities with duration).
- **Medical condition**: Optional label stored in settings and used for anonymised data aggregation and AI context; user can change or clear it.

### App shell and log experience (web UI)

![Home tab — daily message, last 7 days vs targets, and Log today](docs/images/home-dashboard.png)

- **Home / Today**: Default tab with greeting, date, logging status, goals snippet when enabled, and **Log today** to start the entry flow.
- **Log entry wizard**: Step-by-step flow (date & flare → vitals → symptoms & pain → energy & day → food → exercise → medication & notes → review) with step indicator, **Back** / **Skip** / **Next**, and **Save entry** on the last step. Drafts are debounced to `sessionStorage`; URL hash `#log/step/<1-based step>` restores step when opening the Log tab.
- **Navigation**: Top tab strip on wider screens; **bottom navigation bar** on viewports ≤768px (Home, Log, View logs, Charts, AI) with comfortable spacing between items so only one nav chrome shows per breakpoint.
- **Layout**: Extra horizontal padding in the log wizard on small screens; **`--card-content-padding-x`** in `styles.css` sets consistent horizontal inset inside bordered cards (`.form-section` / `.section-content`), including wizard vitals and other steps, log date/flare blocks, and review—so labels, inputs, and controls (e.g. weight unit toggle) are not flush to the card edge. **Tile pickers** (energy & mental clarity, stressors, symptoms, food by meal, exercise by category) open in a **full-screen `<dialog>` bottom sheet** on phones and a centred max-width sheet on wider viewports; chip content is moved into the sheet and restored on close (same IDs and handlers as before). Optional **per-section search** filters chips on the client. Sticky wizard actions use a flat bar (no heavy drop shadow behind the button row).

![Card selector modal — energy & mental clarity (grouped options and filter)](docs/images/card-selector-energy-clarity.png)

- **View logs**: Date range shortcuts (Today / 7 / 30 / 90 days) or custom dates, **Filter** and **Oldest** / **Newest** sort; **Your entries** lists per-day cards with vitals, symptoms, wellbeing, food, exercise, flare status, and edit / delete / share.

![View Logs tab — range filters and a detailed entry card](docs/images/view-logs.png)

### Charts and visualisation
- **Combined chart**: Multi-metric line chart with date range filter; optional AI-powered trend predictions (when AI enabled); metric selector; balance and single-chart views.
- **Individual metric charts**: Per-metric ApexCharts (e.g. fatigue, stiffness, BPM, sleep, steps, hydration) with lazy loading and device-based point caps.
- **Chart view modes**: Use **Balance**, **Combined**, or **Individual** in the Charts tab. Only the active mode’s layout is shown (combined, balance radar, or per-metric charts). Saved preference uses **`chartView`** as the source of truth; legacy **`combinedChart`** is kept in sync when settings load.
- **Chart behaviour**: Date range (7/30/90 days) and prediction range; predictions can be toggled off; empty state when no data; animations respect reduced-motion and device class. Charts tab opens in balance view; View Logs tab opens with last 7 days.
- **Tier 5 / GPU-accelerated charts**: On tier 5 (or tier 4 with a good GPU), chart containers use GPU-friendly compositor layers and maximum point limits; critical chart and AI preload run with high scheduler priority when supported.
- **Loading behaviour**: App shows a loading overlay until the combined chart and summary LLM preload are ready (or 12s timeout), then reveals the UI so heavy work does not stutter the first paint.

### Performance (optimisation stack)

- **Logs**: Central reads via `getAllHistoricalLogsSync()` (avoids repeated `JSON.parse` of `healthLogs` on hot paths); optional **IndexedDB** mirror in `web/logs-idb.js` (async backup; localStorage remains primary); cache invalidation on save/import.
- **Charts**: In-place **ApexCharts** updates when view/data signatures match (combined, balance, individual); chart-specific styles load on demand from **`styles-charts.css`** when opening the Charts tab (or when the chart section is shown on load).
- **AI**: In-flight **deduplication** of `analyzeHealthMetrics`; guarded AI preload and chart **precompute** (idle / debounced; slower when the tab is hidden).
- **View logs**: For very large histories, **IntersectionObserver** loads additional entries as you scroll (windowed append).
- **Scripts**: **`summary-llm.js`** loads with `requestIdleCallback` on non–low devices (no `document.write`); Font Awesome remains deferred.
- **Build**: Root **`npm run build:web`** runs esbuild (`web/build-site.mjs`) and emits **`web/app.min.js`** (ignored by git). **GitHub Pages** deploy minifies `app.js` → `app.min.js` and rewrites `index.html` accordingly.
- **Web Workers**: `web/workers/io-worker.js` — large JSON **parse** / **stringify** when the optimisation profile has **`useWorkers`** (import / export paths).
- **Service worker**: **Off** by default; opt-in with `localStorage.setItem('healthAppEnableStaticSW','1')` or **`?sw=1`** — `web/sw.js` uses cache-first for static file extensions (test on your host; CSP is same-origin).
- **Python server**: **gzip** for compressible static files when the client sends `Accept-Encoding: gzip`; **Cache-Control** tuned for common static extensions (`server/main.py`).
- **Observability**: Optional **Long Task** logging via `localStorage.setItem('healthAppPerfLongTasks','1')` or debug mode; `performance.mark('health-app-init')` during init.

### AI analysis

![AI Analysis tab — range selector (7 / 30 / 90 days, Custom), Share, and What we found](docs/images/ai-analysis.png)

- **Optional AI**: Settings toggle "Enable AI features & Goals" hides or shows the AI Analysis tab, chart predictions, and Goals.
- **Neural-style pipeline**: Trend regression, correlations, patterns, risk factors, flare prediction, cross-section (food/exercise/stressors/symptoms), clustering, time series, actionable advice, prioritised insights, and a 2–3 sentence summary (see [AI Analysis](#ai-analysis-neural-network-architecture)).
- **Summary note**: In-browser LLM (Transformers.js, flan-t5 by device class) or rule-based fallback; context from analysis and logs; value highlighting in the UI.
- **Dashboard title (MOTD)**: Main header shows a **message of the day** only (no user name). A **stable daily line** is chosen from built-in presets; when AI is enabled and not deferred, the on-device LLM may replace it after the app has loaded. Browser tab title stays **Health Dashboard**.
- **GPU-accelerated LLM**: When the performance benchmark detects a capable GPU (WebGPU or WebGL), the summary/suggest pipeline loads with GPU acceleration; the app falls back to CPU automatically if GPU loading fails. Uses Transformers.js 3.3.2 for stable WebGPU/WebGL support.
- **On-device AI model selection**: Settings → Performance → **On-device AI model** lets you choose **Use recommended (for this device)** (from the performance benchmark), **Small (faster, lower memory)**, or **Base (better quality)**. The benchmark recommends flan-t5-small or flan-t5-base by tier; changing the setting clears the LLM cache so the next summary or suggest note uses the selected model.
- **Suggest note**: LLM or rule-based suggestion for the day’s log note; "Generating…" state on button.
- **Chart predictions**: Combined (and balance) chart can show predicted series from the analysis pipeline; "Calculating predictions…" overlay when computing; cache by date range and log count.
- **Responsiveness**: Analysis yields to the main thread between layers; loading states ("Analyzing…", "Calculating predictions…"); optional Web Worker for AI preload on multi-core devices.

### Goals and targets
- **Goals**: Targets for steps, hydration, sleep quality, and "good days"; progress visible in a dedicated Goals view; stored in settings and synced to cloud when signed in.
- **Medications**: Optional medications list in settings (stored locally and in cloud with settings).

### Data management
- **Export**: CSV and JSON export of health logs from Settings.
- **Import**: Restore from JSON backup; handles compressed (gzip) format.
- **Print**: Print-friendly view of logs and reports.
- **Clear/reset**: Option to clear all local data (with confirmation).

### Cloud sync (Supabase)
- **Anonymised contribution**: Optional "Contribute anonymised data" in Settings; GDPR-compliant consent; data anonymised before upload; medical condition used for server-side aggregation only.
- **Auth**: Sign in / sign out; session state; auth state reflected in sync and settings sync.
- **Settings sync**: Goals and app settings synced to Supabase when signed in (e.g. app_settings table).
- **Deploy**: On GitHub Pages, Supabase URL and anon key are injected at deploy time from repository secrets (`SUPABASE_URL`, `SUPABASE_ANON_KEY`); no credentials in the repo.

### Notifications and reminders
- **Daily reminder**: Configurable time; system notification when the app is in the background.
- **Sound**: "Enable sound notifications" controls system notification sound and an in-app heartbeat-style sound when the app is in the foreground (including on mobile).

### Install and run options
- **PWA / Install web app**: Add to home screen from Settings (globe icon); runs standalone and works offline.
- **Install on Android**: Download APK from Settings (or Install modal); CI builds debug APK on push and commits to `App build/Android/` for same-origin download links.
- **Install on iOS**: Add to Home Screen from Safari (Settings or Install modal); or download Xcode project zip from Settings and build in Xcode; optional OTA install if a signed build is provided in `App build/iOS/`.

### Tutorial and onboarding
- **Tutorial**: First-run slides (Welcome, Log entry, View & AI, Settings & data, Data options, Goals, You're all set); first card "Enable AI & Goals?" (Enable / Skip); skipping hides AI-related slides.
- **Install modal**: Post-tutorial modal (once) with web/Android/iOS install options; can be retriggered from God mode.

### Settings and UI
- **Settings**: Weight unit (kg/lb), medical condition, date filters, chart visibility, AI & Goals toggle, contribution toggle, reminder time, sound notifications, cookie/consent; **Demo mode** toggle (sample “John Doe” data for exploration; export/cloud contribution disabled); when demo mode is **on**, demo health logs are **regenerated on each full page load** so sample values and dates stay fresh (desktop: procedural generation; mobile: premade dataset with dates shifted to the recent window). God mode (test UI, show install modal, etc.); **Developer** tools (in God mode): “Clear performance benchmark cache” (clear cache and view last result).
- **Keyboard**: On desktop, **Escape** key opens or closes Settings when no other modal is open.
- **Theme**: Dark mode by default; light mode optional.
- **Responsive**: Layout and charts adapt to viewport and device; device-based optimisation (chart points, animations, AI preload).
- **Device performance (benchmark)**: On first load a short CPU benchmark classifies the device as mobile or desktop and assigns a performance tier (1–5). A **GPU detection and benchmark** (WebGPU/WebGL) runs after the CPU suite with stability samples (5 runs) for a **GPU stability graph**; the result is cached and used to accelerate the on-device AI (Transformers.js) when a GPU is available, with fallback to CPU. **Tier 5** is maxed for resources: highest chart point limits, fastest preload delays, and full UI/chart animation; devices with a good GPU and tier 4 are treated as effective tier 5 for charts and AI. The result is cached in localStorage and drives expansive optimisation profiles (chart points, AI preload, DOM batching, demo data size, **recommended on-device AI model**, etc.). **During the benchmark**, the loading overlay shows a **progress bar** and percentage (e.g. "Measuring performance… 45% · CPU arithmetic"). When the benchmark runs (first run or after cache clear), a **Performance & AI benchmark** modal shows a **brief** result (device, tier, class, recommended AI model, **GPU status**) with an optional **"See detailed benchmark results"** section (test bars, Stability (CPU) and Stability (GPU) sparklines with stats, OS/device/CPU/memory, full profile JSON). Settings → Performance includes **On-device AI model** (Use recommended / Small / Base) with a recommendation hint from the benchmark. God mode (` key) Developer tools: “Clear performance benchmark cache” and "View last benchmark details" let you re-run or inspect the last result. **Note:** Browsers do not expose CPU frequency or turbo boost; the app uses tier + GPU (high-performance preference where supported) to maximise performance and optionally the Scheduler API for critical-path prioritisation.

### Server (testing and development)
- **Local server**: Python HTTP server for local testing (`python -m server`); serves `web/` at root; optional file watching and auto-reload.
- **Windows launcher**: From the repo root, `powershell -ExecutionPolicy Bypass -File .\server\launch-server.ps1` (or `pwsh -File .\server\launch-server.ps1`) runs the same server; optional `$env:PORT` / `$env:HOST` before invoking.
- **Supabase integration**: Server can use Supabase for anonymised data and app_settings; credentials from `.env`.
- **Tkinter dashboard**: GUI for server controls: start/restart server, view URL and status, Supabase search/delete/export, real-time database viewer, server logs. Log lines are prefixed with a **level emoji** (e.g. ℹ️ INFO, ⚠️ WARNING, ❌ ERROR) in the console, log files under `logs/`, and the dashboard viewer—see [Logging](#logging). The dashboard log pane uses a **Segoe UI**–family font so emoji render (monospace fonts such as Consolas do not show emoji in Tkinter’s text widget on Windows).

## Project structure

- **`web/`** – Static web app: HTML, CSS, JavaScript, icons, and assets. The server serves this directory at the root URL.
- **`server/`** – Python server package (main server logic in `main.py`, plus config, encryption, Supabase client, sample data, requirements checks). Run from repo root: **`python -m server`**, or on Windows **`server/launch-server.ps1`** (see [Running the Server](#running-the-server)).

## Installation

### Prerequisites
- Python 3.8 or higher
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Supabase account (for cloud sync features)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Metaheurist/Health-app.git
   cd Health-app
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Edit `.env` and add your Supabase credentials:
     ```env
     PORT=8080
     HOST=
     SUPABASE_URL=your_supabase_url_here
     SUPABASE_ANON_KEY=your_supabase_anon_key_here
     ```

4. **Configure Supabase (for frontend)**
   - Edit `supabase-config.js` with your Supabase credentials
   - ⚠️ **Important**: Use the PUBLISHABLE/ANON key, NOT the secret key!

## Usage

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
2. **Network Access**: Use your local IP address (shown in server console)
3. **Production**: Deploy files to a web server (no local server needed)

**Install manifest URLs (Android / iOS `latest.json`):** On `localhost`, `127.0.0.1`, and `::1`, the app does **not** fetch `App build/Android/latest.json` or `App build/iOS/latest.json`, because those files are produced by CI and deployed with the site. Default install links still point at fallback paths. To test manifest-driven links locally, open the devtools console and run `sessionStorage.setItem('forceAppBuildManifest','1')`, then reload.

### GitHub Pages (app at repo root)

The app lives in **`web/`**, so GitHub Pages will not see `index.html` if the source is the repo root. To serve the app from GitHub Pages (e.g. `https://<user>.github.io/Health-app/`):

1. In the repo: **Settings → Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. The workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) runs on push to `main` and deploys the contents of **`web/`** as the site root, so `index.html` is served correctly. The workflow runs **`npm install`**, minifies **`app.js`** to **`app.min.js`**, and rewrites the deployed `index.html` to load the minified script for smaller downloads.

**Cloud sync on the live site:** To use Supabase (login, cloud backup, anonymised data) on the GitHub Pages site, add **Repository secrets** (or **Environment secrets** for the `pages` environment): **`SUPABASE_URL`** (your project URL, e.g. `https://xxxx.supabase.co`) and **`SUPABASE_ANON_KEY`** (your publishable anon key). The deploy workflow injects these into the built site at deploy time so they are never committed. If these secrets are not set, the site still deploys; cloud features will work only after you add them.

After the first push (or a manual **Run workflow**), the site will show the Health Dashboard instead of the README.

## React shell & Android APK

The app can be run as a **React (Vite) app** that wraps the existing web UI and be built into an **Android APK** via Capacitor. The GitHub Action **Build Android APK** runs on every push to `main`/`master`, output to **`App build/Android/`** and **`App build/iOS/`**, and makes it available in the app’s Settings.

### In-app installation (Settings)

- **Install web app** (globe icon): Install the app as a PWA / standalone web app.
- **Install on Android** (Android icon): Download the latest Android APK. When the app is served from the same origin (e.g. GitHub Pages), the link uses the newest build from **`App build/Android/`** (see `latest.json`).
- **Install on iOS / iPhone / iPad**: On iPhone or iPad, open the site in Safari and use **“Install on this iPhone”** or **“Install on this iPad”** in Settings to add the app to your Home Screen (one-tap flow; works offline like a native app). Alternatively, download the Xcode project zip from **Install on iOS** and build to your device in Xcode. If a signed .ipa is provided in **`App build/iOS/`** (with `installUrl` in `latest.json`), **Install on iOS** becomes a one-tap native install from the site.

### Local setup (optional)

- **Node.js 20+**
- From repo root:
  ```bash
  npm install
  cd react-app && npm install
  npm run copy-webapp   # copies web app into react-app/public/legacy
  npm run build        # builds React app into react-app/dist
  ```
- To add the Android project (one-time, then commit `react-app/android/` if you want):
  ```bash
  cd react-app && npx cap add android
  node patch-android-sdk.js   # optional: set minSdk 22, targetSdk 34
  npx cap sync android
  ```
- Open in Android Studio: `cd react-app && npx cap open android`

### Android targets

- **minSdk 22** (Android 5.1) for broad device support.
- **targetSdk 34** (Android 14) for current store requirements.  
Controlled in `react-app/android/variables.gradle` (or via `react-app/patch-android-sdk.js`).

### CI: App builds on each commit

- **Android** workflow: [`.github/workflows/build-android-apk.yml`](.github/workflows/build-android-apk.yml)
- **iOS** workflow: [`.github/workflows/build-ios.yml`](.github/workflows/build-ios.yml) — builds a **simulator .app** (no Apple account; test in Xcode Simulator on a Mac) and zips the Xcode project to `App build/iOS/` for device sideloading (open in Xcode, sign with your Apple ID). Device signing for direct install (OTA) requires an Apple Developer account ($99/year).
- On **push** or **pull_request** to `main` or `master`: builds the web app, syncs Capacitor, builds a **debug APK**, copies it into **`App build/Android/`**, and uploads the **android** artifact (zip containing `apk/app-debug.apk`).
- On **push** (not PR) to `main`/`master`: the workflow also **commits** the `App build/Android/` folder to the repo with `[skip ci]`, so the “Install on Android” link in Settings works when the app is served from the same repo (e.g. GitHub Pages).
- Download the APK from the run’s **Summary → Artifacts** (name **android**), or use **Settings → Install on Android / Install on iOS** in the deployed app.

### Using the Health Dashboard

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

### Server Dashboard Features

![Health App Server Dashboard — local URL, Supabase connection, database viewer, and live server logs](docs/images/server-dashboard.png)

The Tkinter dashboard provides:

1. **Server Status**:
   - View server URL and status
   - Restart server without closing dashboard

2. **Supabase Database Management**:
   - **Search**: Search anonymised data by medical condition
   - **Delete**: Remove data (all, by condition, or specific IDs)
   - **Export**: Export data to CSV files
   - **Viewer**: Real-time database viewer showing last 100 records

3. **Server Logs**: Real-time log viewer with the same **emoji-prefixed** lines as the console and rotating files (`🐛` DEBUG, `ℹ️` INFO, `⚠️` WARNING, `❌` ERROR, `💥` CRITICAL; other levels use `📋`). Font is chosen so emoji are visible in Tkinter (see [Server](#server-testing-and-development) note).

## Testing Data

### Generate Sample Data

The server includes sample data generation:

1. **CSV Export**: Generate sample CSV files for testing
   - Use the "Generate CSV File" button in the server dashboard
   - Configure number of days and base weight
   - Output saved to `health_data_sample.csv`

2. **Database Testing**: 
   - Use Supabase search to find test data
   - Export data for analysis
   - Delete test data when done

### Sample Data Structure

Sample data includes realistic patterns:
- Seasonal variations (winter worse, summer better)
- Weekly patterns (weekends better)
- Flare-up cycles for chronic conditions
- Correlated metrics (sleep affects fatigue, etc.)

## Configuration

### Environment Variables (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `HOST` | Server host (empty = all interfaces) | `` |
| `SUPABASE_URL` | Your Supabase project URL | Required |
| `SUPABASE_ANON_KEY` | Your Supabase anon/publishable key | Required |

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings → API
3. Create the `anonymized_data` table:
   ```sql
   CREATE TABLE anonymized_data (
     id BIGSERIAL PRIMARY KEY,
     medical_condition TEXT NOT NULL,
     anonymized_log JSONB NOT NULL,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   ```
4. Add your credentials to `.env` and `supabase-config.js`

## AI Analysis: Neural Network Architecture

The AI analysis engine runs as a **neural-style pipeline**: each layer applies existing logic (regression, correlation, prediction, etc.) as activator functions. The design aims to **use as much of your collected data as possible** to deliver **meaningful health insights** (trends, early signals, correlations, and actionable advice). A detailed expansion and optimisation plan is in [docs/NEURAL_NETWORK_PLAN.md](docs/NEURAL_NETWORK_PLAN.md).

### Planned objectives

- **Richer input**: One pass over all logs to build metricsData, rolling 7d/30d baselines, day-of-week, days-since-flare, fill-rate, and a **precomputed correlation matrix** so downstream layers avoid redundant work.
- **Optimisation**: Correlation matrix computed once in the input layer; correlation layers **reuse** it. Cross-section layer **skips** food/exercise analysis when no food or exercise entries exist.
- **Interpretation**: A dedicated layer **ranks and deduplicates** anomalies, risk factors, correlations, and patterns into **prioritisedInsights** (top 5–7 items) so “what matters most” is clear.
- **Summary**: A **summary** layer produces a short 2–3 sentence plain-language headline from trends, risk, and advice.
- **Activations**: Trend significance is normalised (e.g. sigmoid(r²)) for consistent scoring; activations (sigmoid, tanh, relu, softmax) are available for bounding and ranking.

### Analysis pipeline (forward pass)

```mermaid
%%{init: {'themeVariables': {'fontSize': '12px'}, 'flowchart': {'useMaxWidth': true, 'nodeSpacing': 25, 'rankSpacing': 30}}}%%
flowchart TB
  subgraph L1 [Layer 1: Input]
    Logs[Logs]
    Logs --> MData[metricsData + rolling 7d/30d]
    Logs --> Matrix[fullNumericMatrix]
    Logs --> CorrM[correlationMatrix]
    Logs --> Temporal[dates, flareFlags, dayOfWeek, daysSinceFlare]
  end
  subgraph L2 [Layer 2: Trend]
    MData --> Reg[Regression / ARIMA]
    Reg --> Proj[Projections + normalizedSignificance]
  end
  subgraph L3 [Layers 3a-3b: Correlation]
    CorrM --> Pair[Pairwise]
    CorrM --> Multi[Multi-metric from precomputed]
  end
  subgraph L4 [Layer 4: Pattern]
    Pair --> Anom[Anomalies]
    Anom --> Pat[Patterns + acceleration]
  end
  subgraph L5 [Layer 5: Risk]
    Multi --> Risk[Risk factors]
    Risk --> Flare[Flare prediction]
  end
  subgraph L6 [Layer 6: Cross-section]
    Flare --> Food[Food/Exercise if present]
    Food --> Stress[Stressors, symptoms, pain]
  end
  subgraph L7 [Layers 7a-7c]
    Stress --> Clust[Clustering]
    Clust --> TS[Time series]
    TS --> Out[Outliers, seasonality]
  end
  subgraph L8 [Layer 8: Advice]
    Out --> Advice[Actionable advice]
  end
  subgraph L9 [Layer 9: Interpretation]
    Advice --> Prior[prioritisedInsights top 5-7]
  end
  subgraph L10 [Layer 10: Summary]
    Prior --> Summary[2-3 sentence summary]
  end
  L1 --> L2
  L2 --> L3
  L3 --> L4
  L4 --> L5
  L5 --> L6
  L6 --> L7
  L7 --> L8
  L8 --> L9
  L9 --> L10
```

### Data flow: from logs to insights

```mermaid
%%{init: {'themeVariables': {'fontSize': '14px'}, 'flowchart': {'useMaxWidth': false, 'nodeSpacing': 50, 'rankSpacing': 45}}}%%
flowchart TB
  subgraph sources [Data sources]
    Filtered[Filtered logs by date range]
    AllLogs[All logs for training]
  end
  subgraph input [Input layer - single pass]
    OnePass[One pass over logs]
    OnePass --> MetricsData[metricsData: series, avg, variance, rollingMean7/30, fillRate]
    OnePass --> NumMatrix[fullNumericMatrix]
    OnePass --> CorrMatrix[correlationMatrix precomputed]
    OnePass --> Temporal[dayOfWeek, daysSinceLastFlare]
  end
  subgraph layers [Layers 2-10]
    MetricsData --> Trend[Trend: regression, ARIMA, sigmoid significance]
    CorrMatrix --> Corr[Correlation: reuse matrix]
    Trend --> Pattern[Patterns, anomalies]
    Corr --> Risk[Risk, flare prediction]
    Pattern --> Cross[Cross-section with skip logic]
    Risk --> Cross
    Cross --> TS[Clustering, time series, outliers]
    TS --> Advice[Advice]
    Advice --> Interp[Interpretation: prioritisedInsights]
    Interp --> Summary[Summary: 2-3 sentence headline]
  end
  Filtered --> OnePass
  AllLogs --> OnePass
  Summary --> Output[Analysis: trends, correlations, patterns, advice, prioritisedInsights, summary]
```

### Layer summary

| Layer | Role | Data used | Activator functions |
|-------|------|-----------|---------------------|
| 1 Input | Feature space in one pass | All training + recent logs | metricsData (with rollingMean7/30, fillRate), fullNumericMatrix, correlationMatrix, dates, flareFlags, dayOfWeek, daysSinceLastFlare |
| 2 Trend | Per-metric trends and predictions | Full training series per metric | Linear/polynomial regression, ARIMA, predictFutureValues, normalizedSignificance (sigmoid) |
| 3a–3b | Pairwise + multi-metric correlation | Precomputed matrix or training logs | detectCorrelations, detectMultiMetricCorrelations (uses precomputed when available) |
| 4 Pattern | Anomalies and patterns | Recent logs | detectAnomalies, detectPatterns, detectTrendAcceleration |
| 5 Risk | Risk factors and flare prediction | Training logs | assessRiskFactors, predictFlareUps |
| 6 Cross-section | Food, exercise, stressors, symptoms | Larger of training/recent; **skip** food/exercise if none logged | analyzeFoodExerciseImpact (guarded), analyzeStressorsImpact, analyzeSymptomsAndPainLocation, analyzeCrossSectionCorrelations |
| 7a–7c | Clustering, time series, outliers | Training logs | performClustering, performTimeSeriesAnalysis, detectOutliers, detectSeasonality |
| 8 Output | Advice | Recent logs + trends | generateActionableAdvice |
| 9 Interpretation | Prioritise and dedupe | analysis.anomalies, riskFactors, correlations, patterns | Score, dedupe, set prioritisedInsights (top 7) |
| 10 Summary | Plain-language headline | trends, risk, patterns, advice | Set analysis.summary (2–3 sentences) |

### How we use your data for meaningful insights

- **Full history**: Training logs (all available data) are used for regression, correlation matrix, clustering, time series, and flare prediction so insights reflect long-term patterns, not just the last few days.
- **Rolling baselines**: 7-day and 30-day rolling means per metric support future “vs your baseline” comparisons and stability checks.
- **Temporal context**: Day-of-week and days-since-last-flare are computed once and available for pattern and seasonality layers.
- **Prioritised list**: Anomalies and risk factors are ranked above correlations and patterns; duplicates are removed so the UI can show a short “what matters most” list.
- **Summary**: The final summary sentence is generated from improving/worsening trends, the top risk or pattern, and one piece of advice so the user gets a quick takeaway.

Activation functions (sigmoid, tanh, relu, softmax) are available as `AIEngine.activations`. The network constructor is `AIEngine.NeuralAnalysisNetwork`. Detailed plan: [docs/NEURAL_NETWORK_PLAN.md](docs/NEURAL_NETWORK_PLAN.md).

---

## Project Structure

```
Health-app/
├── web/                    # Static web app (served at site root on GitHub Pages)
│   ├── index.html          # Main application HTML
│   ├── app.js              # Core application logic
│   ├── app.min.js          # (generated) esbuild minify — gitignored; use npm run build:web
│   ├── build-site.mjs      # esbuild script → app.min.js
│   ├── logs-idb.js         # IndexedDB mirror for health logs (optional async backup)
│   ├── styles-charts.css   # Deferred chart + ApexCharts styles (loaded on demand)
│   ├── sw.js               # Optional service worker (static asset cache)
│   ├── workers/            # Web Workers (e.g. large JSON parse/stringify)
│   ├── AIEngine.js         # AI analysis (neural pipeline, …)
│   ├── styles.css          # Application styles
│   ├── cloud-sync.js       # Supabase synchronisation
│   ├── supabase-config.js  # Supabase configuration
│   ├── summary-llm.js      # In-browser LLM (summary, suggest note, dashboard MOTD)
│   ├── notifications.js    # Reminders, heartbeat sound
│   └── …                   # Other JS/CSS/assets
├── requirements.txt        # Python dependencies
├── package.json            # Root scripts (build, sync, android)
├── docs/                   # Documentation
│   ├── images/             # README screenshots (Home, View logs, AI Analysis, card selector, server dashboard, …)
│   └── NEURAL_NETWORK_PLAN.md   # AI expansion and optimisation plan
├── .github/workflows/      # CI (e.g. Build Android APK)
├── react-app/              # React (Vite) + Capacitor shell for Android
│   ├── src/                # React entry and iframe wrapper
│   ├── android/            # Capacitor Android project (optional to commit)
│   ├── copy-webapp.js      # Copies web app into public/legacy
│   ├── patch-android-sdk.js
│   └── capacitor.config.ts
├── App build/              # Built apps (filled by CI; committed for download links)
│   ├── Android/           # APK + latest.json
│   └── iOS/               # Xcode project zip + latest.json
├── server/                 # Python HTTP server (`python -m server`)
│   └── launch-server.ps1   # Windows launcher (optional)
├── .env                    # Environment variables (not in git)
├── .env.example            # Environment template
└── logs/                   # Server logs
```

## Dependencies

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
- Root `package.json`: scripts for `build`, `build:android`, `build:web` (minify `web/app.js` → `web/app.min.js`), `sync`, `dev`
- `react-app/`: Vite 6, React, Capacitor 7; run `npm run build` from repo root

## Development

### File Watching
The server automatically reloads when files change (if watchdog is installed):
```bash
pip install watchdog
```

### Logging
Server logs are saved to `logs/health_app_YYYYMMDD.log`. The `HealthApp` logger uses an **`EmojiLogFormatter`**: each line starts with an emoji for the level (`🐛` DEBUG, `ℹ️` INFO, `⚠️` WARNING, `❌` ERROR, `💥` CRITICAL; anything else `📋`), **two spaces**, then the usual timestamp, level name, logger name, and message. This applies to **file**, **stdout/stderr**, and the **Tkinter** log pane (`server/config.py`, shared formatter in `server/main.py`). The Tkinter **Server Logs** widget uses **Segoe UI**, **Segoe UI Emoji**, or **Segoe UI Symbol** when available so emoji display correctly; **Consolas** does not render emoji in Tk’s `Text` widget on Windows.

### Browser Compatibility
- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (responsive design)

## GDPR Compliance

The app includes GDPR-compliant data sharing:
- Explicit user consent required
- Data anonymisation before upload
- Clear privacy agreement
- User can disable at any time

## Troubleshooting

### Server Issues

**Port already in use**:
- Change `PORT` in `.env` or close the application using port 8080

**Supabase connection failed**:
- Verify credentials in `.env` and `supabase-config.js`
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

## Security Notes

⚠️ **Important Security Considerations**:

1. **Never commit sensitive files**:
   - `.env` (contains Supabase credentials)
   - `supabase-config.js` (contains API keys)

2. **Use environment variables** for production deployments

3. **Supabase Keys**: Always use PUBLISHABLE/ANON keys in frontend code, never secret keys

4. **Data Privacy**: Anonymised data sharing is opt-in only

## Author

**Metaheurist** - Sole developer and maintainer

- GitHub: [@Metaheurist](https://github.com/Metaheurist)
- Repository: [https://github.com/Metaheurist/Health-app](https://github.com/Metaheurist/Health-app)

## Licence

This project is open source and available under an open source licence.

## Repository

**GitHub**: [https://github.com/Metaheurist/Health-app](https://github.com/Metaheurist/Health-app)

## Support

For issues and questions:
- Check the troubleshooting section
- Review server logs in `logs/` directory
- Check browser console for frontend errors

## Changelog

Changelog is derived from project commit history. Versions follow semantic versioning (major.minor.patch). Expand a section to see details.

**Latest: v1.28.2** — Dashboard log emoji visibility (Tk font) and spacing.

<details>
<summary><strong>v1.28.2</strong> — 2026-03-22 — Server dashboard log emoji</summary>

- **Server**: Tkinter **Server Logs** pane uses a Segoe UI–family font (`Segoe UI`, `Segoe UI Emoji`, or `Segoe UI Symbol` when installed) so level emojis render; monospace **Consolas** does not show emoji in Tk `Text` on Windows (`server/main.py`).
- **Server**: `EmojiLogFormatter` inserts **two spaces** after the emoji for a clear gap before the timestamp (`server/config.py`).

</details>

<details>
<summary><strong>v1.28.1</strong> — 2026-03-22 — Server logs & charts visibility</summary>

- **Server**: `EmojiLogFormatter` in `server/config.py` prepends a per-level emoji to every `HealthApp` log line (file, console, Tkinter dashboard); `server/main.py` uses the same formatter for the dashboard `TextHandler`.
- **Charts tab**: `updateChartEmptyState` calls `enforceChartSectionView` when data appears; `.chart-container.hidden` and chart container IDs use `display: none !important` so Combined / Balance / Individual panels do not stack visibly when switching modes.

</details>

<details>
<summary><strong>v1.28.0</strong> — 2026-03-22 — Performance overhaul</summary>

- **Web**: Centralised log reads, chart in-place updates, AI/precompute dedupe and scheduling, virtualised View Logs append, deferred chart CSS and idle `summary-llm` load, IndexedDB mirror, IO workers, optional SW, perf marks / long-task observer.
- **Server**: gzip static assets; cache headers for static extensions.
- **CI**: esbuild minify + HTML rewrite on GitHub Pages deploy; root `npm run build:web` for local minified bundle.

</details>

<details>
<summary><strong>v1.27.5</strong> — 2026-03-22 — Documentation</summary>

- **README**: Added AI Analysis tab screenshot under [AI analysis](#ai-analysis); image stored at `docs/images/ai-analysis.png`.

</details>

<details>
<summary><strong>v1.27.4</strong> — 2026-03-22 — Documentation</summary>

- **README**: Added **View logs** bullet and screenshot (date filters and entry card) under [App shell and log experience (web UI)](#app-shell-and-log-experience-web-ui); image stored at `docs/images/view-logs.png`.

</details>

<details>
<summary><strong>v1.27.3</strong> — 2026-03-22 — Documentation</summary>

- **README**: Added tile picker (card selector) screenshot for **energy & mental clarity** under [App shell and log experience (web UI)](#app-shell-and-log-experience-web-ui); image stored at `docs/images/card-selector-energy-clarity.png`.

</details>

<details>
<summary><strong>v1.27.2</strong> — 2026-03-22 — Documentation</summary>

- **README**: Added Home tab screenshot under [App shell and log experience (web UI)](#app-shell-and-log-experience-web-ui); image stored at `docs/images/home-dashboard.png`.

</details>

<details>
<summary><strong>v1.27.1</strong> — 2026-03-22 — Documentation</summary>

- **README**: Added screenshot of the Health App Server Dashboard (Tkinter control panel) under [Server Dashboard Features](#server-dashboard-features); image stored at `docs/images/server-dashboard.png`.

</details>

<details>
<summary><strong>v1.27.0</strong> — 2026-03-22 — Charts tab views, demo mode</summary>

- **Charts tab**: Balance / Combined / Individual now show **only** the active chart layout. Visibility is enforced after chart builds and background preload; **`chartView`** drives refresh (legacy **`combinedChart`** is normalised on settings load). Individual lazy charts stay hidden when another mode is active.
- **Demo mode**: With demo mode enabled, **each full page load** regenerates demo health logs (same rules as enabling demo: desktop `generateDemoData`, mobile premade + date rebase). Initial load skips reading stored `healthLogs` in demo mode so async decompression cannot overwrite fresh demo data.

</details>

<details>
<summary><strong>v1.26.0</strong> — 2026-03-22 — UI, MOTD, first paint, extensions</summary>

- **Mobile bottom nav**: Increased flex `gap` between items so tab buttons are not visually squashed on small screens.
- **Mobile header**: Goals and Settings controls use **in-flow layout** above the green dashboard title (≤768px) instead of overlapping long/wrapped MOTD text.
- **Dashboard MOTD**: Removed personalised “Welcome to {name}'s health”; header uses **daily preset lines** (deterministic per calendar day) plus optional LLM line **after** `body.loaded` so startup does not double-load the Transformers pipeline with `preloadSummaryLLM`. Tab title remains **Health Dashboard**.
- **First paint**: Inline critical CSS in `index.html` for `html`/`body` and `#loadingOverlay` so the loading screen is **dark with spinner** before `styles.css` loads (avoids a white flash).
- **Extensions**: Early `unhandledrejection` listener plus a stronger handler in `app.js` to **suppress noisy extension promise rejections** (e.g. `tabs:outgoing.message.ready`, `vendor.js`). Optional: use a profile without extensions for a clean console when debugging.

</details>

<details>
<summary><strong>v1.25.0</strong> — 2026-03-22 — `server/launch-server.ps1` for Windows</summary>

- **Windows launcher**: Added `server/launch-server.ps1` to start the Health App server from the repo root (`python -m server` or `py -3 -m server` when `python` is not on PATH). README documents usage with Windows PowerShell and `pwsh`, and optional `$env:PORT` / `$env:HOST`.

</details>

<details>
<summary><strong>v1.24.0</strong> — 2026-03-21 — Tile picker dialog, mobile chips, dashboard MOTD</summary>

- **Tile picker (`<dialog>`)**: Replaced native `<details>` chip sections with a shared **full-screen bottom sheet** (centred max-width panel from 768px up). Triggers use buttons with `aria-expanded`; content is **teleported** into `#tilePickerSheet` and restored on close so chip grids keep stable IDs. Food/exercise modals and the edit-entry form use the same pattern; closing a parent modal closes the sheet. `collapseSectionContent` closes the sheet when collapsing a section. Removed the old `makeAccordion` / one-open-details wiring.
- **Mobile-centric chips**: Horizontal scroll strips, scroll snap, denser tiles, and softer open shadows on small viewports; optional debounced **filter** inputs per chip area (food, stressors, symptoms, exercise).
- **Dashboard MOTD**: `summary-llm.js` exposes `generateMotdWithLLM`; `updateDashboardTitle()` loads the script when needed and sets a short on-device motivational line per full page load (skipped when `deferAI` is true).

</details>

<details>
<summary><strong>v1.23.0</strong> — 2026-02-24 — Developer in God mode, GPU stability graph, better GPU utilisation</summary>

- **Developer settings moved to God mode**: The "Clear performance benchmark cache" and "View last benchmark details" buttons (and hint) are no longer in Settings; they now live in **God mode** (press <kbd>`</kbd>). Benchmark modal and empty-state copy updated to say "God mode (` key)" instead of "Settings → Developer". README Settings and Device performance sections updated.
- **GPU stability graph**: The Performance & AI benchmark modal (brief and "View last benchmark details") now includes a **Stability (GPU)** panel when detailed results are expanded. The benchmark runs the GPU test 5 times and stores `gpu.scoreSamples`; a sparkline and stats (Backend, Samples, Mean ms) are shown. Layout: three panels (Test results, Stability CPU, Stability GPU) on wide screens; grid wraps on smaller viewports.
- **Better GPU utilisation**: WebGPU adapter and WebGL context request **high-performance** power preference. TensorFlow.js WebGL backend uses `WEBGL_POWER_PREFERENCE: 'high-performance'` and is enabled when the benchmark reports a good GPU (not only on desktop). TF WebGL is warmed early (idle callback or timeout) when GPU is good and AI is enabled so the first analysis avoids cold init. AIEngine exposes `warmGPUBackend()`.

</details>

<details>
<summary><strong>v1.22.0</strong> — 2026-02-24 — Tier 5 maxed, GPU detection & acceleration, accelerated UI</summary>

- **Tier 5 maxed**: Desktop and mobile tier 5 profiles now use maximum resources—highest chart point limits (400/450 desktop, 280/300 mobile), fastest preload and stagger delays (300 ms chart, 400 ms AI, 15–18 ms lazy stagger), and full animations. Overrides (e.g. tablet) no longer reduce chart capacity below tier 5 when the effective tier is 5.
- **GPU detection and benchmark**: After the CPU benchmark, a quick GPU check runs (WebGPU adapter request or WebGL clear loop). Result is cached with the benchmark (cache version bumped to 4). Profile exposes `gpuBackend` ('webgpu' | 'webgl' | 'none') and `gpuGood`; tier 4 devices with a good GPU are treated as effective tier 5 for charts and AI.
- **GPU-accelerated AI**: Summary/suggest LLM (Transformers.js) loads with `device: 'webgpu'` or `device: 'webgl'` when the benchmark reports GPU available; on failure the app falls back to CPU (WASM). Same model IDs and in-memory cache behaviour; no cache migration.
- **Transformers.js upgrade**: Upgraded from @huggingface/transformers@3.2.0 to **@3.3.2** for stable WebGPU/WebGL device support; 3.4.x is avoided due to a known ONNX Runtime Web issue (`n.env is not a function`). Documented in `docs/LLM_TIERS_AND_MODELS.md`.
- **Accelerated UI and charts**: When tier is 5 or GPU is good, the chart section gets class `chart-gpu-accelerated` so chart containers use `translateZ(0)` for compositor layer promotion. Critical-path work (combined chart build and AI preload) is scheduled with `scheduler.postTask(..., { priority: 'user-blocking' })` when available (Chrome), otherwise deferred once.
- **Benchmark modal**: New line shows GPU status—e.g. "GPU: WebGPU available, used for AI" or "GPU: Not available (using CPU for AI)". Profile JSON in details includes `gpuBackend` and `gpuGood`.
- **Docs**: README Device performance section already described GPU and tier 5; LLM_TIERS_AND_MODELS.md updated with GPU acceleration and Transformers.js 3.3.2; note that browsers do not expose CPU frequency/turbo (app uses tier + GPU and optional Scheduler API).

</details>

<details>
<summary><strong>v1.21.0</strong> — 2026-02-24 — Escape toggles Settings on desktop, benchmark progress bar, device hardware detection</summary>

- **Escape key on desktop**: Escape now **opens** Settings when it is closed and no other modal is open; it still **closes** Settings when open. On mobile, Escape continues to close Settings only. Desktop is detected via `DeviceModule.platform.platform === 'desktop'` or non-mobile User-Agent.
- **Benchmark progress indicator**: While the performance benchmark runs on first load, the loading overlay shows a **progress bar** (0–100%) and the existing text ("Measuring performance… X% · &lt;current test&gt;"). The bar is visible only during the benchmark phase and completes to 100% before the overlay is removed.
- **Device hardware detection**: Optional UAParser.js v1.x for OS, device type/vendor/model, and CPU architecture; **estimated memory bucket** when `navigator.deviceMemory` is missing (e.g. iOS). Benchmark modal and env snapshot show OS, device, CPU, and "estimated: low/medium/high" RAM. Tier heuristic and profile memory overrides use the estimated bucket so iOS and other no–deviceMemory environments get better default tiers.
- **README**: Settings & UI now document Escape key behaviour; Device performance section updated with progress bar and tier range; changelog v1.21.0 added.

</details>

<details>
<summary><strong>v1.20.0</strong> — 2026-02-24 — Benchmark-driven AI model selection and brief benchmark UI</summary>

- **Performance & AI benchmark modal**: Modal title and framing updated to "Performance & AI benchmark". Default view is **brief**: one-line summary (device, tier, class, **Recommended AI model: small/base**) and a line stating the device can run the recommended on-device model (flan-t5-small/base). **"See detailed benchmark results"** expandable section contains the test bars, stability (CPU) panel, and "Chosen optimisation profile" JSON so details are optional.
- **AI-oriented benchmark**: Benchmark messaging and profiles are oriented around **on-device AI runnability**; each tier profile includes `llmModelSize` ('small' | 'base') used for the summary/suggest LLM. Device-benchmark comment and UI copy reflect this.
- **On-device AI model in Settings**: Settings → Performance → **On-device AI model** dropdown: "Use recommended (for this device)", "Small (faster, lower memory)", "Base (better quality)". Stored as `appSettings.preferredLlmModelSize`; hint shows "Recommended: flan-t5-…" when the benchmark is ready, or "Run benchmark (reload app) to see recommendation."
- **Model resolution and cache**: `summary-llm.js` resolves model in order: user override (`preferredLlmModelSize` 'small'/'base') → benchmark profile `llmModelSize` → deviceClass fallback. `getOptimizationProfile()` in `performance-utils.js` now returns `llmModelSize`. Changing the setting calls `clearSummaryLLMCache()` so the next summary/suggest loads the chosen model.
- **README**: AI analysis and Device performance sections updated; changelog v1.20.0 added.

</details>

<details>
<summary><strong>v1.19.0</strong> — 2026-02-23 — Benchmark-driven device classifier and expansive settings</summary>

- **Device benchmark module** (`web/device-benchmark.js`): Classifies platform as **mobile** or **desktop** (including Capacitor native app), runs a short CPU benchmark to determine a performance **tier (1–4)**, and caches the result in localStorage. Exposes `DeviceBenchmark.runBenchmarkIfNeeded`, `isBenchmarkReady`, `getPerformanceTier`, `getFullProfile`, `getLegacyDeviceClass`, `clearBenchmarkCache`, etc.
- **Expansive profiles**: Separate **MOBILE_PROFILES** and **DESKTOP_PROFILES** tables (4 tiers each) drive chart points, AI preload, DOM batching, demo data days, load timeout, LLM model size, and related options. When the benchmark is ready, `performance-utils.js` uses these profiles via `getOptimizationProfile()` and `getDeviceOpts()` and syncs `platform.deviceClass` from the benchmark tier.
- **Load gating**: App load handler runs the benchmark first (when `DeviceBenchmark` is present). Loading text shows “Measuring performance…” during the run. If the result was **not** cached (first run), a modal shows the detected device class (platform + tier + class) for user acknowledgment; on OK the result is saved and the app continues. If cached, the app proceeds without the modal.
- **Developer**: (Moved to God mode in v1.23.0.) Clearing “Clear performance benchmark cache” forces the benchmark and device-class modal to run again on next reload.
- **Alert modal callback**: `showAlertModal(message, title, onClose)` now accepts an optional third argument; when provided, the OK button (and overlay/Escape close) invokes the callback before closing, used for the device-class acknowledgment flow.
- **README**: New “Device performance (benchmark)” and Developer setting documented; changelog entry for v1.19.0.

</details>

<details>
<summary><strong>v1.18.0</strong> — 2026-02-23 — Tab defaults and chart first-load fix</summary>

- **Charts tab**: Always opens in balance view when the tab is clicked; preference is saved so balance is the default each time.
- **View Logs tab**: Defaults to last 7 days when the tab is opened (was today).
- **Individual charts first load**: Only the combined chart is built during the loading overlay; the 14 individual charts are built after the overlay is removed and layout is complete (rAF + 80 ms delay when view is individual), so they get correct dimensions and no longer appear blank until the user switches view and back.

</details>

<details>
<summary><strong>v1.17.0</strong> — 2026-02-23 — Dependencies: Dependabot alerts resolved</summary>

- **npm (react-app)**: Upgraded Vite 5 → 6.4 (esbuild 0.25+, fixes moderate CORS advisory) and all @capacitor/* 6 → 7 (fixes high: minimatch ReDoS, tar path traversal). Regenerated package-lock.json; `npm audit` reports 0 vulnerabilities.
- **Node**: Root `package.json` engines set to Node >=20 for Vite 6 compatibility. README and local setup now state Node.js 20+.
- **React/Capacitor**: @vitejs/plugin-react ^4.5.0; build and audit verified.

</details>

<details>
<summary><strong>v1.16.0</strong> — 2026-02-23 — Performance, memory caps, loading UX, disclaimer, CSP</summary>

- **Loading overlay**: Kept visible until combined chart and summary LLM preload are ready (or 12s timeout); loading text set to "Loading charts and AI…". Ensures the app does not appear until the main heavy work is done.
- **CPU and polling fixes**: Chart container readiness in `loadChart` now capped at 40 retries (2s) to avoid unbounded 50ms polling and 100% main-thread usage. `updateCharts` ApexCharts retry capped at 24 (12s) when the library is not yet loaded.
- **Memory caps**: `DOMBatcher` in `performance-utils.js` flushes when pending updates exceed 150 to avoid unbounded growth when the tab is backgrounded (rAF throttled). `DataCache` limited to 80 keys with LRU eviction. Periodic cleanup (60s) also clears `PerformanceMonitor.marks` when size exceeds 20 to prevent leak.
- **Supabase**: `initSupabase` in `cloud-sync.js` skips creating the client when URL or anon key is missing or placeholder; logs one warning instead of repeated "supabaseUrl is required" errors.
- **CSP**: `connect-src` in `index.html` updated to allow `https://cas-bridge.xethub.hf.co` and `https://*.xethub.hf.co` so the in-browser summary LLM can fetch Hugging Face model assets.
- **Disclaimer**: Full disclaimer text ("For patterns only… You can share this at your next visit. AI data (e.g. prediction weights) is stored on your device and, when signed in, backed up to your cloud account.") applied to plain-text export, print report footer, and both PDF export paths in `export-utils.js` and `app.js` so it matches the AI Analysis on-screen disclaimer.

</details>

<details>
<summary><strong>v1.15.0</strong> — 2026-02-23 — Defer app reveal, chart fix, config resilience, docs</summary>

- **Defer app reveal until charts and AI ready**: The loading overlay stays visible until the combined chart (and its data/predictions) and the summary LLM pipeline are ready, or a 12s timeout. This avoids the UI stuttering while heavy chart and AI work run on first load. `summary-llm.js` exposes `window.preloadSummaryLLM()`; the load handler in `app.js` awaits charts + AI with `Promise.race([ Promise.allSettled([chartsReady, aiReady]), timeout ])` then reveals the app and runs the rest of init.
- **Combined chart fix**: `deviceOpts` was used in `createCombinedChart` without being defined, causing `ReferenceError` and breaking balance/combined charts. It is now set at the start of the function via `PerformanceUtils.getDeviceOpts()` with a safe fallback.
- **Supabase config resilience**: Inline script in `index.html` sets `window.SUPABASE_CONFIG` to a fallback before loading `supabase-config.js`, so a syntax error in that file (e.g. smart quotes) no longer breaks the page. Non-ASCII characters (emoji) in `supabase-config.js` comments were replaced with ASCII so the file parses everywhere.
- **GitHub secrets**: Deploy workflow already injects `SUPABASE_URL` and `SUPABASE_ANON_KEY` from repository secrets into the built site; README and comments clarify that tokens come from GitHub secrets at deploy time.
- **README**: Features section expanded to document all app features (tracking, charts, AI, goals, cloud, install options, server, security). Version set to 1.15.0.

</details>

<details>
<summary><strong>v1.14.1</strong> — 2026-02-23 — Neural network optimisation and loading states</summary>

- **Neural network optimisation** (`web/AIEngine.js`): Added `yieldToMain()` and yield between analysis layers in `NeuralAnalysisNetwork.forward()` so the main thread can update the UI during analysis, reducing perceived lag and avoiding a frozen page.
- **AI Summary loading**: Loading state shows "Analyzing your health data…" and waits one frame (`requestAnimationFrame` + `setTimeout`) before starting analysis so the message is visible; existing pulse animation on the loading icon retained.
- **Combined chart loading**: When predictions are computed (cache miss), a "Calculating predictions…" overlay with spinner is shown on the combined chart container and removed when done, so chart view no longer feels stuck during prediction runs.
- **Suggest note**: Already showed "Generating…" for the LLM path; no change.

</details>

<details>
<summary><strong>v1.14.0</strong> — 2026-02-23 — Background loader module, slower rate, optional worker</summary>

- **Background loader module** (`web/background-loader.js`): Device-aware scheduling for chart and AI preload; loads after `performance-utils.js`, exposes `BackgroundLoader.scheduleChartPreload` and `BackgroundLoader.scheduleAIPreload`.
- **Slower preload rate**: Chart preload uses device-based stagger (low 280 ms, medium 200 ms, high 120 ms) and gap after combined (350 / 260 / 180 ms); profile `chartPreloadDelayMs` for initial delay.
- **performance-utils.js**: `platform.hardwareConcurrency` and `getOptimizationProfile().useWorkers` added for loader (worker path was never wired; AI preload runs on main thread only).
- **app.js**: Chart and AI preload delegate to `BackgroundLoader` when present; `getAIPreloadData`/`setAICache` for worker path; fallbacks when loader missing.

</details>

<details>
<summary><strong>v1.13.9</strong> — 2026-02-23 — Throttle preload to avoid UI freeze</summary>

- **Chart preload**: Combined chart and individual charts no longer run in one blocking burst. Combined chart is deferred with `requestIdleCallback` (or `setTimeout(0)`); a 220 ms gap follows before the first individual chart; each subsequent chart is staggered by 180 ms (was 80 ms) so the app stays responsive.
- **AI preload**: An extra idle callback (or short delay) before running AI preload ensures the sync work does not block the same frame as chart preload or startup.

</details>

<details>
<summary><strong>v1.13.8</strong> — 2026-02-23 — Device-based optimisation, chart & AI preload</summary>

- **Device opts**: `PerformanceUtils.getDeviceOpts()` in `performance-utils.js` returns `{ reduceAnimations, maxChartPoints, deferAI, batchDOM }` from device class and `prefersReducedMotion`. Low: 30 chart points, animations off, AI deferred; medium: 80 points, batch DOM; high: 200 points, full features.
- **Charts**: All chart options (combined, balance, individual) preload in the background when the Charts tab is opened so switching view is instant. Chart data point caps and animation toggles use `getDeviceOpts()` (and existing viewport caps). Combined and balance charts respect `reduceAnimations`; individual charts use device-based max points.
- **AI analysis**: AI analysis runs in the background (e.g. after load) and is cached so opening the AI tab shows results immediately when the cache matches the date range. On low devices (`deferAI`), the summary note uses the rule-based fallback only (no in-browser LLM load); AI tab open delay is increased to avoid blocking.
- **Log list**: `renderLogEntries` uses `domBatcher.schedule()` when `batchDOM` is true (low/medium) for fewer layout thrashing and smoother scrolling.
- **UI motion**: Heartbeat animation and AI summary UI respect `reduceAnimations` (and existing `prefersReducedMotion` / optimisation profile) so low-end and reduced-motion users get a calmer experience.

</details>

<details>
<summary><strong>v1.13.7</strong> — 2026-02-23 — Version bump</summary>

- **Version**: Bump to 1.13.7 for release tracking.

</details>

<details>
<summary><strong>v1.13.6</strong> — 2026-02-23 — README and changelog</summary>

- **README**: Changelog updated with version summaries; UK English retained.
- **Versioning**: Bump to v1.13.6 for documentation and release tracking.

</details>

<details>
<summary><strong>v1.13.5</strong> — 2026-02-23 — Per-platform optimisation and hardware detection</summary>

- **Platform and capabilities**: Central layer in `performance-utils.js` exposes `PerformanceUtils.platform` (and `window.PlatformCapabilities`) with `deviceClass` ('low' | 'medium' | 'high'), `platform` (ios/android/desktop), `isTouch`, `isStandalone`, `prefersReducedMotion`, and optional `connection`. Single source of truth for hardware and platform used by LLM and charts.
- **Lazy-load LLM on low-end**: On low device class, `summary-llm.js` is not loaded in initial page; it is loaded on demand when the user first uses AI (Summary note or Suggest note). Medium/high devices load it up front for snappier AI.
- **Chart optimisations**: Charts use `deviceClass` to cap data points (low → max 30 points; medium/high keep existing 50/30 by viewport). When `prefersReducedMotion` is true, ApexCharts animations are disabled for that chart.

</details>

<details>
<summary><strong>v1.13.4</strong> — 2026-02-23 — LLM model by device performance</summary>

- **Summary/Suggest LLM**: In-browser model is now chosen by device performance (RAM, CPU cores, mobile heuristic). Low-end and mobile use flan-t5-small; medium/high use flan-t5-base for better quality. Pipeline is cached by model id. If flan-t5-base fails to load, the app retries once with flan-t5-small before falling back to rule-based note.

</details>

<details>
<summary><strong>v1.13.3</strong> — 2026-02-23 — Summary note and Suggest note LLM improvements</summary>

- **Summary note**: Improved LLM prompt and context for a clearer, patient-friendly 2–3 sentence summary; optional line from top stressor in context; strip trailing incomplete sentences from output.
- **Suggest note (log entry)**: "Suggest note" now uses the in-browser LLM (same model as Summary note) when available, with rule-based fallback; short timeout and token limit for snappy response; "Generating…" on button during LLM call.
- **Optimisation**: Shared LLM pipeline for both Summary and Suggest note; no duplicate model load.

</details>

<details>
<summary><strong>v1.13.2</strong> — 2026-02-23 — CI: fix iOS/Android build push</summary>

- **CI**: iOS and Android build workflows now fetch and rebase onto `origin/main` before committing, so the "Update iOS build" / "Update Android APK" push no longer fails when `main` has moved (remote rejected: expected older commit). Removed stash-based rebase; commit is made on top of latest `main`.

</details>

<details>
<summary><strong>v1.13.1</strong> — 2026-02-23 — AI summary value highlighting, README UK English</summary>

- **AI summary readability**: Stress and triggers, Symptoms and where you had pain, Pain patterns, Pain by body part, Nutrition, Exercise, Top foods, and Top exercises now use the same value markup as “What we found” (e.g. `ai-brackets-highlight` for parenthesised values, percentages, and counts) so key figures are easier to scan.
- **README**: Converted to UK English (e.g. visualisation, synchronisation, anonymised, analyse, licence).

</details>

<details>
<summary><strong>v1.13.0</strong> — 2026-02-23 — AI optional, summary LLM, notifications</summary>

- **AI optional**: Settings toggle "Enable AI features & Goals" – when off, hides AI Analysis tab, chart predictions, and Goals (targets button and progress). Stored in settings and synced to cloud.
- **Tutorial**: First card "Enable AI & Goals?" (Enable / Skip for now). If skipped, all AI-related tutorial slides are omitted (View & AI, Settings & data, Data options, Goals).
- **Summary LLM**: In-browser small LLM (Transformers.js, flan-t5-small) for the AI summary note; data-rich context (trends, flares, insights) for short, insightful 2–3 sentence summary. Fallback to rule-based note on error or timeout.
- **Goals & cloud**: Goals and targets saved to cloud (Supabase app_settings) with localStorage; sync on save and on load when signed in.
- **Notifications**: "Enable sound notifications" now respected – notifications use `silent: false` when sound is on (including on mobile). Heartbeat-monitor style sound (Web Audio, lub-dub) plays when reminder fires and app is in foreground, and when enabling sound in Settings. AudioContext unlocked on permission request for mobile.
- **Server**: No server files in repo root; run with `python -m server` (see v1.12.0).

</details>

<details>
<summary><strong>v1.12.0</strong> — 2026-02-23 — Security, CI & docs</summary>

- **Security**: Remove exposed Supabase URL/keys and default encryption key from repo; rewrite git history to redact secrets; document connecting your own API and encryption keys.
- **GitHub Pages**: Deploy workflow injects Supabase config from repository secrets so production site works without committing credentials.
- **Server**: Move server logic into `server/` package; root entry point removed (run with `python -m server`).
- **Install modal**: Post-tutorial install modal (shown once) with web/Android/iOS install options; added to God mode – test all UI.
- **UK English**: User-facing copy and docs use UK spelling (anonymised, optimisation, centre, etc.); schema/code identifiers unchanged.
- **CI**: Android/iOS workflows use pull–rebase before push and stash to avoid unstaged-changes errors; Android compileSdk set to 36.
- **Builds**: Android APK and iOS (Xcode project zip, simulator) output to `App build/Android/` and `App build/iOS/` with `latest.json`; Settings modal uses newest build.
- **README**: Changelog in collapsible sections; God mode and post-tutorial install modal documented.

</details>

<details>
<summary><strong>v1.11.0</strong> — 2026-02-22 — React shell & neural pipeline</summary>

- **React & Android**: React (Vite) shell wrapping web app in iframe; Capacitor 6 for Android; GitHub Actions build APK on push to `main`, output to `App build/Android/`.
- **AI**: Neural-style pipeline for AIEngine (layers: input, trend, correlation, pattern, risk, cross-section, advice, interpretation, summary).
- **UI**: Install web app (PWA) and Install on Android in Settings; styles and README updates.

</details>

<details>
<summary><strong>v1.10.0</strong> — 2026-02-19 — Goals, medications & sharing</summary>

- **Features**: Goals and targets (steps, hydration, sleep, good days); medications; offline queue; sharing.
- **Demo**: Improved flare modelling and smoothing in demo data.

</details>

<details>
<summary><strong>v1.9.0</strong> — 2026-02-18 — Settings & modals</summary>

- **Settings**: Refactor settings modal, tabs and UI styles.
- **Modals**: Fix modal open/close, expose handlers, delegate clicks correctly.

</details>

<details>
<summary><strong>v1.8.0</strong> — 2026-02-03 — Sharing, consent & God mode</summary>

- **Sharing**: Sharing UI and AI PDF export.
- **Consent**: Cookie consent banner; GDPR/cookie policy.
- **Testing**: God mode – test all UI (backtick ` key) to trigger tabs, modals, charts, AI range, form sections.
- **AI**: Enhanced AI analysis and flare detection; UI improvements.

</details>

<details>
<summary><strong>v1.7.0</strong> — 2026-02-02 — Tutorial</summary>

- **Onboarding**: Tutorial for new users; UI updates; tutorial mode (slides: Welcome, Log Entry, View & AI, Settings & data, Data options, Goals, You're all set).

</details>

<details>
<summary><strong>v1.6.0</strong> — 2026-02-01 — Food, pain & UI</summary>

- **Food**: New food log input via tiles; food variety update.
- **Pain**: New pain diagram model; joints in pain diagram.
- **UI**: General UI fixes and app.js updates.

</details>

<details>
<summary><strong>v1.5.0</strong> — 2026-01-05 — Setup</summary>

- Setup added (documentation/setup flow).

</details>

<details>
<summary><strong>v1.4.0</strong> — 2026-01-03 — Cloud & server</summary>

- **Cloud**: User-specific encryption and cloud data management.
- **Server**: Server UI with DB control; bug fixes.
- **Repo**: Remove ignored files from Git tracking.

</details>

<details>
<summary><strong>v1.3.0</strong> — 2026-01-02 — AI & anonymised data</summary>

- **AI**: Optimised AI engine with new models and model selection.
- **Data**: Anonymous dataserver for global prediction models.
- **Server**: Test server multithread; filters fixed.
- **Docs**: README and app documentation updates.

</details>

<details>
<summary><strong>v1.2.0</strong> — 2026-01-01 — Stability & security</summary>

- **Security**: Security update.
- **UI**: Settings modal consistent layer; mobile UI optimisation; UI fixes; UI glitches fixed.
- **Server**: Logger error fixed for multithread.
- **Misc**: Caching bug fixed; demo mode logger updates; log file updates.

</details>

<details>
<summary><strong>v1.1.0</strong> — 2025-12-31 — Cloud, AI models & demo</summary>

- **Cloud**: Cloud sync; SHA-256 for data; Google Drive sync.
- **AI**: Custom condition and tailored LLM; new models (Xenova/LaMini-Flan-T5-783M, GPT, ONNX medical notes); model caching and config; prediction models and data filters; model reset; filters for graphs; BPM animation and AI analysis in view logs.
- **Data**: Data sample script; handling for no data; data deletion protocol; incompatibility fix on imported data.
- **Features**: Demo mode; exercise and food track; optimised prediction patterns and log cards.
- **Fixes**: Stack overflow for encryption solved; AIEngine and app.js updates.

</details>

<details>
<summary><strong>v1.0.0</strong> — 2025-12-30 — Initial release</summary>

- **Core**: Initial commit; health tracking; data visualisation; server for development/testing.
- **AI**: New container for AI logic; AI modal (fixed and UI updates).
- **UI**: Settings and text highlight fix; UI updates; old build added.

</details>


