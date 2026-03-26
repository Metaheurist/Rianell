# Next phase development plan (buildable)

This document is the **single build plan** to finish Rianell’s transition to a **React Native CLI** app that matches the **web/PWA** and produces **Android APK** + **iOS emulator Xcode zip** via CI releases.

**Last updated:** 2026-03-26 (Ionicons tab bar + settings carousel + Supabase login; `app.config.js` / `.env.example`)

---

## 1) Product contract (non‑negotiables)

- **One product, two primary surfaces**
  - **Web/PWA**: GitHub Pages deployment of `web/` (browser + installed PWA)
  - **Native mobile**: React Native CLI (`apps/mobile`) (iOS + Android)
- **No WebView shortcut** for core UI on mobile.
- **Capacitor is legacy delivery only**: if it remains, it must ship the **same** built web assets and behave identically. It is not the parity reference.
- **Parity scope**: features, UI hierarchy, animations/micro‑interactions, settings, data behavior, permissions rationale, and empty/error states.

**Definition of done (global):** a user can follow the same flows on web/PWA and native mobile and get the same results with the same UX intent; exceptions are listed and signed off.

---

## 2) Current repo state (assumed true)

These are treated as “already implemented” and should not be re-planned here:
- `apps/mobile` exists with navigation + settings shell + AsyncStorage-backed logs; **Settings** includes **Data management** (JSON export/import with merge/replace) and **Install & downloads** (same public `latest.json` resolution as web, opens artifact URL in the system browser).
- CI can generate **RN CLI** native artifacts (Android debug APK + iOS Xcode project zip) and attach them to GitHub Releases. **`rn-build-version`** bumps a **sequential RN-only build number** (1, 2, 3…) stored in `App build/RNCLI-Android/latest.json`; **`rncli-android-apk`** / **`rncli-ios-zip`** use that for `latest.json` and iOS zip filenames (not `GITHUB_RUN_NUMBER`).
- **Cloud login (Supabase):** **`apps/mobile/app.config.js`** merges `app.json` with **`extra.supabaseUrl` / `extra.supabaseAnonKey`** from **`EXPO_PUBLIC_SUPABASE_*`** at build time. **`getSupabaseClient()`** (`src/cloud/supabaseClient.ts`) returns `null` when unset; **`SettingsCloudPane`** wires sign-in / sign-up / sign-out (parity with web `cloud-sync.js`). Local template: **`apps/mobile/.env.example`**.
- **Android Gradle (`expo prebuild`):** `@react-native-async-storage/async-storage` **v3** resolves `org.asyncstorage.shared_storage:storage-android` from a **local Maven repo** shipped under `node_modules/.../android/local_repo`. **`apps/mobile/plugins/withAsyncStorageLocalRepo.js`** injects that `maven { url … }` into the generated root `android/build.gradle` (see `app.json` → `plugins`).
- **README** (`scripts/update-readme-build-info.mjs`) lists **CI builds** (Alpha RN Android + RN iOS, Server, Web) and a **Legacy builds** table for frozen **Capacitor** metadata: `App build/Android/` (APK) and **`App build/Legacy/Capacitor-iOS/`** (last Capacitor iOS manifest). RN iOS artifacts live under **`App build/iOS/`** (same `latest.json` shape the app resolves).
- Web settings already exposes app installation/download links driven by `latest.json` in each `App build/…/` folder (see `web/app.js` `refreshBuildDownloadLinks`).

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

## 4) Parity checklist (remaining work only)

**Web reference:** `web/index.html` + `web/app.js`

### 4.1 Native screens remaining
- [~] **Charts tab (Phase B)** — **lite parity done:** range/view (`balance` / `individual` / `combined`), trends, sparks, refresh, balance filter, empty state, chip a11y, **value/delta** formatting, **`CHART_METRIC_HEX`** + spark + row accent (`ChartsScreen` + `summarizeCharts.ts`). **Still open:** full **Apex-class** line/radar charts, animations, prediction toggles, and chart chrome (`Phase B` → **Next steps** in §5).
- [~] **AI Analysis tab (Phase C)** — **lite parity done:** `AiScreen` + `summarizeLogsForAi` (`apps/mobile/src/ai/analyzeLogs.ts`): range chips + a11y, pull-to-refresh, “what you logged” / flare / averages / narrative-style sections. **Still open:** match **web** section order, headings, and copy; correlations + “groups that change together” if present on web; respect `aiEnabled` everywhere. Code: `apps/mobile/src/screens/AiScreen.tsx`.

