<a id="nav-repo-tree"></a>

## 🗂️ Project Structure

**Canonical layout:** see **[architecture-standard.md](architecture-standard.md)** for the directory map, workspace graph, dependency rules, and migration log. The sections below are version-sync notes moved toward CHANGELOG over time.

### v2.1.6 documentation sync (design token contract, RN primitives, motion guardrails, Mood Control Deck)

- **Contract:** `docs/design-token-contract.md` — `@rianell/tokens` is runtime authority; root `DESIGN.md` is reference-only.
- **Mood tab (PWA):** Mood Control Deck in `modules/mood-tab.js` + scoped `.mood-control-deck` CSS; Home check-in card unchanged.
- **Log metrics (PWA):** Swelling balloon, irritability, mobility trampoline, weather widgets in `log-metric-widgets.js` + `styles.css`.
- **Cycle tracking (PWA):** 45-day timeline in `cycle-tracking-ui.js`; beacon cleanup in `graphics-portfolio.js`.
- **Goals carousel (PWA):** Animated dot SVG icons in `goals-carousel.js`.
- **Device benchmark (PWA):** Async sliced suite + timeouts in `device-benchmark.js` (v8).
- **Tokens:** `SPACING_TOKENS`, `SURFACE_TOKENS` in `packages/tokens/src/index.mjs`; synced via `scripts/build/sync-tokens-to-pwa.mjs`.
- **RN:** `apps/rn-app/src/components/ScreenCard.tsx`, `ScreenContainer.tsx`, `RangeChip.tsx`, `themeHelpers.ts`; tab screens use `resolveScreenBackground()`.
- **PWA motion:** `setProgressScale()` in `app.js`; progress fills in `styles.css` use `transform: scaleX(var(--progress))`; tab indicator uses `translateX` + `scaleX`.
- **Verify:** `scripts/verify/verify-design-tokens.mjs` + `npm run verify:design-tokens` (CI unit-tests job).
- **Tests:** `mood-tab-ui`, `log-metric-widgets`, `pwa-goals-carousel`, `perf-benchmark-modal`, `ai-engine-parity`, `tokens`, `verify-design-tokens`.
- **See:** [CHANGELOG.md](CHANGELOG.md) `[2.1.6]`; wiki [[Release-Notes]] § v2.1.6.

### v2.1.5 documentation sync (log metrics, onboarding, companion polish)

- **PWA log metrics:** Swelling balloon morph, mobility trampoline phases, body-map stroke silhouette in `log-metric-widgets.js` + `styles.css`.
- **PWA onboarding:** Companion picker order in `guided-onboarding.js`; profile companion carousel/accessories in settings.
- **PWA AI tab:** Vein ambient layers in `css/oasis.css`; cycle/digestive/barcode defaults in shared settings.
- **PWA achievements:** 3D book SVG in `achievement-icons` rendering path.
- **Tests:** `achievement-icons`, `animation-polish`, `log-metric-widgets`.
- **See:** [CHANGELOG.md](CHANGELOG.md) `[2.1.5]`; wiki [[Release-Notes]] § v2.1.5.

### v2.1.4 documentation sync (companion names, lock SVG, metric motion, nav polish)

- **PWA companions:** Lazy `shared()` in `graphics-portfolio.js`; script order after `rianell-shared.js` in `index.html`.
- **PWA app lock:** Stroke padlock symbols (`icon-lock`, `icon-lock-open`); `docs/icons/lock.svg`; `graphics-portfolio.css` illustration rules.
- **PWA log metrics:** Mobility trampoline jumper + swelling knee pulse in `log-metric-widgets.js` + `styles.css`.
- **PWA AI trends:** `renderAITrendStatValue()` num/unit split in `app.js`; grid layout in `styles.css`.
- **PWA AI tab:** Neural trace timing/direction in `css/oasis.css` (`--oasis-neural-dur: 9s`).
- **PWA navbar:** Redesigned `rianell-nav-*` symbols and `navIcon*` keyframes in `index.html` + `styles.css`.
- **Tests:** `graphics-portfolio`, `animation-polish`, `log-metric-widgets`, `ai-trend-cards`.
- **See:** [CHANGELOG.md](CHANGELOG.md) `[2.1.4]`.

### v2.1.3 documentation sync (log wizard clarity, pickers, goals art)

- **Shared:** `classifySeverityRaw` in `packages/shared/src/metrics/sliderWellness.mjs`.
- **PWA log wizard:** Severity scale labels, review metric bars, urgent vitals in `app.js`, `log-metric-widgets.js`, `advanced-vitals-widgets.js`.
- **PWA pickers:** Symptom tile animations, tile-picker i18n fallbacks in `i18n-pwa.js`.
- **PWA goals:** Inline animated target/medal SVG in `goals-carousel.js`.
- **PWA AI tab:** Full-panel neural trace in `oasis-canvas.js` + `css/oasis.css`.
- **PWA settings:** Carousel pane fix in `settings.js` + `styles.css` container queries.
- **Tests:** `log-review-ux`, `symptom-picker`, `vitals-light-mode-contrast`, `avatar-random-picker`.
- **See:** [CHANGELOG.md](CHANGELOG.md) `[2.1.3]`.

### v2.1.2 documentation sync (dashboard UX, companions, achievements)

- **PWA AI:** Overview/watch/lifestyle/trend panel refresh in `app.js` + `styles.css`; unit tests under `tests/unit/pwa/ai-*.test.mjs`.
- **PWA mood:** `modules/mood-tab.js` compact layout; `mood-tab-ui.test.mjs`.
- **PWA achievements:** `renderAchievementIconHTML` animated SVG badges; `achievement-icons.test.mjs`.
- **PWA companions:** Scrollable `avatar-carousel-shell` with 20 character silhouettes; `avatar-carousel.test.mjs`.
- **Removed:** Ambient vibe UI and onboarding step; `removeLegacyVibeUi` on portfolio init.
- **See:** [CHANGELOG.md](CHANGELOG.md) `[2.1.2]`; wiki [[Features-Guide]] § Profile companion.

