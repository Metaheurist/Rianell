# Release Notes

## Latest release (v2.1.9)

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
- **Mood Control Deck:** Unified 3D glass panel on the Mood tab — daypart orbs, aurora backdrop, parallax tilt, and quick-action tiles (Home check-in unchanged).
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

- **Severity scale:** Low / Moderate / High labels on symptom sliders with raw 1–10 readout.
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
- **Chart memory decay:** Chart `maxPoints` decreases with session age (–40% at 30 min, –60% at 60 min) to keep GPU memory in check across long sessions.
- **Service worker reliability:** Stale SW now auto-applies after 3 "Later" dismissals, preventing outdated asset caching issues.
- **CI gate:** New `verify:cspro` script checks for dangerous Cloudflare CSPRO headers in CI.

---

## Previous (v2.0.9)

**Date:** 2026-06-28

### Highlights

- **Smoother animations:** Spring button presses, staggered AI insights, mood ring draw, and log wizard step slides on mobile; tab and AI card animations refined on web.
- **Wellness sliders:** All health metric sliders now use a **1–10** range (1 = bad, 10 = good) with corrected save/load for symptom fields.
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

- **Hosted share links:** Create a time-limited, password-encrypted link to share a read-only view of your logs with a clinician or carer. Choose date range, whether to include free-text notes, and a password. Data is encrypted client-side (PBKDF2 310 000 iterations + AES-GCM) before upload — Rianell never sees unencrypted health data.
- **App lock PIN mode:** App lock now supports both a **passphrase** (12+ characters) and a **PIN** (4–8 digits). Weak PINs (repeating digits, sequential runs) are blocked.
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
