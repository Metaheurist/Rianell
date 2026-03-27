# Platform parity

This document defines the expected behavior contract across:

- Web / PWA
- Android (Capacitor)
- iOS (Capacitor)

The machine-readable source is `docs/platform-parity.json`. CI parity gates validate key hooks and platform config wiring in each mobile job.

## Current contract

- `notifications`: native plugin path enabled, with web fallback.
- `speech_to_text`: browser API based (`SpeechRecognition`) with explicit microphone permission preflight and plugin-aware permission fallback checks when native speech plugins are present; support still varies by engine/WebView.
- `clipboard_share_download`: supported with fallback paths where available.
- `sync_behavior`: foreground/interval behavior; no guaranteed OS background sync.
- `local_storage_and_idb`: supported across all targets (subject to platform quota/eviction policies).

### v1.45.77 parity note (reminder action burst de-dup)

- **React Native:** reminder action routing now de-duplicates immediate duplicate runtime callbacks to reduce double-navigation/snooze handling risk on some devices.
- **Open parity:** keep tracking long-tail OS delivery semantics and action-surface differences in `docs/next-phase-development-plan.md` Phase E.

### v1.45.76 parity note (reminder action policy visibility)

- **React Native:** Settings now displays explicit reminder action-routing/fallback policy text (`log-now`, `later`, `default`, `unknown`) to make runtime behavior differences transparent.
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
- **Open parity:** full web benchmark detail modal (graphs/stability) and deeper AI runtime parity are still tracked in `docs/next-phase-development-plan.md` (Phase C/E/F).
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

- **Web:** chart and section transitions honor reduced-motion preferences across visual updates.
- **React Native:** Charts now uses reduced-motion-aware layout transitions (view/range/refresh/data update paths) and minimizes animation when the OS reduced-motion setting is enabled.

### v1.45.55 parity note (legacy build path compatibility)

- **Web/legacy bundle pipeline:** minified legacy bundle generation now tolerates both modern and legacy web directory layouts, avoiding CI path-resolution regressions in prebuild asset jobs.

### v1.45.56 parity note (RN Supabase env-source guard)

