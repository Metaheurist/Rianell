# Release Notes

## Latest release (v2.2.18)

**Home chrome** - Bug report sits on the **left** edge; **Goals & targets** and **Settings** stay on the **right**. Achievements badges live only in the Goals modal (no Trophy Room on Home). Hard-refresh for `styles.css?v=150` / `app.js?v=69`.

**Log wizard** - Bottom dock (Skip / Save Entry) no longer covers fields on each step; the form reserves scroll space above the dock.

**Mood deck** - Quick-check clipboard and anxious-face icons are larger with clearer lines.

See **v2.2.17** for mood heatmap day labels and AI lifestyle polish.

## Previous (v2.2.17)

**Mood + logging polish** - Mood heatmap tiles show day numbers. Quick mood check uses a clipboard with a half-smile / half-sad face; quick anxiety check uses an anxious face. Severity number boxes now read Low→High the way you expect.

**AI Analysis** - Lifestyle “what helps” cards use clear Helps/Watch and With/Without labels. Advice text no longer leads with emoji. The wellbeing ring shows your score straight away when reduced motion is on.

See **v2.2.16** for drum reduced-motion snap.

## Previous (v2.2.16)

**Wizard drums** - Number boxes snap instantly (no bounce) when the system prefers reduced motion. Hard-refresh for `drum-picker-scroll.js?v=3` / `styles.css?v=146`.

See **v2.2.15** for boot CPU arithmetic freeze fix.

## Previous (v2.2.15)

**Boot reliability** - First-start “Measuring performance… · CPU arithmetic” yields one small adaptive batch at a time so cold Chrome should no longer show **Page Unresponsive**. Hard-refresh after deploy (`device-benchmark.js?v=9+`).

See **v2.2.14** for wizard drums and Goals from the Home header.

## Previous (v2.2.14)

**Wizard controls + Goals** - Log wizard uses lowkey side arrows on desktop (side Next saves on review). Wellness and vital ranges use scroll/drag number boxes with −/+ like SpO2. Open **Goals & targets** from the Home header (not Settings). Demo mode can download the on-device AI model; companions render larger without broken-image chrome.

See **v2.2.13** for Trophy Room and region severity pills.

## Previous (v2.2.13)

**Phase 4 close** - Achievements Trophy Room sits on Home under your profile. In the log wizard, tapped body areas show None / Mild / Pain pills next to the figure (saves the same way as tap-to-cycle).

See **v2.2.12** for advanced vitals accordion and goals placement history.

## Previous (v2.2.12)

**Wizard + Goals (Phase 4)** - Optional advanced vitals sit in a closed accordion. Split-screen body map + scales; daily targets later moved to the Home header Goals modal (v2.2.14).

See **v2.2.11** for Logs/Mood IA.

## Previous (v2.2.11)

**Date:** 2026-07-14

### Highlights

- **Logs:** Quick range pills (All / 7D / 30D / Custom) and a sort toggle. Entries show a one-line summary; expand for Physical, Lifestyle, and Mental details.
- **Mood:** Today's check-in sits at the top. History uses a 30-day colour grid you can tap for day detail.

See **v2.2.10** for the Home command-center layout.

---

## Previous (v2.2.10)

**Date:** 2026-07-14

### Highlights

- **Home:** Cleaner top bar (greeting + date + sync). Big daily log button when you have not logged yet.
- **Targets:** Last-7-days goals show as a compact 2×2 grid instead of long stacked rows.
- **Ask Rianell:** Pattern pills stay light; type a question in the home bar to open chat.

See **v2.2.9** for segmented scale pills and flat card primitives.

---

## Previous (v2.2.9)

**Date:** 2026-07-14

### Highlights

