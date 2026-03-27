# Next phase development plan (buildable)

This document is the **single build plan** to finish Rianell’s transition to a **React Native CLI** app that matches the **web/PWA** and produces **Android APK** + **iOS emulator Xcode zip** via CI releases.

**Last updated:** 2026-03-27 — **Phase G (View Logs):** RN **`LogsScreen`** now includes modal **edit flow** (date/flare/core metrics/notes), richer entry context in list/detail (symptoms, stressors, pain location, food, exercise), plus range presets, newest/oldest sort, pull-to-refresh, text filter, filtered count, and share/delete actions; list rendering now includes adaptive **FlatList** thresholds by history size and fixed-row layout hints (`getItemLayout`) for better large-history stability. **Open:** final virtualization strategy decisions and any remaining web-depth card polish. **Phase B increment:** RN Charts now includes first-pass visual baselines across **combined**, **individual**, and **balance** views (color-coded plotted trends + balance bar visualization), plus reduced-motion-aware transition handling for range/view/refresh updates using native accessibility settings. **Open:** fuller chart chrome and prediction-overlay parity. **Phase C increment:** RN AI screen now aligns section ordering/copy closer to web (`At a glance`, `What we found`, `How you're doing`) and now includes deeper web-style explanatory copy across findings/trends/flare/correlation/group blocks plus clearer directional-strength correlation wording. **Open:** continue converging model-runtime depth and any remaining body-copy differences versus web templates. **Phase E increments (notifications + goals):** RN Settings now includes notification preference controls (enable reminder, time, sound) + permission status/request actions, daily reminder scheduling/cancel attempts when permission is granted, delivery semantics status text (Android channel + iOS category/action semantics when runtime supports them), response-path visibility through last reminder action status, user-selectable snooze interval for `later` reminder actions, and runtime capability visibility (schedule/channel/category/action support). Snooze controls now adapt to runtime support, with explicit in-UI fallback messaging when scheduling is unavailable. Reminder actions include `log-now` route-to-`LogWizard`, `later` snooze scheduling (interval-driven) with explicit fallback to app-home if snooze scheduling fails, and explicit `default` app-home open intent; handled responses are consumed/cleared to avoid stale replay. Action status display now uses user-facing labels with listener-unavailable messaging on runtimes without live action callbacks. Persisted mood/sleep/fatigue goals continue to feed Charts balance target lines instead of default-only values. **Open:** broader OS-specific delivery surfaces (additional action semantics and long-tail runtime differences) and broader web goals UX depth. **Wizard polish:** Step 3 now includes searchable body-region chips (diagram + chip parity helper), and Step 4 picker expand/collapse now uses smooth `LayoutAnimation` transitions with empty-search feedback. **Modal parity:** RN Home now includes an in-app **Bug report modal** (submit flow) instead of docs-link fallback; other web-only modals are tracked in §4.5/Phase E. **Supabase parity:** RN now accepts the same **`SUPABASE_*`** source names used by web/Capacitor (plus `EXPO_PUBLIC_*` fallback). **Settings scope:** RN removed in-app install/download buttons; install UX remains web/PWA-facing. **Demo parity:** RN now includes a Demo mode toggle that loads web-style sample logs, refreshes them on launch, and restores user logs when disabled. **AI parity increment:** RN now has an `AIEngine`-style service (`predictFutureValues`, analysis/suggest note fallbacks) plus LLM wrapper hooks for **summary note**, **MOTD**, and note suggestions with model-tier resolution + graceful fallback. **Benchmark parity increment:** RN now includes benchmark tiers + model selection settings; **open:** full web benchmark modal/stability graphs and deeper performance-profile parity in Phase E/F. **CI fix:** `expo-bundle-prod` exports from `apps/rn-app` and checks `expo-modules-autolinking` to prevent old `apps/mobile` path + missing autolinking regressions (§6). **Security-audit fix:** root workspace lockfile was resynced with current manifests so `npm ci --omit=dev` succeeds in `.github/workflows/security-audit.yml` (§6 dependency gate). **Unit-tests + prebuild-assets install fix:** lockfile was fully regenerated from current workspace manifests (removing stale `apps/mobile`/extraneous lock graph metadata) so root `npm ci` succeeds consistently in `unit-tests` and `prepare-minified-assets` jobs in `.github/workflows/ci.yml`. **Unit-tests path fix:** root tests now point to current app directories (`apps/pwa-webapp` and `apps/rn-app`) instead of legacy `web`/`apps/mobile` paths, resolving CI `ENOENT` failures in `npm run test:unit`. **Legacy minified bundle CI fix:** `apps/pwa-webapp/build-site.mjs` now resolves web root across both current and legacy directory layouts to avoid stale `apps/web/.trace-build/app.js` resolution errors in the prebuild asset job.

