# Region, policy & UI localization — execution plan (v2.0)

**Product:** Rianell · **Version track:** v1.52+ · **Last updated:** 2026-06-13

## Summary

| Before | After |
|--------|--------|
| EU/US Supabase projects + migration wizard | **One Supabase project, one database** |
| Privacy region = legal/policy only | Region sets **default UI locale** + policy |
| English hardcoded | **Tokenized UI** via `i18n-packs/locale-packs/v1/` |
| Default unset | **Default `eea_uk` + `en-GB`**; language override in Settings |

## Architecture

- **Single cloud:** One URL/key in PWA and RN; no `getSupabaseClientForResidency` routing.
- **Region → locale:** `i18n-packs/policy-packs/v1.json` `defaultLocale` / `supportedLocales` per region.
- **Prefs:** `uiLocale`, `uiLocaleSource`; Supabase `user_privacy_profile.ui_locale` overwrites local on login.
- **i18n:** `packages/shared/src/i18n/` + `i18n-packs/locale-packs/v1/*.json`; PWA `RianellI18n`; RN `I18nProvider` + `useT()`.

See [`single-project-residency.md`](single-project-residency.md) for operator notes.

## Phases

| Phase | ID | Status |
|-------|-----|--------|
| A — Docs pivot | PLAN-A | done |
| B — Single-project simplification | SP-01–05 | done |
| C — i18n foundation | LC-00–05 | done |
| D — Locale rollout | LC-06–08 | done |
| E — UI tokenization | LC-09–14 | done (gate, settings, nav, cloud; incremental for remaining screens) |
| F — Parity | PARITY-i18n | done |

## Cancelled (RP-39–66)

Multi-project residency, migration wizard, storage chooser, dual CI secrets — superseded by single-project model.

## Verification

```bash
node scripts/verify/verify-policy-packs.mjs
node scripts/verify/verify-locale-packs.mjs
node scripts/verify/verify-privacy-docs.mjs
node scripts/verify/verify-supabase-schema-parity.mjs
npm run test:unit
npm run test:mobile
npm run parity:inventory:check
```

## Operator actions

1. Apply `user_privacy_profile` DDL including `ui_locale` from [`supabase/Schema.sql`](../../supabase/Schema.sql).
2. Configure one Supabase project in PWA/RN env.
3. Manual smoke: gate default region/locale; Settings language override; login restores account locale.