### v2.1.1 documentation sync (SVG graphics & animation portfolio)

- **Tokens:** `VIBE_TOKENS`, `AVATAR_THEME_TOKENS`, `getVibeIds`, `normalizeUserVibe` in `packages/tokens/src/index.mjs`; synced via `scripts/build/sync-tokens-to-pwa.mjs` → `apps/pwa-webapp/css/tokens.css`.
- **Shared:** `packages/shared/src/settings/avatars.mjs` — 20 `PROFILE_AVATAR_IDS`, legacy map; onboarding `avatarPick` card in `guidedQuestionnaire.mjs` (vibe step removed v2.1.2).
- **PWA (new):** `modules/graphics-portfolio.js`, `css/graphics-portfolio.css` (`window.RianellGraphicsPortfolio`); wired from `index.html`, `app.js`, `guided-onboarding.js`, settings/log/cycle/mood modules.
- **Sprites:** injected at runtime (avatars, metric entities, badge frames, cycle phases) — tier-0 devices skip metric companions.
- **Body map:** Set D abstract mannequin in `index.html`; aura + tap ripple via portfolio module.
- **Tests:** `tests/unit/pwa/graphics-portfolio.test.mjs`, `tests/unit/settings/avatars.test.mjs`.
- **See:** [CHANGELOG.md](CHANGELOG.md) `[2.1.1]`; wiki [[Features-Guide]] § Profile companion.

### v2.1.0-oasis documentation sync (UI Oasis Overhaul)

- **Tokens:** `OASIS_TOKENS` in `packages/tokens/src/index.mjs` — per-team ambient palettes, motion timings, status glow strings.
- **PWA (new files):** `apps/pwa-webapp/css/oasis.css`, `modules/oasis-canvas.js` (`window.OasisCanvas`); wired from `index.html` + surgical `app.js` hooks. **`styles.css` unchanged** for oasis (file-protection rule).
- **PWA effects:** Ambient blobs, magnetic CTAs, calm-glow metrics, AI neural trace, thinking-text morph, data-stream dots, confetti, check-in shimmer.
- **RN:** `OasisNeuralTrace.tsx`, `BalanceRadarChart` breath ring, `HomeWelcomeCard` pulse, `BootLoadingScreen` rings, `AchievementUnlockToast` burst; `useReduceMotionFlag` OR-gates OS + in-app pref.
- **Tests:** `animation-polish.test.mjs` (8 assertions), `oasis-particles.test.mjs`, `benchmarks/specs/oasis-particles.spec.ts`.
- **See:** [CHANGELOG.md](CHANGELOG.md) `[2.1.0-oasis]`; [UI_OASIS_PLAN.md](../UI_OASIS_PLAN.md).

### v2.1.0 documentation sync (Session stability and memory leak fixes)

- **Root cause confirmed:** 421 MB AI heap spike (triple ONNX WebGPU + MLC + WASM runtime load), 200+ `connect-src 'none'` CSPRO violations/load, unbounded `__rianellBootLog` growth, un-teardown `MutationObserver` instances on Tier 5 desktop.
- **L1 (`performance-utils.js`):** `_voiceInputObserver` disconnected + nulled in `beforeunload`.
- **L2/L2b (`app.js`, `privacy-region.js`):** `__rianellBootLog` ring-buffer capped at 100 entries.
- **L4 (`privacy-region.js`):** Consent `MutationObserver` + `setInterval` stored as module refs; torn down in `unlockAppChrome()`.
- **L5 (`app.js`):** Chart `maxPoints` session-elapsed decay: 60% at 30 min, 40% at 60 min.
- **L6 (`app.js`):** SW dismiss counter auto-forces `SKIP_WAITING` after 3 "Later" clicks.
- **L7 (CI):** `scripts/verify/verify-no-cspro-none.mjs` added to `verify:csp` chain. Cloudflare CSPRO operator fix required — see `security/cloudflare-headers-recommended.md`.
- **L8 (`summary-llm.js`):** Pre-flight heap guard (>200 MB) bypasses GPU/MLC; `cachedPipeline` nulled in catch before WASM fallback.
- **New scripts:** `stress:memory` (Playwright), `verify:cspro`.
- **Tests:** `tests/unit/pwa/session-stability.test.mjs` (12 assertions, all green).
- **See:** [CHANGELOG.md](CHANGELOG.md) v2.1.0.

### v2.0.9 documentation sync (Animation polish and slider range)

- **RN motion:** `PrimaryButton`, `Skeleton`, `Toast`, `EmptyState`, `HomeWelcomeCard`, `SettingsChapter`; screen stagger/slide on AI, Charts, Mood, Log Wizard.
- **PWA motion:** Tab transitions, AI stagger (`ai-animate-in` nth-child), shimmer timing, boot skeleton delays, bottom-nav icon lift in `styles.css`.
- **Sliders (shared):** `sliderWellness.mjs` — range **1–10**; `wellnessSliderFillPercent` uses `(v - 1) / 9`.
- **Boot (PWA):** Benchmark modal not auto-shown on first run; god-mode benchmark on all viewports.
- **See:** [CHANGELOG.md](CHANGELOG.md) v2.0.9; [styling.md](styling.md) § v2.0.9 motion polish.

### v2.0.7 documentation sync (Guided onboarding questionnaire)

- **Onboarding (shared):** `packages/shared/src/onboarding/guidedQuestionnaire.mjs` — `buildGuidedQuestionnaire`, `applyQuestionnaireAnswer`, `createGuidedOnboardingProgressSession`.
- **PWA:** `guided-onboarding.js`, `#guidedOnboardingOverlay`; privacy gate whitelists guided overlay.
- **RN:** `FirstRunWizard.tsx` renders shared card script; `onboardingIllustrations.tsx` for mascot SVG + idle animation.
- **Consents:** Unbundled multichoice cards with “See details” → policy viewer; timestamps + audit unchanged.
- **See:** [CHANGELOG.md](CHANGELOG.md) v2.0.7.