---

## 1) Product contract (non‑negotiables)

- **One product, two primary surfaces**
  - **Web/PWA**: GitHub Pages deployment of **`apps/pwa-webapp/`** (browser + installed PWA)
  - **Native mobile**: React Native CLI (**`apps/rn-app/`**) (iOS + Android)
- **No WebView shortcut** for core UI on mobile.
- **Capacitor (`apps/capacitor-app/`)** is **legacy**: it wraps the **same** built PWA assets as GitHub Pages (legacy WebView load). Use it only for frozen APKs / historical builds — **not** as the UX reference for new RN work.
- **Parity scope**: features, UI hierarchy, animations/micro‑interactions, settings, data behavior, permissions rationale, and empty/error states.

**Definition of done (global):** a user can follow the same flows on web/PWA and native mobile and get the same results with the same UX intent; exceptions are listed and signed off.

---

## 2) Current repo state (assumed true)

These are treated as “already implemented” and should not be re-planned here:
- **Repo layout:** **`apps/pwa-webapp/`** = static PWA (parity reference for HTML/CSS/JS); **`apps/rn-app/`** = React Native (Expo) CLI app; **`apps/capacitor-app/`** = legacy Vite + Capacitor shell (WebView). Root **`package.json`** workspaces: **`apps/*`**, **`packages/*`**.
- `apps/rn-app` exists with navigation + settings shell + AsyncStorage-backed logs; **Settings** includes **Data management** (JSON export/import with merge/replace). Native install/download buttons are intentionally omitted in RN builds (install UX remains web/PWA-facing).
- CI can generate **RN CLI** native artifacts (Android debug APK + iOS Xcode project zip) and attach them to GitHub Releases. **`rn-build-version`** bumps a **sequential RN-only build number** (1, 2, 3…) stored in `App build/RNCLI-Android/latest.json`; **`rncli-android-apk`** / **`rncli-ios-zip`** use that for `latest.json` and iOS zip filenames (not `GITHUB_RUN_NUMBER`).
- **Cloud login (Supabase):** **`apps/rn-app/app.config.js`** merges `app.json` with **`extra.supabaseUrl` / `extra.supabaseAnonKey`** from env at build time. RN accepts **`EXPO_PUBLIC_SUPABASE_*`** and also the same secret names as web/Capacitor (**`SUPABASE_URL`** + **`SUPABASE_PUBLISHABLE_KEY`** / legacy **`SUPABASE_ANON_KEY`**) so CI and local sources stay aligned. **`getSupabaseClient()`** (`src/cloud/supabaseClient.ts`) returns `null` when unset; **`SettingsCloudPane`** wires sign-in / sign-up / sign-out (parity with web `cloud-sync.js`). Local template: **`apps/rn-app/.env.example`**.
- **Android Gradle (`expo prebuild`):** `@react-native-async-storage/async-storage` **v3** resolves `org.asyncstorage.shared_storage:storage-android` from a **local Maven repo** shipped under `node_modules/.../android/local_repo`. **`apps/rn-app/plugins/withAsyncStorageLocalRepo.js`** injects that `maven { url … }` into the generated root `android/build.gradle` (see `app.json` → `plugins`).
- **README** (`scripts/update-readme-build-info.mjs`) lists **CI builds** (Alpha RN Android + RN iOS, Server, Web) and a **Legacy builds** table for frozen **Capacitor** metadata: `App build/Android/` (APK) and **`App build/Legacy/Capacitor-iOS/`** (last Capacitor iOS manifest). RN iOS artifacts live under **`App build/iOS/`** (same `latest.json` shape the app resolves).
- Web settings already exposes app installation/download links driven by `latest.json` in each `App build/…/` folder (see **`apps/pwa-webapp/app.js`** `refreshBuildDownloadLinks`).