### 4.2 Log wizard remaining steps (native)
- [~] **Step 3 — Symptoms & pain**: tap-to-cycle diagram uses **web-matching silhouette path** (`index.html` outline), **140×280** viewBox, regions scaled to canvas; chips + “Use diagram text” + semantics aligned. **Remaining:** optional per-region path shapes matching web SVG exactly (mobile uses simplified rects/circles).
- [~] **Step 4 — Energy & mental clarity**: grouped tiles + search + collapsible tile section + selected summary; **icon tiles** + **group-colored tile borders** + **stronger border on selected tile**; helper copy + **accessibility labels** on fatigue/sleep/mood fields. **Remaining:** optional closer match to web bottom-sheet tile chrome / animations.
- [x] **Step 5 — Stress & triggers**: grouped tile picker + search + frequent + selected/clear + collapsible picker implemented.
- [x] **Step 6 — Lifestyle**: clamp-on-save for daily function (0–10), steps (0–50k), hydration (0–20 glasses); tests in `LogWizardScreen.test.tsx`.
- [x] **Step 7 — Food**: clear-all per section, duplicate counts on tiles, remove controls; tests for clear + count badge.
- [x] **Step 8 — Exercise**: `Name:Minutes` parsing, category tiles, clear all + count badge; tests.
- [x] **Step 9 — Medication & notes**: medications list, Taken today?, clear all + count badge; tests.

### 4.3 Shell UX parity (Home, navigation, themes, fonts, settings, AI / LLM, bug report, goals)
**Web reference:** same as §4.1; compare tab chrome, Settings panels, and `web/app.js` feature flags.

- [~] **Home tab:** greeting + today’s log status + **Log today** FAB (`HomeScreen`). **Tests:** `HomeScreen.test.tsx` (title, empty/logged copy, FAB → `LogWizard`).
- [x] **Navigation:** bottom tabs use **`@expo/vector-icons` / Ionicons** (`home-outline`, `list-outline`, `bar-chart-outline`, `sparkles-outline`, `settings-outline`) in **`RootNavigator`**. **Tests:** `RootNavigator.test.tsx` (AI tab visibility); Jest mocks Ionicons in **`jest.setup.ts`**.
- [~] **Themes & fonts:** `ThemeProvider` + `@rianell/tokens` (team, appearance mode, colorblind); `theme.font()` scales with `prefs.accessibility.textScale`. **Tests:** `ThemeProvider.test.tsx`, `SettingsScreen.test.tsx` (typography scale).
- [~] **Settings — parity vs web carousel:** native **Settings** uses a **horizontal paged carousel** (tabs + prev/next + dots) with panes **Personal & cloud** → **AI & theme** → **Accessibility** → **Data & install** (mirrors web `settings-carousel*` structure). **Cloud** pane: **`SettingsCloudPane`** + Supabase auth when env is set. **Still open vs web:** remaining panes (Display, Customisation, Performance, full AI & Goals toggles), **bug report**, **goals/targets**, **LLM** picker, notifications, **About**—port incrementally; **tests:** `SettingsScreen.test.tsx`, `SettingsCloudPane.test.tsx`, `supabaseClient.test.ts`.
- [~] **AI gating:** `aiEnabled` hides AI tab and should gate AI-heavy settings copy on native the same way as web when implemented end-to-end.

---

## 5) Execution phases (what to build next)

### Phase A — Finish the Log wizard parity loop (highest impact)
**Goal:** the wizard feels identical to the web flow, step-by-step.

**Work items (in order)**
- Step 5: implement stressor tile UX parity (grouped tiles + frequent + selected list + clear). **(done)**
- Step 3: implement native body diagram parity (SVG-equivalent interaction + intensity cycling + legend). **(in progress: web outline + tall canvas + region scale; optional path-for-path region shapes)**
- Step 4: implement tile UI polish (icons + collapsible behavior parity). **(in progress: icons + group borders + selected-state ring + vitals field a11y; optional web sheet polish)**
- Steps 6–9: validate and close remaining UX gaps (labels, selection summary, clear behaviors, accessibility labels). **(done — clamp/save, clear-all, count badges; see section 4.2)**

