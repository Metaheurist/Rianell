# Plan 08 — Scope & scripts

**Section 5:** On-device LLM & NLP · **IDs:** N1–N11 (excl N8 NR)

## In scope

- Features listed in [plan.md](./plan.md) and [../MASTER.md(../MASTER.md) §5
- N8 sensor fusion NR (depends on excluded L10 wearables).

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
| `node docs/plans/plan-08-llm-nlp/scripts/verify-plan.mjs` | Before local gate |
| `$env:PROJECTS_EXTRA_VERIFY = "verify:llm-security"` | Plan 08 extra gate |
| `npm run projects:gate` | Full local CI-parity test |
| `npm run projects:ci-watch` | After push |
