# Changelog

All notable changes to the Rianell monorepo are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). Versions use `v<major>.<minor>.<patch>` aligned with npm workspace roots.

---

---

## [2.1.8] - 2026-07-06

Visual System Upgrade (agentic plan P0–P7): unified motion tokens, SVG sprite chrome, tier-gated WebGL ambient layer, and RN reduce-motion parity.

### Added

- **docs/visual-inventory.md** — living registry of SVG, motion, and surface upgrade status
- **audit-history/visual-baseline-manifest.json** — screenshot targets for before/after diffs
- **apps/pwa-webapp/lazy-webgl.mjs** + **modules/webgl-scene.js** — lazy-loaded WebGL2 particle scenes (home ambient, mood orb, achievement burst)
- **Sprite icons:** `icon-chevron-left`, `icon-chevron-right`, `icon-close`, `icon-backspace`
- **@rianell/tokens:** `--dur-slower` (700ms), `ACHIEVEMENT_TIER_COLORS`, `EXPORT_SVG_COLORS` in medTimeline

### Changed

- **Motion foundation:** legacy `--transition-*` aliases map to `--dur-*` + `--ease-out-expo`; global `body.reduce-motion` synced from OS + in-app pref
- **Goals carousel:** medal/target icons use sprite `<use>` (deduped inline SVG)
- **UI chrome:** pin keypad, carousel arrows, log wizard nav, tutorial arrows use SVG sprites (emoji/text retired)
- **Home:** hero card stagger entrance; pointer-hover lift on quick actions (desktop)
- **Charts:** panel crossfade on load
- **RN:** `HomeScreen`, `AiScreen`, `PrimaryButton`, `BootLoadingScreen` honor `useReduceMotionFlag`; achievement tiers from tokens

### Fixed

- **sw.js** push notification icon aligned to CI contract (`Icons/beta/Icon-192.png`)

### Tests

- Extended `tests/unit/pwa/animation-polish.test.mjs` (motion tokens, reduce-motion, WebGL wiring, push icon)
- Updated `tests/unit/pwa-goals-carousel.test.mjs` for sprite-based dot icons
- 708 unit tests passing

---

## [2.1.7] - 2026-07-06

Dependency maintenance release: patch-updates group, lighthouse 13, and RN ScrollView ref fixes for React 19 types.

### Changed

- **npm patch-updates:** react 19.2.7, @types/react 19.2.17, react-native-svg 15.15.5, @react-navigation/bottom-tabs 7.18.7, @react-navigation/native-stack 7.17.9, @react-native/babel-preset 0.83.10, @playwright/test 1.61.1, @ungap/structured-clone 1.3.2
- **benchmarks:** lighthouse 12.2.1 → 13.4.0 (dev-only; production npm audit unchanged)
- **Dependabot:** ignore incompatible major bumps for jest ≥30, @react-native/babel-preset ≥0.84, expo-modules-core ≥56 while on Expo SDK 55 / RN 0.83

### Fixed

- **RN carousel refs:** `GoalsModal`, `MoodScreen`, and `SettingsScreen` use `React.ComponentRef<typeof ScrollView>` so `tsc` passes after @types/react 19.2.17
- **CI Lighthouse probe:** Wait for `asset-manifest.json` main bundle before LHCI (same warm-up as Playwright); `pauseAfterLoadMs` in `lighthouserc.js` reduces CLS flake on cold runners

### Tests

- `tests/unit/rn-scroll-ref-contract.test.mjs` — ScrollView ref typing + dependabot ignore contracts
- `tests/unit/lighthouse-ci-probe.test.mjs` — LHCI warm-up and CLS budget contracts

---

## [2.1.6] - 2026-06-30

Six-guardrail technical audit remediation: canonical tokens, RN screen primitives, transform-only progress motion, and CI guard script.

### Added

- **Mood Control Deck (PWA Mood tab)** — unified 3D glass panel replacing separate check-in slider and quick-action buttons; daypart orbs with depth, aurora backdrop, parallax tilt, and 3D action tiles (`mood-tab.js`, scoped `.mood-control-deck` CSS). Home check-in card unchanged.
- **`docs/design-token-contract.md`** — `@rianell/tokens` is runtime authority; root `DESIGN.md` is reference-only (getdesign Airbnb crawl)
- **`SPACING_TOKENS` / `SURFACE_TOKENS`** in `@rianell/tokens`; synced to PWA via `npm run sync:tokens`
- **RN primitives:** `ScreenCard`, `ScreenContainer`, `RangeChip`, `themeHelpers.ts`
- **`scripts/verify/verify-design-tokens.mjs`** + `npm run verify:design-tokens` (CI unit-tests job)
- **Cursor guardrails:** `.cursor/rules/` (layout, brand-tokens, ui-motion), skills, MCP guide

### Changed

- **PWA log metrics:** Pin-anchored swelling balloon with face/glow tiers; irritability chill-face + thought cloud; mobility trampoline bounce phases; weather sun/cloud crossfade tied to wellness score (`log-metric-widgets.js`, scoped CSS).
- **PWA cycle tracking:** Unified 45-day timeline with period-start anchor and drag threshold on day beacons (`cycle-tracking-ui.js`); stale selection rings removed in `decorateCycleBeacon`.
- **PWA goals carousel:** Refined target/medal dot SVG icons with fill animations and viewport height sync.
- **PWA device benchmark:** Async sliced CPU suite, stall/hard-cap timeouts, and non-blocking string ops so boot benchmark cannot hang the main thread (`device-benchmark.js` v8).
- **PWA progress bars** — `scaleX(var(--progress))` instead of animating `width` (wizard, goals, achievements, import, AI download, password strength)
- **Tab nav indicator** — `translateX` + `scaleX` (no width transition)
- **RN screens** — `resolveScreenBackground()` + `ScreenCard` on Home, Logs, AI, Charts, LogWizard; tab bar background via theme helper
- **`AchievementsPane` / `OasisNeuralTrace`** — native-driver `scaleX` progress; opacity pulse trace (reduced-motion gated)

