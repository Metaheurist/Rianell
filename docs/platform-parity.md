# Platform parity

This document defines the expected behaviour contract across:

- **Web / PWA** (`apps/pwa-webapp/`)
- **React Native (Expo)** (`apps/rn-app/`) — primary mobile app

The machine-readable source is `docs/platform-parity.json` (v2). CI runs `npm run parity:web`, `parity:android`, `parity:ios`, and `parity:inventory:check` on every PR.

### Home AI suggestions (PWA + RN)

- **Shared engine:** `packages/shared/src/ai/homeSuggestions.mjs` — rule-based chip selection (0–3 chips).
- **Gating:** AI enabled, logged today, ≥3 days in the last 14-day window.
- **Answer modal:** `homeQuestion` prompt feature in `summary-llm.js` (PWA) and `llm.ts` (RN); medical disclaimer on both platforms.

### v1.70.3 parity note (PWA bugfix release)

- **PWA-only fixes (v1.70.0–v1.70.3):** Settings freeze, log card expand, summary LLM host probe, log share button styling — no RN parity flag changes.
- **Logs expand:** PWA per-day cards again show full detail body when expanded; RN `LogsScreen` modal detail unchanged.

### v1.69.1 parity note (CI generate-before-coverage)

- **`verify:i18n`:** `generate-locale-overrides.mjs` → `sync-i18n-assets.mjs` → strict translation coverage.
- **CI:** Unit-tests job mirrors the same generate step before locale/coverage checks.

### v1.69.0 parity note (reproducible Tier A packs)

- **Generate:** `generate-locale-overrides.mjs` applies rule-based MT + exact overrides; locale packs committed at ≤5% en-GB identity.
- **Maintainer:** `merge-tier-a-overrides-from-packs.mjs`, `build-tier-a-exact-overrides.mjs --locale=…`.

### v1.68.1 parity note (gitleaks allowlist)

- **Security:** `.gitleaks.toml` allowlists i18n translation paths (password UI labels are not secrets).

### v1.68.0 parity note (LC-19 release gates)

- **CI:** `verify-translation-coverage.mjs --strict` in CI and `npm run verify:i18n`.
- **Catalog:** 861 en-GB keys; **0** hardcoded UI; `ui_string_catalog_full` supported.
- **Builds:** PWA minified site + Expo prod bundles verified.

### v1.67.0 parity note (LC-18 RTL)

- **RN:** `LogWizardScreen` + `SettingsScreen` mirrored nav/chevrons when `isRtl`.
- **PWA:** `[dir=rtl]` CSS for modals, wizard, settings carousel.
- **`ui_rtl_ar_he`:** supported on web, Android, iOS.

### v1.66.0 parity note (LC-17 prompt/MOTD)

- **Scripts:** `translate-prompt-packs.mjs`, `translate-motd-packs.mjs`.
- **Packs:** Tier A prompt strings translated; all 13 locales ≥30 MOTD quotes.

### v1.65.0 parity note (LC-16 Tier A MT)

- **Pipeline:** `batch-mt-tier-a.mjs`, `tier-a-exact-overrides.mjs`, `verify-translation-coverage.mjs --strict`.
- **Quality:** Tier A locales ≤5% en-GB identity (glossary-excluded).

### v1.63.0 parity note (LC-11–LC-15 wiring)

- **Wiring complete:** 861 en-GB catalog keys; **0** hardcoded UI audit candidates; `audit-hardcoded-strings.mjs --require-wiring` + `verify-no-hardcoded-ui.mjs --strict` in CI.
- **Audit infra:** `scripts/.audit/i18n-allowlist.json`, `hardcoded-ui-baseline.json`, shared `i18n-audit-shared.mjs`.

### v1.60.0 parity note (full UI localization)

- **Catalog:** 325 en-GB keys; PWA `RianellI18n` + RN `useT()` on major screens; `audit-hardcoded-strings.mjs --check` for remaining PWA wizard/settings strings.
- **LLM i18n:** `i18n-packs/prompt-packs/v1/`; explicit **`locale`** on RN LLM POST (B2); ar/he **ui-only** (rule-based + motd fallback).
- **RTL:** ar/he in `SHIPPED_LOCALES`; PWA `[dir=rtl]` CSS; RN `I18nManager.forceRTL`.
- **UGC (B1):** Log text immutable; export headers localized via `export.csv.*` keys.

