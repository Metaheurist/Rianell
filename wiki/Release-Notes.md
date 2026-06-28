# Release Notes

## Latest release (v2.0.7)

**Date:** 2026-06-28

### Highlights

- **Guided onboarding questionnaire:** One friendly modal with multichoice cards (coach tone, helper level, consents, reminders) on web and native — driven by shared `guidedQuestionnaire.mjs`.
- **Child-readable UX:** Custom mascot SVG + animations; explicit consent cards with “See details”; tutorial opt-in from finish or Settings replay.
- **Settings link-back:** “You can change this anytime in Settings” on preference cards.

---

## Previous (v2.0.6)

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