### v2.0.6 documentation sync (Wellness sliders, onboarding, and goals prompt)

- **Sliders (shared + PWA):** `packages/shared/src/metrics/sliderWellness.mjs` — unified 0 bad / 10 good UX; symptom metrics invert on persist.
- **Vitals drums (PWA):** `modules/drum-picker-scroll.js` — scroll + snap for BP/BPM and advanced vitals pickers.
- **Metric widgets (PWA):** Irritability animated ocean; weather-sensitivity lightning; mood face direction fix (`log-metric-widgets.js`).
- **Goals prompt (PWA):** `.targets-button-top--prompt` glow when `hasActiveGoals()` is false; respects AI feature gate and reduced motion.
- **Onboarding (shared + PWA + RN):** Unified steps 1–14; tutorial arrow nav; first-session logging nag suppressed via `firstSessionPrompt.mjs`.
- **i18n:** “Ability to do Daily activities” rename; `common.goals.setPrompt`.
- **See:** [CHANGELOG.md](CHANGELOG.md) v2.0.6.

### v2.0.5 documentation sync (Vitals layout and metric animation polish)

- **Basic vitals (PWA):** `bp-input-widget.js` v2 - systolic mmHg + BPM drums; hidden `#bpm` in widget; top-level weight/BPM inputs removed; body weight in Advanced vitals only.
- **Animations (PWA):** Glucose liquid droplet (`advanced-vitals-widgets.js`); mobility/swelling/mood SVG upgrades (`log-metric-widgets.js` v3).
- **Achievement toast (PWA):** `.achievement-toast__action` resets global button width in `styles.css`.
- **i18n:** BP zone/slideHint keys; ASCII hyphen normalization in all locale packs.
- **Shared:** `vitalSuggestions.mjs` - blood pressure suggests systolic + optional BPM.
- **See:** [CHANGELOG.md](CHANGELOG.md) v2.0.5.

### v2.0.4 documentation sync (Log wizard metrics and responsiveness)

- **Log metrics (PWA):** `modules/log-metric-widgets.js` — animated SVG widgets for ten log-wizard sliders; keeps native `input[type=range]` IDs for save/review.
- **Governor (PWA):** `modules/main-thread-governor.js` — defers LLM queue and AI preload while `body.log-wizard-active` or user interaction; boot charts then AI serialized via `runBackgroundTask`.
- **Lifestyle (PWA):** `lifestyle-vitals-widgets.js` v2 — descending footprint trail; hydration liquid fill + wave surface in large glass.
- **Cycle (PWA):** Flow opts use `data-i18n-aria`; `refreshFlowOpts()` restores droplets after i18n pass.
- **God mode (PWA):** Achievement unlock testing section in `#modalTestOverlay`.
- **See:** [CHANGELOG.md](CHANGELOG.md) v2.0.4.

### v2.0.3 documentation sync (Mobile first-launch boot fix)

- **Boot (PWA):** Shell reveals before AI preload on installed mobile PWAs; `__rianellForceRevealBootShell` watchdog at 12s on mobile.
- **Privacy gate (PWA):** `isOnboardingInteractionTarget` whitelists `#aiModelDownloadOverlay`, `#aiModelDownloadProgressOverlay`, `#alertModalOverlay`, `#appLockOverlay`, `#rianellBootRecoveryOverlay`, `#loadingOverlay`.
- **Modals (PWA):** `isAnyModalOverlayOpen()` in `ui-feedback.js`; first-run wizard uses it on close; `body.modal-active` pointer-events extended to first-run, perf benchmark, and AI download overlays.
- **See:** [CHANGELOG.md](CHANGELOG.md) v2.0.3.

### v2.0.2 documentation sync (Vitals widgets and mobile UX)

- **Log wizard (PWA):** Animated widgets — BP dial (`modules/bp-input-widget.js`), advanced vitals sliders (`modules/advanced-vitals-widgets.js`), lifestyle steps/hydration (`modules/lifestyle-vitals-widgets.js`); mobile side prev/next nav; desktop-only bottom nav bar.
- **Weather (PWA):** Redrawn `#icon-weather-*` sprite set; `.home-weather-icon` uses lighter drop-shadow and `geometricPrecision`.
- **Mood tab (PWA):** `renderMoodReadingsSummaryCard()` — count, ring, goal, stat chips (`mood.readings.*` i18n).
- **Barcode (PWA):** Desktop webcam via `BarcodeDetector` / ZXing; `#icon-barcode-scan` SVG.
- **View logs (PWA):** `.filter-section` mobile stack for date/filter/sort.
- **Settings (PWA + RN):** `SETTINGS_PANE_ICON_BY_KEY` per-pane icons; import section accent button tokens.
- **See:** [CHANGELOG.md](CHANGELOG.md) v2.0.2.

### v2.0.1 documentation sync (Post–2.0.0 polish)

- **Barcode food logging (PWA):** Settings toggle + consent dashboard row; scan icon in food modal; Open Food Facts lookup; wiki privacy section for camera + lookup.
- **App lock:** PIN encryption via `minPassphraseLength: 4`; i18n fallbacks in `app-lock.js`; `window.tUi` exposed for deferred modules.
- **Removed:** Guided voice log extraction (`voiceLogExtract.mjs`, `guidedVoiceLogEnabled` pref).
- **UX:** Mood reading ribbon (PWA + RN); cycle ribbon with integrated flow (PWA); BBT thermometer widget; brain fog toggle fix; passkey button styling; Developer & API panel scaling; check-in slider icons; AI download modal stability; settings nav spacing.
- **See:** [CHANGELOG.md](CHANGELOG.md) v2.0.1; [wiki/Privacy-and-Your-Data.md](../wiki/Privacy-and-Your-Data.md) § Barcode food logging.

