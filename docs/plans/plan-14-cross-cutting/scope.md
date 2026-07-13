# Plan 14 - Scope & scripts

**Section 14:** Cross-cutting concepts · **IDs:** X14.1-X14.5

## In scope

- Features listed in [plan.md](./plan.md) and [../MASTER.md(../MASTER.md) §14
- Capstone - no new IDs; integrates prior plans.

## Out of scope (NR)

See [../MASTER.md §Excluded(../MASTER.md#excluded-nr).

## Folder layout

| File | Purpose |
|------|---------|
| [plan.md](./plan.md) | Agent runbook |
| [security-performance.md](./security-performance.md) | CVE + perf review |
| [references.md](./references.md) | External docs + Firecrawl |
| [scripts/verify-plan.mjs](./scripts/verify-plan.mjs) | Pre-rollout verify |

## Agent scripts (repo root)

| Command | When |
|---------|------|
| `node docs/plans/plan-14-cross-cutting/scripts/verify-plan.mjs` | Before local gate |
| `npm run projects:gate` | Full local CI-parity test |
| `npm run projects:ci-watch` | After push |
