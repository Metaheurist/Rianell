# Plan 06 — Scope & scripts

**Section 6:** Cloud sync & portability · **IDs:** D1–D7

## In scope

- Features listed in [plan.md](./plan.md) and [../MASTER.md(../MASTER.md) §6
- D6/D7 security review before production.

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
| `node docs/plans/plan-06-cloud-sync/scripts/verify-plan.mjs` | Before local gate |
| `npm run projects:gate` | Full local CI-parity test |
| `npm run projects:ci-watch` | After push |