### v2.0.0 documentation sync (Rianell 2.0 production)

- **Version:** Root `@rianell` workspace **2.0.0**; PWA and RN app packages aligned.
- **Branding:** Production PWA icons (`Icons/`), no open-beta chip or install Beta badges.
- **Log wizard:** Cycle timeline, vitals last-value hints, mobile nav parity (PWA + RN).
- **Benchmark:** Desktop full suite on cold boot when cache lacks per-test data.
- **Connectors:** Strava, Withings, Google Sheets (Plan 19); operator guide `docs/connectors/SETUP.md`.
- **See:** [CHANGELOG.md](CHANGELOG.md) v2.0.0; [EXTERNAL-SETUP.md](plans/EXTERNAL-SETUP.md) § Plan 19; wiki [[Release-Notes]] / [[Features-Guide]].

### v1.135.0 documentation sync (Third-party connectors CN4–CN7)

- **Connectors:** Strava, Withings, Google Sheets OAuth via Supabase Edge Functions (`connector-auth`, `connector-callback`, `connector-disconnect`, provider sync functions).
- **Token storage:** Encrypted `connector_tokens` (service-role only); client-safe status in `user_integrations` (`last_sync_at`, `sync_status`, sheet config).
- **PWA:** Settings → Integrations — Connect, Sync now, Disconnect, Google Sheets configure/export modal, `connector-success.html` OAuth popup bridge.
- **RN:** `oauthConnect.ts` + `SettingsConnectorsPane` with `rianell://connector/callback` deep link.
- **Shared:** `@rianell/shared` mappers (`strava`, `withings`, `googleSheets`, `oauthState`, `providers`).
- **Operator setup:** [docs/connectors/SETUP.md](connectors/SETUP.md); policy rows in [FREE-TIER-POLICY.md](plans/FREE-TIER-POLICY.md).
- **See:** [CHANGELOG.md](CHANGELOG.md) v1.135.0; [EXTERNAL-SETUP.md](plans/EXTERNAL-SETUP.md) § Plan 19; wiki [[Release-Notes]] / [[Features-Guide]].

### v1.97.0 documentation sync (Achievements + Engagement & UX)

- **Achievements:** 11-id catalog with tier accents, per-card progress bars, completion counter, in-app unlock toast queue, unseen badge on Goals header (`markAchievementSeen` on achievements pane).
- **Empty states:** Warm copy + animated placeholders on Logs, Charts, AI, Mood, Weekly Review (RN components + PWA HTML/CSS); ghost chart bars and AI insight cards when data is sparse.
- **Home:** Welcome card, discovery chips, FAB pulse, goals progress bars, streak grace day, personal-best card, tab discovery badges (Charts/AI).
- **Settings:** Collapsible chapters, setup progress strip, inline info expanders on complex toggles.
- **Goals modal:** First-visit orientation card; per-field target hints (`goals.field.*`); achievement progress bars with WCAG `progressbar` role.
- **Gamification:** Behavior-gated log milestones, daily goal celebration, wizard unlock banners — no points/leaderboards.
- **Prefs:** `homeWelcomeCardDismissed`, `goalsModalSeenCount`, `firstOpenDate`, `weeklyReviewCompletedAt`, `personalBestDismissedAt` via `normalizeHomeDashboardPrefs`.
- **See:** [CHANGELOG.md](CHANGELOG.md) v1.97.0; [data-model.md](data-model.md) § Home dashboard engagement; [platform-parity.md](platform-parity.md) v1.97.0 note; [ux-audit.md](ux-audit.md).

### v1.96.2 documentation sync (First-run wizard interaction fix)

- **PWA onboarding:** Consent lock (`privacy-region.js`) merges `appSettings` with `localStorage` for enforcement; clicks inside the active first-run wizard and tutorial modal are no longer blocked as `interaction-blocked` while `region-unconfigured`.
- **Wizard:** `guided-onboarding.js` (replaces legacy `first-run-wizard.js` shim); tutorial **Enable AI & Goals?** buttons use bound listeners.
- **See:** [CHANGELOG.md](CHANGELOG.md) v1.96.2.

### v1.121.0 documentation sync (Cycle period-start anchor)

- **Cycle tracking:** **Period started today** on log wizard step 1 sets `cycle.periodStart` + day 1; `suggestCycleForDate` counts from `findLatestPeriodStart`. UI day pills **1–35** default; expand to **45** for irregular cycles; late hint above day 35.
- **Shared constants:** `CYCLE_DAY_NORMAL_MAX` (35), `CYCLE_DAY_SELECTOR_MAX` (35), `CYCLE_DAY_MAX` (45); helpers `computeCycleDayFromPeriodStart`, `isCycleDayLate`, `daysSincePeriodStart`.
- **Goals modal (PWA):** Carousel meta/i18n via `RianellI18n.t`; themed dot icons (`ui-svg-icon`).
- **See:** [CHANGELOG.md](CHANGELOG.md) v1.121.0; [data-model.md](data-model.md) § Cycle; [platform-parity.md](platform-parity.md) v1.121.0 note.

### v1.120.0 documentation sync (Theme tokens & unified onboarding)

- **Theme accents (PWA):** `--accent-primary`, `--accent-soft`, `--accent-border*`, `--accent-fill-*`, `--accent-glow-*` in `styles.css` `:root`; bulk migration off hardcoded Material green. Chart/AI JS uses `getThemePrimaryColor()` from **`document.body`**; `setGlobalTheme()` triggers `refreshCharts()` + AI re-render.
- **Semantic colours unchanged:** Food/exercise tile group hues and per-metric chart line colours remain data-visualization semantics; UI chrome (modals, nav accents, AI cards, mood scores) follows global theme.
- **Onboarding:** `buildUnifiedOnboardingSteps()` / `resolveUnifiedOnboardingProgress()` — single step counter for wizard + tutorial slides on PWA and RN.
- **See:** [CHANGELOG.md](CHANGELOG.md) v1.120.0; [styling.md](styling.md) § Theme accent tokens; [platform-parity.md](platform-parity.md) v1.120.0 note.

