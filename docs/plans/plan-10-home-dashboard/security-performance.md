# Plan 10 — Security & performance review

**Section 1:** Home & dashboard · **IDs:** H1–H7

Cross-checked against repo [SECURITY.md](../../SECURITY.md), [ai-security.md](../../ai-security.md), and Firecrawl research in [.firecrawl/projects/](../../../.firecrawl/projects/).

---

## CVE & exploit surface

- H5 weather: [Open-Meteo](https://open-meteo.com/) — no API key; opt-in geolocation only; round coords; client rate-limit 1/hr; no precise geolocation stored without consent.
- H7 LLM question: same injection rules as homeQuestion intent.

**CI baseline:** `npm audit --omit=dev`, OSV-Scanner, Gitleaks in [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml). High/critical production deps must be fixed or accepted-risk documented before plan rollout commit.

---

## Performance

- H1 adaptive layout: compute card order once per session/day, not every render.
- H2 spoon widget: derive from cached aggregates, not full log scan.

**Local gate:** [`server/launch-server.ps1`](../../../server/launch-server.ps1) compiled mode + boot audit — no console `pageerror` regressions.

---

## Mitigations (implementation)

- Respect S5 simple mode + aiEnabled
- Max font scale layout test

---

## Pre-commit verify

```bash
node docs/plans/plan-10-home-dashboard/scripts/verify-plan.mjs
npm run projects:gate
```

See [../ROLLOUT-GATE.md](../ROLLOUT-GATE.md).
