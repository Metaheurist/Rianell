# Next phase development plan

Build plan for the next application phase of **Rianell**. This document captures platform strategy, theming, accessibility, and AI acceleration goals so engineering can sequence work and scaffold correctly.

**Naming:** The product, repository, and local project folder should all use **Rianell** so docs, paths, and marketing stay consistent. New mobile scaffolds (e.g. React Native) should use the same name in app display title, bundle identifiers (as allowed by stores), and internal references.

---

## 1. Platform architecture

**One product.** Rianell is a **single product** experienced on **two primary surfaces** that must stay **the same**: the **web app** (hosted on **GitHub Pages**, including when installed as a **PWA**—manifest, service worker, installable / standalone behaviour) and the **React Native Expo app** on **iOS and Android**. The PWA is **not** a separate product: it is the **same** web build and must match feature-for-feature with the in-browser experience. Users should not get a “web version,” a “different PWA,” and a “different mobile version”—features, UI, UX, motion, and permission behaviour are **one contract**, implemented as **web (browser + PWA)** and **native (Expo)**, not divergent apps.

### 1.1 Split clients

| Surface | Stack | Scope |
|--------|--------|--------|
| **Web** | Existing / evolved web stack, deployed on **GitHub Pages**, **PWA-enabled** (manifest, service worker, etc.) | Canonical web build—in **browser** and as an **installed PWA**; **source of truth for parity** with Expo mobile |
| **Mobile (iOS & Android)** | **React Native (Expo)** | **Exactly the same product** as the web app (GitHub Pages + PWA) (see **1.2**); UI built in RN, not a WebView shell |

### 1.2 Web (GitHub Pages + PWA) ↔ Expo: exact parity (no WebView)

The **Expo** iOS and Android apps must match the **same web product** users get from **GitHub Pages**—whether they open it in a **tab** or **install it as a PWA**—with **exact parity** across:

- **Features** — Same capabilities, flows, and data behaviour; no “mobile-lite” subset unless explicitly documented and accepted as a platform exception.
- **UI** — Screens, components, layout hierarchy, and visual design replicated in **native React Native views** (not approximations inside a browser surface).
- **UX** — Navigation patterns, settings, feedback, empty states, and error handling aligned with the web app (browser and PWA install).
- **Animations** — Motion, transitions, and micro-interactions matched to the extent RN/Reanimated (or chosen stack) allows; where a 1:1 effect is impossible, document the closest equivalent and product sign-off.
- **Permissions** — Same permission **requests and rationale** as the web app where applicable (camera, notifications, storage, health-related APIs, etc.); parity in **when** prompts appear and **what** is gated, respecting iOS/Android rules.

**Explicit non-goal:** Do **not** ship the product UI by embedding the web app in a **WebView** (or similar “load the site in a frame”) as a substitute for building screens in React Native. Any WebView use, if allowed at all, is only for **isolated** cases (e.g. legal pages, OAuth) agreed in writing—not for core dashboard or feature UI.

**Implications**

- Expo must be **scaffolded** and implemented screen-by-screen to **replicate the web app** (browser + PWA), with a **parity checklist** (features, screens, animations, permissions) tracked to completion.
- Shared concerns (API contracts, auth, domain models, design tokens) should be centralized where practical so **web (GitHub Pages, including PWA) and Expo** stay one product.
- **Capacitor** or other wrappers, if they remain in the repo during transition, should **not define a third product**—they stay aligned with the same web build or are phased out; parity work is measured against **GitHub Pages web + PWA + Expo**.
- Platform-only gaps (store policies, OS APIs) must be **listed and signed off**; they are exceptions to parity, not silent drift.

---

## 2. Theming: system default + manual dark / light

### 2.1 Behavior (all platforms)

- **Default:** Theme follows **system appearance** (light / dark) on:
  - Web (prefers-color-scheme and related APIs)
  - iOS and Android (React Native appearance / system UI mode)
- **User override:** User can **manually toggle** between dark and light; this preference should persist per device / profile as appropriate.
- When the user clears override or chooses “system,” behavior returns to tracking the OS setting.

### 2.2 Team themes × appearance

- **Team identity stays the same** (same team selection, same brand “team”).
- **Colors are appearance-dependent:** For each team, maintain **two coordinated palettes**:
  - **Light mode:** light-appropriate surfaces, text, and accents for that team.
  - **Dark mode:** dark-appropriate surfaces, text, and accents for the same team.
- Conceptually: **team + (light | dark)** selects the token set; changing only appearance swaps light/dark variants without changing which team is active.

**Implementation note:** Express this as **design tokens** (e.g. semantic colors: `background.primary`, `text.primary`, `accent`) mapped per team × mode, rather than duplicating entire unrelated themes.

---

## 3. Accessibility (next phase)

Deliver accessibility as a **first-class slice** of work, surfaced in the **settings** experience.

### 3.1 Settings module: new “Accessibility” area

- Add an **Accessibility** section (tab / panel) inside the **settings modal** (or equivalent settings UX on mobile).
- Group related controls here so users discover them in one place.

### 3.2 Large text and font scaling

- **Large text mode:** Toggle (or preset) for users who need bigger UI text.
- **Font size control:** A **slider** (or stepped control) that adjusts **text scale** (and ideally spacing where needed) **across the app**, not only in one screen.
- Respect platform guidelines (e.g. avoid breaking layouts; test critical flows at max scale).