### v1.53.1 parity note (settings carousel + policy modals)

- **PWA settings:** Nine-pane carousel with Privacy & region; policy HTML viewer and confirm-modal fixes aligned with shared **`showConfirmModal(message, title, onConfirm, onCancel)`** contract.
- **RN:** **`AiModelDownloadGate`** uses **`prefs.accessibility.colorblindMode`**; **`PolicyDocumentsModal`** typed for strict TypeScript.

### v1.53.0 parity note (On-device LLM + download gates)

- **On-device LLM:** Weights from **Hugging Face Hub** (onnx-community `*-ONNX` repos). PWA uses Transformers.js HF remote; RN downloads HF files to device cache.
- **Download UX:** PWA blocking modal on installed mobile; skippable on mobile web; desktop banner bottom-right. RN **`AiModelDownloadGate`** blocks until cache ready.
- **Credential hygiene:** Tracked configs use placeholders; `verify-no-service-role-in-clients` gates CI.

### v1.50.0 parity note (RN secure storage + anonymized_data)

- **React Native auth:** Supabase session tokens stored in **`expo-secure-store`** via `supabaseAuthStorage` (not AsyncStorage). Android **`allowBackup: false`** in `app.json`.
- **Cloud tables:** RN sync and deletion use **`anonymized_data`** (aligned with PWA and schema); unified **`deleteAllUserDataFromCloud`** covers `health_data`, `user_keys`, `anonymized_data`, `bug_reports`.

### v1.49.0 parity note (Capacitor sunset + shared packages)

- **Capacitor removed:** Legacy **`apps/capacitor-app/`** WebView shell and CI release artifacts are gone; **PWA + React Native (Expo)** are the only app surfaces.
- **Shared packages:** **`@rianell/shared`**, **`@rianell/ai-engine`**, **`@rianell/cloud-sync`**, **`@rianell/llm`** — PWA loads vendor bundles; RN imports the same packages.
- **RN parity:** Cloud sync UI (`SettingsCloudPane`), expanded settings/goals, chart predictions, print export, offline queue flush, native LLM consent path (`llmNative.ts` placeholder until ONNX ships).
- **Parity gates:** `check-platform-parity.mjs` modes **`web | android | ios`**; `parity-inventory.mjs` diffs settings keys and cloud exports.

## Current contract

- `notifications`: native plugin path enabled, with web fallback.
- `speech_to_text`: browser API based (`SpeechRecognition`) with explicit microphone permission preflight and plugin-aware permission fallback checks when native speech plugins are present; support still varies by engine/WebView.
- `clipboard_share_download`: supported with fallback paths where available.
- `sync_behavior`: foreground/interval behaviour; no guaranteed OS background sync.
- `local_storage_and_idb`: supported across all targets (subject to platform quota/eviction policies).
- `ui_toast_feedback`: non-blocking toast/snackbar on PWA (`ui-feedback.js`) and RN (`ToastProvider`).
- `haptic_feedback`: optional vibration/haptics on supported platforms; no-op elsewhere.
- `on_device_llm`: PWA Transformers.js with HF-hosted weights + consent/download UI; RN HF download cache + **`AiModelDownloadGate`** blocking download; on-device inference via WASM (Expo Go) or ORT wrapper (dev/prod builds).

### v1.48.0 parity note (Llama on-device LLM upgrade)

- **PWA:** **`summary-llm.js`** — **`onnx-community/Llama-3.2-1B-Instruct-ONNX`** (tier 3–5) / **`SmolLM2-360M-Instruct-ONNX`** (tier 1–2); **`text-generation`** chat pipeline; download consent modal; progress banner; **`motd.json`** healthy-lifestyle quotes.
- **React Native:** **`llm.ts`** remote endpoint when configured; **`llmNative.ts`** consent + MOTD fallback aligned with **`@rianell/llm`** model IDs.
- **Parity checks:** **`check-platform-parity.mjs`** validates new model ids, **`progress_callback`**, and consent hook.

### v1.47.0 parity note (UI sophistication overhaul)

