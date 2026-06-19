# Plan 01 — Security & performance review

**Section 13:** Platform & architecture · **IDs:** T1, T2

Cross-checked against repo [SECURITY.md](../../SECURITY.md), [ai-security.md](../../ai-security.md), and Firecrawl research in ``.firecrawl/projects/`` (gitignored local cache).

---

## CVE & exploit surface

- Supply-chain: new Storybook/npm deps in T2 — run `npm audit --omit=dev` + OSV before merge.
- ES module split (T1): accidental exposure of internal APIs via `window.*` — avoid new globals.

**CI baseline:** `npm audit --omit=dev`, OSV-Scanner, Gitleaks in [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml). High/critical production deps must be fixed or accepted-risk documented before plan rollout commit.

---

## Performance

- T1 extraction must not regress initial bundle: keep lazy-load for charts/LLM paths.
- Storybook (T2) is dev-only; exclude from `build-site.mjs` production graph.

**Local gate:** [`server/launch-server.ps1`](../../../server/launch-server.ps1) compiled mode + boot audit — no console `pageerror` regressions.

---

## Mitigations (implementation)

- Pin Storybook in root devDependencies; SBOM via CI security-audit job.
- Incremental extract + `npm run build:web` + boot audit each slice.

---

## Pre-commit verify

```bash
node docs/plans/plan-01-platform-architecture/scripts/verify-plan.mjs
$env:PROJECTS_EXTRA_VERIFY = "verify:root-hygiene"  # PowerShell
npm run projects:gate
```

See [../ROLLOUT-GATE.md](../ROLLOUT-GATE.md).
