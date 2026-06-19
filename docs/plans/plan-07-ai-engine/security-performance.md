# Plan 07 — Security & performance review

**Section 4:** AI engine (deterministic) · **IDs:** A1–A8

Cross-checked against repo [SECURITY.md](../../SECURITY.md), [ai-security.md](../../ai-security.md), and Firecrawl research in [.firecrawl/projects/](../../../.firecrawl/projects/).

---

## CVE & exploit surface

- No new network CVE surface — local-only; ensure A8 export strips direct identifiers.
- A5 anomaly alerts: false positives are UX risk, not CVE — document thresholds.

**CI baseline:** `npm audit --omit=dev`, OSV-Scanner, Gitleaks in [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml). High/critical production deps must be fixed or accepted-risk documented before plan rollout commit.

---

## Performance

- A1 parity: run analysis in worker chunk or requestIdleCallback on PWA for large logs.
- A3 hypothesis engine: cap factor count; memoize on log hash.

**Local gate:** [`server/launch-server.ps1`](../../../server/launch-server.ps1) compiled mode + boot audit — no console `pageerror` regressions.

---

## Mitigations (implementation)

- Fixture tests PWA vs RN ranking
- GDPR Art. 22 disclaimers preserved

---

## Pre-commit verify

```bash
node docs/plans/plan-07-ai-engine/scripts/verify-plan.mjs
npm run projects:gate
```

See [../ROLLOUT-GATE.md](../ROLLOUT-GATE.md).