### Tests

- `tests/unit/tokens.test.mjs` — spacing/surface/`resolveScreenBackground`
- `tests/unit/verify-design-tokens.test.mjs` — guard script + progress CSS contracts
- `tests/unit/pwa/mood-tab-ui.test.mjs` — Mood Control Deck markup/CSS contracts
- `tests/unit/pwa/log-metric-widgets.test.mjs` — swelling balloon, irritability, mobility, weather widgets
- `tests/unit/pwa-goals-carousel.test.mjs` — goals dot SVG + cycle timeline contracts
- `tests/unit/pwa/perf-benchmark-modal.test.mjs` — benchmark slice/timeout guards
- `tests/unit/ai-engine-parity.test.mjs` — rolling date fixtures for 30-day filter

---

## [2.1.5] - 2026-06-30

PWA UI/UX fixes batch: log metrics, onboarding, AI ambient, feature defaults, and companion polish.

### Fixed

- **Joint swelling:** Morphing balloon SVG replaces knee metaphor; body path morphs with slider severity
- **Mobility trampoline:** Jumper/mat animation phases aligned (jumper at bottom when mat depressed)
- **Where it hurts:** Stroke-only anatomical silhouette; neutral/mild/pain region colors; edit form matches main diagram
- **Stool type (Bristol):** Removed green circular status icon overlay on slider card
- **Mood metric:** Square shadow artifact fixed — circular icon wrap, drop-shadow on head only
- **Onboarding avatar:** Loader removed; companion picker shown before instructional copy
- **Profile companion:** Larger settings framing, seeded accessories (glasses, hats, etc.), per-render motion profiles

### Changed

- **AI Insights background:** Dashed neural paths replaced with slow pulsing vein layers (`oasisVeinDrift` / `oasisVeinPulse`)
- **Feature toggles:** Cycle tracking, digestive module, and barcode food logging default **on** (PWA + RN)
- **Daily log:** Cycle tracking and BBT panels in collapsed-by-default accordions
- **Getting started achievement (`milestone_3`):** 3D self-opening book SVG with perspective cover/page animations

### Tests

- Updated `achievement-icons`, `animation-polish`, and `log-metric-widgets` unit tests for new visuals

---

## [2.1.4] - 2026-06-30

PWA visual polish: companion names, lock icon, metric animations, trend layout, and nav icon motion.

### Fixed

- **Companion names:** Onboarding “Meet your companion” shows generated names (e.g. Sun Warden) instead of raw seed timestamps — `graphics-portfolio.js` lazy-loads `RianellShared` after script order fix
- **Security lock:** Padlock SVG renders as stroke outline, not solid grey blob (`icon-lock` / `icon-lock-open` symbols + illustration CSS)
- **AI trend cards:** Typical / Latest / Outlook stat values split num/unit; wider grid prevents cramped labels and orphan cards

### Changed

- **Mobility metric:** Stick-figure jumper on trampoline with bounce tied to score; limb and mat squash animations
- **Swelling metric:** Side-view knee with pulsing joint fluid and ripple rings scaled by severity
- **AI neural trace:** Slower (9s) reversed dash animation on full-panel background
- **Navbar icons:** Redesigned Home / Logs / Charts / Mood / AI symbols with per-tab active motion and hover polish

### Tests

- Extended `graphics-portfolio`, `animation-polish`, `log-metric-widgets`, `ai-trend-cards`

---

## [2.1.3] - 2026-06-29

Log wizard clarity, picker polish, goals tab art, and full-panel AI ambient trace.

### Added

- **Severity scale:** `classifySeverityRaw` in `@rianell/shared` — stiffness, joint pain, fatigue, and related sliders show **Low / Moderate / High** with raw 1–10 readout (not inverted Good/Bad)
- **Log review:** Metric intensity bars, urgent vitals rows (glucose/SpO₂), raw severity values on review step
- **Critical vitals:** Urgent styling for extreme glucose and SpO₂ (`data-vital-urgent`, pulsing border, warning badge)
- **Symptom picker:** Per-icon motion classes, tile-picker i18n fallbacks (`data-i18n-placeholder-fallback`), ripple on tap
- **Goals modal tabs:** Redesigned inline target/medal SVG (three rings, medal shine) with staggered animations
- **AI tab:** Full-panel dashed neural trace background (replaces 64px header strip)
- **Settings carousel:** Container-query pane widths, active pane visibility, search reset on close
- **i18n:** `ai.watch.*`, `logs.picker.filterSymptoms*`, `wizard.metric.severity.*`, `wizard.vitals.glucose.*`, `wizard.vitals.spo2.*`
- **Tests:** `log-review-ux`, `symptom-picker`, `vitals-light-mode-contrast`, `avatar-random-picker`; extended goals-carousel, animation-polish, sliderWellness, log-metric-widgets

### Changed

