# Supabase SQL

**Apply now:** [APPLY.md](./APPLY.md) — step-by-step for project `gitnxgfbbpykwqvogmqq`.

All database SQL lives in **`Schema.sql`** (idempotent; §0 test reset stays commented for production).

| Section | Contents |
|---------|----------|
| §0 | Test reset (commented — dev wipe only) |
| §1 | Tables + `research_facets` migration |
| §2 | RLS policies |
| §3 | Grants + `pg_graphql` drop |
| §4 | Pool insight RPCs |
| §5 | Post-apply verification SELECTs |

**Already configured (no SQL step):** GitHub secrets → CI injects URL + anon key into PWA/RN builds.

**Manual setup (not in SQL):** See [docs/plans/EXTERNAL-SETUP.md](../docs/plans/EXTERNAL-SETUP.md) — Email auth; VAPID for Web Push.
