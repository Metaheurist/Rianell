# Plan 04 - Scope & scripts

**Section 2:** Logging & data capture · **IDs:** L1-L11 (excl L4, L10, L12 NR)

## In scope

- Features listed in [plan.md](./plan.md) and [../MASTER.md(../MASTER.md) §2
- L4 drug interactions NR. L10 wearables NR. L12 photo journal NR.

## Out of scope (NR)

See [../MASTER.md §Excluded(../MASTER.md#excluded-nr). **L10** (HealthKit, Health Connect, Fitbit) excluded - requires Xcode and paid Apple Developer account.

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
| `node docs/plans/plan-04-logging-data-capture/scripts/verify-plan.mjs` | Before local gate |
| `npm run projects:gate` | Full local CI-parity test |
| `npm run projects:ci-watch` | After push |