- **Metric steppers:** 44×44px touch targets; higher-contrast slider endpoint labels
- **Graphics portfolio:** Achievement book open animation fix, rotating pill icon, symptom chip decorations, log screen art
- **i18n runtime:** Placeholder/aria fallback when catalog key missing
- **RN:** Log review summary parity with PWA severity display

---

## [2.1.2] - 2026-06-29

PWA dashboard polish, scrollable profile companions, animated achievement icons, and removal of ambient vibe UI.

### Added

- **AI dashboard panels:** Ranked “Things to watch” cards, lifestyle stat strip, nutrition/exercise/helpful-pattern panels, status-toned trend sparklines with typical baseline
- **Mood tab:** Compact reading history, focus row, goal-line sparkline
- **Achievement icons:** Inline animated SVG per badge type (plate, swimmer, pill glass, book, calendars, bed, tree, clipboard, etc.)
- **Companion carousel:** `avatar-carousel-shell` with prev/next scroll, 20 unique `avatarSymbolPathsForId` silhouettes, intro + Settings variants
- **Tests:** `ai-watch-panel`, `ai-lifestyle-panel`, `ai-trend-cards`, `mood-tab-ui`, `achievement-icons`, `avatar-carousel`, `log-metric-widgets`

### Changed

- **Log wizard:** Metric entity companions anchored in widgets; skip widgets with dedicated visuals; lifestyle section title in `index.html`
- **Onboarding:** Avatar pick only (vibe step removed from `guidedQuestionnaire.mjs`)
- **Settings:** Profile companion carousel; ambient vibe section removed
- **LLM:** WASM GPU-cap toast suppressed (`summary-llm.js`)

### Removed

- **Ambient vibe:** Settings picker, onboarding card, parallax vibe scene injection, `applyUserVibe` runtime (legacy classes cleared via `removeLegacyVibeUi`)

---

## [2.1.1] - 2026-06-29

SVG graphics and animation portfolio — profile companions, ambient vibes, metric entities, and screen decorations across the PWA.

### Added

- **`VIBE_TOKENS` / `AVATAR_THEME_TOKENS`** in `@rianell/tokens` — five user vibes and per-team avatar CSS variables synced to `apps/pwa-webapp/css/tokens.css`
- **20 profile avatars** (`PROFILE_AVATAR_IDS`) with legacy icon mapping in `@rianell/shared`
- **Onboarding cards:** `avatarPick` (carousel) and `vibe` (picker) after appearance
- **`apps/pwa-webapp/modules/graphics-portfolio.js`** — `window.RianellGraphicsPortfolio` (runtime SVG sprites, vibe parallax scene, metric companions, badge composites, Set D body map, Phase 6 screen art)
- **`apps/pwa-webapp/css/graphics-portfolio.css`** — carousel, companions, unlock sweep, connector flow dots, reduced-motion guards
- **i18n:** avatar names, vibe labels, onboarding copy; Tier A overrides in `scripts/lib/graphics-portfolio-tier-a-overrides.mjs`
- **Tests:** `graphics-portfolio.test.mjs`, `avatars.test.mjs`; extended `guidedQuestionnaire.test.mjs` and `tokens.test.mjs`

### Changed

- **Pain body map:** abstract Set D mannequin outline (regions and click handlers unchanged)
- **Achievements:** badge composite frames, day-chip flip, confetti unlock sequence
- **Settings:** avatar carousel and vibe picker mounts; lifestyle steps/hydration metric companions

---

## [2.1.0-oasis] - 2026-06-29

UI Oasis Overhaul — bioluminescent ambient canvas, living stats, AI neural traces, and celebration micro-interactions across PWA and React Native. Zero new npm dependencies.

### Added

- **`OASIS_TOKENS`** in `@rianell/tokens` — per-team ambient palettes, oasis motion timings, status glow strings
- **`apps/pwa-webapp/css/oasis.css`** — scoped `.oasis-*` stylesheet (blobs, grain, calm-glow, neural trace, particles)
- **`apps/pwa-webapp/modules/oasis-canvas.js`** — `window.OasisCanvas` IIFE (blobs, magnetic CTAs, confetti, shimmer, stream dots)
- **PWA:** Ambient blobs on all five tab panels; AI thinking-text morph; data-stream dots; milestone confetti; check-in shimmer
- **RN:** `OasisNeuralTrace.tsx`; `BalanceRadarChart` ghost breath ring; `HomeWelcomeCard` ambient pulse ring; `BootLoadingScreen` bioluminescent rings; achievement particle burst
- **Tests:** 8 assertions in `animation-polish.test.mjs`; `tests/unit/pwa/oasis-particles.test.mjs`; `tests/e2e/oasis-particles.mjs` static gate; `benchmarks/specs/oasis-particles.spec.ts` Playwright ceiling test

### Changed

- **`PrimaryButton.tsx`:** spring friction 6 → 12 (snappier snap-back)
- **`useReduceMotionFlag.ts`:** OR-gates OS reduce-motion + in-app `reducedMotion` pref

---

## [2.1.0] - 2026-06-28

Session stability and memory leak fixes targeting the long-session freeze/crash on high-end desktop PCs (Tier 5). Confirmed via live console capture showing a 421 MB AI heap spike, 200+ CSP Report-Only violation entries per load, and unbounded boot log growth. All fixes are non-breaking; first-load experience is unchanged.

### Added