If any of the above becomes false, fix it before moving forward.

---

## 3) Build outputs that must exist (release contract)

### 3.1 GitHub Pages site
- Deployed site includes the web app plus `App build/` download directories.

### 3.2 Native artifacts on every `mobile_release` push
- **Android (RN CLI)**:
  - `App build/RNCLI-Android/app-debug-beta.apk`
  - `App build/RNCLI-Android/latest.json` (points to file + **sequential RN build** `version`)
- **iOS (RN CLI emulator zip)**:
  - `App build/iOS/Health-Tracker-ios-alpha-build-<N>.zip` (**`<N>`** = same sequential RN build as Android, from **`rn-build-version`**)
  - `App build/iOS/Health-Tracker-ios-alpha-latest.zip`
  - `App build/iOS/Health-Tracker-simulator-alpha-<N>.zip`
  - `App build/iOS/latest.json`

**Done when:** A GitHub Release created by CI contains these assets and the web Settings download links resolve to them.

**Legacy (Capacitor, not rebuilt):** frozen metadata under **`App build/Android/`** and **`App build/Legacy/Capacitor-iOS/`** for README / release “Legacy” bundles only.

---

## 4) Parity checklist (web / PWA + Capacitor vs React Native)

**Code reference (PWA):** `apps/pwa-webapp/index.html` + `apps/pwa-webapp/app.js` + `apps/pwa-webapp/styles.css`  
**Capacitor:** same minified/copied PWA bundle inside **`apps/capacitor-app/`** (WebView) — feature set matches PWA; **not** the target for new UI work.

### 4.1 Surfaces

| Surface | Role |
|--------|------|
| **PWA (`apps/pwa-webapp/`)** | Canonical **UX, copy, charts, AI, settings depth** — what RN should converge to. |
| **Capacitor** | Legacy **WebView** of that PWA — inherits PWA gaps automatically; only listed where native plugins differ (e.g. notifications). |
| **RN (`apps/rn-app/`)** | **Reimplemented** UI — parity is intentional feature-by-feature, not pixel-identical DOM. |

### 4.2 Gap matrix — what web/Capacitor has that RN still lacks or only approximates

**Typography & layout**
- **Web:** CSS font stacks, responsive breakpoints, **`styles.css`** / **`styles-charts.css`**, Font Awesome (CDN), fine-grained spacing and card chrome.
- **RN:** **`ThemeProvider`** + **`@rianell/tokens`**, **`theme.font()`** × `textScale` — **no custom web font files** (system UI fonts). **Open:** optional **`expo-font`** load if product wants named web font parity; match line-heights / letter-spacing where it affects readability.

**Motion & animation**
- **Web:** CSS transitions, Apex chart animations, wizard **`<dialog>`** sheet motion, loading overlays, reduced-motion hooks across many paths.
- **RN:** mostly **static** transitions; Charts are **spark/list**-first without Apex. **In progress:** loading screen parity track — RN boot loader now uses tokenized orbit/sun drawn objects and animated orbit/pulse/wobble motif. **Open:** exact web burst/flood transitions and reduced-motion parity; `LayoutAnimation` / **Reanimated** for wizard sheets & tab changes; chart library animations in Phase B.

**Charts**
- **Web:** Apex **line / radar / combined** charts, prediction overlays, rich tooltips.
- **RN:** **lite** — trends as text + sparks + filters; **no** full chart canvas (see §5 Phase B). Balance **Targets** row is snapshot vs default **7/10**, not full **Goals** persistence.

**AI & on-device intelligence**
- **Web:** **Transformers.js** / summary LLM, chart **predictions**, dashboard **MOTD** from LLM, rich AI Analysis pipeline.
- **RN:** **`summarizeLogsForAi`** + **`AiScreen`** with LLM-wrapper **summary note** and Home **MOTD** generation path (remote endpoint when configured; deterministic fallback always available). `AIEngine` parity scaffolding now includes prediction + suggest-note helpers and model-tier resolution from benchmark/settings. **Still open:** full Transformers.js-equivalent native runtime, chart prediction overlays, and full web AI section depth/order. Tab hidden when **`aiEnabled === false`** (`shouldShowAiTab`).

