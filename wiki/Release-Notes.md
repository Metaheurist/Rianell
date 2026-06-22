# Release Notes

## Latest release (v1.121.0)

**Date:** 2026-06-22

### Highlights

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
| v1.120.0 | Theme accent tokenization (PWA), unified onboarding step counter |
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

[docs/CHANGELOG.md](https://github.com/Metaheurist/Rianell/blob/main/docs/CHANGELOG.md)

---

## Downloads for this release

See [[Downloads]] and [GitHub Releases](https://github.com/Metaheurist/Rianell/releases) for Android APK, iOS zip, server EXE, and web deploy.

After each release, maintainers should refresh this page and the Downloads build table.