**Done when:** a QA pass can follow the wizard on both surfaces and observe no UX/behavior differences (except signed-off exceptions).

### Phase B — Charts parity (range + views + deltas) **← active**
**Goal:** Charts tells the same story as web for the same range selection.

**Work items**
- [x] Range + view toggles, trends, sparks, refresh, balance filter, empty state, chip a11y (see §4.1).
- [x] **Metric copy parity:** steps use integer + locale grouping; hydration uses `X.X glasses`; deltas signed consistently (`summarizeCharts.ts` + `ChartsScreen`).
- [x] **Metric color parity (lite):** `CHART_METRIC_HEX` from web palette; colored mini spark bars + row left border (`ChartsScreen`).
- [~] **Visual parity:** full Apex line/radar charts / animations / chrome (not on native yet).

**Done when (lite — met):** for the same logs + range, native shows the same **numbers**, **deltas**, **view mode** semantics, and **metric colors** as web; toggles and empty/loading behave consistently.

**Next steps (visual — ordered)**
1. **Spike:** pick a native chart approach (e.g. **Victory Native**, **react-native-gifted-charts**, or **Skia**) that supports multi-series lines + radar; confirm bundle size and Hermes compatibility.
2. **Combined view:** multi-series line chart(s) using **`CHART_METRIC_HEX`** and the same series order/semantics as web combined charts (`web/app.js` chart helpers).
3. **Individual view:** one chart per active metric (or paginated) with the same scales/labels intent as web.
4. **Balance view:** radar or equivalent “wellness balance” visualization matching web **Balance** mode (axes, caps, colors).
5. **Polish:** respect **reduced motion** where applicable; match web **prediction** toggle behavior if/when predictions are surfaced on native.

### Phase C — AI Analysis parity (lite++ → web-structure parity)
**Goal:** AI tab outputs match web wording/sections closely, and remains correctly gated by `aiEnabled`.

**Work items**
- [x] **Lite pipeline:** `summarizeLogsForAi` + `AiScreen` — range, refresh, sections (what you logged, flare, averages, how you’re doing, top symptoms/stressors).
- [x] **Range a11y** on chips (`AiScreen` — mirror Charts patterns).
- [~] **Web copy alignment:** diff `AiScreen` section titles and body strings against the web AI panel (`web/app.js` / templates) and converge.
- [~] **Feature parity:** correlations, “important” / flare-up callouts, and any **groups-that-change-together** blocks that exist on web — port logic into `@rianell/shared` or `analyzeLogs.ts` where shared, else document exceptions.
- [~] **`aiEnabled`:** ensure empty/disabled state matches web when AI is off (settings flag + UI guard).

**Done when:** for the same logs + range, the sections and “Important / flare-up / correlations” align closely with web.

### Phase D — Settings: Data management parity + download UX
**Goal:** Settings exposes the same data-management and install/download affordances.

**Work items**
- [x] **Native export/import (JSON)**: share-sheet export + paste import with **merge** (append new dates) and **replace all** (with confirm), using `@rianell/shared` normalization (`apps/mobile/src/data/logExportImport.ts`).
- [x] **Install/download UX parity**: Settings **Install & downloads** resolves the same public `latest.json` URLs as web (`buildDownloads.ts` → `Linking.openURL`), for legacy Android, RN CLI Android, and iOS Xcode zip.

**Done when:** both surfaces show equivalent options (export/import/install/download) and point to the same build artifacts.

**Status:** Phase D goals for native Settings are **met** (see `docs/app-and-features.md` and changelog **v1.45.8–v1.45.9**).

### Phase E — Shell UX parity (Home, nav, themes, bug report, goals, LLM) **← parallel with B/C**
**Goal:** Native **shell** matches web intent: same primary tabs, theme tokens, typography scaling, and settings coverage; close gaps for **bug report**, **goals/targets**, and **LLM / AI model** affordances where the web app exposes them.