- **PWA:** Shared **`ui-feedback.js`** toast/haptic/ripple/offline helpers; direction-aware tab transitions; wizard step motion; home hero + goals rings; **`check-platform-parity.mjs`** validates **`showToast`** / **`notifySuccess`** hooks.
- **React Native:** **`ToastProvider`** + UI kit under **`src/components/ui/`**; log wizard progress bar/dots; non-blocking save toasts (replacing blocking save **`Alert.alert`** for success paths).
- **Tokens:** **`@rianell/tokens`** semantic colors/motion scales aligned with PWA **`css/tokens.css`** / **`styles.css`**.

### v1.46.3 parity note (RN settings carousel + app installation + log wizard suggest note)

- **React Native — Settings:** Eight titled carousel panes match the web settings overlay pane titles (`apps/pwa-webapp/index.html`). Daily reminders live under **Display**; demo mode under **Data options**; LLM tier + benchmark under **Performance**; export, import, native **App installation** info, and **Clear all data** under **Data management** (`SettingsAppInstallSection.tsx`).
- **React Native — Log wizard:** **Suggest note** uses the same `suggestLogNote` pipeline as the PWA (remote LLM when configured, otherwise `AIEngine.suggestLogNote`), with preferences and benchmark available to the screen.
- **Web unchanged:** PWA settings layout and `refreshAppInstallSection` behaviour remain the source of truth for browser/WebView install tiles; native RN shows the replacement block described in `docs/CHANGELOG.md` v1.46.3.

### v1.46.2 parity note (legacy release labeling + CI metadata fallback)

- **Release contract clarity:** legacy artifacts are now emitted with explicit `legacy-capacitor-*` names in CI release assets, reducing ambiguity between RN CLI and Capacitor channels.
- **Docs continuity on size-limited runs:** when repository push limits reject oversized branch artifact commits, CI now falls back to README-only metadata commit/push so release/build status remains visible.

### v1.46.1 parity note (documentation checkpoint)

- **All platforms/docs contract:** parity docs are synchronised on the current RN notification diagnostics baseline (summary line, quality/confidence cues, and trajectory context).
- **Open parity:** long-tail OS delivery/action differences are summarized in this file and **[CHANGELOG.md](CHANGELOG.md)**.

### v1.46.0 parity note (unknown-action session summary line)

- **React Native:** notification diagnostics now include a compact aggregate summary line for unknown-action sessions (quality + drift + trajectory stability).
- **Open parity:** long-tail OS delivery/action differences are summarized in this file and **[CHANGELOG.md](CHANGELOG.md)**.

### v1.45.99 parity note (unknown-action trajectory stability note)

- **React Native:** notification diagnostics now include trajectory stability status for unknown-action source evolution within a session.
- **Open parity:** long-tail OS delivery/action differences are summarized in this file and **[CHANGELOG.md](CHANGELOG.md)**.

### v1.45.98 parity note (unknown-action source trajectory visibility)

- **React Native:** notification diagnostics now include first-to-latest source trajectory context for unknown-action sessions.
- **Open parity:** long-tail OS delivery/action differences are summarized in this file and **[CHANGELOG.md](CHANGELOG.md)**.

### v1.45.97 parity note (unknown-action recommended next-check guidance)

- **React Native:** notification diagnostics now include quality-driven recommended next-check guidance for unknown-action sessions.
- **Open parity:** long-tail OS delivery/action differences are summarized in this file and **[CHANGELOG.md](CHANGELOG.md)**.

### v1.45.96 parity note (unknown-action observability quality score)

- **React Native:** notification diagnostics now include a consolidated observability quality score for unknown reminder-action sessions.
- **Open parity:** long-tail OS delivery/action differences are summarized in this file and **[CHANGELOG.md](CHANGELOG.md)**.

### v1.45.95 parity note (documentation checkpoint)

- **All platforms/docs contract:** parity docs are synchronised on the current RN notification diagnostics baseline (counts, source split, confidence hint, low-sample warning).
- **Open parity:** long-tail OS delivery/action differences are summarized in this file and **[CHANGELOG.md](CHANGELOG.md)**.

### v1.45.94 parity note (unknown-action minimum-sample confidence warning)

