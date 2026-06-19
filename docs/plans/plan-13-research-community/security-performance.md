# Plan 13 — Security & performance review

**Section 12:** Research & anonymized pool · **IDs:** RE1, RE4

Cross-checked against repo [SECURITY.md](../../SECURITY.md), [ai-security.md](../../ai-security.md), and Firecrawl research in ``.firecrawl/projects/`` (gitignored local cache).

---

## CVE & exploit surface

- RE1 k-anonymity: never return cohort stats below k threshold (recommend k>=5 document in UI).
- Re-identification via rare condition + date — suppress small cells.
- RE4 export: user own rows only; RLS enforced.

**CI baseline:** `npm audit --omit=dev`, OSV-Scanner, Gitleaks in [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml). High/critical production deps must be fixed or accepted-risk documented before plan rollout commit.

---

## Performance

- Aggregation server-side or edge; cache cohort stats daily, not per request.

**Local gate:** [`server/launch-server.ps1`](../../../server/launch-server.ps1) compiled mode + boot audit — no console `pageerror` regressions.

---

## Mitigations (implementation)

- A8 payload shape
- P5 DPIA helper copy
- RE2/RE3 NR

---

## Pre-commit verify

```bash
node docs/plans/plan-13-research-community/scripts/verify-plan.mjs
npm run projects:gate
```

See [../ROLLOUT-GATE.md](../ROLLOUT-GATE.md).
