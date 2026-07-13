# migrate-residency (optional Edge Function)

**Status:** Deferred - use client-side export/import wizard (`migration-wizard.js`, RN Settings pane) for v1.51.

When enabled, this function would copy encrypted `health_data` rows between Supabase projects using the user's JWT on source and target.

Deploy only after dual-project RLS parity is verified with `scripts/verify-supabase-schema-parity.mjs`.