- **`scripts/audit/stress-test-memory.mjs`:** Playwright CDP automated stress test — seeds Tier 5 benchmark + 365-day demo data, runs 10 tab-switch cycles, reports heap growth vs 80 MB threshold. Run with `npm run stress:memory`.
- **`scripts/verify/verify-no-cspro-none.mjs`:** CI check that asserts no `Content-Security-Policy-Report-Only` header with `connect-src 'none'` is served by the live site. Added to `verify:csp` chain.
- **npm scripts:** `stress:memory`, `verify:cspro` registered in root `package.json`.
- **Tests:** `tests/unit/pwa/session-stability.test.mjs` — 12 assertions covering all session-stability fixes (L1–L8).

### Fixed

- **L1 (performance-utils.js):** `_voiceInputObserver` (`MutationObserver` on `document.body`) now disconnected and nulled in the `beforeunload` cleanup block alongside `eventManager.cleanup()`. Was retained for the entire session, firing on every DOM mutation.
- **L2 (app.js):** `window.__rianellBootLog` is now a ring-buffer capped at 100 entries. The privacy-gate 2 s interval was pushing an entry every 2 s during onboarding — confirmed 8+ entries per boot in live console capture.
- **L2b (privacy-region.js):** `global.__rianellBootLog` (used in Node/test contexts) receives the same ring-buffer cap.
- **L4 (privacy-region.js):** Consent-enforcement `MutationObserver` and 2 s `setInterval` are now stored as module-scoped refs (`_privacyConsentObserver`, `_privacyConsentIntervalId`) and torn down inside `unlockAppChrome()` when consent is granted. Both were previously kept alive for the entire session.
- **L5 (app.js):** Chart `maxPoints` applies a session-elapsed decay: 100% of device-tier points for the first 30 min, 60% from 30–60 min, 40% beyond 60 min. Tier 5 desktop can render 300–450 points with full animations; the decay prevents long-session GPU memory accumulation without affecting first-load performance.
- **L6 (app.js):** Service worker update dismissal now tracks a `sessionStorage` counter (`rianellUpdateDismissCount`). After 3 "Later" clicks, `SKIP_WAITING` is sent automatically without showing the modal again. Users who kept dismissing were running a stale SW for hours, causing stale-asset network errors.
- **L8 (summary-llm.js):** Added pre-flight heap pressure check (`usedJSHeapSize > 200 MB`) before `tryLoadWithPlans`. Under pressure, GPU/MLC paths are bypassed and the app goes directly to the WASM runtime, preventing the 421 MB triple-runtime spike (ONNX WebGPU + MLC + WASM) on top of an already-stressed session heap. Also nulls `cachedPipeline` in the GPU catch block before WASM allocates.

### Operator action required

- **L7 (Cloudflare):** Remove or align the `Content-Security-Policy-Report-Only` header. Live console captured 200+ `connect-src 'none'` violations per page load from a CSPRO header at Cloudflare — each violation is a retained console.error string. See `security/cloudflare-headers-recommended.md` for steps. CI gate: `npm run verify:cspro`.

---

## [2.0.9] - 2026-06-28

Animation polish across React Native and PWA, wellness slider 1–10 range alignment, and boot benchmark modal UX fix.

### Added

- **RN motion polish:** Spring press on `PrimaryButton`; toast entry/exit scale + opacity; icon scale-pop and scale-based idle pulse on `EmptyState` / `HomeWelcomeCard`; staggered chart skeleton rows; AI stat/insight stagger entrances; mood ring SVG draw animation; log wizard direction-aware step slide; spring `SettingsChapter` expand.
- **PWA motion polish:** Wider tab transitions (38px), AI section/advice/list stagger delays, refined `aiSlideInFade` easing, shimmer ease-in-out, boot skeleton bar stagger, active nav icon lift.
- **Tests:** `tests/unit/pwa/animation-polish.test.mjs`, `tests/unit/pwa/perf-benchmark-modal.test.mjs`.

### Changed

- **Wellness sliders (shared + PWA):** Unified slider range is **1–10** (was 0–10); symptom invert uses `11 - value`; fill percent maps `(value - 1) / 9`.
- **Boot benchmark (PWA):** First-run boot no longer auto-opens the performance benchmark modal; god-mode **View benchmark** available on all viewports.
- **npm version:** Workspace roots bumped to **2.0.9**.

### Fixed

- **Form validation (PWA):** Metric fields validate via `metricRawFromWellness` so inverted symptom sliders persist correctly.

---

## [2.0.8] - 2026-06-28

Light-mode readability, system appearance boot sync, theme-tokenised metric animations, and clean Chromium dev tooling.

### Added

- **Server dev Chromium launcher:** `server/chromium_dev.py` + `server/scripts/chromium-dev.mjs` — isolated Playwright Chromium profile, `/api/reload` stream watcher, and status helpers for local PWA debugging.
- **PWA boot appearance sync:** Early `index.html` script reads stored appearance prefs and applies `rianell-appearance-*` / `light-mode` classes before the loading shell paints.
- **Light-mode CSS tokens:** `--text-light-rgb`, `--neutral-card-rgb`, and flipped `--ui-icon-color` so text, icons, and card surfaces stay readable in light mode.
- **Ocean metric tokens:** Irritability ocean animation uses `--ocean-*` tokens derived from `--primary-color` via `color-mix` (calm, moderate, storm states).

### Changed

- **Alert/confirm modals:** Message text and icons use theme tokens; HTML/icon message classes reset on open.
- **Guided onboarding:** Auth sign-in/setup card polish, finish flow `finally` closes wizard; privacy gate whitelists recovery and CSS reload overlays.
- **Dev reload:** PWA skips in-page reload stream when external Chromium watcher sets `__rianellExternalReloadWatcher`.
- **npm version:** Workspace roots bumped to **2.0.8**.

