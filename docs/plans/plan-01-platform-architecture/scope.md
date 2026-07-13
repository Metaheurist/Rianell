# Plan 01 - Scope & scripts

**Section 13:** Platform & architecture · **IDs:** T1, T2

## In scope

- Features listed in [plan.md](./plan.md) and [../MASTER.md(../MASTER.md) §13
- DevEx only; no PHI in Storybook stories. Use synthetic fixtures.

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
| `node docs/plans/plan-01-platform-architecture/scripts/verify-plan.mjs` | Before local gate |
| `npm run projects:gate` | Full local CI-parity test |
| `npm run projects:ci-watch` | After push |
