# Single Supabase project

**Status:** Active (v1.52+)

All users share **one Supabase project and one PostgreSQL database**. Privacy region controls legal policy packs, feature gates, and **default UI language** — not separate cloud backends.

## Cloud storage

- Encrypted backups (`health_data`, `user_keys`) live in the operator’s single Supabase project.
- `user_privacy_profile.data_residency_code` is informational (`default`) for audit; there is no per-user project routing.
- Do not configure EU/US dual projects or migration wizards for this deployment model.

## Operator checklist

1. One Supabase URL + anon key in PWA `supabase-config.js` and RN `EXPO_PUBLIC_SUPABASE_*`.
2. Apply [`supabase/Schema.sql`](../../supabase/Schema.sql) including `ui_locale` on `user_privacy_profile`.
3. Document physical hosting region in [`subprocessors.md`](subprocessors.md).

## Policy strings in locale packs (v1.60)

- **`policy.*`** UI strings (titles, summaries) live in **`i18n-packs/locale-packs/v1/{locale}.json`** alongside app chrome.
- Non–en-GB locales may include **machine-translated** policy text merged by **`scripts/i18n/auto-translate-policy-strings.mjs`**. This is **not** blocked by legal review in CI.
- **Disclaimer:** `policy.machineTranslatedNotice` is shown in the PWA policy viewer and RN **`PolicyDocumentsModal`** for non–en-GB locales; **en-GB** text and linked policy pack remain authoritative.

## Related

- [`region-policy-execution-plan.md`](region-policy-execution-plan.md) — full execution plan (v2)
- [`i18n-packs/locale-packs/v1/`](../../i18n-packs/locale-packs/v1/) — UI string catalogs