### 3.3 Text-to-speech (TTS)

- When the user **activates / focuses / taps** an element (per agreed interaction model), **read its accessible label** (and short description where defined) via TTS.
- Scope: define which roles get TTS (buttons, headings, list items, custom components) and ensure **semantic labels** exist so TTS is meaningful.

### 3.4 Colorblind support

- **Colorblind-related settings** live under **Accessibility** in settings.
- Options might include: safe palettes, patterns / icons in addition to color, contrast adjustments, or presets—**exact presets to be specified** during design; the plan is to **reserve** this surface and token hooks early.

### 3.5 Cross-platform parity

- Web and React Native should expose **the same accessibility capabilities** where OS APIs allow; document any intentional platform-only behavior.

---

## 4. AI / LLM and hardware acceleration

### 4.1 React Native (iOS & Android)

- Modern phones include **AI-oriented silicon** (NPUs, neural engines, etc.). The React Native scaffold and architecture should **plan for**:
  - **On-device inference** or **accelerated runtime** paths where models and licenses support it.
  - Clear **fallback** to cloud / server-side LLM when on-device is unavailable or insufficient.
- **Scaffolding requirement:** From the start, structure AI features behind an **abstraction** (e.g. “inference backend”) so native modules or SDKs can plug in **Core ML**, **NNAPI** / vendor SDKs, or similar **without rewriting** all call sites.
- Existing **AI elements, analysis flows, and LLM usage** in the app should be mapped to this layer so acceleration can be enabled incrementally.

### 4.2 Web (browser)

- Investigate **browser-side acceleration** for users with **AI-capable GPUs / NPUs** accessible via the web platform (e.g. **WebGPU**, **WebNN** where supported), for compatible workloads.
- Treat this as **progressive enhancement:** baseline behavior works everywhere; accelerated path activates only when APIs and hardware are available.
- Align with existing **AI architecture** documentation in the repo where applicable (`docs/ai-architecture.md`).

### 4.3 Non-goals / constraints (to validate in phase)

- Not all models can run on-device; **privacy, size, and latency** tradeoffs need explicit product decisions.
- **Hardware utilization** is platform- and browser-specific; feature flags and capability detection are required.

---

## 5. Suggested workstreams (for sequencing)

1. **Monorepo / shared packages** — API client, types, design tokens (team × mode).
2. **Theming system** — System default + persistence + team × light/dark tokens (web first, then RN).
3. **Expo (React Native) scaffold** — Navigation, settings shell, theme provider, env/config; parity checklist vs **GitHub Pages web + PWA** from day one.
4. **Feature parity** — Screen-by-screen or domain-by-domain port with a parity checklist.
5. **Accessibility** — Settings UX, dynamic type / font scale, TTS hooks, colorblind presets.
6. **AI abstraction + acceleration** — Interface + native/web adapters + capability detection.

---

## 6. Open decisions (fill in during planning)

- [ ] Exact React Native structure (single app vs. monorepo with shared `packages/`).
- [ ] Where theme and accessibility preferences sync (local only vs. account-backed).
- [ ] TTS trigger model (focus vs. explicit “read aloud” vs. both).
- [ ] Which on-device models or SDKs are approved for iOS/Android and web.

---

*This document is the build plan for the next phase; update it as scope and timelines are committed.*

---

## 7. Linear next-phase build steps (detailed scaffold)

This section is intentionally written as a **linear checklist** that a non-agentic code assistant (e.g. Aider) can execute step-by-step. Each step has a clear “done when” so parity doesn’t drift.

### 7.1.1 Progress log (session persistence)