### v1.119.0 documentation sync (Cycle tracking UX & Home cards)

- **Cycle tracking:** Log wizard step 1 when `cycleModuleEnabled` — **Period started today**, day pills (1–35, expand to 45), phase tiles (SVG), flow levels; auto-suggest from last period start; first-run tutorial slide 8 to enable.
- **Cycle day range:** Selector defaults 1–35 (`CYCLE_DAY_SELECTOR_MAX`); storage cap 45 (`CYCLE_DAY_MAX`); late hint above 35 (`CYCLE_DAY_NORMAL_MAX`).
- **Logging modules:** Settings → Data options — **cycle module** and **barcode food logging** (camera + Open Food Facts lookup).
- **Home:** Recent patterns inset (icon + streak summary); Weekly review card gates on LLM ready — **Enable AI** triggers download consent when model not loaded.
- **Mood tab:** Sparkline in metrics grid scales to card width on narrow viewports.
- **See:** [CHANGELOG.md](CHANGELOG.md) v1.119.0; [platform-parity.md](platform-parity.md) v1.119.0 note; [data-model.md](data-model.md) § Cycle.

### v1.118.0 documentation sync (Onboarding UX & Smartlook default-on)

- **First-run wizard:** Shared step order — region → health consent (EEA/UK) → cookies → **session recording disclosure** → tutorial → AI download → install (PWA). Tracking profile deferred; defaults from `completeFirstRunWizard()`.
- **Smartlook:** Default-on **preference** with disclosure gate — recording starts only after onboarding step or explicit Settings enable. See [smartlook-session-recording.md](privacy/smartlook-session-recording.md).
- **Settings PWA:** Consent dashboard on Privacy & region pane; Goals modal carousel IIFE fix.
- **See:** [CHANGELOG.md](CHANGELOG.md) v1.118.0; [platform-parity.md](platform-parity.md) v1.118.0 note.

### v1.117.1 documentation sync (Supabase pool RPC hardening)

- **Schema §4:** `REVOKE EXECUTE ON FUNCTION … FROM anon` for `get_k_anon_pool_insights` and `count_pool_contribution_days`; `GRANT EXECUTE` remains **`authenticated`** only.
- **Security Advisor:** Lint **0028** (anon callable) should clear after re-apply; **0029** (authenticated + SECURITY DEFINER) is accepted for RE1.
- **See:** [CHANGELOG.md](CHANGELOG.md) v1.117.1; [SECURITY.md](SECURITY.md) § Pool insight RPCs; [supabase/APPLY.md](../supabase/APPLY.md).

### v1.117.0 documentation sync (Achievements & logging unlock)

- **Progressive unlock:** Food/exercise/medication wizard steps remain gated by `getUnlockedLogCategories`; achievements surface the same schedule plus milestone and engagement badges (11 total in `ALL_ACHIEVEMENTS`) with tier accents, per-card progress bars, completion counter, in-app unlock toast, and optional OS notifications.
- **Goals modal:** PWA `#goalsModal` and RN `GoalsModal` — carousel panes 0 (targets) and 1 (achievements); sleek crosshair/medal nav icons; Home **Goals & targets** opens pane 0 on both platforms.
- **Persistence:** Local `appSettings.achievements` (PWA) / `prefs.achievements` (RN); cloud row in **`user_achievements`** when signed in with backup enabled.
- **See:** [CHANGELOG.md](CHANGELOG.md) v1.117.0; [platform-parity.md](platform-parity.md) v1.117.0 note; [data-model.md](data-model.md) § Achievements.

### v1.116.0 documentation sync (Stepped PHQ-9/GAD-7 screening)

- **Mental health screeners:** PHQ-2/GAD-2 remain entry points on Mood tab (hidden in simple mode). Initial score ≥ 3 triggers stepped PHQ-9 or GAD-7 follow-up questions in the weekly-review modal (PWA) and Mood screening modal (RN).
- **Scoring:** Shared `@rianell/shared` `mentalHealthScreening.mjs` — `shouldOfferPhq9FollowUp` / `shouldOfferGad7FollowUp`, merge helpers, severity interpreters, `isPhq9SuicideItemPositive`.
- **Privacy:** Screening responses are not written to logs, IndexedDB, AsyncStorage, or Supabase.
- **See:** [CHANGELOG.md](CHANGELOG.md) v1.116.0; [platform-parity.md](platform-parity.md) v1.116.0 note.

### v1.115.0 documentation sync (PWA boot shell + Smartlook)

- **PWA boot:** `#appShell` must be a direct `<body>` child — not inside `#settingsOverlay`. Missing closing tag caused a black/blank viewport (`shellW/H: 0`). Fixed in `index.html`; `ensureAppShellDomPlacement()` reparents on boot for stale cached HTML; `logBootState()` logs `shellParentId`, `shellMisplaced`, layout blockers.
- **Shell probes:** `npm run audit:probe-shell`, `audit:probe-shell:screenshot`, `audit:probe-shell:layout` (layout + DOM parent check); `scripts/audit/check-dom-nesting.mjs` for HTML div balance.
- **Smartlook:** Optional EU session recording (PWA + RN) — off by default; Settings → Privacy → Session recording; see [smartlook-session-recording.md](privacy/smartlook-session-recording.md).
- **See:** [CHANGELOG.md](CHANGELOG.md) v1.115.0; [testing-and-configuration.md](testing-and-configuration.md) § PWA shell boot probes.

### v1.114.0 documentation sync (Security lock tab and UX trim)