**Voice & speech**
- **Web:** **SpeechRecognition** / voice-in-flow where wired in `app.js`.
- **RN:** **TTS** via **`expo-speech`** for accessibility (e.g. settings); **no** voice dictation in the log wizard — **open** if parity required.

**Notifications**
- **Capacitor:** **LocalNotifications** plugin path; web fallbacks in **`notifications.js`**.
- **RN:** **not** at feature parity — no daily reminder scheduling / OS channels like web+Capacitor. **Open:** `expo-notifications` (or platform APIs) + prefs wiring.

**Logs tab (`View Logs`)**
- **Web:** Date range, sort, filter, **per-entry cards** with edit / delete / share, intersection-observer windowing for large histories.
- **RN:** **`LogsScreen`** — **range presets** + **sort** + **refresh** + **text filter** + count (“Showing *n* of *m*”); dev-only sample entry; **entry detail modal** now includes **edit/share/delete** baseline. **Still missing vs web:** richer per-entry card depth and final large-history virtualization strategy.

**Data export**
- **Web:** JSON + **CSV** + print-oriented views.
- **RN:** **JSON** export/import in Settings — **no** CSV / print. **Open:** CSV share sheet or document export if required.

**Onboarding & chrome only on web**
- **Web:** First-run **tutorial**, **install** modal, **God mode**, **`#Demo`** hash flow, **PayPal** / donate wiring, **PWA** install / **service worker** opt-in.
- **RN:** **out of scope** unless explicitly scheduled — treat as **Phase E+** or product call. RN uses store/OTA installs, not PWA.

**Shell — already closer**
- **Home:** FAB + top **targets / ? / settings** row aligned with **`header-buttons-wrap`** (bug = doc link until in-app form).
- **Navigation:** bottom tabs + **AI** gated; **Settings** carousel with **4** panes vs deeper web section count — many **web-only** settings blocks still **not** ported (Display, Customisation, Performance, full **AI & Goals** toggles, **About**, in-app **bug report**, **LLM** picker).

### 4.3 Primary tabs (screens)

- [~] **Charts (Phase B)** — lite++: range/view, sparks, deltas, `CHART_METRIC_HEX`, targets snapshot, plus first combined + individual + balance visual baselines; **open:** richer prediction overlays, animation/chrome depth, and fuller parity semantics (§5 Phase B).
- [~] **AI Analysis (Phase C)** — `AiScreen` + `analyzeLogs.ts` + LLM-wrapper summary note + Home MOTD baseline; section order/copy alignment is closer (`At a glance`, `What we found`, `How you're doing`) with explicit disabled-state message when AI is off. **Open:** deeper feature parity blocks, chart prediction overlays, and full native model runtime parity (§5 Phase C).
- [~] **View Logs** — **in progress** (§4.2 / §5 Phase G): range + sort + refresh + text filter + detail modal/edit-share-delete baseline **done**; richer row/detail context now includes symptoms/stressors/pain/food/exercise. **Open:** virtualization strategy and remaining web-depth polish.

### 4.4 Log wizard (native)

- [~] **Step 3 — Symptoms & pain:** web outline + chips; **optional** exact per-region SVG paths (currently simplified hit regions).
- [~] **Step 4 — Energy & mental clarity:** tiles + search + collapsible; **optional** web sheet motion / micro-interactions.
- [x] **Steps 5–9** — stress, lifestyle, food, exercise, meds & notes: implemented with tests (`LogWizardScreen.test.tsx`).

### 4.5 Shell — Home, nav, theme, settings

- [~] **Home** — FAB + header chrome + Beta; bug link → **`docs/SECURITY.md`** (modal = Phase E).
- [x] **Navigation** — Ionicons tabs; `headerShown: false`; AI tab conditional.
- [~] **Themes** — tokens + `textScale` + colorblind; not full web theme/CSS parity.
- [~] **Settings** — four panes + cloud; demo mode toggle + demo dataset lifecycle landed. **open:** web parity for remaining sections, goals, LLM, notifications (`SettingsScreen.tsx`, `SettingsCloudPane`).
- [~] **Settings / Performance parity** — benchmark cache + tier recommendation + model tier picker landed in RN; **open:** detailed benchmark modal graphs, GPU backend telemetry, and full web performance profile JSON.

