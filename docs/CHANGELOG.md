## 📜 Changelog

Changelog is derived from project commit history. Versions follow semantic versioning (major.minor.patch).

**Latest: v1.45.6** - Charts tab: Balance view filters metrics to match web wellness focus.

### v1.45.6 - 2026-03-26 - Charts Balance view metric filtering

- **Mobile / Charts (Phase B)**:
  - **Balance** view now lists only **mood, sleep, and fatigue** trends (aligned with web balance chart excluding steps/hydration from the balance summary list).
  - Added `filterTrendsForChartView` in `summarizeCharts.ts` with unit tests; refreshed Charts screen copy per view mode.
- **Docs**:
  - Deduplicated checklist lines in `docs/next-phase-development-plan.md` and noted Charts progress.

### v1.45.5 - 2026-03-26 - RN CLI artifacts + Log wizard parity polish

- **CI / Release (native mobile)**:
  - Removed token-gated EAS binaries and switched to **React Native CLI** artifact generation in CI (Android APK + iOS emulator Xcode project zip) using `expo prebuild` + native toolchains.
  - Added a small unit test to prevent accidental removal of RN CLI jobs from the release pipeline.
- **Mobile / Log wizard parity (Phase A)**:
  - **Stress & triggers**: grouped picker + search + collapsible section + selected/clear parity.
  - **Symptoms & pain**: introduced a tap-to-cycle body diagram, aligned semantics to **good / discomfort / pain**, and added “Use diagram text”.
  - **Energy & mental clarity**: added collapsible tile picker and icon tiles, plus group-colored tile borders.
  - **Steps 6–9 UX**: added clear-all controls (food/exercise/meds), count-badge clear affordance shown at **1+**, and tests to lock these behaviors in.
- **Docs**:
  - Updated `docs/next-phase-development-plan.md` with Phase A progress notes.

### v1.45.4 - 2026-03-26 - CI/security hardening + Expo parity UX updates

- **CI / Security**:
  - Hardened `security-audit.yml` by running npm audits with `--omit=dev` to avoid legacy Capacitor-only dev transitive vulnerabilities failing the high-severity gate.
- **CI / Release**:
  - Added `eas-native-binaries-prod` to `ci.yml` to build Expo iOS + Android production binaries via EAS and include them in GitHub Release assets.
- **Mobile / Parity**:
  - Improved Log today wizard step parity (energy/stressors and lifestyle sub-steps) and added clear-all controls for selected symptoms/stressors.
  - Added Charts view toggle (`Balance / Individual / Combined`) UI parity control.
- **Docs**:
  - Updated `docs/next-phase-development-plan.md` with the latest parity checklist progress.

### v1.45.3 - 2026-03-24 - Expanded app functionality unit tests

- **Tests / Unit coverage**:
  - Expanded `tests/unit/app-functionality.test.mjs` with behavior assertions for:
    - in-place theme switching (no forced reload in `setGlobalTheme`),
    - Home-only MOTD title/quote guards,
    - voice input permission gate flow wiring,
    - settings hint copy for live theme apply,
    - CSS contracts for textarea mic icon centering and single-row settings icon rail.
- **Docs**:
  - Updated docs pages to include the expanded unit-test scope and command usage.

### v1.45.2 - 2026-03-24 - CI unit tests for app functionality

- **CI / Workflow**:
  - Added a dedicated `unit-tests` job to `.github/workflows/ci.yml`.
  - New test path runs `npm run test:unit` on push and pull requests.
  - Android, iOS, Server EXE, and Pages deploy jobs now depend on unit-test success.
- **Tests / App functionality**:
  - Added Node unit tests (`tests/unit/app-functionality.test.mjs`) to verify core app wiring:
    - bug report modal ids and launch binding,
    - supported global theme options,
    - presence of key runtime hooks (theme switch, MOTD title update, bug-report submit, voice input init).
  - Added root script `test:unit` in `package.json`.

### v1.45.1 - 2026-03-24 - Theme switch UX + mobile settings alignment

- **Web / Theme switching**:
  - Removed forced page reload on global theme change.
  - Theme now applies instantly in-place (background update) without restarting the app shell.
  - Updated settings helper text to describe live apply behavior.
- **Web / Settings (mobile)**:
  - Fixed settings section icon row wrapping where the last icon could drop onto a second line on narrow screens.
  - Header icon strip now remains a single row and allows horizontal overflow scroll when needed.
- **Web / MOTD visibility**:
  - Dashboard quote rendering now stays scoped to the Home tab only.
  - Non-Home tabs consistently show the base app title without carrying MOTD text.

### v1.45.0 - 2026-03-24 - Bug reports, STT permissions, and theme cleanup

- **Bug report pipeline (web + server + Supabase)**:
  - Added a new top-right **`?`** bug report entry button (alongside Targets and Settings) with shared chrome/theme styling.
  - Added a dedicated bug report modal with structured fields and submit flow.
  - Added console snapshot capture on submit (bounded client buffer of recent `console.log/info/warn/error` lines), stored in bug report payload as `console_output`.
  - Added server endpoint **`POST /api/bug-report`** with validation and Supabase insert into `public.bug_reports`.
  - Added per-IP rate limiting for bug report submissions: **5 requests / 24h**.
  - Updated Supabase schema (`supabase/Schema.sql`) with `public.bug_reports` table including `console_output`, metadata, timestamps, and primary key.
- **Theme parity / visual consistency**:
  - Reworked **rainbow** theme tokens to be genuinely multicolour/flashy instead of blue-dominant accents.
  - Removed hardcoded notification permission status colors and migrated to theme-driven state classes.
  - Removed remaining hardcoded install-surface accents so install hints/buttons respect active theme tokens.
- **Speech-to-text (STT) reliability**:
  - Voice input now requests/checks microphone permission before starting recognition.
  - Added fallback permission handling across browser APIs and optional Capacitor/community speech plugin permission methods when present.
  - Improved user-facing errors for denied permission, unsupported engines/webviews, and missing microphone capture states.

### v1.44.2 - 2026-03-24 - Theme parity and settings/navigation polish

- **Web / Theming parity**:
  - Removed remaining hardcoded mint accents from key flows so selected global themes apply consistently (including **mono**).
  - ECG pulse, active navbar tabs, goals/targets progress block, loading overlay ring/accent layers, and chart empty-state/tooling accents now follow theme tokens.
  - Added early theme bootstrapping in `index.html` so loading overlay uses the saved theme before app init completes.
- **Web / Settings UX**:
  - Replaced settings carousel dots with clickable **mini icon** indicators per section.
  - Mini icons now support direct jump-to-section navigation from the settings header area.
- **Web / Cloud sync**:
  - Expanded cloud settings payload to include user settings stored outside `rianellSettings` (for example tutorial/special toggles and feature flags), so settings round-trip more completely across devices.
  - Added restore path for those extra keys on cloud load.