- **React Native:** notification diagnostics now flag dominant-source confidence as preliminary until at least 3 unknown reminder-action observations are captured.
- **Open parity:** long-tail OS delivery/action differences are summarized in this file and **[CHANGELOG.md](CHANGELOG.md)**.

### v1.45.93 parity note (unknown-action dominant-source confidence)

- **React Native:** notification diagnostics now include dominant-source confidence context for unknown reminder actions, helping distinguish clear startup/live skew from balanced sessions.
- **Open parity:** long-tail OS delivery/action differences are summarized in this file and **[CHANGELOG.md](CHANGELOG.md)**.

### v1.45.92 parity note (unknown-action source split percentages)

- **React Native:** notification diagnostics now show startup-vs-live percentage split for unknown reminder actions, making runtime-source drift easier to compare across sessions.
- **Open parity:** long-tail OS delivery/action differences are summarized in this file and **[CHANGELOG.md](CHANGELOG.md)**.

### v1.45.91 parity note (unknown-action drift status)

- **React Native:** notification diagnostics now include a session-level drift status (`low`, `moderate`, `high`) derived from unknown reminder-action volume.
- **Open parity:** long-tail OS delivery/action differences are summarized in this file and **[CHANGELOG.md](CHANGELOG.md)**.

### v1.45.90 parity note (documentation checkpoint)

- **All platforms/docs contract:** parity docs are synchronised on the current RN notification diagnostics baseline and remaining open long-tail parity items.
- **Open parity:** long-tail OS delivery/action differences are summarized in this file and **[CHANGELOG.md](CHANGELOG.md)**.

### v1.45.89 parity note (unknown diagnostics source breakdown)

- **React Native:** notification diagnostics now include startup-vs-live unknown action counts in addition to latest-source context.
- **Open parity:** long-tail OS delivery/action differences are summarized in this file and **[CHANGELOG.md](CHANGELOG.md)**.

### v1.45.88 parity note (unknown diagnostics source context)

- **React Native:** notification diagnostics now identify whether the most recent unknown reminder action came from startup snapshot handling or live listener callbacks.
- **Open parity:** long-tail OS delivery/action differences are summarized in this file and **[CHANGELOG.md](CHANGELOG.md)**.

### v1.45.87 parity note (unknown diagnostics last-seen context)

- **React Native:** notification diagnostics now show last-seen context for unknown reminder actions, improving in-app parity troubleshooting without external logs.
- **Open parity:** long-tail OS delivery/action differences are summarized in this file and **[CHANGELOG.md](CHANGELOG.md)**.

### v1.45.86 parity note (unknown diagnostics reset control)

- **React Native:** notification diagnostics now include a user-visible reset control for session unknown-action counts, improving parity troubleshooting ergonomics.
- **Open parity:** long-tail OS delivery/action differences are summarized in this file and **[CHANGELOG.md](CHANGELOG.md)**.

### v1.45.85 parity note (unknown drift context hint)

- **React Native:** when unknown reminder actions are observed and dismiss semantics are unsupported, Settings now explains this likely runtime cause directly in the notification diagnostics area.
- **Open parity:** long-tail OS delivery/action differences are summarized in this file and **[CHANGELOG.md](CHANGELOG.md)**.

### v1.45.84 parity note (documentation checkpoint)

- **All platforms/docs contract:** parity docs are synchronised on the current RN notification baseline (dismiss capability visibility, safe dismiss no-op behaviour, and unknown-action session observability).
- **Open parity:** long-tail OS delivery/action differences are summarized in this file and **[CHANGELOG.md](CHANGELOG.md)**.

### v1.45.83 parity note (unknown action observability)

- **React Native:** notification settings now expose session-level unknown reminder action observations, improving parity diagnostics for runtime-specific action-id drift.
- **Open parity:** long-tail OS delivery/action differences are summarized in this file and **[CHANGELOG.md](CHANGELOG.md)**.

### v1.45.82 parity note (dismiss capability visibility)

- **React Native:** Settings now surfaces runtime support for dismiss semantics alongside schedule/channel/category/action listener capability statuses.
- **Open parity:** long-tail OS delivery/action differences are summarized in this file and **[CHANGELOG.md](CHANGELOG.md)**.

### v1.45.81 parity note (dismiss action safe ignore)

