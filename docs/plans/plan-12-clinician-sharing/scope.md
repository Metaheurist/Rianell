# Plan 12 — Scope & scripts

**Section 11:** Clinician & sharing · **IDs:** CL1, CL2, CL4, CL5

## In scope

- Features listed in [plan.md](./plan.md) and [../MASTER.md(../MASTER.md) §11
- X14.4 telehealth mode extends CL1/C6.

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
| `node docs/plans/plan-12-clinician-sharing/scripts/verify-plan.mjs` | Before local gate |
| `npm run projects:gate` | Full local CI-parity test |
| `npm run projects:ci-watch` | After push |