- **Web / MOTD title styling**:
  - Updated MOTD quote/title rendering to a **single-tone** theme colour with stronger layered 3D depth/extrusion and cleaner readability.

### v1.44.1 - 2026-03-24 - AI summary reliability and orbit-ring water flow polish

- **Web / AI Analysis**:
  - Fixed a Summary note edge case where the note could stay on **"Generating summary..."** if the LLM promise never resolved.
  - Added request-staleness guards and timeout-based fallback so Summary note always returns to a valid value (LLM text when available, otherwise rule-based note).
- **Web / Loading overlay**:
  - Loading orbit ring arc now uses animated layered conic gradients to create a **flowing water** motion while still filling to 100% via `--loading-progress`.
  - `prefers-reduced-motion` handling keeps decorative ring flow disabled for accessibility.
- **Web / God mode**:
  - Function trace toggle now uses a theme-matched switch control style for visual consistency with the rest of the mint UI.

### v1.44.0 - 2026-03-24 - PyQt6 tinker, server EXE release path, icon + loader refresh

- **Server / Tinker dashboard (PyQt6)**:
  - Rebuilt the dashboard from Tkinter to **PyQt6** with modern dark mint styling.
  - Preserved existing controls/actions (server status, watchdog controls, Supabase tools, DB viewer, logs).
  - Database viewer now uses Qt table multi-select with selection count and Ctrl+A handling.
  - Log pane rendering changed so only bracket tags (`[INFO]`, `[ERROR]`, etc.) are color-highlighted while the rest of each line remains default text color.
  - Fixed Qt key handling crash (`QKeyEvent.StandardKey` -> `QKeySequence.StandardKey`).
- **CI / Release**:
  - Added a dedicated Windows **PyInstaller** server binary path in CI.
  - Server EXE artifacts are now prepared and included in GitHub release assets.
  - README build-info generator now supports a **Server** build channel by reading `App build/Server/latest.json`.
- **Icons / Branding**:
  - Added `scripts/generate-icon-set.mjs` and `npm run icons:generate` to regenerate base icon sizes from a single source image.
  - Regenerated base and beta icon sets from a new source image.
  - Beta icon badge updated to **theme green** and moved to the **top-right** corner.
  - Floating `+` beta tag (`.app-beta-badge`) updated to the same green theme palette.
- **Web / Loading overlay**:
  - Removed the old straight fluid progress bar.
  - Loading progress now uses the **planet orbit ring** as a curved progress arc (circular progress around the planet).
  - Benchmark and startup loading progress updates now drive the orbit-ring progress element and ARIA values.

### v1.43.0 - 2026-03-24 - Loader swirl, log review UX, tinker refresh

- **Web / Loading overlay**: Orbit widget is larger; small orbit dot glow refined; main planet now shows a visible liquid-style swirl/wobble animation. `prefers-reduced-motion` disables decorative liquid sub-animations.
- **Web / Log wizard**:
  - **Skip** on optional steps now clears that step’s inputs/items first, then advances (discard-on-skip behaviour).
  - Step 10 **Review** changed from a dense line list to section cards with friendlier labels, optional empty-state hints, and improved mobile readability.
- **Web / AI Analysis (mobile)**: Pain-by-body-part table now fits slide width on narrow screens (no sideways inner scroll for the card); responsive column sizing and badge scaling.
- **Web / Goals**: Default targets (only when user has never saved goals) are now **10,000 steps**, **9 glasses hydration**, **sleep score 5**, **3 good days/week**.
- **Server / Tinker dashboard**:
  - Updated visual styling to a darker mint-accent theme.
  - Added button icons for key actions.
  - Database viewer keeps multi-row selection (`extended`) and now includes explicit **Ctrl/Shift + Ctrl+A** guidance and select-all shortcut binding.
  - Server log pane now applies full-line colour by severity (console-like), with token highlighting layered on top.
- **Docs**: README, styling guide, and security notes updated for these behaviours.

### v1.42.0 - 2026-03-23 - Settings modal, tile pickers, AI swipe cue, tutorial, docs

- **Web / Settings**: Modal uses **shared surface tokens** (`--modal-surface`, `--surface-border`, `--surface-outer-glow`) instead of a separate blue-grey panel and heavy neon-only glow; header and close button align with **button chrome** tokens. **Carousel** panes use **`contain: paint`**, **`min-width: 0`**, **`overflow-x: clip`** on the viewport, and **`visibility: hidden`** on **`[aria-hidden="true"]`** panes so the next section’s copy does not bleed at the edge.
- **Web / Settings copy layout**: **`.settings-hint`** is **left-aligned** (no right-aligned body text). Rows that are helper-only (no toggle) use a **column** layout via **`.settings-option-with-hint:not(:has(.toggle-switch))`**. Toggle rows get **gap**, **`min-width: 0`**, and **`flex-shrink: 0`** on switches so labels do not crush controls.
- **Web / Log & tile pickers**: Symptom / energy / stressor modal triggers use **pill** layout (icon + label + chevron), not full-width bars (see **`docs/styling.md`**).
- **Web / AI Analysis (mobile)**: **Card-edge peek** (narrower panes + gap) and a **dot row** under the track signal multiple slides without instructional copy. **Scroll index** uses pane geometry (`aiMobilePagerGetActiveIndexFromScroll`) so height sync and chrome stay correct when panes are not full width. Optional **first-visit shimmer** only (no chevrons); dismiss on scroll or timeout; **`localStorage`** `healthApp_aiSwipeCueSeen`; **`prefers-reduced-motion`**; hidden **≥ 769px** where **‹ ›** apply.
- **Web / Tutorial**: Removed bottom **step dots**; navigation remains **‹ ›**, swipe, and keyboard.
- **Docs**: New **[styling.md](styling.md)**; **[README.md](../README.md)** and **[project-reference.md](project-reference.md)** updated. **`styles.css` / `app.js` `?v=`** bumps in **`index.html`** as shipped.
- **Build**: **`npm run build:web`** after **`app.js`** changes; refresh **`web/app.min.js`** for releases.

### v1.41.0 - 2026-03-23 - AI analysis, Settings carousel, a11y, copy

- **Web / AI Analysis**: **At a glance** plain-language strip above dense results; section **intros**; **Typical / Latest / Outlook** labels and **visible status chips** (not colour-only) on trend cards; **aria** improvements (regions, list semantics, correlation expanders as **buttons** with `aria-expanded`, pain table **caption** + **`scope="col"`**); desktop **timeline** (coloured vertical rail + dots) with **scroll snap** between sections (respects **`prefers-reduced-motion`**).
- **Web / Settings**: Modal split into **sections**; desktop **‹** / **›** controls; **swipe** between sections on narrow viewports; header **section index** (e.g. `1 / 8`); focus trap limited to the active pane; **`inert`** on inactive panes where supported.
- **Web / pickers**: Selected **food, exercise, stressor, symptom, energy & clarity** tiles show a **corner checkmark**; stressor/symptom tooltips say **Toggle**.
- **Web / UI**: Floating **+** FAB cluster inset **further from the screen edge** (safe area + padding); **`styles.css`** cache bump in **`index.html`**.
- **Copy style**: Replaced Unicode **em dash** (`U+2014`) with ASCII **hyphen-minus** across the repo (user-facing strings, comments, docs).
- **Docs**: **[README.md](../README.md)**, **[app-and-features.md](app-and-features.md)**, this changelog.
- **Build**: Run **`npm run build:web`** before release; **`web/app.min.js`** remains gitignored (generate locally/CI).