- **React Native:** dismissed/close notification actions are now explicitly treated as no-op (`none`) in reminder response mapping, avoiding runtime-specific accidental fallback navigation.
- **Open parity:** long-tail OS delivery/action differences are summarized in this file and **[CHANGELOG.md](CHANGELOG.md)**.

### v1.45.80 parity note (snooze reminder response mapping)

- **React Native:** taps on snoozed reminder notifications now map into the same open-app reminder action semantics as primary reminder defaults, reducing runtime-specific response drift.
- **Open parity:** long-tail OS delivery/action differences are summarized in this file and **[CHANGELOG.md](CHANGELOG.md)**.

### v1.45.79 parity note (reminder action identifier normalization)

- **React Native:** notification response handling now normalizes action identifiers from runtime-specific format variants before mapping to action semantics, improving consistency across device/runtime combinations.
- **Open parity:** long-tail OS delivery/action differences are summarized in this file and **[CHANGELOG.md](CHANGELOG.md)**.

### v1.45.78 parity note (documentation checkpoint)

- **All platforms/docs contract:** parity documentation now consistently calls out RN notification action-policy visibility and duplicate-action burst suppression as current baseline behaviour.
- **Open parity:** long-tail OS delivery/action differences are summarized in this file and **[CHANGELOG.md](CHANGELOG.md)**.

### v1.45.77 parity note (reminder action burst de-dup)

- **React Native:** reminder action routing now de-duplicates immediate duplicate runtime callbacks to reduce double-navigation/snooze handling risk on some devices.
- **Open parity:** keep tracking long-tail OS delivery semantics and action-surface differences in `docs/next-phase-development-plan.md` Phase E.

### v1.45.76 parity note (reminder action policy visibility)

- **React Native:** Settings now displays explicit reminder action-routing/fallback policy text (`log-now`, `later`, `default`, `unknown`) to make runtime behaviour differences transparent.
- **Open parity:** keep tracking long-tail OS delivery semantics and action-surface differences in `docs/next-phase-development-plan.md` Phase E.

### v1.44.2 parity update

- Cloud sync now includes additional user setting keys stored outside `rianellSettings`, improving cross-device settings parity for authenticated users.
- Native-first notification permission handling and native daily scheduling remain in place for mobile runtime consistency.

### v1.45.26 parity note (Home header chrome)

- **Web:** fixed **`.header-buttons-wrap`** (Goals & targets, Report a bug, Settings) sits beside scroll content (`apps/pwa-webapp/index.html`).
- **React Native:** the same three actions appear on **Home** as a top-right **chrome** row: **Goals** → Charts **Balance** + targets UI; **?** → security reporting doc; **Settings** → Settings tab. Full **Goals** modal and **bug report** modal parity remain Phase E.

### v1.45.29 parity note (View Logs Phase G)

- **Web:** View Logs supports date ranges, sorting, filtering, rich cards, and entry actions.
- **React Native:** `LogsScreen` now matches core controls for **range presets**, **sort**, and **refresh** with explicit selected-state accessibility labels; remaining parity backlog is text filter, card detail depth, and edit/delete/share actions.

### v1.45.40 parity note (AI + performance settings scope)

- **React Native:** baseline parity now includes `AIEngine`-style deterministic helpers and LLM wrapper hooks (summary/MOTD/suggest), plus benchmark-tier model selection settings.
- **Open parity:** full web benchmark detail modal (graphs/stability) and deeper AI runtime parity are summarized in this file and **[CHANGELOG.md](CHANGELOG.md)**.
- **Scope clarification:** RN keeps install/download affordances on web/PWA surfaces; native app settings do not show install buttons.

### v1.45.41 parity note (status rollup)

- Documentation now consistently marks RN AI/LLM, demo mode, and benchmark-tier settings as **implemented baseline parity increments** with remaining deep parity tracked in Phase C/E/F.

### v1.45.50 parity note (CI dependency gate stability)

- **All platforms:** security-audit dependency checks now consistently run from a lockfile-manifest-synced workspace state (`npm ci --omit=dev`), reducing cross-platform CI drift from lockfile mismatch failures.

### v1.45.51 parity note (unit-tests install gate)