### Fixed

- **Light mode:** Replaced hardcoded `rgba(224, 242, 241, …)` and `#e0f2f1` with theme tokens across shell, logs, mood, home, and modal surfaces.
- **System theme on intro:** Guided onboarding and policy modals no longer flash dark chrome on light/system appearance.
- **Empty states / cards:** Dark card backgrounds corrected for light mode (logs, mood, home welcome, AI ghost card, custom date range).

---

## [2.0.7] - 2026-06-28

Guided onboarding questionnaire: one friendly multichoice modal (PWA + RN) driven by a shared question script.

### Added

- **Guided onboarding questionnaire (shared + PWA + RN):** `guidedQuestionnaire.mjs` — child-readable multichoice cards for coach tone, helper level, consents, reminders, and finish; custom mascot SVG + animations.
- **`onboarding.questionnaire.*` i18n namespace** with Tier-A locale overrides (`v207-onboarding-tier-a-overrides.mjs`).
- **PWA:** `#guidedOnboardingOverlay` + `guided-onboarding.js` replaces day-to-day first-run wizard chrome.
- **RN:** Rebuilt `FirstRunWizard.tsx` + `onboardingIllustrations.tsx` rendering shared cards with `Animated` transitions.

### Changed

- **First-run flow:** Preference and consent questions presented as guided choices instead of settings-style toggles; tutorial is opt-in from finish card or Settings replay.
- **Onboarding progress:** `createGuidedOnboardingProgressSession` counts questionnaire cards (not tutorial slides).
- **npm version:** Workspace roots bumped to **2.0.7** (aligned with this release).
- **`first-run-wizard.js`:** Replaced with a thin deprecation shim; PWA loads `guided-onboarding.js` only.

### Fixed

- **PWA privacy gate:** `isOnboardingInteractionTarget` whitelists `#guidedOnboardingOverlay`, guided choice buttons, and uses `composedPath()` so consent lock does not block card taps.
- **PWA card navigation:** `resolveNextGuidedCardIndex` skips removed questionnaire cards after region or consent answers (shared + PWA + RN).
- **PWA completion hook:** `onFirstRunWizardComplete` restores shell visibility, syncs locale/consent, and preloads AI when consented.
- **Boot audit probes:** Guest-flow and shell-visible scripts advance `#guidedOnboardingOverlay` instead of legacy first-run wizard DOM.

---

## [2.0.6] - 2026-06-28

Unified wellness sliders, onboarding polish, metric animation upgrades, and goals discovery prompt.

### Added

- **Unified wellness sliders (shared + PWA):** `sliderWellness.mjs` maps every log metric so 0 = bad (left) and 10 = good (right); symptom fields flip on save/load.
- **Vitals drum scroll (PWA):** Shared `drum-picker-scroll.js` with snap-to-integer for BP/BPM and advanced vitals drums.
- **Metric animations (PWA):** Irritability ocean (calm → stormy); weather-sensitivity cloud lightning when score nears bad.
- **Goals header prompt (PWA):** Target button glows and pulses when no goals are saved; `common.goals.setPrompt` i18n key.
- **First-session home nag (shared):** `shouldSuppressFirstRunLoggingPrompt` hides “not logged today” until first entry and wizard complete.
- **Unified onboarding counter (shared + PWA + RN):** Single step 1–14 flow across wizard screens and tutorial slides.

### Changed

- **Daily activities label:** Renamed to **Ability to do Daily activities** across i18n, CSV export/import, AI copy, and RN home summary.
- **Onboarding tutorial (PWA + RN):** Side arrows + Finish on last slide only; redundant Next removed.
- **Mood widget (PWA):** Face animation corrected — good scores smile, bad scores frown.

### Fixed

- **Mood face inversion (PWA):** Swapped mouth lerp endpoints in `updateMoodFace()`.

---

## [2.0.5] - 2026-06-27

Log wizard vitals layout, richer metric animations, achievement toast fix, and ASCII dash normalization across UI copy.

### Added

- **BP + BPM dual drum (PWA):** Basic Metrics blood pressure widget uses systolic mmHg + resting BPM drums (replaces systolic/diastolic split); hidden `#bpm` lives in the widget.
- **BP i18n (PWA):** `wizard.vitals.bp.slideHint`, zone labels, and `common.bpm` in all locale packs.
- **Metric animations (PWA):** Blood glucose droplet liquid fill; mobility footprint trail + walker; joint swelling fluid/heat SVG; mood slider animated face (sad to happy).

### Changed

- **Basic vitals layout (PWA):** Removed duplicate top-level Weight and Resting BPM fields; body weight stays in Advanced vitals only.
- **Vital suggestions (shared):** Blood pressure hints include optional BPM; weight/BPM standalone suggestion rows removed.
- **Typography (PWA + RN + i18n):** User-visible em/en dashes normalized to ASCII hyphen in locale packs, widgets, and static pages.

### Fixed

- **Achievement unlock toast (PWA):** Action button no longer stretched by global `button { width: 100% }` rule; toast copy layout restored.

---

## [2.0.4] - 2026-06-27

Log wizard animated metrics, lifestyle widget polish, cycle timeline fix, and main-thread responsiveness during on-device AI.

### Added