- **Settings carousel:** Ten panes — **Security lock** is tab 10 (passcode + caregiver/proxy); Privacy tab 1 no longer includes app lock or caregiver toggles.
- **Home:** Single hero status card merges streak nudge when applicable; pacing/energy-budget card removed.
- **Charts:** Insights side panel removed; core chart series and presentation mode unchanged.
- **Screening:** PHQ-2/GAD-2 sliders in weekly-review modal (PWA) and Mood tab (RN).
- **Logging modules** (Settings → Data options): `cycleModuleEnabled` shows cycle fields on **log wizard step 1** (SVG icons, phase suggest from last log). **Barcode food** uses camera + Open Food Facts lookup.
- **See:** [CHANGELOG.md](CHANGELOG.md) v1.114.0; [platform-parity.md](platform-parity.md) v1.114.0 note.

### v1.113.0 documentation sync (Mood tab and Home UX)

- **Navigation:** Primary tabs are **Home → Logs → Charts → Mood → AI** (PWA bottom bar + top strip; RN bottom tabs). Settings remains a header action, not a main tab.
- **Mood tab:** Metrics from submitted log mood/irritability answers, recent-feeling list, AM/midday/PM check-in, PHQ/GAD shortcuts, Charts mood link; shared `packages/shared/src/mood/moodMetrics.mjs`.
- **Home:** Weather strip inline under greeting/date (H5); micro-check-in and appointment countdown cards removed from Home stack.
- **i18n:** Cross-cutting Settings + screening modals hydrate after catalogs load; em-dash copy cleanup across locale/prompt packs.
- **CSP:** Open-Meteo hosts in `connect-src`; see [SECURITY.md](SECURITY.md).
- **See:** [app-and-features.md](app-and-features.md) § App shell; [CHANGELOG.md](CHANGELOG.md) v1.113.0.

### Execution plans (01–14)

Feature rollout runbooks, MASTER tracker, external setup, and rollout gates live under **[plans/](plans/)** (formerly gitignored `Projects/`). Start with [plans/MASTER.md](plans/MASTER.md) and [plans/00-execution-index.md](plans/00-execution-index.md).

### v1.89.2 documentation sync (CI caching and post-deploy audit)

- **CI:** Dependency caches (npm, pip, Playwright, Gradle, security-tool binaries); composite actions under `.github/actions/`; **`pages-site-probe`** artifact for post-deploy boot audit on the exact GitHub Pages tree.
- **Workflow:** Gate jobs cancel the run on failure; benchmark jobs continue independently.
- **Boot audit:** Local serve of deploy artifact (Cloudflare blocks GHA on live `rianell.com`); fix false `DEPLOY_HTML_MISSING`.
- **See:** [testing-and-configuration.md](testing-and-configuration.md) § CI dependency caching and post-deploy audit; [wiki/Build-Test-and-CI.md](../wiki/Build-Test-and-CI.md).

### v1.89.1 documentation sync (boot i18n and CI supply-chain)

- **PWA boot:** Phase 2b privacy-gate light i18n; `revealAppShellWithLocale()` restores full locale hydration after catalogs load.
- **CI:** Minified artifact upload retry; Playwright install for post-deploy `audit:boot:strict`.
- **Supply chain:** `@sentry/node` override via benchmark `lighthouse`; `cryptography>=48.0.1`.
- **See:** [testing-and-configuration.md](testing-and-configuration.md) § PWA boot locale hydration; [SECURITY.md](SECURITY.md) dependency floors.

### v1.87.0 documentation sync (locale refresh all tabs)

- **PWA:** `refreshAllTabsForLocaleChange()` in `app.js`; wired from `i18n-pwa.js` `refreshLocaleUI()`.
- **Home:** `formatUiDate()` for locale-aware today header.
- **See:** [testing-and-configuration.md](testing-and-configuration.md) § UI locale refresh.

### v1.86.0 documentation sync (pl-PL mixed-language)

- **Scripts:** `scripts/lib/pl-pl-exact-overrides.mjs`; merged in `lc20-mixed-fixes.mjs`.
- **Verify:** `verify-mixed-language-strings.mjs --locale=pl-PL`.

### v1.85.0 documentation sync (on-device model clear/redownload)

- **PWA:** Settings → Performance — `clearAndRedownloadAiModel()`; `summary-llm.js` cache wipe; `model-chunk-loader.js` `clearAssembledModelCache()`.

### v1.84.0 documentation sync (AI benchmark runner fixes)

- **`toolkit-env.mjs`:** Relative `BENCHMARK_PWA_ROOT` resolved from repo root.
- **`run-ai-engine-rn.mjs`:** Root `jest.js` spawn (Windows).
- **`benchmark:ai-verify -- --strict`:** npm passthrough documented in testing-and-configuration.

### v1.83.0 documentation sync (README icons and copy)

- **README:** `docs/icons/*.svg` — 32×32 tinted tiles for GitHub dark mode; removed next-phase plan section and documentation table row.
- **PWA:** AI at-a-glance footnote removed (`app.js`, `styles.css`).
- **Pointers:** [about-and-support.md](about-and-support.md) — changelog + feature docs (no roadmap link in README).

### v1.82.0 documentation sync (AI engine benchmarks)

- **Toolkit:** `benchmarks/scripts/toolkit/run-ai-engine-*.mjs`, `verify-ai-engine.mjs`, `ai-fixtures.mjs`, `ai-engine-catalog.json`, `ai-thresholds.json`.
- **CI:** `benchmarks-ai-package`, `benchmarks-ai-layers`, `benchmarks-ai-algos`, `benchmarks-ai-rn` jobs; merged in `commit-benchmarks`.
- **npm:** `benchmark:ai-package`, `benchmark:ai-layers`, `benchmark:ai-algos`, `benchmark:ai-rn`, `benchmark:ai-verify`, `benchmark:ai-all`.
- **See:** [testing-and-configuration.md](testing-and-configuration.md) § AI engine benchmark suite.

### v1.81.0 documentation sync (benchmark toolkit CI)

- **CI:** `benchmarks-toolkit` — full perf toolkit via `npm run full-suite -- --strict`.
- **Runbook:** `benchmarks/toolkit/AGENT-RUNBOOK.md`.
- **compare.md:** tier-matrix and settings-matrix history sections.

