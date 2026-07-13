# Plan 03 - Scope & scripts

**Section 6:** Settings & onboarding · **IDs:** S1-S8

## In scope

- Features listed in [plan.md](./plan.md) and [../MASTER.md(../MASTER.md) §6
- S5 simple mode hides AI/pool - test with plan 14 X14.3.

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
| `node docs/plans/plan-03-settings-onboarding/scripts/verify-plan.mjs` | Before local gate |
| `npm run projects:gate` | Full local CI-parity test |
| `npm run projects:ci-watch` | After push |