### v1.40.0 - 2026-03-23 - README & changelog

- **Docs**: Root **[README.md](../README.md)** now summarises **direct legacy load** on Android APK vs **React + iframe** on web/dev, **`npm run build:apk`**, and **debug (CI) vs release/AAB** with a link to **[docs/setup-and-usage.md](setup-and-usage.md#nav-react-android)**.

### v1.39.0 - 2026-03-23 - Android WebView performance

- **Capacitor / React**: **`react-app/src/main.tsx`** redirects native platforms to **`legacy/index.html`** immediately; **`app-web.tsx`** loads the React + iframe shell only for browser/Vite. Avoids nested WebView + iframe on APK/iOS.
- **Web**: **`isRianellNativeApp()`** treats **`window.Capacitor.isNativePlatform()`** as authoritative. New **`web/android-update-check.js`** replaces the React-only APK update modal ( **`App` / `Browser`** plugins). **`performance-utils`**: stricter AI defer and **`isRianellCapacitorAndroid()`**; **`index.html`** skips idle **`summary-llm.js`** preload on Capacitor Android; **`rel=preload`** for main script (patched to **`app.min.js`** in **`copy-webapp.js`**). **`styles.css`**: **`overscroll-behavior-y: contain`** on **`.app-main-scroll`**. **`workers/io-worker.js`**: note on payload size for WebView.
- **Android patch**: **`patch-android-sdk.js`** ensures **`android:hardwareAccelerated="true"`** on **`<application>`** when absent.
- **Docs**: **`docs/setup-and-usage.md`** - native vs iframe behaviour, release/debug/AAB, profiling, regression checklist.

### v1.38.0 - 2026-03-23 - MOTD selection

- **Web**: Dashboard preset MOTD (when the on-device LLM does not replace it) picks a **random** line from **`web/motd.json`** **once per full page load**; the same line is reused for repeated `updateDashboardTitle` calls in that session. **`web/motd.json`** `description` updated.


### v1.37.0 - 2026-03-22 - Icons, repo cleanup

- **Web**: Regenerated **`web/Icons/Icon-*.png`** from **`logo-source.png`**; **`scripts/generate-icons.mjs`** and **`scripts/generate-native-icons.mjs`** removed (use **`npm run build:android`** / **`prepare-android-assets.mjs`** + **`@capacitor/assets`** for native; edit **`web/Icons/`** and **`logo-source.png`** directly for future PWA changes).
- **Repo**: Removed legacy **`web/Icons/generate_icons.py`**. Root **`package.json`**: dropped **`generate:icons`** / **`generate:native-icons`** scripts.


### v1.36.0 - 2026-03-22 - APK / native shell performance

- **Legacy web bundle (iframe)**: Root **`npm run build`** runs **`build:web`** first, then **`react-app`** copies **`web/app.min.js`** into **`public/legacy/`** and rewrites **`legacy/index.html`** to load it instead of **`app.js`** (production/`vite build` only; **`npm run dev`** still uses full **`app.js`** for debugging). Much smaller script download and parse on device.
- **React shell (Vite)**: **`manualChunks`** for React and **`@capacitor/*`**; **`target: es2020`**, esbuild minify for the shell bundle.
- **Capacitor**: **`backgroundColor`**, **`android.webContentsDebuggingEnabled: false`** (less WebView debugging overhead on debug APKs; set **`true`** in **`capacitor.config.ts`** when you need Chrome `chrome://inspect`).
- **Gradle (patch)**: **`patch-android-sdk.js`** appends parallel build + cache + JVM heap hints when missing (speeds **`assembleDebug`** in CI).


### v1.35.0 - 2026-03-22 - Android launcher icon pipeline

- **Android / Capacitor**: PWA icons under `web/Icons/` are not applied to the native project by `cap sync` alone. **`scripts/prepare-android-assets.mjs`** builds **`react-app/assets/logo.png`** (from **`web/Icons/logo-source.png`**, or **`Icon-512.png`**, or a flat placeholder), then **`@capacitor/assets`** generates **mipmap** / adaptive icon and splash assets before **`cap sync`**. Root **`npm run build:android`** and CI **`android`** job run this sequence.
- **Dependencies**: **`react-app`**: devDependency **`@capacitor/assets`**. **`.gitignore`**: **`react-app/assets/logo.png`** (generated locally/CI).


### v1.34.0 - 2026-03-22 - MOTD quotations content

- **Web**: **`web/motd.json`** preset list replaced with **144 attributed quotations** (historical / widely published sources). Licensing for redistribution remains your responsibility; see the file’s `description` field.
- **Repo**: No redundant scripts to remove beyond what **v1.33.0** already dropped; **`scripts/`** retains **`smoke-function-trace.mjs`** and related tooling.


### v1.33.0 - 2026-03-22 - MOTD JSON, legacy copy

- **Web**: Dashboard MOTD fallback lines load from **`web/motd.json`** (fetched before `loadSettings()`); minimal inline fallback if fetch fails. Preset list still rotates per calendar day until the on-device LLM replaces it (when AI is enabled).
- **React / Capacitor**: **`motd.json`** is included in **`react-app/copy-webapp.js`** static root files so **`/legacy/`** builds serve the file.
- **Repo**: Removed redundant **`scripts/extract-motd-to-json.mjs`** (edit **`web/motd.json`** directly or use your editor’s JSON formatter).


### v1.32.0 - 2026-03-22 - Function trace, CI web build

- **Web (debug)**: Build-time **function trace** (Babel AST) for first-party `web/**/*.js` with excludes (vendor/min bundles, workers, service worker, `trace-runtime.js`). **`web/trace-runtime.js`** loads before other app scripts; **`trace-runtime.js`** is never instrumented so hooks exist before any wrapped code. Toggle **Function trace** (verbose `console.debug` per function) only in **God mode** (backtick `` ` `` **with demo mode on**); persisted as `localStorage.rianellFunctionTrace`. Gated by **`window.__rianellFnTraceOn`** (demo + toggle); **console-only** - no `Logger`, no `fetch` (no network for tracing).
- **Build**: Root **`npm run build:web`** runs **`web/build-site.mjs`** (mirror to **`web/.trace-build/`** + minify **`app.js`** → **`app.min.js`**). **`npm run smoke:trace`** checks the transform output parses.
- **CI**: **`deploy-pages`** runs **`npm ci`** (cached from **`package-lock.json`**) then **`node web/build-site.mjs --site site`** so the live site matches the local web build (instrument + minify), then rewrites **`index.html`** to **`app.min.js`**.
- **README**: Changelog and [GitHub Pages](setup-and-usage.md#github-pages-app-at-repo-root) / [Performance](app-and-features.md#performance-optimisation-stack) updated for this pipeline.


### v1.31.0 - 2026-03-22 - Donate, wizard buttons, selected lists

- **Donate**: PayPal **JavaScript SDK** with Smart Payment Buttons when `paypal-client-id` (or `window.__PAYPAL_CLIENT_ID__`) is set; amount chips; fallback hosted donate URL if unset. CSP extended for PayPal script and API hosts.
- **Log wizard**: **Back** / **Skip** / **Next** use a **three-column grid** and visibility (not `display:none`) so the row does not collapse to one full-width button on early steps; step 0 **Back** acts as **Close** (home).
- **UI**: Selected stressors/symptoms (and edit lists) **`.item-tag`** rows match card styling; mobile **selection-summary-sticky** uses glass blur instead of flat `#0a0a0a`.


### v1.30.0 - 2026-03-22 - Mobile shell, charts metrics, console hygiene

- **Web (mobile)**: Viewport-locked **`.app-shell`**, single scroll on **`.container`**; **+** FAB **fixed** over content above bottom tabs; bottom bar as flex footer. Tab switching resets main scroll for consistency.
- **Web (charts)**: “Select metrics to display” uses the **main scroll** on narrow screens (no inner metric panel scroll).
- **Web (console)**: Broader **`unhandledrejection`** filters for extension noise (`tabs:outgoing.message.ready`, `VM… vendor.js`, etc.).
- **Web (nav)**: Neutral focus rings on bottom tab buttons (avoid global green `--shadow-focus` glow).


### v1.28.3 - 2026-03-22 - Dashboard bracket log format

- **Server**: **`BracketLevelFormatter`** (`server/config.py`) prefixes dashboard lines with **`[LEVEL]`** (two spaces before the timestamp); **`EmojiLogFormatter`** remains for **file** and **stream** handlers only. Console and `logs/*.log` keep emoji; Tkinter **Server Logs** uses ASCII brackets and coloured tags (`BRACKET_*` in `server/main.py`).
- **Server**: Log pane font set back to **Consolas**; leading `[INFO]` / `[ERROR]` / etc. highlight with level-appropriate colours.


### v1.28.2 - 2026-03-22 - Server dashboard log emoji

- **Server**: Tkinter **Server Logs** pane uses a Segoe UI–family font (`Segoe UI`, `Segoe UI Emoji`, or `Segoe UI Symbol` when installed) so level emojis render; monospace **Consolas** does not show emoji in Tk `Text` on Windows (`server/main.py`).
- **Server**: `EmojiLogFormatter` inserts **two spaces** after the emoji for a clear gap before the timestamp (`server/config.py`).


### v1.29.0 - 2026-03-22 - Mobile nav, console log colours, README

- **Web**: Bottom **Home / Logs / Charts / AI** bar and floating **+** are **siblings** of `.app-shell` in `index.html` so fixed tab labels and icons render correctly on mobile WebKit; minor stacking CSS (`isolation` / `z-index` on tab buttons). Log entry is opened via **+** (no Log tab).
- **Server**: `ConsoleColorBracketFormatter` colours **`[LEVEL]`** in the terminal (blue INFO, red ERROR, etc.); `EmojiLogFormatter` remains for **file** logs only (no ANSI in files). Respects `NO_COLOR` and `FORCE_COLOR`.
- **README**: App overview diagram and [App shell](app-and-features.md#app-shell-and-log-experience-web-ui) / [Logging](project-reference.md#logging) sections updated to match.


### v1.28.1 - 2026-03-22 - Server logs & charts visibility

- **Server**: `EmojiLogFormatter` in `server/config.py` prepends a per-level emoji to every `Rianell` log line (file, console, Tkinter dashboard); `server/main.py` uses the same formatter for the dashboard `TextHandler`.
- **Charts tab**: `updateChartEmptyState` calls `enforceChartSectionView` when data appears; `.chart-container.hidden` and chart container IDs use `display: none !important` so Combined / Balance / Individual panels do not stack visibly when switching modes.


### v1.28.0 - 2026-03-22 - Performance overhaul

- **Web**: Centralised log reads, chart in-place updates, AI/precompute dedupe and scheduling, virtualised View Logs append, deferred chart CSS and idle `summary-llm` load, IndexedDB mirror, IO workers, optional SW, perf marks / long-task observer.
- **Server**: gzip static assets; cache headers for static extensions.
- **CI**: esbuild minify + HTML rewrite on GitHub Pages deploy; root `npm run build:web` for local minified bundle.


### v1.27.5 - 2026-03-22 - Documentation

- **README**: Added AI Analysis tab screenshot under [AI analysis](app-and-features.md#ai-analysis); image stored at `docs/images/ai-analysis.png`.


### v1.27.4 - 2026-03-22 - Documentation

- **README**: Added **View logs** bullet and screenshot (date filters and entry card) under [App shell and log experience (web UI)](app-and-features.md#app-shell-and-log-experience-web-ui); image stored at `docs/images/view-logs.png`.


### v1.27.3 - 2026-03-22 - Documentation

- **README**: Added tile picker (card selector) screenshot for **energy & mental clarity** under [App shell and log experience (web UI)](app-and-features.md#app-shell-and-log-experience-web-ui); image stored at `docs/images/card-selector-energy-clarity.png`.


### v1.27.2 - 2026-03-22 - Documentation

- **README**: Added Home tab screenshot under [App shell and log experience (web UI)](app-and-features.md#app-shell-and-log-experience-web-ui); image stored at `docs/images/home-dashboard.png`.


### v1.27.1 - 2026-03-22 - Documentation

- **README**: Added screenshot of the Health App Server Dashboard (Tkinter control panel) under [Server Dashboard Features](setup-and-usage.md#server-dashboard-features); image stored at `docs/images/server-dashboard.png`.


### v1.28.0 - 2026-03-22 - #Demo onboarding, donate modal, MOTD

- **`#Demo` deep link**: The first time a user opens the app via **`/#Demo`** (not via the Settings demo toggle alone), after demo mode loads they get **random Goals & targets** once and the **tutorial** if it was not already completed (`rianellDemoHashOnboardingDone`, `rianellDemoHashPendingOnboarding` in sessionStorage across the reload).
- **Donate**: Settings **Donate** opens the PayPal modal reliably (wired in `event-handlers.js`); floating **×** on the iframe; optional auto-close on PayPal `postMessage` heuristics.
- **Dashboard MOTD**: Preset line rotates **once per calendar day**; shimmer/fade animation removed so text updates are an instant swap.


### v1.27.0 - 2026-03-22 - Charts tab views, demo mode

- **Charts tab**: Balance / Combined / Individual now show **only** the active chart layout. Visibility is enforced after chart builds and background preload; **`chartView`** drives refresh (legacy **`combinedChart`** is normalised on settings load). Individual lazy charts stay hidden when another mode is active.
- **Demo mode**: With demo mode enabled, **each full page load** regenerates demo health logs (same rules as enabling demo: desktop `generateDemoData`, mobile premade + date rebase). Initial load skips reading stored `healthLogs` in demo mode so async decompression cannot overwrite fresh demo data.


### v1.26.0 - 2026-03-22 - UI, MOTD, first paint, extensions

- **Mobile bottom nav**: Increased flex `gap` between items so tab buttons are not visually squashed on small screens.
- **Mobile header**: Goals and Settings controls use **in-flow layout** above the green dashboard title (≤768px) instead of overlapping long/wrapped MOTD text.
- **Dashboard MOTD**: Removed personalised “Welcome to {name}'s health”; header uses **preset lines** (one per calendar day) plus optional LLM line **after** `body.loaded` so startup does not double-load the Transformers pipeline with `preloadSummaryLLM`. Tab title remains **Rianell**.
- **First paint**: Inline critical CSS in `index.html` for `html`/`body` and `#loadingOverlay` so the loading screen is **dark with spinner** before `styles.css` loads (avoids a white flash).
- **Extensions**: Early `unhandledrejection` listener plus a stronger handler in `app.js` to **suppress noisy extension promise rejections** (e.g. `tabs:outgoing.message.ready`, `vendor.js`). Optional: use a profile without extensions for a clean console when debugging.


### v1.25.0 - 2026-03-22 - `server/launch-server.ps1` for Windows

- **Windows launcher**: Added `server/launch-server.ps1` to start the Health App server from the repo root (`python -m server` or `py -3 -m server` when `python` is not on PATH). README documents usage with Windows PowerShell and `pwsh`, and optional `$env:PORT` / `$env:HOST`.


### v1.24.0 - 2026-03-21 - Tile picker dialog, mobile chips, dashboard MOTD

- **Tile picker (`<dialog>`)**: Replaced native `<details>` chip sections with a shared **full-screen bottom sheet** (centred max-width panel from 768px up). Triggers use buttons with `aria-expanded`; content is **teleported** into `#tilePickerSheet` and restored on close so chip grids keep stable IDs. Food/exercise modals and the edit-entry form use the same pattern; closing a parent modal closes the sheet. `collapseSectionContent` closes the sheet when collapsing a section. Removed the old `makeAccordion` / one-open-details wiring.
- **Mobile-centric chips**: Horizontal scroll strips, scroll snap, denser tiles, and softer open shadows on small viewports; optional debounced **filter** inputs per chip area (food, stressors, symptoms, exercise).
- **Dashboard MOTD**: `summary-llm.js` exposes `generateMotdWithLLM`; `updateDashboardTitle()` loads the script when needed and sets a short on-device motivational line per full page load (skipped when `deferAI` is true).


### v1.23.0 - 2026-02-24 - Developer in God mode, GPU stability graph, better GPU utilisation

- **Developer settings moved to God mode**: The "Clear performance benchmark cache" and "View last benchmark details" buttons (and hint) are no longer in Settings; they now live in **God mode** (press <kbd>`</kbd>). Benchmark modal and empty-state copy updated to say "God mode (` key)" instead of "Settings → Developer". README Settings and Device performance sections updated.
- **GPU stability graph**: The Performance & AI benchmark modal (brief and "View last benchmark details") now includes a **Stability (GPU)** panel when detailed results are expanded. The benchmark runs the GPU test 5 times and stores `gpu.scoreSamples`; a sparkline and stats (Backend, Samples, Mean ms) are shown. Layout: three panels (Test results, Stability CPU, Stability GPU) on wide screens; grid wraps on smaller viewports.
- **Better GPU utilisation**: WebGPU adapter and WebGL context request **high-performance** power preference. TensorFlow.js WebGL backend uses `WEBGL_POWER_PREFERENCE: 'high-performance'` and is enabled when the benchmark reports a good GPU (not only on desktop). TF WebGL is warmed early (idle callback or timeout) when GPU is good and AI is enabled so the first analysis avoids cold init. AIEngine exposes `warmGPUBackend()`.


### v1.22.0 - 2026-02-24 - Tier 5 maxed, GPU detection & acceleration, accelerated UI

- **Tier 5 maxed**: Desktop and mobile tier 5 profiles now use maximum resources-highest chart point limits (400/450 desktop, 280/300 mobile), fastest preload and stagger delays (300 ms chart, 400 ms AI, 15–18 ms lazy stagger), and full animations. Overrides (e.g. tablet) no longer reduce chart capacity below tier 5 when the effective tier is 5.
- **GPU detection and benchmark**: After the CPU benchmark, a quick GPU check runs (WebGPU adapter request or WebGL clear loop). Result is cached with the benchmark (cache version bumped to 4). Profile exposes `gpuBackend` ('webgpu' | 'webgl' | 'none') and `gpuGood`; tier 4 devices with a good GPU are treated as effective tier 5 for charts and AI.
- **GPU-accelerated AI**: Summary/suggest LLM (Transformers.js) loads with `device: 'webgpu'` or `device: 'webgl'` when the benchmark reports GPU available; on failure the app falls back to CPU (WASM). Same model IDs and in-memory cache behaviour; no cache migration.
- **Transformers.js upgrade**: Upgraded from @huggingface/transformers@3.2.0 to **@3.3.2** for stable WebGPU/WebGL device support; 3.4.x is avoided due to a known ONNX Runtime Web issue (`n.env is not a function`).
- **Accelerated UI and charts**: When tier is 5 or GPU is good, the chart section gets class `chart-gpu-accelerated` so chart containers use `translateZ(0)` for compositor layer promotion. Critical-path work (combined chart build and AI preload) is scheduled with `scheduler.postTask(..., { priority: 'user-blocking' })` when available (Chrome), otherwise deferred once.
- **Benchmark modal**: New line shows GPU status-e.g. "GPU: WebGPU available, used for AI" or "GPU: Not available (using CPU for AI)". Profile JSON in details includes `gpuBackend` and `gpuGood`.
- **Docs**: README Device performance section describes GPU and tier 5; on-device LLM uses Xenova FLAN-T5 small/base by tier (tier 5 uses **base** because **large** can 401 from the browser); browsers do not expose CPU frequency/turbo (app uses tier + GPU and optional Scheduler API).


### v1.21.0 - 2026-02-24 - Escape toggles Settings on desktop, benchmark progress bar, device hardware detection

- **Escape key on desktop**: Escape now **opens** Settings when it is closed and no other modal is open; it still **closes** Settings when open. On mobile, Escape continues to close Settings only. Desktop is detected via `DeviceModule.platform.platform === 'desktop'` or non-mobile User-Agent.
- **Benchmark progress indicator**: While the performance benchmark runs on first load, the loading overlay shows a **progress bar** (0–100%) and the existing text ("Measuring performance… X% · &lt;current test&gt;"). The bar is visible only during the benchmark phase and completes to 100% before the overlay is removed.
- **Device hardware detection**: Optional UAParser.js v1.x for OS, device type/vendor/model, and CPU architecture; **estimated memory bucket** when `navigator.deviceMemory` is missing (e.g. iOS). Benchmark modal and env snapshot show OS, device, CPU, and "estimated: low/medium/high" RAM. Tier heuristic and profile memory overrides use the estimated bucket so iOS and other no–deviceMemory environments get better default tiers.
- **README**: Settings & UI now document Escape key behaviour; Device performance section updated with progress bar and tier range; changelog v1.21.0 added.


### v1.20.0 - 2026-02-24 - Benchmark-driven AI model selection and brief benchmark UI

- **Performance & AI benchmark modal**: Modal title and framing updated to "Performance & AI benchmark". Default view is **brief**: one-line summary (device, tier, class, **Recommended AI model: small/base**) and a line stating the device can run the recommended on-device model (flan-t5-small/base). **"See detailed benchmark results"** expandable section contains the test bars, stability (CPU) panel, and "Chosen optimisation profile" JSON so details are optional.
- **AI-oriented benchmark**: Benchmark messaging and profiles are oriented around **on-device AI runnability**; each tier profile includes `llmModelSize` ('small' | 'base') used for the summary/suggest LLM. Device-benchmark comment and UI copy reflect this.
- **On-device AI model in Settings**: Settings → Performance → **On-device AI model** dropdown: "Use recommended (for this device)", "Small (faster, lower memory)", "Base (better quality)". Stored as `appSettings.preferredLlmModelSize`; hint shows "Recommended: flan-t5-…" when the benchmark is ready, or "Run benchmark (reload app) to see recommendation."
- **Model resolution and cache**: `summary-llm.js` resolves model in order: user override (`preferredLlmModelSize` 'small'/'base') → benchmark profile `llmModelSize` → deviceClass fallback. `getOptimizationProfile()` in `performance-utils.js` now returns `llmModelSize`. Changing the setting calls `clearSummaryLLMCache()` so the next summary/suggest loads the chosen model.
- **README**: AI analysis and Device performance sections updated; changelog v1.20.0 added.


### v1.19.0 - 2026-02-23 - Benchmark-driven device classifier and expansive settings

- **Device benchmark module** (`web/device-benchmark.js`): Classifies platform as **mobile** or **desktop** (including Capacitor native app), runs a short CPU benchmark to determine a performance **tier (1–4)**, and caches the result in localStorage. Exposes `DeviceBenchmark.runBenchmarkIfNeeded`, `isBenchmarkReady`, `getPerformanceTier`, `getFullProfile`, `getLegacyDeviceClass`, `clearBenchmarkCache`, etc.
- **Expansive profiles**: Separate **MOBILE_PROFILES** and **DESKTOP_PROFILES** tables (4 tiers each) drive chart points, AI preload, DOM batching, demo data days, load timeout, LLM model size, and related options. When the benchmark is ready, `performance-utils.js` uses these profiles via `getOptimizationProfile()` and `getDeviceOpts()` and syncs `platform.deviceClass` from the benchmark tier.
- **Load gating**: App load handler runs the benchmark first (when `DeviceBenchmark` is present). Loading text shows “Measuring performance…” during the run. If the result was **not** cached (first run), a modal shows the detected device class (platform + tier + class) for user acknowledgment; on OK the result is saved and the app continues. If cached, the app proceeds without the modal.
- **Developer**: (Moved to God mode in v1.23.0.) Clearing “Clear performance benchmark cache” forces the benchmark and device-class modal to run again on next reload.
- **Alert modal callback**: `showAlertModal(message, title, onClose)` now accepts an optional third argument; when provided, the OK button (and overlay/Escape close) invokes the callback before closing, used for the device-class acknowledgment flow.
- **README**: New “Device performance (benchmark)” and Developer setting documented; changelog entry for v1.19.0.


### v1.18.0 - 2026-02-23 - Tab defaults and chart first-load fix

- **Charts tab**: Always opens in balance view when the tab is clicked; preference is saved so balance is the default each time.
- **View Logs tab**: Defaults to last 7 days when the tab is opened (was today).
- **Individual charts first load**: Only the combined chart is built during the loading overlay; the 14 individual charts are built after the overlay is removed and layout is complete (rAF + 80 ms delay when view is individual), so they get correct dimensions and no longer appear blank until the user switches view and back.


### v1.17.0 - 2026-02-23 - Dependencies: Dependabot alerts resolved

- **npm (react-app)**: Upgraded Vite 5 → 6.4 (esbuild 0.25+, fixes moderate CORS advisory) and all @capacitor/* 6 → 7 (fixes high: minimatch ReDoS, tar path traversal). Regenerated package-lock.json; `npm audit` reports 0 vulnerabilities.
- **Node**: Root `package.json` engines set to Node >=20 for Vite 6 compatibility. README and local setup now state Node.js 20+.
- **React/Capacitor**: @vitejs/plugin-react ^4.5.0; build and audit verified.


### v1.16.0 - 2026-02-23 - Performance, memory caps, loading UX, disclaimer, CSP

- **Loading overlay**: Kept visible until combined chart and summary LLM preload are ready (or 12s timeout); loading text set to "Loading charts and AI…". Ensures the app does not appear until the main heavy work is done.
- **CPU and polling fixes**: Chart container readiness in `loadChart` now capped at 40 retries (2s) to avoid unbounded 50ms polling and 100% main-thread usage. `updateCharts` ApexCharts retry capped at 24 (12s) when the library is not yet loaded.
- **Memory caps**: `DOMBatcher` in `performance-utils.js` flushes when pending updates exceed 150 to avoid unbounded growth when the tab is backgrounded (rAF throttled). `DataCache` limited to 80 keys with LRU eviction. Periodic cleanup (60s) also clears `PerformanceMonitor.marks` when size exceeds 20 to prevent leak.
- **Supabase**: `initSupabase` in `cloud-sync.js` skips creating the client when URL or anon key is missing or placeholder; logs one warning instead of repeated "supabaseUrl is required" errors.
- **CSP**: `connect-src` in `index.html` updated to allow `https://cas-bridge.xethub.hf.co` and `https://*.xethub.hf.co` so the in-browser summary LLM can fetch Hugging Face model assets.
- **Disclaimer**: Full disclaimer text ("For patterns only… You can share this at your next visit. AI data (e.g. prediction weights) is stored on your device and, when signed in, backed up to your cloud account.") applied to plain-text export, print report footer, and both PDF export paths in `export-utils.js` and `app.js` so it matches the AI Analysis on-screen disclaimer.


### v1.15.0 - 2026-02-23 - Defer app reveal, chart fix, config resilience, docs

- **Defer app reveal until charts and AI ready**: The loading overlay stays visible until the combined chart (and its data/predictions) and the summary LLM pipeline are ready, or a 12s timeout. This avoids the UI stuttering while heavy chart and AI work run on first load. `summary-llm.js` exposes `window.preloadSummaryLLM()`; the load handler in `app.js` awaits charts + AI with `Promise.race([ Promise.allSettled([chartsReady, aiReady]), timeout ])` then reveals the app and runs the rest of init.
- **Combined chart fix**: `deviceOpts` was used in `createCombinedChart` without being defined, causing `ReferenceError` and breaking balance/combined charts. It is now set at the start of the function via `PerformanceUtils.getDeviceOpts()` with a safe fallback.
- **Supabase config resilience**: Inline script in `index.html` sets `window.SUPABASE_CONFIG` to a fallback before loading `supabase-config.js`, so a syntax error in that file (e.g. smart quotes) no longer breaks the page. Non-ASCII characters (emoji) in `supabase-config.js` comments were replaced with ASCII so the file parses everywhere.
- **GitHub secrets**: Deploy workflow already injects `SUPABASE_URL` and `SUPABASE_ANON_KEY` from repository secrets into the built site; README and comments clarify that tokens come from GitHub secrets at deploy time.
- **README**: Features section expanded to document all app features (tracking, charts, AI, goals, cloud, install options, server, security). Version set to 1.15.0.


### v1.14.1 - 2026-02-23 - Neural network optimisation and loading states

- **Neural network optimisation** (`web/AIEngine.js`): Added `yieldToMain()` and yield between analysis layers in `NeuralAnalysisNetwork.forward()` so the main thread can update the UI during analysis, reducing perceived lag and avoiding a frozen page.
- **AI Summary loading**: Loading state shows "Analyzing your health data…" and waits one frame (`requestAnimationFrame` + `setTimeout`) before starting analysis so the message is visible; existing pulse animation on the loading icon retained.
- **Combined chart loading**: When predictions are computed (cache miss), a "Calculating predictions…" overlay with spinner is shown on the combined chart container and removed when done, so chart view no longer feels stuck during prediction runs.
- **Suggest note**: Already showed "Generating…" for the LLM path; no change.


### v1.14.0 - 2026-02-23 - Background loader module, slower rate, optional worker

- **Background loader module** (`web/background-loader.js`): Device-aware scheduling for chart and AI preload; loads after `performance-utils.js`, exposes `BackgroundLoader.scheduleChartPreload` and `BackgroundLoader.scheduleAIPreload`.
- **Slower preload rate**: Chart preload uses device-based stagger (low 280 ms, medium 200 ms, high 120 ms) and gap after combined (350 / 260 / 180 ms); profile `chartPreloadDelayMs` for initial delay.
- **performance-utils.js**: `platform.hardwareConcurrency` and `getOptimizationProfile().useWorkers` added for loader (worker path was never wired; AI preload runs on main thread only).
- **app.js**: Chart and AI preload delegate to `BackgroundLoader` when present; `getAIPreloadData`/`setAICache` for worker path; fallbacks when loader missing.


### v1.13.9 - 2026-02-23 - Throttle preload to avoid UI freeze

- **Chart preload**: Combined chart and individual charts no longer run in one blocking burst. Combined chart is deferred with `requestIdleCallback` (or `setTimeout(0)`); a 220 ms gap follows before the first individual chart; each subsequent chart is staggered by 180 ms (was 80 ms) so the app stays responsive.
- **AI preload**: An extra idle callback (or short delay) before running AI preload ensures the sync work does not block the same frame as chart preload or startup.


### v1.13.8 - 2026-02-23 - Device-based optimisation, chart & AI preload

- **Device opts**: `PerformanceUtils.getDeviceOpts()` in `performance-utils.js` returns `{ reduceAnimations, maxChartPoints, deferAI, batchDOM }` from device class and `prefersReducedMotion`. Low: 30 chart points, animations off, AI deferred; medium: 80 points, batch DOM; high: 200 points, full features.
- **Charts**: All chart options (combined, balance, individual) preload in the background when the Charts tab is opened so switching view is instant. Chart data point caps and animation toggles use `getDeviceOpts()` (and existing viewport caps). Combined and balance charts respect `reduceAnimations`; individual charts use device-based max points.
- **AI analysis**: AI analysis runs in the background (e.g. after load) and is cached so opening the AI tab shows results immediately when the cache matches the date range. On low devices (`deferAI`), the summary note uses the rule-based fallback only (no in-browser LLM load); AI tab open delay is increased to avoid blocking.
- **Log list**: `renderLogEntries` uses `domBatcher.schedule()` when `batchDOM` is true (low/medium) for fewer layout thrashing and smoother scrolling.
- **UI motion**: Heartbeat animation and AI summary UI respect `reduceAnimations` (and existing `prefersReducedMotion` / optimisation profile) so low-end and reduced-motion users get a calmer experience.


### v1.13.7 - 2026-02-23 - Version bump

- **Version**: Bump to 1.13.7 for release tracking.


### v1.13.6 - 2026-02-23 - README and changelog

- **README**: Changelog updated with version summaries; UK English retained.
- **Versioning**: Bump to v1.13.6 for documentation and release tracking.


### v1.13.5 - 2026-02-23 - Per-platform optimisation and hardware detection

- **Platform and capabilities**: Central layer in `performance-utils.js` exposes `PerformanceUtils.platform` (and `window.PlatformCapabilities`) with `deviceClass` ('low' | 'medium' | 'high'), `platform` (ios/android/desktop), `isTouch`, `isStandalone`, `prefersReducedMotion`, and optional `connection`. Single source of truth for hardware and platform used by LLM and charts.
- **Lazy-load LLM on low-end**: On low device class, `summary-llm.js` is not loaded in initial page; it is loaded on demand when the user first uses AI (Summary note or Suggest note). Medium/high devices load it up front for snappier AI.
- **Chart optimisations**: Charts use `deviceClass` to cap data points (low → max 30 points; medium/high keep existing 50/30 by viewport). When `prefersReducedMotion` is true, ApexCharts animations are disabled for that chart.


### v1.13.4 - 2026-02-23 - LLM model by device performance

- **Summary/Suggest LLM**: In-browser model is now chosen by device performance (RAM, CPU cores, mobile heuristic). Low-end and mobile use flan-t5-small; medium/high use flan-t5-base for better quality. Pipeline is cached by model id. If flan-t5-base fails to load, the app retries once with flan-t5-small before falling back to rule-based note.


### v1.13.3 - 2026-02-23 - Summary note and Suggest note LLM improvements

- **Summary note**: Improved LLM prompt and context for a clearer, patient-friendly 2–3 sentence summary; optional line from top stressor in context; strip trailing incomplete sentences from output.
- **Suggest note (log entry)**: "Suggest note" now uses the in-browser LLM (same model as Summary note) when available, with rule-based fallback; short timeout and token limit for snappy response; "Generating…" on button during LLM call.
- **Optimisation**: Shared LLM pipeline for both Summary and Suggest note; no duplicate model load.


### v1.13.2 - 2026-02-23 - CI: fix iOS/Android build push

- **CI**: iOS and Android build workflows now fetch and rebase onto `origin/main` before committing, so the "Update iOS build" / "Update Android APK" push no longer fails when `main` has moved (remote rejected: expected older commit). Removed stash-based rebase; commit is made on top of latest `main`.


### v1.13.1 - 2026-02-23 - AI summary value highlighting, README UK English

- **AI summary readability**: Stress and triggers, Symptoms and where you had pain, Pain patterns, Pain by body part, Nutrition, Exercise, Top foods, and Top exercises now use the same value markup as “What we found” (e.g. `ai-brackets-highlight` for parenthesised values, percentages, and counts) so key figures are easier to scan.
- **README**: Converted to UK English (e.g. visualisation, synchronisation, anonymised, analyse, licence).


### v1.13.0 - 2026-02-23 - AI optional, summary LLM, notifications

- **AI optional**: Settings toggle "Enable AI features & Goals" – when off, hides AI Analysis tab, chart predictions, and Goals (targets button and progress). Stored in settings and synced to cloud.
- **Tutorial**: First card "Enable AI & Goals?" (Enable / Skip for now). If skipped, all AI-related tutorial slides are omitted (View & AI, Settings & data, Data options, Goals).
- **Summary LLM**: In-browser small LLM (Transformers.js, flan-t5-small) for the AI summary note; data-rich context (trends, flares, insights) for short, insightful 2–3 sentence summary. Fallback to rule-based note on error or timeout.
- **Goals & cloud**: Goals and targets saved to cloud (Supabase app_settings) with localStorage; sync on save and on load when signed in.
- **Notifications**: "Enable sound notifications" now respected – notifications use `silent: false` when sound is on (including on mobile). Heartbeat-monitor style sound (Web Audio, lub-dub) plays when reminder fires and app is in foreground, and when enabling sound in Settings. AudioContext unlocked on permission request for mobile.
- **Server**: No server files in repo root; run with `python -m server` (see v1.12.0).


### v1.12.0 - 2026-02-23 - Security, CI & docs

- **Security**: Remove exposed Supabase URL/keys and default encryption key from repo; rewrite git history to redact secrets; document connecting your own API and encryption keys.
- **GitHub Pages**: Deploy workflow injects Supabase config from repository secrets so production site works without committing credentials.
- **Server**: Move server logic into `server/` package; root entry point removed (run with `python -m server`).
- **Install modal**: Post-tutorial install modal (shown once) with web/Android/iOS install options; added to God mode – test all UI.
- **UK English**: User-facing copy and docs use UK spelling (anonymised, optimisation, centre, etc.); schema/code identifiers unchanged.
- **CI**: Android/iOS workflows use pull–rebase before push and stash to avoid unstaged-changes errors; Android compileSdk set to 36.
- **Builds**: Android APK and iOS (Xcode project zip, simulator) output to `App build/Android/` and `App build/iOS/` with `latest.json`; Settings modal uses newest build.
- **README**: Changelog in collapsible sections; God mode and post-tutorial install modal documented.


### v1.11.0 - 2026-02-22 - React shell & neural pipeline

- **React & Android**: React (Vite) shell wrapping web app in iframe; Capacitor 6 for Android; GitHub Actions build APK on push to `main`, output to `App build/Android/`.
- **AI**: Neural-style pipeline for AIEngine (layers: input, trend, correlation, pattern, risk, cross-section, advice, interpretation, summary).
- **UI**: Install web app (PWA) and Install on Android in Settings; styles and README updates.


### v1.10.0 - 2026-02-19 - Goals, medications & sharing

- **Features**: Goals and targets (steps, hydration, sleep, good days); medications; offline queue; sharing.
- **Demo**: Improved flare modelling and smoothing in demo data.


### v1.9.0 - 2026-02-18 - Settings & modals

- **Settings**: Refactor settings modal, tabs and UI styles.
- **Modals**: Fix modal open/close, expose handlers, delegate clicks correctly.


### v1.8.0 - 2026-02-03 - Sharing, consent & God mode

- **Sharing**: Sharing UI and AI PDF export.
- **Consent**: Cookie consent banner; GDPR/cookie policy.
- **Testing**: God mode – test all UI (backtick ` key) to trigger tabs, modals, charts, AI range, form sections.
- **AI**: Enhanced AI analysis and flare detection; UI improvements.


### v1.7.0 - 2026-02-02 - Tutorial

- **Onboarding**: Tutorial for new users; UI updates; tutorial mode (slides: Welcome, Log Entry, View & AI, Settings & data, Data options, Goals, You're all set).


### v1.6.0 - 2026-02-01 - Food, pain & UI

- **Food**: New food log input via tiles; food variety update.
- **Pain**: New pain diagram model; joints in pain diagram.
- **UI**: General UI fixes and app.js updates.


### v1.5.0 - 2026-01-05 - Setup

- Setup added (documentation/setup flow).


### v1.4.0 - 2026-01-03 - Cloud & server

- **Cloud**: User-specific encryption and cloud data management.
- **Server**: Server UI with DB control; bug fixes.
- **Repo**: Remove ignored files from Git tracking.


### v1.3.0 - 2026-01-02 - AI & anonymised data

- **AI**: Optimised AI engine with new models and model selection.
- **Data**: Anonymous dataserver for global prediction models.
- **Server**: Test server multithread; filters fixed.
- **Docs**: README and app documentation updates.


### v1.2.0 - 2026-01-01 - Stability & security

- **Security**: Security update.
- **UI**: Settings modal consistent layer; mobile UI optimisation; UI fixes; UI glitches fixed.
- **Server**: Logger error fixed for multithread.
- **Misc**: Caching bug fixed; demo mode logger updates; log file updates.


### v1.1.0 - 2025-12-31 - Cloud, AI models & demo

- **Cloud**: Cloud sync; SHA-256 for data; Google Drive sync.
- **AI**: Custom condition and tailored LLM; new models (Xenova/LaMini-Flan-T5-783M, GPT, ONNX medical notes); model caching and config; prediction models and data filters; model reset; filters for graphs; BPM animation and AI analysis in view logs.
- **Data**: Data sample script; handling for no data; data deletion protocol; incompatibility fix on imported data.
- **Features**: Demo mode; exercise and food track; optimised prediction patterns and log cards.
- **Fixes**: Stack overflow for encryption solved; AIEngine and app.js updates.


### v1.0.0 - 2025-12-30 - Initial release

- **Core**: Initial commit; health tracking; data visualisation; server for development/testing.
- **AI**: New container for AI logic; AI modal (fixed and UI updates).
- **UI**: Settings and text highlight fix; UI updates; old build added.



