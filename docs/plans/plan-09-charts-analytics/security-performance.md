# Plan 09 — Security & performance review

**Section 3:** Charts & analytics · **IDs:** C1–C10

Cross-checked against repo [SECURITY.md](../../SECURITY.md), [ai-security.md](../../ai-security.md), and Firecrawl research in ``.firecrawl/projects/`` (gitignored local cache).

---

## CVE & exploit surface

- ApexCharts: sanitize series labels from user custom metrics (C8) before render.
- C6 PDF/PNG export: no embedded JS in PDF generators.

**CI baseline:** `npm audit --omit=dev`, OSV-Scanner, Gitleaks in [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml). High/critical production deps must be fixed or accepted-risk documented before plan rollout commit.

---

## Performance

- C10 quick win: localStorage read once per charts tab open.
- Lazy-load ApexCharts; destroy charts on tab hide to free WebGL/canvas memory.
- C1 correlation cards: compute from cached A3 results, not re-run engine per render.

**Local gate:** [`server/launch-server.ps1`](../../../server/launch-server.ps1) compiled mode + boot audit — no console `pageerror` regressions.

---

## Mitigations (implementation)

- I5 high-contrast palettes when ready
- C4 only with L7 data

---

## Pre-commit verify

```bash
node docs/plans/plan-09-charts-analytics/scripts/verify-plan.mjs
npm run projects:gate
```

See [../ROLLOUT-GATE.md](../ROLLOUT-GATE.md).
