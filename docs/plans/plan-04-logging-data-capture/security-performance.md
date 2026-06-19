# Plan 04 — Security & performance review

**Section 2:** Logging & data capture · **IDs:** L1–L11 (excl L4, L10, L12 NR)

Cross-checked against repo [SECURITY.md](../../SECURITY.md), [ai-security.md](../../ai-security.md), and Firecrawl research in ``.firecrawl/projects/`` (gitignored local cache).

---

## CVE & exploit surface

- L5 barcode/OFF API: SSRF if URL user-controlled — allowlist openfoodfacts.org only.
- L11 voice→LLM: prompt injection in STT output — delimiter + schema validation (AI-02).

**CI baseline:** `npm audit --omit=dev`, OSV-Scanner, Gitleaks in [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml). High/critical production deps must be fixed or accepted-risk documented before plan rollout commit.

---

## Performance

- L8 sub-entries: index by date key; avoid O(n) full log scan on every home render.

**Local gate:** [`server/launch-server.ps1`](../../../server/launch-server.ps1) compiled mode + boot audit — no console `pageerror` regressions.

---

## Mitigations (implementation)

- Extend normalizeLogEntry with migration tests.
- L9 offline queue: idempotent flush.

---

## Pre-commit verify

```bash
node docs/plans/plan-04-logging-data-capture/scripts/verify-plan.mjs
npm run projects:gate
```

See [../ROLLOUT-GATE.md](../ROLLOUT-GATE.md).