---

## 5) Execution phases (what to build next)

### Phase A — Log wizard + (optional) Logs tab foundation
**Goal:** Wizard steps match web behavior; **View Logs** is a separate large track (§4.2 / §4.3).

**Work items (wizard — in order)**
- Steps 5–9: **done** (see §4.4).
- Step 3: body diagram — **in progress** (outline + regions + searchable region chips; optional exact SVG paths).
- Step 4: energy tiles — **in progress** (search + collapsible + animated expand/collapse; optional web-level sheet polish).

**Optional parallel:** **View Logs** parity — **range, sort, refresh** shipped; **filter, entry cards, edit/delete/share** still at web depth.

**Done when:** wizard QA passes; Logs tab scoped separately.

### Phase B — Charts parity (range + views + deltas) **← active**
**Goal:** Charts tells the same story as web for the same range selection.

**Work items**
- [x] Range + view toggles, trends, sparks, refresh, balance filter, empty state, chip a11y (see §4.3).
- [x] **Metric copy parity:** steps use integer + locale grouping; hydration uses `X.X glasses`; deltas signed consistently (`summarizeCharts.ts` + `ChartsScreen`).
- [x] **Metric color parity (lite):** `CHART_METRIC_HEX` from web palette; colored mini spark bars + row left border (`ChartsScreen`).
- [~] **Visual parity:** combined + individual + balance visual baselines landed (color-coded trend plots + balance bars), with reduced-motion-aware transitions now wired for view/range/refresh state changes in RN Charts. **Open:** fuller radar-equivalent semantics and chart chrome depth.
- [x] **Target snapshot (lite):** Balance view shows **Targets** block: current vs default **7.0/10** with fill bar + marker (`ChartsScreen`); custom goals when native storage matches web.

**Done when (lite — met):** for the same logs + range, native shows the same **numbers**, **deltas**, **view mode** semantics, and **metric colors** as web; toggles and empty/loading behave consistently.

**Next steps (visual — ordered)**
1. **Spike:** pick a native chart approach (e.g. **Victory Native**, **react-native-gifted-charts**, or **Skia**) that supports multi-series lines + radar; confirm bundle size and Hermes compatibility.
2. **Combined view:** first visual baseline landed (color-coded multi-series trend plot); iterate toward richer line-chart parity and labeling semantics from web.
3. **Individual view:** first per-metric visual baseline landed; iterate toward fuller scales/labels parity with web.
4. **Balance view:** first equivalent baseline landed (wellness balance bars using metric colors/levels); iterate toward richer radar-equivalent semantics (axes/caps/colors).
5. **Polish:** respect **reduced motion** where applicable; match web **prediction** toggle behavior if/when predictions are surfaced on native.

### Phase C — AI Analysis parity (lite++ → web-structure parity)
**Goal:** AI tab outputs match web wording/sections closely, and remains correctly gated by `aiEnabled`.

**Work items**
- [x] **Lite pipeline:** `summarizeLogsForAi` + `AiScreen` — range, refresh, sections (what you logged, flare, averages, how you’re doing, top symptoms/stressors).
- [x] **AI service parity baseline:** RN `AIEngine` helper module + LLM wrapper (`summary`, `suggest note`, `MOTD`) with model tier resolution and deterministic fallback path.
- [x] **Range a11y** on chips (`AiScreen` — mirror Charts patterns).
- [~] **Web copy alignment:** section order/title parity pass landed (`At a glance`, `What we found`, `How you're doing` + disabled-state copy); **open:** continue converging body-text/details against web panel templates (`apps/pwa-webapp/app.js`).
- [~] **Feature parity:** correlations, “important” / flare-up callouts, and any **groups-that-change-together** blocks that exist on web — port logic into `@rianell/shared` or `analyzeLogs.ts` where shared, else document exceptions.
- [x] **`aiEnabled`:** disabled-state message/guard now renders when AI is off; tab visibility remains gated by `shouldShowAiTab`.

**Done when:** for the same logs + range, the sections and “Important / flare-up / correlations” align closely with web.