- **Status**: In progress
- **Last updated**: 2026-03-26
- **Completed in this repo so far**
  - **Step 0 (baseline + inventory)**: **Completed** — added initial parity checklist based on current canonical web app (`web/`) reference.
  - **Step 1/2 (repo layout + shared packages scaffold)**: **Completed** — enabled npm workspaces and added `packages/shared` + `packages/tokens` with a unit test proving they can be imported from root tests.
  - **Step 3 (move first shared module + tests)**: **Completed** — moved file read/exists helpers used by `scripts/check-platform-parity.mjs` into `@rianell/shared` and extended unit tests to cover them.
  - **Theme behavior (web)**: **In progress** — added an **Appearance** setting (system/dark/light) and implemented `appearanceMode` persistence + `prefers-color-scheme` tracking when set to “system”.
  - **Tokens (packages/tokens)**: **In progress** — introduced `getTokens({ team, mode })` with initial light/dark token maps for Mint/Red-Black/Mono/Rainbow and a unit test ensuring every team has both modes.
  - **Accessibility (web)**: **In progress** — added a new **Accessibility** pane in the Settings carousel (with icon in the mini icon nav) and implemented **tap-to-read + read-mode toggle** using the Web Speech API, persisted under `rianellSettings.accessibility`.
  - **Step 5 (web accessibility settings data model)**: **In progress** — added shared `normalizeAccessibilitySettings()` + tests in `@rianell/shared` (web now uses the same shape in `appSettings`, with deeper integration next).
  - **Step 6 (web font scaling)**: **Completed** — added Accessibility **Large text** toggle + **Font size** slider; persists `accessibility.textScale`; applies globally via CSS `--text-scale` scaling the type tokens.
  - **Step 7 (web TTS)**: **Completed (initial)** — implemented tap-to-read + read-mode toggle via Web Speech API, with unit-test gates confirming the hook is present.
  - **Onboarding / tutorial (web)**: **Completed (accessibility slide)** — added a tutorial slide that lets users configure Accessibility (large text, font size, TTS, read mode) on first launch; settings are wired to the same persisted `rianellSettings.accessibility`.
  - **Step 8 (Expo app scaffold)**: **In progress** — created `apps/mobile` (Expo + TypeScript). Next: navigation + settings shell + persistence + theming provider + test setup/CI.
  - **Step 8 (Expo app scaffold)**: **In progress** — added navigation skeleton (tabs + stack), a theme provider consuming `@rianell/tokens`, and a persisted Settings shell (theme mode/team + accessibility placeholders) via AsyncStorage.
  - **Step 8 (Expo app scaffold)**: **In progress** — wired mobile typography scaling from `preferences.accessibility.textScale`, added a permissions manager placeholder module, and added Jest + RTL tests with root scripts `typecheck:mobile` and `test:mobile`.
  - **Step 9 (Tokens consumed by Expo)**: **Completed** — Expo consumes `@rianell/tokens` via `ThemeProvider` with tests verifying manual mode + team + text scale paths.
  - **Step 10 (Expo accessibility shell)**: **Completed** — Settings includes Accessibility section (large text + TTS toggles) persisted via AsyncStorage preferences model.
  - **Step 11 (Expo font scaling)**: **Completed** — text scale affects rendered typography via theme scaling, with component tests asserting font size increases when `textScale` increases.
  - **Step 12 (Expo TTS)**: **Completed (initial)** — implemented tap-to-read + read-mode hooks (focus) for interactive choice chips using `expo-speech`, with tests mocking `expo-speech` and asserting a press triggers `speak()`.
  - **Step 13 (Colorblind modes as token overrides)**: **Completed (initial)** — added `colorblindMode` override support in `@rianell/tokens` + tests; wired Expo theme provider + settings selector; added web Accessibility selector applying CSS token overrides via `body.cb-*` classes.
  - **Step 14 (Parity loop: port screen-by-screen)**: **In progress** — Expo now has (1) shared log entry normalization aligned to the web schema, (2) a real logs list backed by AsyncStorage under the canonical `healthLogs` key (with legacy mobile key migration), and (3) a **Log today** wizard aligned to the web **`LOG_WIZARD_TOTAL_STEPS` (10 steps, indices 0–9)**: Date/flare → Vitals (no notes on vitals; notes live with medications per web) → Symptoms & pain → Energy → Stress & triggers → Lifestyle → Food → Exercise → Medication & notes → **Review** with plain-text summary (`buildLogReviewSummary`) and **Save** only on the last step (then `goBack()`). Home uses a **floating +** affordance (web parity) plus today status from logs; **Charts** shows a pull-to-refresh **summary** (counts, 14-day coverage, flare days, simple averages) until full chart parity. Frequent symptom/stressor chips, body-region pain states, meal-level food, and category-grouped exercise with `Name:Minutes` parsing remain as before; duplicate-date protection on save is unchanged.
  - **Server (local Supabase import)**: **Completed** — fixed Supabase client initialization to support multiple import paths for `create_client` and removed a direct `from supabase import create_client` usage in the dashboard wipe flow.
  - **Web settings UX polish**: **Completed** — moved “Appearance” label below the dropdown to avoid UI clash.
  - **Web settings consolidation**: **Completed** — merged “App install” into “💾 Data Management” (kept existing IDs so install links and logic continue to work).
  - **CI (Expo minified bundles)**: **Completed** — GitHub Actions now builds Expo **production bundles** for iOS + Android (`expo export`), verifying minified `.hbc` bundle outputs as a merge gate.
  - **CI (Legacy Capacitor builds)**: **Completed** — CI no longer rebuilds Capacitor Android/iOS jobs; legacy artifacts remain in repo history/releases without version bumps.
  - **README**: **Completed** — added React Native + Expo badges; marked Capacitor as legacy in tech stack and notes.
  - **CI (Security audit)**: **Completed** — pip-audit now ignores `CVE-2026-4539` (pygments; no fix version published) to prevent false-failures from a transitive dependency in the audit toolchain.
  - **CI (workflows split)**: **Completed** — `security-audit` moved to `.github/workflows/security-audit.yml` (standalone). Legacy Capacitor Android/iOS jobs moved to `.github/workflows/legacy-capacitor.yml` (**disabled**, `workflow_dispatch` only). Main `ci.yml` keeps **Expo** `expo-bundle-prod` with explicit **Verify Android / iOS** Hermes `.hbc` steps.
  - **CI (Expo native builds via EAS)**: **Completed (manual workflow)** — added `.github/workflows/expo-native-build.yml` for manual (`workflow_dispatch`) cloud builds of **Android + iOS** using EAS CLI and `EXPO_TOKEN`; added `apps/mobile/eas.json` with development/preview/production profiles.
  - **Web Settings → Data management**: **Completed (layout)** — App installation block uses stacked full-width rows (`.app-install-*` CSS) so Android/iOS download links and build metadata no longer overlap; labels stay driven by `refreshAppInstallSection()`.
  - **Web log food & exercise tiles**: **Completed (duplicate selection UX)** — when the same predefined food or exercise is added more than once, the tile shows a **numeric count badge** instead of a checkmark; clicking the badge opens **Yes / No** confirm (`showConfirmModal` options) to clear that item by name (log form, edit form, food modal, exercise modal).
  - **Expo log food & exercise quick picks**: **Completed (duplicate selection UX parity)** — quick-pick chips now allow duplicate adds; when count > 1, a badge appears on the chip and tapping it shows a **Yes / No** confirm to clear that selected card item.
  - **Expo AI Analysis tab**: **Completed (initial parity)** — replaced placeholder with a range-based analysis surface (`14/30/90/all`) that computes log-driven summary outputs (entry count, flare days, average mood/sleep/fatigue, top symptoms/stressors) with pull-to-refresh; added tests for analysis logic and AI screen rendering.
  - **Expo Charts tab**: **Completed (expanded lite parity)** — upgraded from basic totals to a range-based chart summary surface (`14/30/90/all`) with per-metric trend cards (average/current/delta/point-count for mood, sleep, fatigue, steps, hydration), plus pull-to-refresh; added trend summarizer unit tests.
  - **Expo Log wizard (symptoms/stressors free-add)**: **Completed (lite parity improvement)** — Step 3 now supports adding custom symptoms and Step 5 supports adding custom stressors, in addition to frequent/predefined chips; updated wizard tests to cover custom entry flows.
  - **Expo Log wizard (pain UX refinement)**: **Completed (lite parity improvement)** — Step 3 pain region selector now includes severity legend, mild/pain region counts, state-colored region chips, and a one-tap clear-all action for body selections.
  - **Expo AI Analysis tab (narrative sections)**: **Completed (lite+ parity improvement)** — AI tab now includes structured narrative sections closer to web copy: **What you logged**, **What we found**, **How you are doing**, and **Things to watch**, generated from selected-range logs; tests updated.
  - **Expo AI Analysis tab (correlations)**: **Completed (lite parity improvement)** — added a **Correlations** section with simple Pearson-based metric links (mood/sleep, sleep/fatigue, mood/fatigue) and fallback guidance when no strong relationship is detected.
  - **Expo Charts tab (mini visual trends)**: **Completed (lite parity improvement)** — added lightweight sparkline-style trend bars for each metric trend row so the Charts tab now has a quick visual trajectory in addition to numeric average/current/delta summaries.
  - **Expo AI Analysis tab (possible flare-up)**: **Completed (lite parity improvement)** — added a **Possible flare-up** block (risk level + matching signal count + notes) derived from recent trends and flare frequency to align closer to web AI summary structure.
  - **Expo AI Analysis tab (groups-that-change-together)**: **Completed (lite parity improvement)** — added a **Groups that change together** section based on detected metric links, providing plain-language relationship hints similar to the web AI sectioning style.
  - **Expo AI Analysis tab (important changes)**: **Completed (lite parity improvement)** — added an **Important** section that flags sudden recent metric changes (fatigue/sleep/mood shifts) with a fallback “no sudden changes” message.
  - **Expo Log wizard (medication quick-picks)**: **Completed (lite parity improvement)** — Step 9 now includes medication quick-pick chips, selected-medication remove controls, and duplicate count-badge clear behavior consistent with food/exercise quick-picks.
  - **Expo Log wizard (lifestyle quick scores)**: **Completed (lite parity improvement)** — Step 5 now includes quick score chips/inputs for irritability & weather sensitivity, while Step 6 includes quick score chips for daily function plus manual inputs for steps/hydration.
  - **Expo Log wizard (energy selection UX parity)**: **Completed (lite parity improvement)** — Step 4 energy/clarity adds a visible “Selected energy & clarity” control with one-tap clear.