### v1.80.0 documentation sync (full-suite orchestrator)

- **`run-full-suite.mjs`:** tier matrix + settings matrix + user journey + Lighthouse + `verify-regression --strict`.
- **Reports:** `benchmarks/full-suite/`, `benchmarks/source-built/`.

### v1.79.0 documentation sync (God mode and settings autotest)

- **`run-god-mode-suite.mjs`**, **`run-settings-matrix.mjs`**, **`run-user-journey.mjs`**.
- **PWA:** `data-god-mode` selectors; God mode catalog in `benchmarks/toolkit/god-mode-catalog.json`.

### v1.78.0 documentation sync (tier-matrix performance suite)

- **`run-tier-matrix.mjs`:** 10 cells (tier 1–5 × desktop/mobile); `export-tier-profiles.mjs`.
- **PWA:** `__rianellTestHooks` on `?benchmark_test=1`; tier 1–2 LLM route block for AIEngine-only probes.
- **Reports:** `benchmarks/tier-matrix/latest.run.json` (schema v4).

### v1.77.0 documentation sync (LC-20 i18n gap close-out)

- **Plan:** [i18n-gap-closeout-plan.md](i18n-gap-closeout-plan.md) — segmented delivery v1.71.0–v1.77.0 (all phases done).
- **`verify:i18n`:** Content build → generate → UI fill → policy → MOTD translate → sync → full gate suite including `verify-motd-translation-coverage`, `verify-mixed-language-strings`, coverage `--strict --max-pct=13`.
- **PWA (v1.72–v1.74):** Cookie/install/picker wiring; god mode / benchmark / wizard review i18n; `tContent()` tile catalogs; `device-benchmark.js` localized test labels.
- **RN (v1.74):** `LogWizardScreen` `tContent()`; `ga` in `I18nProvider`.
- **Scripts (v1.73–v1.76):** `lc20-mixed-fixes`, `batch-mt-hybrid-keys`, `build-content-catalog-keys`, `verify-motd-translation-coverage`, `auto-translate-policy-strings`.
- **ga (v1.71):** Shipped locale with UI-only LLM; batch MT pass.

### v1.70.3 documentation sync (PWA bugfix release)

- **Settings (v1.70.0):** `i18n-pwa.js` re-entrancy guard; `app.js` `onLocaleChange` no longer calls `applyDocumentI18n` recursively.
- **Logs (v1.70.1):** Expanded log cards show `.log-entry-content` via CSS class only (no inline `display: none`).
- **LLM (v1.70.2):** `summary-llm.js` GET manifest probe; chunked loader gated to Supabase/app-origin.
- **Share UI (v1.70.3):** `icon-share` sprite; circular `.log-entry-actions .share-btn` in `styles.css`.

### v1.69.1 documentation sync (CI generate order)

- **CI:** `.github/workflows/ci.yml` unit-tests job runs `npm run verify:i18n` (includes `--max-pct=13` coverage gate).
- **CI:** `.github/workflows/ci.yml` unit-tests job aligned.

### v1.69.0 documentation sync (Tier A generate pipeline)

- **Generate:** `scripts/i18n/generate-locale-overrides.mjs` — en-GB + curated overrides + rule-based MT + `tier-a-exact-overrides.mjs`.
- **Maintainer:** `merge-tier-a-overrides-from-packs.mjs`, `build-tier-a-exact-overrides.mjs --locale=pt-BR`.
- **Gitleaks (v1.68.1):** `.gitleaks.toml` allowlists `i18n-packs/` and `tier-a-exact-overrides.mjs`.

### v1.68.0 documentation sync (i18n release gates)

- **Verify:** `npm run verify:i18n` — sync, locale/prompt/motd/HTML/audit, `--require-wiring`, `--strict` hardcoded UI, translation coverage `--strict`.
- **CI:** `.github/workflows/ci.yml` mirrors the full i18n gate suite.
- **Parity:** `docs/platform-parity.json` — `ui_string_catalog_full`, `ui_rtl_ar_he`, `llm_prompt_i18n` supported.

### v1.65.0–v1.67.0 documentation sync (LC-16–LC-18)

- **Tier A MT (v1.65):** `scripts/i18n/batch-mt-tier-a.mjs`, `apply-tier-a-exact-overrides.mjs`, `verify-translation-coverage.mjs --strict`.
- **Prompt/MOTD (v1.66):** `translate-prompt-packs.mjs`, `translate-motd-packs.mjs` → canonical `i18n-packs/` then `sync-i18n-assets.mjs`.
- **RTL (v1.67):** RN `isRtl` row/chevron mirroring in `LogWizardScreen.tsx`, `SettingsScreen.tsx`.

### v1.61.0 documentation sync (README icons)

- **README:** Documentation table uses **`docs/icons/*.svg`** (referenced via `<img>` for GitHub rendering).
- **i18n:** See v1.54–v1.69 segments in [CHANGELOG.md](CHANGELOG.md); canonical packs under **`i18n-packs/`**; **`npm run verify:i18n`**.

### v1.60.0 documentation sync (full UI localization)

- **i18n paths:** `i18n-packs/` — `locale-packs/v1/` (UI + policy strings), `prompt-packs/v1/` (LLM templates), `motd-packs/v1/` (offline quotes), `policy-packs/v1.json`; synced by **`scripts/i18n/sync-i18n-assets.mjs`**.
- **Shared runtime:** `packages/shared/src/i18n/` — `translate.mjs`, `resolveLocale.mjs`, `format.mjs`, `rtl.mjs`, `promptPack.mjs`, generated `promptPackData.mjs`.
- **PWA:** `apps/pwa-webapp/i18n-pwa.js` → `window.RianellI18n`; **RN:** `apps/rn-app/src/i18n/I18nProvider.tsx` → `useT()`.
- **Verify:** `scripts/verify/verify-locale-packs.mjs`, `verify-prompt-packs.mjs`, `audit-hardcoded-strings.mjs`.
- **Key naming:** UI strings use `{namespace}.{semantic.slug}` in `i18n-packs/locale-packs/v1/en-GB.json` (e.g. `wizard.saveEntry`, `settings.privacy.title`). Namespaces follow rollout order: `common`, `nav`, `gate`, `consent`, `settings`, `wizard`, `logs`, `modal`, `toast`, `charts`, `ai`, `export`, `tutorial`, `units`, `policy`. Slugs are lowercase dot-separated words derived from English copy; intentional English (brand names, medical codes) is listed in `scripts/.audit/i18n-allowlist.json`.

