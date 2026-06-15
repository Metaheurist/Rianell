# Release Notes

## Latest release (v1.89.2)

**Date:** 2026-06-15

### Highlights

- **CI faster:** Dependency caching for npm, pip, Playwright, Gradle, and security scanners — caches refresh only when lockfiles or tool versions change.
- **Post-deploy audit:** Boot audit probes the **exact** `site/` tree uploaded to GitHub Pages (served locally on the audit runner); avoids Cloudflare **403** on live `rianell.com` from GitHub Actions.
- **Workflow efficiency:** Failed gate jobs cancel the rest of the run (benchmark jobs still complete).
- **Boot i18n (v1.89.1):** Privacy gate light locale hydration; `revealAppShellWithLocale()` fixes raw keys on Home after Phase 2b.

### Previous (v1.89.0)

- **Production boot:** App starts on `DOMContentLoaded` instead of `window.load` — fixes rianell.com stuck on “Loading Rianell…” when fonts/CDN hang.
- **Service worker:** Cache bump + boot recovery reload clears stale cached bundles.
- **Build:** Disabled esbuild identifier mangling on `app.js` (minified bundle no longer freezes the main thread).
- **On-device model:** Clear/redownload resets consent; Supabase config race fixed for model URLs.
- **Wiki:** `wiki/` source in repo; `npm run wiki:sync` pushes to GitHub Wiki.

### Previous (v1.88.0)

- **CI benchmarks:** AI layer/algo Playwright jobs use `domcontentloaded` navigation so font/CDN assets cannot block CI for minutes.
- **React Native:** Log wizard exercise chips use stable `id` keys for localized labels; fixes mobile TypeScript check.
- **Locale refresh (v1.87):** Changing language re-renders all tabs without reload; home date is locale-aware.
- **On-device model (v1.85):** Settings → Performance adds **Clear and redownload model** for cache reset.
- **Polish locale (v1.86):** Mixed-language string cleanup for pl-PL packs.

---

## Previous releases (recent)

| Version | Theme |
|---------|-------|
| v1.89.1 | Boot i18n hotfix, OSV/supply-chain, deploy artifact retry |
| v1.84–v1.87 | AI benchmark toolkit, locale refresh, model redownload |
| v1.78–v1.83 | Tier-matrix performance suite, God mode autotest, README doc icons |
| v1.60+ | Full UI localization (13 locales, RTL) |
| v1.53+ | Supabase-hosted LLM chunks, privacy/settings fixes |
| v1.49+ | Capacitor sunset; PWA + RN only |

---

## Full changelog

Complete version history with file-level pointers:

[docs/CHANGELOG.md](https://github.com/Metaheurist/Rianell/blob/main/docs/CHANGELOG.md)

---

## Downloads for this release

See [[Downloads]] and [GitHub Releases](https://github.com/Metaheurist/Rianell/releases) for Android APK, iOS zip, server EXE, and web deploy.

After each release, maintainers should refresh this page and the Downloads build table.
