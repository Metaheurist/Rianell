# Next phase development plan (buildable)

This document is the **single build plan** to finish Rianell’s transition to a **React Native CLI** app that matches the **web/PWA** and produces **Android APK** + **iOS emulator Xcode zip** via CI releases.

**Last updated:** 2026-03-26 (§6 testing/CI matrix; §4.3 shell parity; §8 RN performance; Home + preferences + plugin tests)

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

### 4.3 Shell, navigation, typography & reporting (web parity gaps)
**Web reference:** home tab MOTD / goals strip, bottom chrome, `web/app.js` settings + bug report flows.

- [~] **Home tab:** web shows greeting, **goals** snippet when enabled, richer copy; native **`HomeScreen`** is minimal (today’s log status + FAB). **Target:** surface goals / daily target copy when shared types exist in `@rianell/shared` or prefs.
- [~] **Tab bar / navigation:** native uses **bottom tabs** (`RootNavigator`) with placeholder **text “icons”** (●, ≡, ▦, ✦, ⚙); web uses icon rail + labels. **Target:** optional `@expo/vector-icons` or SVG tab icons matching web affordances; keep **a11y** `tabBarAccessibilityLabel` per tab.
- [~] **Typography / fonts:** **`ThemeProvider`** applies **`font()`** scaling from `prefs.accessibility.textScale` + large-text; web uses CSS + token teams. **Target:** align heading/body scale steps with web where measurable; optional custom font matching PWA (out of scope until bundled).
- [~] **Bug report:** web **Settings → bug report** modal / mailto flow (`web/index.html` / `app.js`). **Not on native** — add **native** equivalent (mailto + device/app info, or share sheet) when prioritized.
- [~] **AI + Goals gating:** **`SettingsScreen`** exposes **“Enable AI features & Goals”** (`aiEnabled`) like web; **`shouldShowAiTab`** hides **AI Analysis** when off. **Target:** ensure **Charts** / home teasers respect the same flags as web (`aiEnabled`, goals modules).
- [x] **Preferences contract:** `loadPreferences` / `getDefaultPreferences` / `savePreferences` (`apps/mobile/src/storage/preferences.ts`) — covered by **`preferences.test.ts`**.

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

### Phase E — Shell polish, bug report, nav icons (after Charts/AI core parity)
**Goal:** Home, tabs, fonts, and reporting feel as complete as web without blocking Phase B/C.

**Work items**
- [~] **Home:** goals / target line + MOTD-style greeting where data exists.
- [~] **Bug report:** native modal or share intent with app version + build channel (align with web copy).
- [~] **Tab icons:** replace placeholder glyphs with accessible icon set; verify focus order and labels.
- [x] **Tests:** `HomeScreen.test.tsx`, `preferences.test.ts`, **`tests/unit/async-storage-expo-plugin.test.mjs`** (Gradle plugin guard).

**Done when:** QA checklist in §4.3 is mostly **[x]** or explicitly deferred.

---

## 6) Engineering gates (how we keep parity from drifting)

### Required local commands
- `npm run typecheck:mobile`
- `npm run test:mobile`
- `npm run test:unit` (repo root — web wiring + **workflow guards** + **Expo plugin** smoke tests)

### Testing strategy (must grow with every feature)
| Layer | What | Where |
| :--- | :--- | :--- |
| **Pure logic** | Charts summarisation, AI summaries, import/export, preferences merge | `apps/mobile/src/**/*.test.ts(x)`, `packages/shared` tests |
| **Screens** | Render smoke, a11y labels, key user actions | `apps/mobile/src/screens/*.test.tsx` |
| **CI / config** | `ci.yml` invariants, Async Storage **local_repo** plugin | `tests/unit/*.test.mjs` |
| **Future** | E2E (Detox / Maestro), visual regression | not required yet; add when shell stabilises |

**Rules**
- New **user-facing** surface area (screen, setting, navigator branch) should ship with **at least one** test (render or logic) in the same PR when feasible.
- **Regression guards** (Gradle cache, RN job wiring, plugin text) live in **`tests/unit/`** so they run on **every** PR/push without an Android emulator.

### Required CI gates (`.github/workflows/ci.yml`)
- **`unit-tests` job:** runs **`npm run test:unit`** (includes `tests/unit/workflows-ci-rncli.test.mjs`, `async-storage-expo-plugin.test.mjs`, web markup guards).
- **`expo-bundle-prod` job:** runs **`npm run typecheck:mobile`** + **`npm run test:mobile`** after `unit-tests` + `security-audit` pass — **Jest** must be green before native bundle / RN CLI jobs.
- `security-audit` must pass (production-only audit).
- Release job must attach RN CLI artifacts.
- **`rn-build-version`** runs before **`rncli-android-apk`** / **`rncli-ios-zip`**; both jobs **need** it so RN `latest.json` and zip names stay on the **sequential** counter (see `tests/unit/workflows-ci-rncli.test.mjs`).
- **RN CLI Android** (`rncli-android-apk`): `setup-java` must **not** use **`cache: gradle`** until Gradle exists (generated by `expo prebuild`); see `tests/unit/workflows-ci-rncli.test.mjs`.
- **Async Storage v3:** prebuild must apply **`withAsyncStorageLocalRepo`** so `:app:compileDebugJavaWithJavac` can resolve **`storage-android`** (local repo under the async-storage package); see **`tests/unit/async-storage-expo-plugin.test.mjs`**.

---

## 7) React Native performance (optimise as we build)

**Principles** (apply during Phase B visual work and shell polish):
- **Hermes** + **production bundles** are already enforced by **`expo export`** in CI (`expo-bundle-prod`).
- **Lists:** use **`FlatList`** / **`FlashList`** (if adopted) for long log lists; avoid rendering huge scroll views of unbounded children.
- **Re-renders:** `React.memo` on row components; stable **`keyExtractor`**; avoid inline object literals in hot paths where profiling shows cost.
- **Focus / logs:** reload data on **`useFocusEffect`** only where needed (pattern already on **Home** / logs).
- **Images / assets:** prefer static `require` for icons; resize splash/icon assets to needed DPs.
- **Profiling:** use React Native **Performance** monitor in dev; track **TTI** for Charts once native charts land.

---

## 8) Working agreements (so this stays buildable)

- Every parity change must update this file by moving items between:
  - **Remaining** (section 4)
  - **Done** (recorded in commit messages and changelog; do not re-add checklist noise here)
- Avoid “plan drift”: if it isn’t in section 4 or 5, it isn’t in scope right now.
- **Tests:** add or extend automated tests when adding parity; prefer **fast** unit tests in CI over flaky E2E until shell is stable.

