# Release Notes

## Latest release (v1.135.0)

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

## Previous (v1.96.2)

**Date:** 2026-06-24

### Highlights

- **First-run onboarding (web):** **Enable** and **Skip for now** on the **Enable AI & Goals?** tutorial slide work again — consent enforcement no longer blocks clicks while the wizard is open.
- **Region step:** Wizard re-shows the privacy region step if settings drift out of sync during onboarding.

### Previous (v1.96.0)

**Date:** 2026-06-23

### Highlights

- **Delete cloud data:** When the Supabase Edge Function is deployed, **Delete cloud data** removes all app tables **and** your login (Auth user). Falls back to per-table deletes if the function is unavailable.
- **security.txt:** Responsible disclosure file ships at `/.well-known/security.txt` after the next Pages deploy (v1.96.0 CI fix).
- **Supabase:** Security Advisor **0029** cleared via `private` impl + public invoker wrappers; fresh-install SQL available for empty projects.
- **Cloudflare:** Edge sets `frame-ancestors 'self'` and companion headers; full CSP stays in the PWA (do not duplicate a narrow HTTP CSP).

### Previous (v1.121.0)

**Date:** 2026-06-22

- **Cycle tracking (web + native):** Tap **Period started today** to anchor day 1; future logs auto-count cycle days from that date. Day picker shows **1–35** by default with an option for **36–45** when cycles run long.
- **Late-cycle hint:** Days above 35 show informational copy (symptom logging only — not medical advice).

### Previous (v1.120.0)

**Date:** 2026-06-21

### Highlights

- **Themes (web):** Switching from Mint to Red/Black (or Mono/Rainbow) now updates modals, AI Analysis cards, Mood accents, chart prediction lines, and save-button icons — not just the navbar.
- **Onboarding:** One continuous **step counter** across the first-run wizard and each tutorial slide (PWA + native app).

### Previous (v1.119.0)

- **Cycle tracking:** SVG phase icons, smoother day picker (scroll without visible bar), auto-suggest day/phase from your last log and selected date; tutorial slide to enable the module.
- **Home:** Recent patterns card styling; Weekly Health Review shows **Enable AI** until the on-device model is downloaded.
- **Mood tab (web):** Trend sparkline fits narrow screens.
- **Logging modules:** Barcode food and guided voice logging removed from Settings for now (not shipped); cycle tracking remains.

### Previous (v1.118.0)

- **Supabase:** Pool insight RPCs no longer executable by `anon` (Security Advisor lint 0028).
- **RN:** Typecheck fixes for Goals modal and achievements.

### Previous (v1.117.0)

- **Achievements:** Food, exercise, and medication logging unlock badges with optional unlock notifications.
- **Goals modal:** PWA + RN carousel — targets + achievements panes.

### Previous (v1.115.0)

- **PWA boot:** Fixed black screen when `#appShell` was nested inside settings overlay.
- **Smartlook (initial):** EU session recording infrastructure (PWA + RN).

---

## Previous releases (recent)

| Version | Theme |
|---------|-------|
| v1.135.0 | Strava/Withings/Google Sheets OAuth connectors |
| v1.134.0 | Hosted share links, app lock PIN, password strength |
| v1.96.0 | Full account erasure Edge Function, security.txt Pages fix, Supabase 0029, Cloudflare headers |
| v1.121.0 | Cycle period-start anchor, Goals carousel i18n |
| v1.119.0 | Cycle tracking UX, Home cards, Mood sparkline, deferred barcode/voice |
| v1.118.0 | Onboarding UX, Smartlook default-on, Goals carousel fix |
| v1.115.0 | PWA boot shell fix, Smartlook infrastructure |
| v1.114.0 | Security lock settings tab, Home/Charts UX trim |
| v1.113.0 | Mood tab, Home weather inline, i18n fixes |
| v1.89.1–v1.89.2 | CI caching, post-deploy boot audit |
| v1.60+ | Full UI localization (13 locales, RTL) |

---

## Full changelog

Complete version history with file-level pointers:

[docs/CHANGELOG.md](https://github.com/Metaheurist/Rianell/blob/main/CHANGELOG.md)

---

## Downloads for this release

See [[Downloads]] and [GitHub Releases](https://github.com/Metaheurist/Rianell/releases) for Android APK, iOS zip, server EXE, and web deploy.

After each release, maintainers should refresh this page and the Downloads build table.