- **React Native:** Expo app config now consistently accepts both Expo-prefixed and shared Supabase env names (`EXPO_PUBLIC_SUPABASE_*`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_ANON_KEY`), matching CI/web secret naming expectations.

### v1.45.57 parity note (AI compute-path hardening)

- **React Native:** AI analysis now derives summaries from memoized log/range state and runs summary-note generation in a dedicated effect path, reducing recomputation churn and aligning with ongoing performance-parity hardening.

### v1.45.58 parity note (AI section-body tone alignment)

- **React Native:** AI analysis section helper copy now better mirrors web intent for findings/trends/flare/correlations/groups, and correlation output wording now uses directional-strength phrasing for clearer parity with web summaries.

### v1.45.59 parity note (notifications scheduling baseline)

- **React Native:** notification settings now attempt daily reminder scheduling/cancellation when permission is granted, moving beyond prefs-only parity toward runtime delivery behavior.

### v1.45.60 parity note (logs large-list virtualization tuning)

- **React Native:** View Logs now applies adaptive FlatList virtualization settings and fixed-row layout hints to better handle larger histories, tightening parity with web large-list behavior intent.

### v1.45.61 parity note (status checkpoint + next target)

- **All platforms:** parity documentation is now aligned to the `v1.45.60` baseline and explicitly tracks notifications channel/OS delivery semantics as the next RN parity execution target.

### v1.45.62 parity note (notifications delivery semantics)

- **React Native:** reminder scheduling now reports delivery semantics and configures Android notification channels when runtime APIs are present, closing the baseline gap between preference state and platform delivery behavior.

### v1.45.63 parity note (notifications OS category semantics)

- **React Native:** reminder scheduling now also configures iOS notification categories/actions when runtime APIs are present, expanding platform-level delivery semantics beyond Android channel-only behavior.

### v1.45.64 parity note (notification response-path visibility)

- **React Native:** reminder action responses are now observable through runtime listener helpers and surfaced in Settings as last-action status, improving parity coverage for notification interaction behavior.

### v1.45.65 parity note (notification action routing)

- **React Native:** reminder action handling now routes `log-now` interactions directly into the `LogWizard` flow, reducing parity gap between notification interaction and app navigation behavior.

### v1.45.66 parity note (notification response consumption)

- **React Native:** handled reminder responses are now explicitly cleared, improving parity stability by preventing stale notification actions from replaying on later app sessions.

### v1.45.67 parity note (notification later/snooze behavior)

- **React Native:** `later` reminder actions now map to explicit snooze scheduling behavior, improving parity depth for actionable notification semantics beyond direct log-now routing.

### v1.45.68 parity note (notification default-open behavior)

- **React Native:** default reminder tap actions now explicitly foreground/open the app home path, completing baseline parity intent for primary reminder action routes.

### v1.45.69 parity note (notification snooze personalization)

- **React Native:** reminder `later` actions now honor a user-selected snooze interval from Settings, improving parity depth for notification action customization.

### v1.45.70 parity note (notification snooze-fallback behavior)

- **React Native:** when runtime snooze scheduling is unavailable/fails, `later` actions now fall back to app-home open behavior, reducing dead-end interaction risk.

### v1.45.71 parity note (notification runtime capability visibility)

- **React Native:** Settings now surfaces runtime capability support for scheduling/channel/category/action handling, making platform behavior differences explicit for parity validation.

### v1.45.72 parity note (documentation checkpoint)

- **All platforms:** parity documentation is synchronized to the latest RN notification semantics baseline and preserves explicit open items for remaining cross-platform depth work.

### v1.45.73 parity note (runtime-adaptive snooze controls)

- **React Native:** notification settings now adapt snooze controls to runtime capability support and explicitly communicate fallback behavior when snooze scheduling is unsupported.

### v1.45.74 parity note (action status clarity on limited runtimes)

- **React Native:** reminder action status now uses user-facing labels and includes explicit listener-unavailable messaging, improving parity transparency on runtimes without live action callbacks.

### v1.45.75 parity note (unknown action fallback policy)

- **React Native:** unknown reminder actions now resolve to explicit Home fallback routing and user-facing status guidance, reducing undefined behavior across runtime variants.

### v1.45.42 parity note (View Logs edit + list baseline)

- **Web:** View Logs supports full entry actions and scales to large histories with deeper card context.
- **React Native:** `LogsScreen` now includes **modal edit flow** (date, flare, core metrics, notes) alongside share/delete, and a first-pass **FlatList tuning** baseline for large histories. Remaining parity backlog is richer per-entry card depth and final virtualization strategy choice.

### v1.45.43 parity note (Charts visual baseline)

- **Web:** Charts uses full visual canvases (combined/individual/balance) with richer animation/chrome and prediction overlays.
- **React Native:** Charts now includes a first combined-view **visual trend chart** baseline using web metric color semantics, while existing trend rows/sparks remain in place. Remaining parity backlog is richer individual/balance visual parity and full animation/prediction overlay behavior.

### v1.45.44 parity note (AI copy/gating increment)

- **Web:** AI Analysis presents "At a glance", findings, and caution sections with clear section flow and gated AI surfaces.
- **React Native:** AI screen now mirrors section flow more closely ("At a glance", "What we found", "How you're doing") and explicitly shows disabled-state copy when AI features are off, while tab visibility remains settings-gated.

### v1.45.45 parity note (View Logs detail depth)

- **Web:** View Logs entry cards/details show broad per-entry context (symptoms, stressors, pain, food, exercise) alongside edit/delete/share.
- **React Native:** View Logs rows and detail modal now surface richer per-entry context (symptoms, stressors, pain location, food, exercise) in addition to edit/share/delete and existing range/sort/filter controls.

### v1.45.46 parity note (Charts individual visual baseline)

- **Web:** Individual charts provide full per-metric visual rendering with richer scale/tooltip behavior.
- **React Native:** Individual chart mode now includes a first per-metric visual trend baseline (color-coded plotted points) alongside the existing numeric summaries and spark bars; deeper visual parity and balance/radar parity remain open.

### v1.45.47 parity note (Charts balance visual baseline)

- **Web:** Balance mode uses richer radar-style visualization semantics.
- **React Native:** Balance mode now includes a first visual baseline chart (color-coded bars for core balance metrics) in addition to the targets snapshot; deeper radar-equivalent semantics and animation/chrome parity remain open.

### v1.45.48 parity note (Notifications settings baseline)

- **Web/Capacitor:** notification behavior includes reminder controls tied to runtime delivery paths.
- **React Native:** Settings now includes notification preference controls (enable, reminder time, sound) plus permission status/request baseline. Full OS scheduling/channel parity remains open.

### v1.45.49 parity note (Goals target persistence baseline)

- **Web:** Goals & targets settings persist and drive charts/goals surfaces.
- **React Native:** mood/sleep/fatigue targets now persist in settings/preferences and feed Charts balance target lines, replacing default-only target behavior for those metrics.

### v1.45.25 parity note (React Native shell)

- Native **bottom tabs** align with web primary navigation intent (Home, logs, charts, optional AI, settings). **Charts → Balance** exposes a **Targets** row (default wellness line) as a stepping stone toward full **Goals & targets** parity with web.

### v1.45.0 parity update

- Voice input now performs explicit microphone permission checks before recognition start, with clearer denied/unsupported feedback.
- Where Capacitor/community speech plugins are available at runtime, their permission APIs are checked/requested before falling back to browser media permission flow.

## CI enforcement

The mobile jobs run:

- `node scripts/check-platform-parity.mjs android`
- `node scripts/check-platform-parity.mjs ios`

These checks fail the build when expected parity hooks or generated native config markers are missing.

## Release traceability

`publish-release` includes `release-assets/Meta/platform-parity.json` so each release has a versioned parity snapshot.
