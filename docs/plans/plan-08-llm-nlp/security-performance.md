# Plan 08 — Security & performance review

**Section 5:** On-device LLM & NLP · **IDs:** N1–N11

Cross-checked against repo [SECURITY.md](../../SECURITY.md), [ai-security.md](../../ai-security.md), and Firecrawl research in ``.firecrawl/projects/`` (gitignored local cache).

---

## CVE & exploit surface

- CVE baseline: @huggingface/transformers 3.3.2, onnxruntime-react-native — audit before bump.
- N1 chat: max 5 turns limits injection blast radius; no tool calling.
- N11: on-device parity only — **no user-supplied commercial LLM URL** (FREE-TIER-POLICY); PWA uses same Transformers.js/ONNX path as RN.
- N10 GGUF WASM: memory safety — cap model size tier.

**CI baseline:** `npm audit --omit=dev`, OSV-Scanner, Gitleaks in [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml). High/critical production deps must be fixed or accepted-risk documented before plan rollout commit.

---

## Performance

- N7 instant tier: sub-100MB model; MOTD must not block shell reveal.
- N3 chart narration: truncate series points in prompt (max tokens).

**Local gate:** [`server/launch-server.ps1`](../../../server/launch-server.ps1) compiled mode + boot audit — no console `pageerror` regressions.

---

## Mitigations (implementation)

- verify:llm-security
- llm-golden-prompts CI
- N4 ui-only locales enforced

---

## Pre-commit verify

```bash
node docs/plans/plan-08-llm-nlp/scripts/verify-plan.mjs
$env:PROJECTS_EXTRA_VERIFY = "verify:llm-security"  # PowerShell
npm run projects:gate
```

See [../ROLLOUT-GATE.md](../ROLLOUT-GATE.md).