### 7.1 Ground rules (apply to every step)

- **Parity rule**: The GitHub Pages web app (including installed **PWA**) and the **Expo** iOS/Android app are **one product**. Any divergence must be documented as a signed-off exception.
- **No WebView shortcut**: The Expo app UI is built in React Native views. WebView is only allowed for isolated, explicitly approved surfaces (e.g. OAuth/Legal).
- **One source of truth for tokens**: Team × (light|dark) palettes + typography scale must be expressed as **shared design tokens** consumed by both web and RN.
- **Test as you build**: Every new “platform surface” comes with tests and CI gates from day one.

### 7.2 Step 0 — Baseline and inventory (web is the reference)

**Goal**: Define exactly what “same product” means in *this* repo so parity can be measured.

- Create a **Parity Checklist** inside this doc (or link a file under `docs/`) that enumerates:
  - **Screens / routes**
  - **Core UI components**
  - **Settings modules** (including Accessibility)
  - **Animations and transitions**
  - **Permissions** and when prompts occur
  - **Offline/PWA behaviors** (install, caching, update prompts, background sync if used)
  - **AI features** (where they appear, inputs/outputs, latency expectations)
- Capture “web reference” behaviors with small, concrete notes (what the user clicks, what they see, expected state changes).

**Done when**: parity checklist exists and every planned RN screen has a web/PWA reference.

#### 7.2.1 Parity checklist (initial, from current web reference)

**Web reference**: `web/index.html` + `web/app.js` (static web/PWA). `react-app/` is a shell for Capacitor and is **not** the canonical UX reference for parity.

##### Screens / primary surfaces (web)

