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

## Related

- [`region-policy-execution-plan.md`](region-policy-execution-plan.md) — full execution plan (v2)
- [`locale-packs/v1/`](../../locale-packs/v1/) — UI string catalogs