**Work items**
- [x] **Home + FAB + navigation wiring** — covered by smoke tests; extend as new UI lands.
- [x] **Tab bar icons** — **`@expo/vector-icons` (Ionicons)**; app **store icons** remain in **`app.json`** (`icon`, adaptive icons, splash).
- [x] **Settings carousel** — horizontal paged panes + tab strip + chevrons + dots; **cloud** pane uses Supabase when env configured.
- [~] **Bug report:** surface equivalent to web (modal / mailto / GitHub)—route, copy, and **tests** (`SettingsScreen` or dedicated screen).
- [~] **Goals & targets:** parity with web goals UI and persistence (`@rianell/shared` / preferences)—**tests** for merge rules and UI.
- [~] **LLM / on-device / browser AI** scaffolding: align with web feature flags; when native inference exists, gate behind same prefs—**tests** for disabled/enabled states.
- [~] **Nav polish:** safe-area / label parity with web bottom chrome.

**Done when:** a user can complete the same **settings-adjacent** and **home/nav** tasks on web and native with the same intent; exceptions documented.

### Phase F — Performance & RN optimization (ongoing)
**Goal:** Keep native builds fast and memory-stable as Charts / AI grow.

**Work items (apply opportunistically)**
- [~] **Lists:** virtualized lists for long **Logs** where needed (`FlatList` / `FlashList` spike); avoid unnecessary `loadLogs` on every focus where cache suffices.
- [~] **Charts / AI:** memoize heavy selectors (`summarizeCharts`, `summarizeLogsForAi` inputs); avoid re-rendering full tabs on unrelated pref changes.
- [~] **Bundle:** monitor Expo prod bundle size (`expo export` / Hermes); defer heavy optional deps behind lazy imports where applicable.
- [~] **Images / SVG:** keep wizard diagram SVGs scoped; profile if jank appears on low-end Android.

**Done when:** no regressions in `npm run test:mobile` / `typecheck:mobile`; optional profiling notes in changelog when large UI lands.

---

## 6) Engineering gates (how we keep parity from drifting)

### Testing strategy (repo + CI)
- **Mobile (Jest):** `apps/mobile/src/**/*.test.ts(x)` — screens, storage, AI, charts, theme, navigation, **Supabase client** (`supabaseClient.test.ts`), **SettingsCloudPane**, data import/export. Run: **`npm run test:mobile`**.
- **Root unit (Node):** `tests/unit/**/*.test.mjs` — web wiring, **workflow guards** (`workflows-ci-rncli.test.mjs`), **Expo config** (`mobile-expo-config.test.mjs` — Async Storage Gradle plugin), **`app.config.js`**, tokens. Run: **`npm run test:unit`**.
- **CI (`.github/workflows/ci.yml`):** `unit-tests` job runs **`npm run test:unit`**; **`expo-bundle-prod`** runs after **`unit-tests`** + **`security-audit`** and runs **`npm run typecheck:mobile`** + **`npm run test:mobile`**. **Every PR/push** must pass these before native artifacts build.
- **When adding a feature:** prefer **one** focused test file or cases in an existing file; run both commands locally before push.

### Required local commands
- `npm run typecheck:mobile`
- `npm run test:mobile`
- `npm run test:unit` (from repo root)

### Required CI gates
- `security-audit` must pass (production-only audit).
- Unit tests + mobile tests must pass before release jobs run.
- Release job must attach RN CLI artifacts.
- **`rn-build-version`** runs before **`rncli-android-apk`** / **`rncli-ios-zip`**; both jobs **need** it so RN `latest.json` and zip names stay on the **sequential** counter (see `tests/unit/workflows-ci-rncli.test.mjs`).
- **RN CLI Android** (`rncli-android-apk`): `setup-java` must **not** use **`cache: gradle`** until Gradle exists (generated by `expo prebuild`); see `tests/unit/workflows-ci-rncli.test.mjs`.
- **Async Storage v3:** prebuild must apply **`withAsyncStorageLocalRepo`** so `:app:compileDebugJavaWithJavac` can resolve **`storage-android`** (local repo under the async-storage package).

---

## 7) Working agreements (so this stays buildable)

- Every parity change must update this file by moving items between:
  - **Remaining** (section 4)
  - **Done** (recorded in commit messages and changelog; do not re-add checklist noise here)
- **Tests:** new user-facing logic (screens, storage, AI, charts, downloads) should ship with **Jest** coverage where practical; CI already runs **`test:mobile`** + **`test:unit`** — extend them when you add parity surfaces (see §6 Testing strategy).
- Avoid “plan drift”: if it isn’t in section 4 or 5, it isn’t in scope right now.