- **Animated log metric widgets (PWA):** Ten symptom/energy/stress/lifestyle sliders upgraded to unique SVG widgets with zone badges and ± steppers (`modules/log-metric-widgets.js`) — stiffness gear, joint-pain pulses, mobility footsteps, swelling blob, fatigue battery, sleep moon/stars, mood sun/cloud, irritability steam gauge, weather rain, daily-function ring.
- **Main-thread governor (PWA):** Defers LLM preload and inference while the log wizard is active or the user is interacting (`modules/main-thread-governor.js`); boot AI/charts work is serialized with background priority.
- **God mode — achievements testing:** Preview unlock toasts, simulate unlock notifications, and reset achievement notification state from the test overlay.

### Changed

- **Steps widget (PWA):** Footprints step down a path with stamp animation when value increases; runner icon removed for clarity.
- **Hydration widget (PWA):** Large glass uses liquid fill with wave surface, bubbles, and pour animation synced to mini-glass row.

### Fixed

- **Cycle timeline (PWA):** Menstrual flow picker no longer shows corrupted text (“glasses” fragments) — flow buttons use `data-i18n-aria` only so i18n does not wipe droplet icons.

---

## [2.0.3] — 2026-06-27

Mobile first-launch boot reliability for the PWA.

### Fixed

- **Mobile first launch (PWA):** Installed mobile PWAs could look frozen until reload — the shell now reveals before AI model preload so onboarding and consent modals stay tappable.
- **Privacy interaction gate:** AI download, boot recovery, and alert overlays are whitelisted so the capture-phase consent blocker no longer swallows taps during boot.
- **First-run wizard:** `modal-active` clears correctly when the wizard uses `display: flex` (not only `display: block`).
- **Boot watchdog:** 12s mobile fallback force-reveals the shell and starts init if the boot chain stalls.

---

## [2.0.2] — 2026-06-27

PWA mobile UX polish: animated vitals inputs, weather icons, log wizard nav, mood tile, barcode desktop, and settings icon parity.

### Added

- **Animated vitals widgets (PWA log wizard):** BP dial (`bp-input-widget.js`); glucose, SpO₂, HRV, and body-weight sliders (`advanced-vitals-widgets.js`); steps footprint trail and hydration glass fill (`lifestyle-vitals-widgets.js`); “use last value” chips sync with widget state.
- **Barcode food logging (desktop PWA):** Webcam scan via `BarcodeDetector` with ZXing fallback; round scan button and clearer barcode SVG icon.
- **Mood readings summary card (PWA):** Redesigned “readings logged” tile with count, progress ring, goal line, and stat chips.

### Changed

- **Weather SVG icons (PWA):** All 18 home-weather symbols redrawn for crisp stroke rendering; tighter drop-shadow and `shape-rendering` on `.home-weather-icon`.
- **Log wizard mobile nav (PWA):** Side prev/next arrows (settings-carousel style); compact Skip in dots row; bottom Back/Skip/Next bar desktop-only; reduced bottom padding so review step is not clipped.
- **View logs filters (PWA mobile):** Date range, Filter, and sort stack cleanly on narrow viewports.
- **Import wizard button (PWA):** Accent token colours and spacing between hint and “Open import wizard”.
- **Settings carousel icons (PWA + RN):** Unique icon per pane (`SETTINGS_PANE_ICON_BY_KEY`); connectors use link icon; data management uses cloud-upload.
- **First-run install step (PWA):** Dedicated inline “Skip for now” button on the install pane.

### Fixed

- **Weather icons:** Partly cloudy and metric icons no longer look blurry on high-DPI mobile (e.g. iPhone 14 Pro Max).
- **Barcode toast copy:** Camera-required message when scanning is unavailable in the browser.

---

## [2.0.1] — 2026-06-27

Post–2.0.0 polish: logging, security lock, accessibility, and UX fixes across PWA + RN.

### Added

- **Barcode food logging (PWA):** Settings toggle with camera consent; scan icon beside food-modal search; Open Food Facts lookup populates food tile fields; consent dashboard row + wiki privacy section.
- **Mood timeline (PWA + RN):** Horizontal daily-average ribbon replaces vertical recent-readings list.
- **Cycle ribbon (PWA):** Merged menstrual day pills with integrated flow levels; removed duplicate Flow section.
- **App lock PIN encryption:** `encryptExportWithPassphrase` accepts `minPassphraseLength: 4` for 4–8 digit PINs (export passphrases still require 12+).

### Changed

- **Removed guided voice log extraction:** Settings toggle, prefs, shared `voiceLogExtract` module, and RN structured voice parsing removed; voice notes remain plain text.
- **Passkey sign-in button:** Black background with white label and icon.
- **BBT widget (PWA):** Integrated card layout with gradient thermometer slider.
- **Developer panel:** Tab buttons no longer hidden by global `button { width: 100% }` rule.
- **Mood recent readings (PWA + RN):** Interactive reading ribbon with mood rings and horizontal scroll (replaces plain text list).
- **Settings nav spacing (PWA):** Tighter gap between carousel icons and search field.

### Fixed

- **Brain fog mode toggle:** Calls `loadSettingsState()` so the switch UI updates and persists.
- **App lock i18n:** Expose `window.tUi`; app-lock module uses `RianellI18n.t` with English fallbacks; PIN setup hint no longer shows raw keys.
- **App lock PIN save:** 4-digit PINs no longer rejected with “Passphrase must be at least 12 characters”; lock overlay prompts on return when PIN is saved.
- **Dev panel tabs:** All Developer & API tabs visible (Keys, Webhooks, etc.).
- **AI model download modal (PWA mobile):** Progress updates no longer hide/reopen the modal each tick; per-file download events no longer flash the overlay.
- **Developer & API panel scaling (PWA):** Scoped CSS resets so global mobile `button`/`label`/`input` rules no longer stretch tabs, scope chips, and form controls.
- **Today's check-in slider (PWA + RN):** Morning/midday/evening icons no longer clip when selected; fixed icon slot and overflow on period stops.