- **Logging scales:** Number pills (1-10) replace bulky sliders on metric widgets; scores still save the same way.
- **Flatter cards:** Single-layer surfaces with soft shadow - less nested green boxes.
- **Docs:** [DESIGN.md](https://github.com/Metaheurist/Rianell/blob/main/DESIGN.md) is the UI declutter roadmap (Phase 1 primitives shipped).

See **v2.2.8** below for heart / trampoline / theme token polish.

---

## Previous (v2.2.8)

**Date:** 2026-07-14

### Highlights

- **Blood pressure dial:** The heart icon is a clearer classic heart shape.
- **Mobility slider art:** One trampoline mat bounces under the stick figure (no double/clipped rim).
- **Themes:** Light-mode toggles, inputs, Skip, and Save Entry follow the active theme colour (no leftover mint edges on Red/Black and other teams).
- **Docs:** Markdown uses hyphens instead of em/en dashes.

See **v2.2.7** below for dependency floors.

---

## Previous (v2.2.7)

**Date:** 2026-07-13

### Highlights

- **Dependencies:** Safer floors for Python (`pydantic`, `cryptography`, `watchdog`, `psycopg2-binary`, `psycopg` >=3.3.4, `websockets` >=15.0.1,<16) and npm (`@sentry/node`, `sharp`, `turbo`, `@supabase/supabase-js`, `jest-expo` 55.0.19, Expo 55 patches). Pinned `react-native-screens` 4.25.2 for RN 0.83; kept babel-preset-expo on SDK 55.
- **Dependabot:** Ignores TypeScript 6+/7, jest-expo/babel-preset-expo 56+, react-native-screens 4.26+, and websockets 16+ until coordinated upgrades.
- **CI:** Soft-pass Live LLM probe on Hugging Face Forbidden from GHA IPs; security inventory regenerated for package 2.2.6.

See **v2.2.6** below for avatar, goals, Ask Rianell gate, and CI/security fixes.

---

## Previous (v2.2.6)

**Date:** 2026-07-13

### Highlights

- **Companion avatar:** Meet-your-companion / Settings character no longer shows a browser broken-image placeholder above the glyph. Generated avatars render inline with hardened paint tokens.
- **Goals progress:** Seven-day pillars and day chips scale to each day’s target %, so incomplete days no longer look “stuck” incomplete.
- **Ask Rianell:** Chat opens only when AI is enabled and the on-device model is ready; otherwise you are prompted to enable and download. Devices that cannot run on-device LLM get guided generic replies.
- **Nav icons:** AI Analysis and Overview chapter icons are larger so they read clearly beside other tabs.
- **Copy:** User-facing em dashes replaced with hyphens across locales and AI suggestions.
- **CI / supply chain:** Node 24-native GitHub Actions artifacts; MobSF action pin fixed; Dependabot ignores unsafe Expo/Babel/RTL majors; OpenTelemetry CVE-2026-54285 cleared via `@opentelemetry/core@2.9.0`; Transformers.js Vault false-positive neutralized.

See **v2.2.5** for settings button contrast and **v2.2.4** for theme mint-leak fixes.

---

## Previous (v2.2.4)

**Date:** 2026-07-13

### Highlights

- **Boot reliability:** First-start “Measuring performance…” no longer freezes on **rAF latency** (or trip Chrome’s Page Unresponsive dialog). The suite still runs behind the loading overlay before content appears, using timer yields only.
- **CI reliability:** Playwright smoke tests run one worker on CI; web benchmarks bound Lighthouse waits and measure PWA/Pages once.

See **v2.2.2** below for CI smoke worker serialization and **v2.2.1** for Ask Rianell offline replies.

---

## Previous (v2.2.2)

**Date:** 2026-07-13

### Highlights

- **CI reliability:** Playwright smoke tests run one worker on CI so boot smoke no longer flakes when two specs hit the local probe server in parallel. Web benchmarks bound Lighthouse waits, measure PWA/Pages once, and fail the job after 25 minutes instead of hanging.
- **Dev tooling:** `scripts/dev/shutdown-pc.ps1` schedules a delayed Windows shutdown for unattended long runs.

See **v2.2.1** below for Ask Rianell offline replies and boot benchmark fixes.

---

## Previous (v2.2.1)

**Date:** 2026-07-08

### Highlights

- **Ask Rianell:** Offline replies now match your question topic (sleep, mood, patterns, fatigue, stress) instead of one canned line; close button and header polish.
- **Mood tab:** Tap a history card to open day detail (full log, check-ins, day average); check-in icons scaled up for readability.
- **Boot reliability:** First-start performance benchmark no longer hangs at “Array throughput” - watchdog aborts and reveals the app if the suite stalls.
- **AI Analysis:** New Overview monitor and Trends & vitals heart/EKG chapter icons; trend metric icons clearer in light mode.
- **Vitals:** BP heart SVG proportion fix; mobility bounce animation no longer freezes on +/- taps.

See **v2.2.0** below for home 3D and server dashboard.

---

## Previous (v2.2.0)

**Date:** 2026-07-06

### Highlights

- **Security:** Service worker rejects cross-origin push notification URLs; new CI guard blocks `eval` / unsafe sinks in PWA source.
- **Cleanup:** Removed dead files (`print-styles.css`, `model-chunk-loader.js`, `first-run-wizard.js`) and archived legacy migration scripts.
- **Structure:** Share modal extracted to `modules/share-modal.js` as a module-split proof pattern.
- **i18n:** `home.chat.inputLabel` in all locales; community tips wait for catalog load before render.
- **Wiki:** New API/Integrations and Accessibility pages.

See **v2.1.8** below for the Visual System Upgrade.

---

## Previous (v2.1.8)

**Date:** 2026-07-06

### Highlights

- **Visual System Upgrade:** Motion tokens, SVG sprite chrome, lazy WebGL ambient layer (home/mood/achievements).
- **RN parity:** Reduce-motion honored on Home, AI, boot, and primary button screens.
- **Home discovery:** AI chat cards replace legacy discovery modal.

---

## Previous (v2.1.7)

**Date:** 2026-07-06

### Highlights

- **Dependency patches:** react 19.2.7, @types/react 19.2.17, react-native-svg, @react-navigation, @playwright/test, and related lockfile sync.
- **Lighthouse 13:** Dev-only benchmark runner bump (production npm audit unchanged).
- **RN type safety:** Carousel ScrollView refs updated for React 19 / @types/react 19.2.17.
- **Dependabot:** Incompatible major bumps (jest 30, babel-preset 0.86+, expo-modules-core 56+) ignored until SDK upgrade.
- **CI:** Lighthouse probe warm-up aligned with Playwright (bundle-ready curl + settle pause) to prevent CLS flake.

See **v2.1.6** below for design token contract and Mood Control Deck.

---

## Previous (v2.1.6)

**Date:** 2026-06-30

### Highlights

- **Design token contract:** `@rianell/tokens` is the single runtime authority; spacing/surface/radius synced to PWA CSS.
- **Mood Control Deck:** Unified 3D glass panel on the Mood tab - daypart orbs, aurora backdrop, parallax tilt, and quick-action tiles (Home check-in unchanged).
- **Log metric polish:** Swelling balloon, irritability thought cloud, mobility trampoline, weather sun/cloud widgets.
- **Cycle timeline:** 45-day unified cycle view with period-start anchor.
- **Benchmark reliability:** Async sliced CPU suite with stall/hard-cap timeouts so boot benchmark cannot hang.
- **RN screen cards:** Shared `ScreenCard` primitive replaces duplicated dark-glass scaffolds across main tabs.
- **Motion compliance:** Progress bars and tab indicator use GPU-friendly `transform` (not `width` animation).
- **CI guard:** `npm run verify:design-tokens` blocks regressions in critical PWA/RN UI files.
- **Cursor guardrails:** Layout, brand-token, and ui-motion rules for agent-assisted UI work.

See **v2.1.5** below for log metrics, onboarding, and companion polish.

---

## Previous (v2.1.5)

**Date:** 2026-06-30

### Highlights

- **Joint swelling / mobility / pain diagram:** Metric and body-map visual fixes.
- **Onboarding:** Companion picker before copy; profile companion framing and accessories.
- **AI Insights:** Pulsing vein ambient layers; feature toggles default on for cycle/digestive/barcode.
- **Getting started achievement:** 3D book SVG milestone art.

---

## Previous (v2.1.4)

**Date:** 2026-06-30

### Highlights

- **Companion names:** Onboarding shows friendly generated names instead of numeric seeds.
- **App lock icon:** Padlock renders as a clear outline on the security screen.
- **Metric animations:** Mobility stick-figure trampoline bounce; swelling knee pulse and ripples.
- **AI trends:** Cleaner Typical / Latest / Outlook layout on trend cards.
- **Navbar polish:** Redesigned tab icons with subtle active animations.
- **AI background:** Slower, reversed neural trace dash animation.

See **v2.1.3** below for log wizard severity and picker polish.

---

## Previous (v2.1.3)

**Date:** 2026-06-29

### Highlights

- **Severity scale:** Low / Moderate / High labels on symptom sliders with raw 1-10 readout.
- **Log review:** Metric intensity bars and urgent vitals highlighting.
- **Symptom picker:** Animated chip icons and i18n fallbacks.
- **Goals modal:** Redesigned target/medal tab art.
- **AI tab:** Full-panel neural trace background.

---

## Previous (v2.1.2)

**Date:** 2026-06-29

### Highlights

- **Companion carousel:** Scrollable picker with 20 unique character silhouettes in onboarding and Settings.
- **Animated achievements:** Per-badge SVG icons (food, exercise, medication, milestones, sleep, cycle, full logger).
- **AI dashboard polish:** Ranked watch cards, lifestyle panels, status-toned trend sparklines.
- **Mood tab:** Compact history and richer sparkline.
- **Removed:** Ambient vibe settings and onboarding step (Oasis motion unchanged).

See **v2.1.1** below for the initial graphics portfolio release.

---

## Previous (v2.1.1)

**Date:** 2026-06-29

### Highlights

- **Profile companions:** Choose from 20 abstract SVG avatars during onboarding or in Settings.
- **Living UI:** Metric companions on sliders, Set D pain body map, and decorated export/connector/goals screens.
- **Accessibility:** Reduced-motion respect; tier-0 devices skip heavy companions.

See **v2.1.0-oasis** below for the bioluminescent UI overhaul.

---

## Previous (v2.1.0-oasis)

**Date:** 2026-06-29

### Highlights

- **UI Oasis:** Ambient bioluminescent blobs on tab panels, calm-glow metric rings, AI neural trace, thinking-text morph, milestone confetti, and check-in shimmer on web.
- **Mobile polish:** `OasisNeuralTrace` on AI screen, ghost breath on balance radar, welcome-card pulse ring, boot loading rings, achievement particle burst.
- **Accessibility:** Brain-fog mode disables spectacle animations; reduced motion gates OS setting **and** in-app preference.
- **Zero new dependencies:** All motion uses existing CSS keyframes and React Native `Animated`.

See also **v2.1.0** (session stability) below.

---

## Previous (v2.1.0)

**Date:** 2026-06-28

### Highlights

- **Freeze/crash fix (desktop):** Resolved long-session tab crash on high-end PCs (Tier 5). Root causes included a 421 MB AI heap spike, unbounded boot log growth, un-teardown `MutationObserver` instances, and 200+ CSP-Report-Only violations per page load.
- **Smarter AI loading:** On-device AI runtime now checks available heap before attempting GPU/MLC paths; falls back to WASM directly if the session is already under memory pressure.
- **Chart memory decay:** Chart `maxPoints` decreases with session age (-40% at 30 min, -60% at 60 min) to keep GPU memory in check across long sessions.
- **Service worker reliability:** Stale SW now auto-applies after 3 "Later" dismissals, preventing outdated asset caching issues.
- **CI gate:** New `verify:cspro` script checks for dangerous Cloudflare CSPRO headers in CI.

---

## Previous (v2.0.9)

**Date:** 2026-06-28

### Highlights

- **Smoother animations:** Spring button presses, staggered AI insights, mood ring draw, and log wizard step slides on mobile; tab and AI card animations refined on web.
- **Wellness sliders:** All health metric sliders now use a **1-10** range (1 = bad, 10 = good) with corrected save/load for symptom fields.
- **Boot experience:** Performance benchmark modal no longer pops up automatically on first launch.

---

## Previous (v2.0.8)

**Date:** 2026-06-28

### Highlights

- **Light mode readability:** Theme tokens for text, cards, and icons; system appearance applied before first paint.
- **Ocean metric animation:** Irritability widget uses theme-derived ocean tokens.
- **Dev Chromium:** Clean profile launcher with reload watcher for local PWA debugging.

---

## Previous (v2.0.7)

**Date:** 2026-06-27

### Highlights

- **BP + BPM drums:** Blood pressure widget uses systolic mmHg + resting BPM pickers.
- **Metric animations:** Glucose droplet, mobility/swelling/mood SVG upgrades.
- **Achievement toast:** Layout fix for unlock notification button.
- **Typography:** ASCII hyphen normalization across locale packs.

---

## Previous (v1.135.0)

**Date:** 2026-06-27

### Highlights

- **Third-party connectors:** Connect **Strava**, **Withings**, and **Google Sheets** from Settings → Integrations. OAuth runs in a popup (web) or system browser (mobile). Manual **Sync now** imports activities and vitals into daily logs with date-aware merge.
- **Google Sheets bidirectional sync:** Configure spreadsheet URL and ranges; import rows into logs or export recent entries (up to 90 days).
- **Security:** OAuth tokens encrypted server-side in `connector_tokens`; clients only see connection status.
- **React Native parity:** Connect/Sync/Disconnect on Android/iOS via `rianell://` deep link after OAuth.
- **Docs:** Operator guide at [docs/connectors/SETUP.md](https://github.com/Metaheurist/Rianell/blob/main/docs/connectors/SETUP.md).

---

## Previous (v1.134.0)

**Date:** 2026-06-26

### Highlights

- **Hosted share links:** Create a time-limited, password-encrypted link to share a read-only view of your logs with a clinician or carer. Choose date range, whether to include free-text notes, and a password. Data is encrypted client-side (PBKDF2 310 000 iterations + AES-GCM) before upload - Rianell never sees unencrypted health data.
- **App lock PIN mode:** App lock now supports both a **passphrase** (12+ characters) and a **PIN** (4-8 digits). Weak PINs (repeating digits, sequential runs) are blocked.
- **Password strength:** Encrypted exports, QR handoffs, and share links now require a minimum **12-character** passphrase (raised from 8). A strength estimator provides live feedback.
- **PWA install guide:** Platform-specific install instructions (iOS Safari, macOS Safari, Chrome, Firefox, Edge) with step-by-step guidance and illustrations.
- **Log range slider:** Log date range now uses a smooth slider instead of discrete buttons.
- **Check-in icons:** New time-of-day icons (morning, midday, evening) for quick check-ins.
- **i18n:** 20+ new translation keys across all 15 supported locales.
- **CI:** Android and iOS manifests now include direct download/install URLs.

---

## Version history (selected)

| Version | Summary |
| --- | --- |
| v2.0.6 | Unified wellness sliders; onboarding polish; goals prompt; metric animations |
| v2.0.5 | BP + BPM drums; metric animation polish; achievement toast fix |
| v2.0.0 | Rianell 2.0 production; cycle timeline; vitals hints; beta branding removed |
| v1.135.0 | Strava/Withings/Google Sheets OAuth connectors |
| v1.134.0 | AI Analysis tab overhaul; hosted share links |
| v1.133.0 | Accessibility & UI principles (Plan 26) |
| v1.132.0 | Data migration toolkit (Plan 25) |

See [CHANGELOG.md](https://github.com/Metaheurist/Rianell/blob/main/CHANGELOG.md) for the full Keep a Changelog entry list.