- **All platforms:** root `npm ci` in the unit-tests workflow now uses a committed workspace-manifest-synced state, avoiding CI failures where workspace package entries (`mobile`, `rianell-shell`) appeared missing from lock resolution.

### v1.45.52 parity note (root install stability across CI jobs)

- **All platforms:** root dependency install jobs now use a regenerated workspace lock graph, preventing stale lock metadata from breaking `npm ci` in both unit-test and prebuild/minified-assets CI paths.

### v1.45.53 parity note (unit-tests path alignment)

- **All platforms:** unit test fixtures now resolve against the canonical app locations (`apps/pwa-webapp` and `apps/rn-app`), removing legacy path assumptions that caused CI-only `ENOENT` failures.

### v1.45.54 parity note (Charts reduced-motion transitions)

- **Web:** chart and section transitions honour reduced-motion preferences across visual updates.
- **React Native:** Charts now uses reduced-motion-aware layout transitions (view/range/refresh/data update paths) and minimises animation when the OS reduced-motion setting is enabled.

### v1.45.55 parity note (legacy build path compatibility)

- **Web/legacy bundle pipeline:** minified legacy bundle generation now tolerates both modern and legacy web directory layouts, avoiding CI path-resolution regressions in prebuild asset jobs.

### v1.45.56 parity note (RN Supabase env-source guard)