### v1.53.1 documentation sync (settings/privacy fixes)

- **PWA:** Settings carousel nine panes, policy HTML modal, benchmark **`global` → `window`** fix — see [CHANGELOG.md](CHANGELOG.md) v1.53.1.
- **RN:** Mobile typecheck fixes in **`sync.ts`**, **`AiModelDownloadGate.tsx`**, **`PolicyDocumentsModal.tsx`**.

### v1.53.0 documentation sync (LLM scripts + gitignore)

- **Model scripts (repo root):** `models:download`, `models:verify` — see [testing-and-configuration.md](testing-and-configuration.md).
- **Gitignore:** `apps/pwa-webapp/models/**/onnx*` excluded; weights are HF-only and must never be committed.

### v1.46.28 documentation sync (PWA content-hashed bundles)

- **Build:** Production PWA output uses **`app.<hash>.min.js`** and (for **`--site`** / **`.android-dist`**) **`styles.<hash>.css`**, with **`asset-manifest.json`** at the app root. Source **`index.html`** in git still uses **`app.js?v=`** / **`styles.css?v=`** for local development.

### v1.46.16 documentation sync (security header runs + MOTD)

- **CI security reports:** **`security/securityheaders-rianell.com.md`** and **`security/securityheaders-runs/run-*.md`** are described in **`security/README.md`** and **`docs/infrastructure-and-security-edge.md`**.
- **Web MOTD:** Home-tab **`.motd-spin-host`** tap spin (3D) — see **`docs/styling.md`**.

### v1.46.14 documentation sync (benchmarks folder)

- **Layout:** **`benchmarks/`** is the single workspace for **`@rianell/benchmark-runner`** (scripts, reporters, Playwright specs) and generated Markdown/JSON (**`web-pwa/`**, **`compare.md`**, etc.). See changelog v1.46.13.

### v1.46.11 documentation sync (RN README build vs workflow run)

- **CI:** README **Alpha RN** rows use the **sequential RN build** from **`rn-build-version`** (stored in **`artifacts/RNCLI-Android/latest.json`**). **Server** and **Web / PWA** rows still follow **`GITHUB_RUN_NUMBER`**. Metadata-only fallback commits keep JSON in sync when large binaries cannot be pushed.
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
│   └── archive/            # deprecated config snapshots (Phase 23)
├── .github/workflows/
├── audit-history/          # boot audit JSON (baseline.json tracked)
├── artifacts/              # CI artifacts + latest.json (download links)
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
- Optional **Smartlook session recording** (off by default; Settings → Privacy → Session recording) — see [smartlook-session-recording.md](privacy/smartlook-session-recording.md)
- Data anonymisation before upload
- Clear privacy agreement
- User can disable at any time

**Privacy program index:** [docs/privacy/global-baseline.md](privacy/global-baseline.md) — links to [eu-gdpr.md](privacy/eu-gdpr.md), [dpia-health-sync.md](privacy/dpia-health-sync.md), [data-subject-rights.md](privacy/data-subject-rights.md), [subprocessors.md](privacy/subprocessors.md), [smartlook-session-recording.md](privacy/smartlook-session-recording.md), [other-jurisdictions.md](privacy/other-jurisdictions.md), and [ropa.json](privacy/ropa.json). Security cross-refs: [threat-model.md](threat-model.md), [incident-response.md](incident-response.md), [ai-security.md](ai-security.md).

<a id="nav-smartlook"></a>

## Smartlook session recording (opt-in)

| Item | Detail |
|------|--------|
| **Default** | Off — no SDK load until user opts in |
| **User UI** | Settings → Privacy & region → Session recording; Consent dashboard revoke |
| **PWA** | `apps/pwa-webapp/smartlook.js` (Web SDK, EU region) |
| **RN** | `apps/rn-app/src/analytics/sessionRecording.ts` + `react-native-smartlook-analytics` (dev build; not Expo Go) |
| **Shared** | `sessionRecording` pref; policy feature in `i18n-packs/policy-packs/v1.json`; `packages/shared/src/settings/consentDashboard.mjs` |
| **CSP** | `apps/pwa-webapp/index.html`; verified by `scripts/verify/verify-csp-connect-src.mjs` |
| **Privacy docs** | [smartlook-session-recording.md](privacy/smartlook-session-recording.md), [subprocessors.md](privacy/subprocessors.md), RoPA **PA-10** |

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

Start with the full guide: **[SECURITY.md](SECURITY.md)** (see also [Security overview](../README.md#security) in the main README). Supplementary references: [../supabase/Schema.sql](../supabase/Schema.sql) (tables, RLS, grants, RPCs), [privacy/global-baseline.md](privacy/global-baseline.md), CI workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) - `security-audit` job (Gitleaks, OSV SARIF, privacy doc verifier, security inventory, SBOM, `npm audit`, `pip-audit`).

⚠️ **Important security considerations**:

1. **Never commit sensitive files**:
   - **`security/.env`** (or legacy root `.env`) - Supabase credentials
   - **`security/.encryption_key`** - encryption key material
   - `supabase-config.js` (contains API keys)

2. **Use environment variables** for production deployments

3. **Supabase Keys**: Always use PUBLISHABLE/ANON keys in frontend code, never secret keys

4. **Data Privacy**: Anonymised data sharing is opt-in only
