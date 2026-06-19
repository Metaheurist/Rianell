# Execution plans — agent workspace

Dependency-ordered rollout of 87 required features across 14 plans (**all shipped**, v1.111.0). Each plan lives in its **own folder** under `docs/plans/`.

## Root files

| File | Purpose |
|------|---------|
| [MASTER.md](./MASTER.md) | Features, progress, section status |
| [00-execution-index.md](./00-execution-index.md) | Exec order 01–14, dependency graph |
| [ROLLOUT-GATE.md](./ROLLOUT-GATE.md) | Local gate + commit + CI watch loop |
| [SECURITY-PERFORMANCE-INDEX.md](./SECURITY-PERFORMANCE-INDEX.md) | CVE/perf rollup for all plans |
| [FREE-TIER-POLICY.md](./FREE-TIER-POLICY.md) | **Mandatory** — free providers only, no paid APIs |
| [UI-UX-STANDARDS.md](./UI-UX-STANDARDS.md) | Mobile + desktop parity, a11y, perf UX |
| [EXTERNAL-SETUP.md](./EXTERNAL-SETUP.md) | Supabase SQL, VAPID, env vars — step-by-step |
| [FINAL-EXECUTION-CHECK.md](./FINAL-EXECUTION-CHECK.md) | Final audit (2026-06-18) + Firecrawl verification |

## Plan folders

| Exec | Folder | Section |
|------|--------|---------|
| 01 | [plan-01-platform-architecture](./plan-01-platform-architecture/) | Platform |
| 02 | [plan-02-accessibility-i18n](./plan-02-accessibility-i18n/) | i18n |
| 03 | [plan-03-settings-onboarding](./plan-03-settings-onboarding/) | Settings |
| 04 | [plan-04-logging-data-capture](./plan-04-logging-data-capture/) | Logging |
| 05 | [plan-05-privacy-compliance](./plan-05-privacy-compliance/) | Privacy |
| 06 | [plan-06-cloud-sync](./plan-06-cloud-sync/) | Cloud sync |
| 07 | [plan-07-ai-engine](./plan-07-ai-engine/) | AI engine |
| 08 | [plan-08-llm-nlp](./plan-08-llm-nlp/) | LLM/NLP |
| 09 | [plan-09-charts-analytics](./plan-09-charts-analytics/) | Charts |
| 10 | [plan-10-home-dashboard](./plan-10-home-dashboard/) | Home |
| 11 | [plan-11-notifications](./plan-11-notifications/) | Notifications |
| 12 | [plan-12-clinician-sharing](./plan-12-clinician-sharing/) | Clinician |
| 13 | [plan-13-research-community](./plan-13-research-community/) | Research |
| 14 | [plan-14-cross-cutting](./plan-14-cross-cutting/) | Cross-cutting |

## Per-plan folder layout

```
plan-NN-<name>/
  plan.md                    # Runbook (phases, gates)
  security-performance.md    # CVE exploits + perf review
  scope.md                   # In/out of scope, scripts
  references.md              # Firecrawl + internal docs
  scripts/
    verify-plan.mjs          # Pre-rollout verify
```

## Workflow (each plan)

1. Read `plan.md` + `security-performance.md`
2. Implement by phase; run `scripts/verify-plan.mjs`
3. `npm run projects:gate` ([launch-server.ps1](../../server/launch-server.ps1))
4. CHANGELOG + MASTER → commit → `npm run projects:ci-watch`
5. Stop on error; fix; loop until green

## Regenerate plan docs

After updating plan metadata:

```bash
node scripts/projects/generate-plan-folder-docs.mjs
```

Firecrawl cache: `.firecrawl/projects/` (gitignored).
