# Plan 02 — Scope & scripts

**Section 10:** Accessibility & i18n · **IDs:** I1–I5

## In scope

- Features listed in [plan.md](./plan.md) and [../MASTER.md(../MASTER.md) §10
- I6 NR. I5 chart palettes validated with plan 09.

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
| `node docs/plans/plan-02-accessibility-i18n/scripts/verify-plan.mjs` | Before local gate |
| `npm run projects:gate` | Full local CI-parity test |
| `npm run projects:ci-watch` | After push |
