# Changelog

All notable changes to the Rianell monorepo are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). Versions use `v<major>.<minor>.<patch>` aligned with npm workspace roots.

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

### Fixed

- **Brain fog mode toggle:** Calls `loadSettingsState()` so the switch UI updates and persists.
- **App lock i18n:** Expose `window.tUi`; app-lock module uses `RianellI18n.t` with English fallbacks; PIN setup hint no longer shows raw keys.
- **App lock PIN save:** 4-digit PINs no longer rejected with “Passphrase must be at least 12 characters”; lock overlay prompts on return when PIN is saved.
- **Dev panel tabs:** All Developer & API tabs visible (Keys, Webhooks, etc.).

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