### Phase D — Settings: Data management portability
**Goal:** JSON portability and safe in-app data controls for native.

**Status:** **Met** — merge/replace import and JSON export. **Product scope:** install/download links are web/PWA entry-point UX and are intentionally not shown inside RN builds. **Still not parity:** CSV/print export, full web Settings section count (see §4.2).

### Phase E — Shell, settings depth, goals, bug report, optional native AI hooks **← parallel with B/C**
**Goal:** Close gaps listed in **§4.2** (settings sections, goals persistence, bug UX, optional notifications).

**Work items**
- [x] Home + FAB + tab icons + carousel shell + Home header chrome row.
- [x] **Bug report** — in-app RN modal on Home with submit flow (web parity baseline); keep server field parity improvements in backlog.
- [x] **Demo mode** — toggle in RN Settings; loads premade/rebased demo logs, refreshes demo logs on app launch, restores backup logs when disabled, and blocks import/export while active.
- [~] **Goals & targets** — persisted mood/sleep/fatigue targets now flow from Settings to Charts target lines; **open:** broader web goals UX depth and remaining settings parity.
- [~] **LLM / on-device AI** — web uses Transformers.js; RN has **no** equivalent pipeline — gate any future native inference behind same prefs as web.
- [~] **Notifications** — RN Settings now has reminder enable/time/sound prefs + permission status/request baseline. **Open:** OS-level scheduling/channel parity vs Capacitor/web paths (§4.2).
- [~] **Optional:** haptics, longer tab labels, **expo-font** if brand fonts required.
- [~] **Modal parity backlog (web-only surfaces):** tutorial / install modal, donate, cookie policy, GDPR agreement, performance benchmark details, and developer/God-mode tools (decide ship vs won’t-do for RN v1).
- [~] **Loading overlay parity:** RN boot loading screen should match web loader animation language (orbit ring, planet/sun motif, theme token colors, reduced-motion behavior).

**Done when:** §4.2 “Shell — already closer” items are done and remaining bullets are either implemented or explicitly **won’t do** for v1.

### Phase F — Performance & RN optimization (ongoing)
**Goal:** Stay fast as Charts / AI / **View Logs** grow.

**Work items (apply opportunistically)**
- [~] **Lists:** baseline `FlatList` tuning landed (render window/batch/clipping), now with adaptive thresholds by history size and fixed-row layout hints on `LogsScreen`; reload path remains non-focus-looping. **Open:** FlashList decision and final profile thresholds from low-end device runs.
- [~] **Charts / AI:** memoization pass expanded (`ChartsScreen` memoizes `summarizeCharts` + filtered view trends; `AiScreen` now memoizes `summarizeLogsForAi` from fetched logs/range and isolates summary-note generation in a separate effect path). **Open:** broader re-render isolation on preference changes and continued profiling as AI/chart depth grows.
- [~] **Bundle:** Hermes bundle size; lazy-load optional chart/AI deps when added.
- [~] **SVG / images:** wizard diagram paths; profile low-end Android.

**Done when:** no regressions in `npm run test:mobile` / `typecheck:mobile`.

### Phase G — View Logs tab (web parity) **← active**
**Goal:** `LogsScreen` matches web **View Logs** for **range**, **sort**, **filter**, **entry cards**, **edit / delete / share**, and performant scrolling for large histories.

**Work items**
- [x] **Range presets** + **sort** + **pull-to-refresh** + **text filter** + filtered/total count; helpers in **`logsViewHelpers.ts`** + **`logsViewHelpers.test.ts`**; screen tests **`LogsScreen.test.tsx`**.
- [~] **Per-entry cards / modal detail** + **edit / delete / share** actions (edit/share/delete baseline landed; richer symptom/stressor/pain/food/exercise detail now surfaced). **Open:** any remaining web-only card polish + virtualization decisions.
- [~] **Large lists:** baseline `FlatList` tuning landed, now with adaptive window/batch settings and `getItemLayout` hints in `LogsScreen`; finalize `FlashList` decision + profile-backed thresholds (§5 Phase F).

**Done when:** §4.2 Logs row can be checked off for RN.

---

## 6) Engineering gates (how we keep parity from drifting)