---

## [2.0.0] — 2026-06-27

**Rianell 2.0** — production release. Open-beta branding removed; PWA uses production icons and copy.

### Added

- **Unified cycle timeline (PWA + RN):** 45-day phase-grouped scale with SVG icons; day ↔ phase inference.
- **Vitals last-value hints (PWA + RN):** “Use last value” chips on log wizard vitals when a recent log exists (`@rianell/shared` `vitalSuggestions`).
- **Log wizard mobile navigation (PWA + RN):** Side next arrow + swipe; desktop keeps Back | Skip | Next bar.
- **BBT sliding thermometer (PWA):** Animated SVG thermometer replaces number input.
- **Third-party connectors (Plan 19):** Strava, Withings, Google Sheets OAuth via Supabase Edge Functions.

### Changed

- **Goals modal:** Viewport height follows active tab (no wasted space on Goals vs Achievements).
- **Desktop benchmark boot:** Full CPU suite runs on desktop when cache is missing or heuristic-only; mobile keeps fast heuristic tier.
- **Developer & API modal:** Centered layout and UI polish.
- **Privacy policies button:** Fixed `showAlertModal` export so in-app policy viewer opens.
- **Version:** Monorepo root, PWA, and RN app packages bumped to **2.0.0**.
- **Branding:** Removed floating Beta chip, install Beta badges, and beta icon set from production PWA; meta/OG copy updated.

### Fixed

- Cycle tracking UI consolidated to single timeline (replaces separate day pills + phase grid).
- Benchmark God-mode view message clarified for heuristic vs full-suite results.

---

## [1.135.0] — 2026-06-27

### Added

- **Third-party connectors CN4–CN7 (Plan 19)**:
  - Live OAuth for Strava, Withings, and Google Sheets via Supabase Edge Functions (`connector-auth`, `connector-callback`, `connector-disconnect`, sync functions).
  - Encrypted token storage in `connector_tokens` (service-role only); client-safe status in `user_integrations`.
  - PWA Connectors pane: Connect, Sync now, Disconnect, Google Sheets configure/export modal, `connector-success.html` popup flow.
  - Shared mappers in `@rianell/shared` (`strava`, `withings`, `googleSheets`, `oauthState`, `providers`).
  - RN `oauthConnect.ts` + `SettingsConnectorsPane` OAuth/sync parity with `rianell://` deep link.
  - Operator docs: `docs/connectors/SETUP.md` and provider guides.

## [1.134.0] — 2026-06-26

- **PWA AI Analysis tab overhaul (2026-06-26)**:
  - Five-chapter layout (Overview, Trends & vitals, Lifestyle, Mind & mood, Body & pain) with mobile pager slides.
  - **Wellbeing score** ring (0–100), coaching **insight card**, quick-stat pills with sparklines and delta arrows.
  - Skeleton loading UI replacing brain-pulse spinner; semantic `--ai-status-*` tokens and per-chapter tints.
  - Ten custom SVG icons (`brain-wave`, `heart-pulse`, `shield-check`, `gut`, `pill-check`, `sparkle-ring`, `stressor-bolt`, `leaf`, `gauge`, `calendar-heatmap`).
  - New visualizations: flare arc gauge, macro sparklines, exercise timeline bars, medication adherence heatmap, stressor chips, gratitude tags, Bristol/gut trend.
  - **AIEngine** extended analysis: HRV trends, medication adherence, digestive/Bristol, intraday subEntry patterns, macro time-series, gratitude word frequency, wellbeing score, mental-health screening from settings.
  - Coaching-style **summary note** (rule-based + LLM prompt update in `summary-llm.js`).

- **Hosted share links** (`packages/shared/src/export/shareReadOnlyLink.mjs`):
  - `generateShareCode()` — cryptographically random, ambiguous-char-free 16-char code.
  - `buildShareSnapshot()` — filters logs by date range, strips sensitive free-text fields when `includeNotes` is off, optionally embeds condition name.
  - `uploadShareLink()` — encrypts snapshot with 310 000 PBKDF2 iterations and inserts into Supabase `share_links` table.
  - `SHARE_LINK_KDF_ITERATIONS` constant (310 000 — stronger than default export KDF).

- **Password strength module** (`packages/shared/src/privacy/passwordStrength.mjs`):
  - `checkPasswordStrength(pw)` — returns `{ score: 0–4, label, feedback[] }` for use in App Lock and export UI.
  - `isWeakPin(pin)` — detects repeating digits, sequential runs, and non-digit PINs.
  - Exported from `packages/shared/src/privacy/index.mjs`.

- **Supabase migration** (`supabase/migrations/20260626180000_share_links.sql`):
  - `share_links` table with RLS, anon insert/select policies, and `increment_share_access` function.

- **PWA 404 share-link redirect** (`apps/pwa-webapp/404.html`):
  - Redirects `/share/<code>` paths to `/#share/<code>` for Cloudflare Pages SPA hosting.