- [x] **Home tab** (`data-tab="home"`, `#homeTab`)
- [x] **View Logs tab** (`data-tab="logs"`, `#logsTab`)
- [x] **Charts tab** (`data-tab="charts"`, `#chartsTab`)
- [x] **AI Analysis tab** (`data-tab="ai"`, `#aiTab`) (feature-gated by “Enable AI features & Goals”)
- [x] **Log today flow** (log wizard container `#logTab`, opened via floating + button; 10-step wizard)

##### Screens / primary surfaces (Expo - parity loop)

- [x] **Home tab** (today status + floating **+** opens Log wizard; refreshes on focus)
- [x] **View Logs tab** (AsyncStorage-backed list; canonical `healthLogs` key; shows key metrics)
- [~] **Charts tab** (range selection `14/30/90/all` + `Balance/Individual/Combined` view toggle + trend summaries/deltas + lightweight mini trend bars per metric + pull-to-refresh; full Apex/web visual parity still to do)
- [~] **AI Analysis tab** (implemented lite++; range-based log summary + narrative sections (incl. Important) + possible flare-up block + basic metric-correlation section + “groups that change together”; deeper parity with web AIEngine/LLM still to do; gated by `aiEnabled`)
- [x] **Settings tab** (theme + accessibility + AI gate; persisted)
- [x] **Log today flow** (stack screen from Home **+**; **10-step** wizard matching web; saves into logs; blocks duplicate dates)

##### Log wizard steps (web)

- [x] **Step 1**: Date & flare
- [x] **Step 2**: Vitals
- [x] **Step 3**: Symptoms & pain (symptom tiles + frequent chips + list)
- [x] **Step 4**: Energy & mental clarity (tile picker)
- [x] **Step 5**: Stress & triggers (stressor tiles + frequent chips + list)
- [x] **Step 6**: Lifestyle
- [x] **Step 7**: Food (meal categories: Breakfast/Lunch/Dinner/Snack)
- [x] **Step 8**: Exercise (categories: Cardio/Strength/Flexibility/Balance/Recovery)
- [x] **Step 9**: Medication & notes (`web/index.html` `data-log-step="8"`)
- [x] **Step 10**: Review (`data-log-step="9"`; save only on last step)

##### Log wizard steps (Expo - parity loop)

- [x] **Step 1**: Date & flare
- [x] **Step 2**: Vitals (basic fields; notes are **not** here — matches web)
- [~] **Step 3**: Symptoms & pain (lite++ — chips + frequent chips + custom free-add + tappable body-region severity with legend/counts/clear-all → `painLocation`; plus selected-symptoms clear-all; full body-diagram UX still to do)
- [~] **Step 4**: Energy & mental clarity (lite — choice chips + selected-clear)
- [~] **Step 5**: Stress & triggers (lite+ — irritability + weather sensitivity quick score inputs/chips + frequent + predefined stressor chips + custom free-add + selected-stressors clear-all)
- [~] **Step 6**: Lifestyle (lite+ — daily function with quick score chips + manual inputs for steps/hydration)
- [~] **Step 7**: Food (lite+ — Breakfast/Lunch/Dinner/Snack with quick-picks + remove)
- [~] **Step 8**: Exercise (lite+ — `Name:Minutes`, category-grouped picks, quick-picks)
- [~] **Step 9**: Medication & notes (lite+ — comma-separated medication names with quick-pick chips + remove controls + duplicate count-badge clear → `{ name, times: [], taken }[]`; free-form notes)
- [x] **Step 10**: Review (plain-text summary via `buildLogReviewSummary`; Save → persist → back)

##### Settings modules (web “Settings” overlay carousel)

- [x] **Personal & Cloud Sync**
  - Name
  - Medical Condition selector (+ AI data processing policy box)
  - Cloud auth (sign up / sign in) and sync controls
- [x] **AI & Goals**
  - Enable AI features & Goals
  - Contribute anonymised data
  - Use open data for training
- [x] **Display**
  - Daily reminders toggle
  - Reminder time
  - Sound notifications toggle
  - Notification permission request button
- [x] **Customisation**
  - Global theme choices: Mint / Red-Black / Mono / Rainbow
- [x] **Data options**
  - Export data
  - Import data
  - (additional toggles exist; confirm exact list during next pass)
- [x] **Performance**
  - Lazy load charts
  - On-device AI model select (recommendation hint)
- [x] **Data management** (merged App install + Data management)
  - App installation
    - Install on iOS (instructions)
    - Install on Android (APK link)
    - Install on iOS (alpha link)
    - Install web app
  - Export data
  - Import data

##### Modals / overlays (web)

- [x] **Goals & targets modal** (`#goalsModalOverlay`) (steps/hydration/sleep/good days sliders)
- [x] **Bug report modal** (`#bugReportModalOverlay`)
- [x] **Alert modal** (custom alert overlay in `web/app.js`)
- [x] **Cookie policy / consent** (`#cookieBanner` + cookie policy modal)

##### Permissions (web; initial inventory)

- [x] **Notifications**: explicit “Request Permission” action in Settings → Display
- [x] **Microphone**: voice input permission handling exists in `web/app.js` (used by speech-to-text)

##### PWA / offline behaviors (web; initial inventory)

- [x] **Manifest**: `web/manifest.json` (standalone display; shortcuts for `?quick=true`, `?charts=true`, `?export=true`)
- [x] **Service worker**: `web/sw.js` (exists; behavior to be audited in next pass)

