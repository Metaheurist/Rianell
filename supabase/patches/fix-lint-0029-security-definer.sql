# Patch: Security Advisor lint 0029

**Problem:** `public.*` functions were `SECURITY DEFINER` + `GRANT EXECUTE TO authenticated` → lint **0029**.

**Fix (in repo `Schema.sql` §4–§4b):**

- `private.*_impl` — `SECURITY DEFINER` (cross-user aggregation / erasure)
- `public.*` — `SECURITY INVOKER` wrappers (same RPC names for PWA/RN)

## Apply on an already-upgraded database

1. Open [SQL Editor](https://supabase.com/dashboard/project/gitnxgfbbpykwqvogmqq/sql/new).
2. Copy **§4 through §4b** from `../Schema.sql` (from `CREATE SCHEMA IF NOT EXISTS private` through the last `GRANT EXECUTE` on `delete_all_user_data`).
3. **Run** — expect success.
4. **Security Advisor** → refresh — the three **0029** warnings on `public.count_pool_contribution_days`, `public.get_k_anon_pool_insights`, and `public.delete_all_user_data` should disappear.

Alternatively re-run the **entire** `Schema.sql` (idempotent; keep §0 commented).

## Note

Advisor may still list `private.*_impl` if it scans all schemas. Those functions are **not** exposed via PostgREST (only `public` is in the API).