- **PWA features** (`apps/pwa-webapp/`):
  - App lock now supports both **passphrase mode** (12+ chars) and **PIN mode** (4–8 digits).
  - Share link generator: date-range picker, notes/condition toggles, password field, copy-to-clipboard.
  - Share link viewer: password prompt, decryption, read-only log display with `expires_at` banner.
  - PWA install guide: per-browser/OS instructions (iOS Safari, macOS Safari, Chrome, Firefox, Edge) with SVG illustrations.
  - Log range slider replacing per-button range selector.
  - New SVG icon set: `checkin-am`, `checkin-midday`, `checkin-pm`.
  - `svgIconUnsafe()` helper for trusted internal icon contexts.
  - `detectPWAInstallPlatform()` detects user-agent for guided install.

- **i18n additions** (all 15 locales, root + pwa-webapp + rn-app):
  - `home.checkin.cta` — "Check in" call-to-action label.
  - `settings.share.*` — 20 new share link UI strings.
  - `settings.security.appLockModePass` / `settings.security.appLockModePin` — lock mode labels.
  - `settings.security.pinSetupHint` — PIN setup guidance.
  - `settings.privacy.appLock.pinLead` — PIN unlock prompt.

- **Artifact manifests**: Android `downloadUrl` and iOS `installUrl` fields added to `latest.json` CI generation and committed manifests (version 284).

### Changed

- **`ENCRYPTED_EXPORT_MIN_LENGTH`** raised from 8 → **12** characters (`encryptedExport.mjs`):
  - `encryptExportWithPassphrase` now enforces 12-char minimum.
  - `createQrHandoffPayload` in `qrHandoff.mjs` aligned to 12-char minimum via `ENCRYPTED_EXPORT_MIN_LENGTH`.
  - `deriveExportKey` accepts `iterations` parameter for per-call override.
  - All i18n placeholders updated to reflect "12 characters" minimum.

- **Cycle module label** renamed: `"Cycle tracking module"` → `"Period & cycle tracking"` (`en-US`, `en-GB`, `en-AU`).

- **App lock setup prompt** updated: `"passcode"` → `"passphrase"` in UI copy.

- **CI workflow** (`ci.yml`):
  - Android `latest.json` now includes `downloadUrl` pointing to GitHub Releases.
  - iOS `latest.json` now includes `installUrl` pointing to `rianell.com` artifact path.
  - `commit-app-build` strips versioned iOS zip/simulator archives (only keeps `Health-Tracker-ios-alpha-latest.zip` manifest).
  - `commit-app-build` validates presence of `Health-Tracker-ios-alpha-latest.zip` in artifact list.

- **Security headers doc** (`security/cloudflare-headers-recommended.md`): added share-link CORS and caching recommendations for `/share/` paths.

- **RN screens** (`HomeScreen.tsx`, `MoodScreen.tsx`): UI updates for check-in CTA, PIN/passphrase lock mode display, and share link integration.

### Fixed

- `encryptedExport.mjs` `decryptExportWithPassphrase` now reads `envelope.iterations` for round-trip compatibility when decrypting envelopes created with non-default iteration counts.

### Tests

- Added `tests/unit/security/password-strength.test.mjs` (16 tests): covers score range, common-pattern penalty, PIN weakness detection.
- Added `tests/unit/share-link.test.mjs` (19 tests): covers `generateShareCode`, `buildShareSnapshot`, `createReadOnlyShareEnvelope`, `shareEnvelopeToPortableJson`, and `ENCRYPTED_EXPORT_MIN_LENGTH` enforcement.
- Total unit test count: **526** (up from 491).

---

## [v1.133.1] — 2026-06-16

### Added

- Plans 15–26 full rollout: extended metrics, nutrition, REST API, connectors, FHIR self-host, security hardening, performance, community, docs automation, migration wizard, and accessibility UI.
- PWA Plan 18/19/23/25 features wired end-to-end.
- Security DAST workflow (ZAP, Gitleaks, OSV) with composite actions.
- RN Plan 19 connector type-checked.
- RN build version sequential counter.
- `@rianell/shared` exports: FHIR lite, LLM runtime profiles, research anonymisation.

### Changed

- CI Actions pinned to v5/v8 (Node 24 runtime).
- `setup-node-ci` patches Smartlook Kotlin for RN 0.83 and onnxruntime for Gradle 9.
- `publish-release` excludes Legacy artifacts.
- `commit-app-build` is manifest-only (Phase 14 policy).

### Fixed

- ZAP artifact name in `security-dast.yml`.
- CI permissions for security workflow.
- Lockfile sync after Phase 22 migration.

---

## [v1.97.0] — 2026-06-09

### Added

- Goals carousel with field hints in PWA.
- MoodScreen unit tests in RN.
- Accessibility improvements: ARIA labels on interactive elements.

---

## [v1.90.1] — 2026-06-16 (architecture milestone)

### Added

- Phases 0–23 migration complete; monorepo canonical layout verified.
- `artifacts/` replaces legacy `App build/` directory.
- Cloudflare 301 redirect documented for legacy artifact URLs.
- `@rianell/build-tools` workspace (Phase 10).
- CI guards for nested `package-lock.json` (Phase 13).
- `scripts/verify/doc-links.mjs` — broken link and forbidden path checker.
- `wiki/` GitHub Wiki source added to repo.

### Changed

- All script concerns nested under `scripts/<concern>/`.
- Python `server/` unchanged at repo root (not a JS workspace).
- `i18n-packs/` remains canonical locale source at root.

---

_Older entries are available in git history (`git log --oneline`)._