- **React Native:** Expo app config now consistently accepts both Expo-prefixed and shared Supabase env names (`EXPO_PUBLIC_SUPABASE_*`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_ANON_KEY`), matching CI/web secret naming expectations.

### v1.45.57 parity note (AI compute-path hardening)

- **React Native:** AI analysis now derives summaries from memoized log/range state and runs summary-note generation in a dedicated effect path, reducing recomputation churn and aligning with ongoing performance-parity hardening.

### v1.45.58 parity note (AI section-body tone alignment)

- **React Native:** AI analysis section helper copy now better mirrors web intent for findings/trends/flare/correlations/groups, and correlation output wording now uses directional-strength phrasing for clearer parity with web summaries.

### v1.45.59 parity note (notifications scheduling baseline)

- **React Native:** notification settings now attempt daily reminder scheduling/cancellation when permission is granted, moving beyond prefs-only parity toward runtime delivery behaviour.

### v1.45.60 parity note (logs large-list virtualization tuning)

- **React Native:** View Logs now applies adaptive FlatList virtualization settings and fixed-row layout hints to better handle larger histories, tightening parity with web large-list behaviour intent.

### v1.45.61 parity note (status checkpoint + next target)

- **All platforms:** parity documentation is now aligned to the `v1.45.60` baseline and explicitly tracks notifications channel/OS delivery semantics as the next RN parity execution target.

### v1.45.62 parity note (notifications delivery semantics)

- **React Native:** reminder scheduling now reports delivery semantics and configures Android notification channels when runtime APIs are present, closing the baseline gap between preference state and platform delivery behaviour.

### v1.45.63 parity note (notifications OS category semantics)

- **React Native:** reminder scheduling now also configures iOS notification categories/actions when runtime APIs are present, expanding platform-level delivery semantics beyond Android channel-only behaviour.

### v1.45.64 parity note (notification response-path visibility)

- **React Native:** reminder action responses are now observable through runtime listener helpers and surfaced in Settings as last-action status, improving parity coverage for notification interaction behaviour.

### v1.45.65 parity note (notification action routing)

- **React Native:** reminder action handling now routes `log-now` interactions directly into the `LogWizard` flow, reducing parity gap between notification interaction and app navigation behaviour.

### v1.45.66 parity note (notification response consumption)

- **React Native:** handled reminder responses are now explicitly cleared, improving parity stability by preventing stale notification actions from replaying on later app sessions.

### v1.45.67 parity note (notification later/snooze behaviour)

- **React Native:** `later` reminder actions now map to explicit snooze scheduling behaviour, improving parity depth for actionable notification semantics beyond direct log-now routing.

### v1.45.68 parity note (notification default-open behaviour)

- **React Native:** default reminder tap actions now explicitly foreground/open the app home path, completing baseline parity intent for primary reminder action routes.

### v1.45.69 parity note (notification snooze personalization)

- **React Native:** reminder `later` actions now honour a user-selected snooze interval from Settings, improving parity depth for notification action customisation.

### v1.45.70 parity note (notification snooze-fallback behaviour)

- **React Native:** when runtime snooze scheduling is unavailable/fails, `later` actions now fall back to app-home open behaviour, reducing dead-end interaction risk.

### v1.45.71 parity note (notification runtime capability visibility)

- **React Native:** Settings now surfaces runtime capability support for scheduling/channel/category/action handling, making platform behaviour differences explicit for parity validation.

### v1.45.72 parity note (documentation checkpoint)

- **All platforms:** parity documentation is synchronised to the latest RN notification semantics baseline and preserves explicit open items for remaining cross-platform depth work.

### v1.45.73 parity note (runtime-adaptive snooze controls)

- **React Native:** notification settings now adapt snooze controls to runtime capability support and explicitly communicate fallback behaviour when snooze scheduling is unsupported.

### v1.45.74 parity note (action status clarity on limited runtimes)

- **React Native:** reminder action status now uses user-facing labels and includes explicit listener-unavailable messaging, improving parity transparency on runtimes without live action callbacks.

### v1.45.75 parity note (unknown action fallback policy)

- **React Native:** unknown reminder actions now resolve to explicit Home fallback routing and user-facing status guidance, reducing undefined behaviour across runtime variants.

### v1.45.42 parity note (View Logs edit + list baseline)

- **Web:** View Logs supports full entry actions and scales to large histories with deeper card context.
- **React Native:** `LogsScreen` now includes **modal edit flow** (date, flare, core metrics, notes) alongside share/delete, and a first-pass **FlatList tuning** baseline for large histories. Remaining parity backlog is richer per-entry card depth and final virtualization strategy choice.

### v1.45.43 parity note (Charts visual baseline)

- **Web:** Charts uses full visual canvases (combined/individual/balance) with richer animation/chrome and prediction overlays.
- **React Native:** Charts now includes a first combined-view **visual trend chart** baseline using web metric color semantics, while existing trend rows/sparks remain in place. Remaining parity backlog is richer individual/balance visual parity and full animation/prediction overlay behaviour.

### v1.45.44 parity note (AI copy/gating increment)

- **Web:** AI Analysis presents "At a glance", findings, and caution sections with clear section flow and gated AI surfaces.
- **React Native:** AI screen now mirrors section flow more closely ("At a glance", "What we found", "How you're doing") and explicitly shows disabled-state copy when AI features are off, while tab visibility remains settings-gated.

### v1.45.45 parity note (View Logs detail depth)

- **Web:** View Logs entry cards/details show broad per-entry context (symptoms, stressors, pain, food, exercise) alongside edit/delete/share.
- **React Native:** View Logs rows and detail modal now surface richer per-entry context (symptoms, stressors, pain location, food, exercise) in addition to edit/share/delete and existing range/sort/filter controls.

### v1.45.46 parity note (Charts individual visual baseline)

- **Web:** Individual charts provide full per-metric visual rendering with richer scale/tooltip behaviour.
- **React Native:** Individual chart mode now includes a first per-metric visual trend baseline (colour-coded plotted points) alongside the existing numeric summaries and spark bars; deeper visual parity and balance/radar parity remain open.

### v1.45.47 parity note (Charts balance visual baseline)

- **Web:** Balance mode uses richer radar-style visualisation semantics.
- **React Native:** Balance mode now includes a first visual baseline chart (colour-coded bars for core balance metrics) in addition to the targets snapshot; deeper radar-equivalent semantics and animation/chrome parity remain open.

### v1.45.48 parity note (Notifications settings baseline)

- **Web/Capacitor:** notification behaviour includes reminder controls tied to runtime delivery paths.
- **React Native:** Settings now includes notification preference controls (enable, reminder time, sound) plus permission status/request baseline. Full OS scheduling/channel parity remains open.

### v1.118.0 parity note (Onboarding UX & Smartlook default-on)

- **First-run wizard:** PWA + RN share `buildFirstRunPlan` — session recording disclosure step after cookies; tracking profile deferred to Settings.
- **Smartlook:** Default-on preference with disclosure gate (`shouldActivateSessionRecording`); PWA `first-run-wizard.js` + RN `FirstRunWizard.tsx`; Settings revoke unchanged.
- **Settings PWA:** Consent dashboard on Privacy pane; Goals carousel script load fix (IIFE).
- **Icons:** AM check-in sun uses theme tokens; sized to midday check-in.

### v1.117.1 parity note (Supabase pool RPC grants)

- **No app parity change** — PWA/RN still call pool RPCs only when signed in with research opt-in.
- **Operator:** Re-run `Schema.sql` §4 so `anon` cannot execute RE1 RPCs (Security Advisor 0028).

### v1.117.0 parity note (Achievements & Goals carousel)

- **Goals modal:** PWA + RN two-pane carousel — **Goals** (steps, hydration, sleep, good-days targets) and **Achievements** (logging unlock badges).
- **Unlock schedule:** Shared `LOGGING_ACHIEVEMENTS` / `computeAchievementSnapshots` — food day 7, exercise day 14, medications day 21 from `trackingProfile.configuredAt`.
- **Wizard locks:** Locked food/exercise/meds steps show **View achievements** CTA → Achievements pane.
- **Notifications:** Unlock toast once per achievement when notifications enabled; streak reminders (R6) remain achievement-free.
- **Cloud:** `user_achievements` sync on sign-in; merged with local `notifiedAt`/`seenAt`; deleted with unified cloud erasure.

### v1.116.0 parity note (Stepped PHQ-9/GAD-7 screening)

- **Screening:** PHQ-2/GAD-2 initial phase unchanged; score ≥ 3 unlocks PHQ-9 (7 follow-up items) or GAD-7 (5 follow-up items) on PWA + RN.
- **Results:** Low path shows `/6`; full instrument shows severity band + `/27` or `/21`.
- **Crisis:** PHQ-9 item 9 positive → alert before result; regional crisis links on all result paths.
- **Data:** Ephemeral only — cleared on modal close; no logs/cloud export.

### v1.114.0 parity note (Security lock tab and UX trim)

- **Settings:** Ten carousel panes; **Security lock** tab 10 on PWA + RN (passcode, caregiver/proxy). Privacy pane no longer hosts app lock or caregiver.
- **Home:** Merged hero streak nudge; pacing widget card removed (Charts C9 series may still exist).
- **Charts:** Insights panel removed on both platforms.
- **Screening:** PHQ-2/GAD-2 slider UX aligned PWA/RN.
- **Logging modules:** Cycle wizard fields both platforms; **barcode food** and **guided voice extraction** wizard UI **RN only** today (PWA toggles without wizard hooks).

### v1.113.0 parity note (Mood tab and Home UX)

- **Web + RN:** Fifth primary tab **Mood** (between Charts and AI) with mood metrics, recent feelings, AM/midday/PM check-in, PHQ/GAD shortcuts, and Charts mood link; shared `moodMetrics.mjs`.
- **Home:** Inline opt-in weather in greeting header; micro-check-in and appointment countdown cards removed from Home stack (check-in on Mood tab).
- **i18n:** Screening modals and Settings cross-cutting sections hydrate after locale catalogs load.

### v1.45.49 parity note (Goals target persistence baseline)

- **Web:** Goals & targets settings persist and drive charts/goals surfaces.
- **React Native:** mood/sleep/fatigue targets now persist in settings/preferences and feed Charts balance target lines, replacing default-only target behaviour for those metrics.

### v1.45.25 parity note (React Native shell)

- Native **bottom tabs** align with web primary navigation intent (Home, logs, charts, optional AI, settings). **Charts → Balance** exposes a **Targets** row (default wellness line) as a stepping stone toward full **Goals & targets** parity with web.

### v1.45.0 parity update

- Voice input now performs explicit microphone permission checks before recognition start, with clearer denied/unsupported feedback.
- Where Capacitor/community speech plugins are available at runtime, their permission APIs are checked/requested before falling back to browser media permission flow.

## CI enforcement

The `unit-tests` job runs:

- `npm run parity:web`
- `npm run parity:android`
- `npm run parity:ios`
- `npm run parity:inventory:check`

These checks fail the build when expected parity hooks or inventory gaps are detected.

## Release traceability

`publish-release` includes `release-assets/Meta/platform-parity.json` so each release has a versioned parity snapshot.