##### AI surfaces (web; initial inventory)

- [x] **AI feature gating**: Settings → “Enable AI features & Goals”
- [x] **On-device model preference**: Settings → Performance → “On-device AI model”
- [~] **AI tab contents + input/output**: Expo now includes range input + summary outputs + narrative sections (including Important) + possible flare-up summary + basic correlations + groups-that-change-together hints. Next: mirror deeper web AIEngine/LLM output structure and richer correlation language.

### 7.3 Step 1 — Repository layout for web + Expo (scaffold)

**Goal**: Structure the repo so web and RN can share code where it makes sense without coupling UI layers.

Recommended target layout (adjust to current repo conventions):

- `apps/web/` (or keep current web root, but isolate it cleanly)
- `apps/mobile/` (Expo React Native app)
- `packages/shared/` (pure TS utilities + domain logic + API client)
- `packages/tokens/` (team palettes, semantic colors, typography scale, spacing)
- `packages/ui-spec/` (optional: platform-agnostic UI contracts like component props types, not actual UI code)

**Actions**

- Move or refactor code only if needed to enable shared packages; prefer incremental change to avoid breaking deployments.
- Ensure both apps can import shared packages (workspace tooling, TS path aliases).

**Done when**: web builds and runs; shared packages can be imported by web without circular deps.

### 7.4 Step 2 — Web/PWA as the canonical product build (GitHub Pages)

**Goal**: Make web + PWA the stable, testable reference that CI can validate on every PR.

**Actions**

- Confirm/standardize:
  - PWA manifest and service worker behavior
  - Install/standalone behavior (app shell, navigation, deep links if used)
  - Offline / cache strategy (what is cached, what is network-only)
- Add/ensure web tests:
  - **Unit tests** for pure logic (in shared packages where possible)
  - **Component tests** for critical UI flows
  - **Accessibility checks** for core screens (see 7.8)

**Done when**: web has repeatable test commands that pass locally and in CI.

### 7.5 Step 3 — Expo mobile scaffold (iOS + Android)

**Goal**: Create the Expo app skeleton that can reach feature parity without later rewrites.

**Scaffold requirements**

- **Navigation**: Match web/PWA navigation intent (tab/stack) while keeping native conventions.
- **Theming provider**: Reads:
  - team selection
  - appearance mode: **system** default + manual override
  - exposes semantic tokens to components
- **Settings**: Include Settings shell early with placeholders for:
  - Theme mode toggle (system/light/dark)
  - Team selector
  - Accessibility section (placeholders)
- **Permissions manager**: Centralized module for requesting permissions with consistent rationale text and gating logic (mirrors web where applicable).
- **Storage**: Preference persistence (theme override, font scale, a11y settings) with a single abstraction used across platforms (web local storage vs RN storage).

**Parity guardrails**

- Every screen implemented in Expo must link back to its web/PWA reference in the parity checklist.
- Recreate **animations** intentionally (e.g. shared motion spec: duration/easing) rather than “whatever default.”

**Done when**: Expo app boots on iOS simulator and Android emulator, has navigation + theme provider + settings shell + token consumption working.

### 7.6 Step 4 — Shared code: domain logic + API client + contracts

**Goal**: Keep parity by sharing the logic that *should* be identical.

**Actions**

- Move pure logic into `packages/shared/`:
  - data models/types
  - validation
  - API client calls
  - formatting utilities (dates, units, etc.)
- Keep UI layer separate:
  - Web uses React DOM + web components
  - Mobile uses React Native views

**Done when**: at least one real feature flow uses shared logic in both web and mobile.

### 7.7 Step 5 — Design tokens: team × light/dark + typography scaling

**Goal**: Implement the theme + team system once as tokens, consumed everywhere.

**Actions**

- Define token structure (example categories):
  - `color.background.*`, `color.text.*`, `color.accent.*`, `color.border.*`
  - `typography.fontFamily`, `typography.scale` (base size + multiplier)
  - `spacing.scale`, `radius.scale`
- For each **team**, define:
  - a **light** palette mapping to semantic tokens
  - a **dark** palette mapping to semantic tokens
- Implement **system default + override** behavior:
  - Web: prefers-color-scheme + stored override
  - RN: Appearance API + stored override

**Done when**: switching team or mode updates both apps consistently; “system” mode tracks device setting changes.

### 7.8 Step 6 — Accessibility implementation (web + Expo)

**Goal**: Accessibility is not a bolt-on; it’s a product surface with parity goals.

#### 7.8.1 Accessibility settings model (shared)

- Add a shared settings shape (e.g. `accessibility: { textScale, largeTextEnabled, ttsEnabled, colorblindMode }`) and a single persistence API.

#### 7.8.2 Font scaling (large text + slider)

- Implement a global **text scale** value.
- Web:
  - Apply scale via CSS variables / root font-size strategy without breaking layout.
- Expo:
  - Apply scale via theme/typography tokens (and/or RN font scaling patterns) consistently.

#### 7.8.3 Text-to-speech (TTS)

- Define interaction model in the parity checklist:
  - tap-to-read for specific components, or
  - dedicated “read mode” toggle, or both
- Web: use a TTS wrapper around the Web Speech API (or chosen library).
- Expo: use a native TTS module/library.
- Ensure every interactive element has meaningful accessible labels so TTS is useful.