### Testing strategy (repo + CI)
- **Mobile (Jest):** `apps/rn-app/src/**/*.test.ts(x)` — screens, storage, AI, charts, theme, navigation, **Supabase client** (`supabaseClient.test.ts`), **SettingsCloudPane**, data import/export, **Home** header chrome + **Charts** `useRoute` mock. Run: **`npm run test:mobile`**.
- **Root unit (Node):** `tests/unit/**/*.test.mjs` — PWA wiring, **workflow guards** (`workflows-ci-rncli.test.mjs`), **Expo config** (`mobile-expo-config.test.mjs` — Async Storage Gradle plugin + shared `SUPABASE_*` app-config env fallback guard), **`app.config.js`**, tokens. Run: **`npm run test:unit`**.
- **CI (`.github/workflows/ci.yml`):** `unit-tests` job runs **`npm run test:unit`**; **`expo-bundle-prod`** runs after **`unit-tests`** + **`security-audit`** and runs **`npm run typecheck:mobile`** + **`npm run test:mobile`**. **Every PR/push** must pass these before native artifacts build.
- **When adding a feature:** prefer **one** focused test file or cases in an existing file; run both commands locally before push.

### Required local commands
- `npm run typecheck:mobile`
- `npm run test:mobile`
- `npm run test:unit` (from repo root)

### Dependency & supply chain (npm)
- **Single lockfile:** only **`package-lock.json` at repo root** (npm workspaces: **`apps/*`**, **`packages/*`**). Nested locks under workspace apps were removed to avoid duplicate Dependabot scans and drift.
- **Root `package.json` `overrides`:** e.g. **`tar` ≥ 7.5.11**, **`handlebars`**, **`brace-expansion` / `minimatch`**, **`@capacitor/assets` → `@capacitor/cli` via `$@capacitor/cli`** (root devDependency **`@capacitor/cli@7.6.1`**), **`http-proxy-agent`**, **`@tootallnate/once`**, **`semver`**, **`send`**, **`replace.minimatch`**.
- **CI / `npm audit --omit=dev`:** **0** high/critical in the **production** tree (matches **`security-audit.yml`**). A **full** `npm audit` (including Jest / RN **dev** subgraphs) may still list **moderate** `brace-expansion` / `glob` until upstream; track via Dependabot or periodic `npm audit` locally.
- **`apps/rn-app` workspace:** explicit **`jest`**, **`@react-navigation/core`**, **`babel-preset-expo`**, **`stacktrace-js`**, **`@ungap/structured-clone`**, **`react-freeze`**, **`warn-once`** so hoisted installs resolve under the lean tree.

### Required CI gates
- `security-audit` must pass (production-only audit).
- Unit tests + mobile tests must pass before release jobs run.
- Release job must attach RN CLI artifacts.
- **`rn-build-version`** runs before **`rncli-android-apk`** / **`rncli-ios-zip`**; both jobs **need** it so RN `latest.json` and zip names stay on the **sequential** counter (see `tests/unit/workflows-ci-rncli.test.mjs`).
- **RN CLI Android** (`rncli-android-apk`): `setup-java` must **not** use **`cache: gradle`** until Gradle exists (generated by `expo prebuild`); see `tests/unit/workflows-ci-rncli.test.mjs`. The **Collect APK + latest.json** step must glob APKs from **`apps/rn-app/android/app/build/outputs/apk/debug/`** (repo root), not `app/build/...` alone — otherwise Gradle succeeds but the step finds zero APKs.
- **Async Storage v3:** prebuild must apply **`withAsyncStorageLocalRepo`** so `:app:compileDebugJavaWithJavac` can resolve **`storage-android`** (local repo under the async-storage package).

---

## 7) Working agreements (so this stays buildable)

- Every parity change must update this file by moving items between:
  - **Remaining** (section 4)
  - **Done** (recorded in commit messages and changelog; do not re-add checklist noise here)
- **Tests:** new user-facing logic (screens, storage, AI, charts, downloads) should ship with **Jest** coverage where practical; CI already runs **`test:mobile`** + **`test:unit`** — extend them when you add parity surfaces (see §6 Testing strategy).
- Avoid “plan drift”: if it isn’t in **§4** (parity) or **§5** (phases), it isn’t in scope until added here.

