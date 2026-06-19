# Apply Schema.sql to Supabase

**Project:** `gitnxgfbbpykwqvogmqq` (matches GitHub secret `SUPABASE_URL` / rianell.com deploy)

## Before you run

- [ ] **Leave §0 TEST RESET commented out** — you are upgrading production, not wiping it.
- [ ] GitHub secrets `SUPABASE_URL` + `SUPABASE_ANON_KEY` are already set (no change needed after SQL).
- [ ] Optional: **Authentication → Providers → Email** enabled if users sign in with email.

## Apply (one paste)

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/gitnxgfbbpykwqvogmqq/sql/new).
2. Open `Schema.sql` in this repo — select all (**Ctrl+A**) and copy.
3. Paste into SQL Editor.
4. Click **Run** (or Ctrl+Enter).
5. Expect: **Success. No rows returned** for the main transaction (§1–§4).

## Verify

Scroll to **§5 POST-APPLY VERIFICATION** at the bottom of `Schema.sql`, select that block only, and **Run** again.

| Check | Expected |
|-------|----------|
| `tables` | 5 rows: `anonymized_data`, `bug_reports`, `health_data`, `user_keys`, `user_privacy_profile` |
| `rls_enabled` | All 5 tables → `ok` |
| `policy_count` | Policies on each table (17 total across tables) |
| `rpc` | 2 rows: `count_pool_contribution_days`, `get_k_anon_pool_insights` |
| `column` | `anonymized_data.research_facets` → `ok` |

Then: **Database → Security Advisor** — GraphQL exposure warnings (0026/0027) should clear after §3.

## Smoke test (app)

1. Open https://rianell.com → Settings → sign in (if configured).
2. Toggle cloud sync / privacy profile save — no console errors referencing missing tables.
3. Research pool (Plan 13): opt-in + condition set — RPC should not 404.

## If something fails

| Error | Fix |
|-------|-----|
| `relation "auth.users" does not exist` | Wrong database — use the Supabase project SQL Editor, not local Postgres. |
| `policy already exists` | Re-run whole file — policies use `DROP POLICY IF EXISTS` first. |
| `permission denied for extension pg_graphql` | Safe to ignore if extension already absent; or run §3 grants block alone. |
| Missing `user_privacy_profile` on old DB | Re-run §1 — `CREATE TABLE IF NOT EXISTS` creates it without touching other tables. |

## Do not run on production

- Uncommenting **§0 TEST RESET** — deletes all auth users and app table data.