#### 7.8.4 Colorblind settings

- Implement colorblind modes as token overrides (don’t hardcode per-component).
- Add non-color cues where necessary (icons, patterns, labels).

#### 7.8.5 Accessibility testing gates

- Web: add automated a11y checks on core screens (axe-style scanning) plus manual keyboard navigation notes.
- Expo: add component tests that verify accessibility labels/roles exist for key controls.

**Done when**: Accessibility section is functional in both apps; text scale affects all screens; TTS works for defined elements; at least one automated a11y gate runs in CI.

### 7.9 Step 7 — Testing strategy (unit + component) and where tests live

**Goal**: Tests enforce parity and prevent regressions across two implementations.

**Minimum test layers**

- **Shared unit tests** (`packages/shared/`): fast tests for logic used by both platforms.
- **Web component tests** (`apps/web/`): critical UI flows (settings, theme, accessibility).
- **Expo component tests** (`apps/mobile/`): navigation + settings + theming + a11y props.

**Parity tests (recommended)**

- Define JSON “golden” fixtures for:
  - token outputs for each team/mode
  - settings serialization/deserialization
  - permission gating decisions
- Run the same fixtures against both web and RN implementations of shared logic.

**Done when**: test suites are present for shared + web + mobile, and run in CI on every PR.

### 7.10 Step 8 — GitHub Actions / CI updates (web + Expo)

**Goal**: CI reflects the new product surfaces: **web/PWA** + **Expo**. It must block parity-breaking changes early.

**Actions**

- Update/standardize **test commands** so CI is stable and deterministic:
  - `test:unit` (shared packages)
  - `test:web` (web UI/component tests)
  - `test:mobile` (Expo/RN tests)
  - `test` runs all three (or a matrix)
  - Ensure coverage output is consistent (so it can be used for gating)

- Add/confirm CI jobs (PR + main):
  - **Install** (cache deps)
  - **Lint** (web + shared + mobile)
  - **Typecheck** (web + shared + mobile)
  - **Test**:
    - shared unit tests
    - web tests
    - mobile tests (Jest/RTL for RN)
    - **Unit test coverage** (minimum thresholds for shared + web; mobile as available)
  - **Build web** (GitHub Pages artifact)
  - Optional: **Expo prebuild/doctor** checks to validate native config and permissions consistency

- Add “workflow discipline”:
  - CI must run on every PR and on pushes to the default branch.
  - When a new package/app is introduced (e.g. `apps/mobile/`), **workflows must be updated in the same PR** (no “we’ll fix CI later”).
  - If any test suite is flaky, treat it as a blocker: fix or quarantine with a tracked issue and a timeboxed plan to re-enable.

- Add a “parity gate” job that fails if:
  - required parity checklist items are missing for a PR touching UI/flows, or
  - token definitions are incomplete for a team in a new mode (light/dark), or
  - accessibility settings exist in one platform but not the other

**Done when**: A PR cannot merge if web/mobile tests fail or if token/a11y/parity gates fail.

### 7.10.1 CI workflow outputs to keep (so releases are easy)

- Web build outputs:
  - single deployable artifact for GitHub Pages
  - optionally: a `build-metadata.json` containing commit SHA, build number, version, timestamp
- Expo build outputs (at minimum for CI validation):
  - “config validated” artifacts/logs (permissions, app.json/app.config checks)
  - optional: EAS build artifacts if using EAS (see releases below)

### 7.10.2 Release workflows (web/PWA + Expo)

**Goal**: Publishing is automated and matches the “two-surface product” model.

#### Web/PWA releases (GitHub Pages)

- On version tags (e.g. `vX.Y.Z`) or manual dispatch:
  - run the full CI pipeline (lint/typecheck/tests)
  - build web
  - deploy to GitHub Pages
  - attach release notes/changelog snippet if desired

**Done when**: tagging a release reliably deploys GitHub Pages and the deployed build is traceable to the tag/SHA.

#### Expo mobile releases (iOS/Android)

- Decide and document the release lane:
  - **EAS Update** for JS-only updates (fast, over-the-air where allowed)
  - **EAS Build** for native changes / store submissions
- Add a release workflow triggered by tags or manual dispatch that:
  - runs lint/typecheck/tests (including shared + mobile)
  - validates native config (permissions, identifiers, assets)
  - performs EAS build (or prepares commands/instructions if credentials require manual steps)
  - publishes artifacts/links as release assets/notes (build IDs, download links, commit SHA)

**Done when**: there is a repeatable, documented path to produce iOS/Android builds for release that matches the same version as the web/PWA release.

### 7.11 Step 9 — Feature-by-feature Expo port (linear execution)

**Goal**: Port the app to Expo in a controlled, repeatable way.

For each feature/screen, execute the same loop:

- Implement shared logic first (if applicable) in `packages/shared/` with unit tests.
- Implement web UI (if the web reference needs improvement) and add/extend web component tests.
- Implement Expo UI with matching UX/animations and add RN component tests.
- Update parity checklist:
  - mark feature as complete
  - document any approved exception

**Done when**: parity checklist shows 100% completion (or exceptions explicitly signed off).

### 7.12 Step 10 — Remove Capacitor as a shipping surface (leave GitHub Pages + PWA + Expo)

**Goal**: Stop producing a Capacitor “third product.” The only products shipped are:

- **Web/PWA** (GitHub Pages)
- **Native mobile** (Expo iOS/Android)

**Actions (phased)**

- Phase A — Freeze:
  - Stop adding features to Capacitor-specific code paths.
  - Update docs to state Capacitor is deprecated and will be removed.
- Phase B — CI cleanup:
  - Remove Capacitor build jobs from GitHub Actions (or mark them non-blocking, then delete).
  - Remove release artifacts and “latest” pointers for Capacitor builds if they exist.
- Phase C — Code removal:
  - Delete Capacitor project files and scripts once Expo mobile replaces them.
  - Remove any “webview trick” documentation and legacy wiring that only existed for Capacitor.

**Done when**: CI no longer builds Capacitor; README/docs no longer reference Capacitor as a supported product; repo contains only web/PWA and Expo mobile shipping paths.

### 7.13 Step 11 — Release readiness checklist (web/PWA + Expo)

- Web/PWA:
  - PWA install works
  - cache/update flows tested
  - accessibility checks pass
- Expo iOS/Android:
  - permissions prompts verified on-device
  - accessibility settings verified
  - performance sanity pass (animations, large text)
- Parity:
  - parity checklist complete
  - exceptions documented and approved

**Done when**: web (GitHub Pages + PWA) and Expo mobile are demonstrably the same product experience.

### 7.14 Step 12 — Aider execution script (prompt-by-prompt)

Use this as a **linear prompt plan**. Each item is intended to be small enough to complete in a single Aider session and ideally map to a single PR or tight group of commits.

**Aider rules for this phase**

- Only change one “surface” at a time unless the change is a shared contract (tokens/types/shared logic).
- Every step that adds a new folder/package must also update CI in the same change.
- After each step: run tests locally (or at least the relevant subset) and ensure CI is green.

#### Prompts (run in order)

1. **Create parity checklist**
   - “Add a parity checklist doc under `docs/` (or inside `docs/next-phase-development-plan.md`) enumerating screens, components, settings, animations, permissions, PWA offline behaviors, and AI surfaces. Populate it by inspecting the current web app routes and settings UI.”

2. **Create shared packages scaffolding**
   - “Add workspace scaffolding for `packages/shared` and `packages/tokens` (no UI code). Ensure the existing web app can import from them. Add minimal unit tests and CI wiring.”

3. **Move first shared module + tests**
   - “Move one real pure-logic module from the web app into `packages/shared`, update imports, and add unit tests proving behavior is unchanged.”

4. **Implement tokens for one team + light/dark**
   - “Implement semantic tokens in `packages/tokens` and wire web theme provider to consume them. Implement one team with light/dark palettes and system-default + override logic. Add unit tests for token selection.”

5. **Web accessibility settings data model**
   - “Add a shared accessibility settings model (text scale, large text, TTS enabled, colorblind mode) in `packages/shared` with serialization tests. Wire web settings UI to read/write it (no RN yet).”

6. **Web font scaling**
   - “Implement app-wide font scaling in the web app using tokens/CSS variables. Add a component test ensuring settings slider changes computed font-size and does not break key layout containers.”

7. **Web TTS**
   - “Implement Web TTS for the defined interaction model and add a minimal test harness (mock speech API) verifying that activating a control triggers speech with the accessible label.”

8. **Expo app scaffold**
   - “Create `apps/mobile` as an Expo app with navigation, theme provider, settings shell, and storage abstraction. Ensure it compiles on iOS simulator and Android emulator. Add a basic RN test setup and CI step.”

9. **Tokens consumed by Expo**
   - “Wire Expo theme provider to `packages/tokens` with the same team + light/dark + system-default logic. Add tests for token selection in RN.”

10. **Expo accessibility shell**
   - “Add Accessibility section in Expo settings with placeholders for text scale slider, TTS toggle, colorblind mode. Persist settings with the shared model and storage abstraction.”

11. **Expo font scaling**
   - “Implement global text scaling in Expo using typography tokens. Add component tests that confirm text size changes when the slider changes.”

12. **Expo TTS**
   - “Implement Expo TTS with the same interaction model as web. Ensure accessible labels exist and add a test (mock TTS) verifying a press triggers speech.”

13. **Colorblind modes as token overrides**
   - “Implement colorblind modes as token overrides in `packages/tokens` and apply them in both web and Expo. Add shared unit tests that the override produces expected semantic tokens.”

14. **Parity loop: port screen-by-screen**
   - “Port the next screen from web to Expo to match UI/UX/animations; update parity checklist and add tests for the new screen on both platforms.”

15. **CI parity gates**
   - “Add CI checks that fail if token sets are incomplete (team missing light/dark), or if accessibility settings exist on web but not on Expo (and vice versa).”

16. **Release workflows**
   - “Add/modify GitHub Actions workflows so: (a) web/PWA builds and deploys to GitHub Pages on tags, (b) Expo release workflow runs tests and triggers EAS Update/Build (as configured). Output build metadata and attach to GitHub releases.”

17. **Deprecate then remove Capacitor**
   - “Update docs/workflows to deprecate Capacitor. Remove Capacitor build jobs. After Expo reaches parity, delete Capacitor-specific code and scripts and update README/docs accordingly.”

**Done when**: The Aider script can be followed end-to-end to produce a web/PWA + Expo product with enforced parity, tests, CI gates, and release automation.
