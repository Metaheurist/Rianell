---
execution_order: 08
section: 5
title: On-device LLM & NLP
status: done
source: ../MASTER.md
master_section: 5
feature_ids: [N1, N2, N3, N4, N5, N6, N7, N9, N10, N11]
depends_on: [plan-07-ai-engine/plan.md, plan-04-logging-data-capture/plan.md]
blocks: [plan-09-charts-analytics/plan.md, plan-10-home-dashboard/plan.md, plan-12-clinician-sharing/plan.md]
---

# Plan 08 - Section 5: On-device LLM & NLP

## Objective

Extend on-device LLM beyond four fixed intents: bounded chat, clinician brief, chart narration, structured outputs, and platform parity. Wellness-only; on-device first per `docs/ai-security.md`.

## Required features (checklist)

| ID | Feature | Tags | Notes |
|----|---------|------|-------|
| N1 | **Bounded "Ask about my week" chat** - max 5 turns, scoped context, no tools | L, star | Wellness guardrails |
| N2 | **Clinician visit prep brief** - new LLM intent, 1-page summary | M, star | Feeds CL1, H6 |
| N3 | **"Explain this chart"** - LLM narrates chart range | M, star | |
| N4 | **Multilingual LLM enforcement** - `llmCapability: ui-only` for ar/he/ga | Q | |
| N5 | **Structured JSON output** - `{ insights[], actions[], confidence }` | M | AI-02 |
| N6 | **Diary coach personas** - tone presets in prompt pack | Q | |
| N7 | **Smaller "instant" model tier** - sub-100MB for MOTD/suggest | L | |
| N9 | **Golden prompt regression expansion** - per-locale/intent CI | Q | |
| N10 | **GGUF Path 3** - llama.cpp WASM | L | Stub: `summary-llm-gguf.js` |
| N11 | **Remote LLM parity on PWA** - on-device only (same as RN) | M | No paid/user commercial endpoints (FREE-TIER-POLICY) |


## Plan folder docs

| Doc | Purpose |
|-----|---------|
| [security-performance.md](./security-performance.md) | CVE + performance review (Firecrawl cross-ref) |
| [scope.md](./scope.md) | Scope boundaries + verify scripts |
| [references.md](./references.md) | Internal + external references |

## Global constraints

- **Free tier only** - no paid APIs. See [FREE-TIER-POLICY.md](../FREE-TIER-POLICY.md).
- **Mobile + desktop** - PWA + RN parity, responsive, max font scale. See [UI-UX-STANDARDS.md](../UI-UX-STANDARDS.md).
- **External setup** - See [EXTERNAL-SETUP.md](../EXTERNAL-SETUP.md) (plan-specific section).

## Prerequisites

- Plan 07 for shared context builders
- `i18n-packs/prompt-packs/`, `summary-llm.js`, `apps/rn-app/src/ai/llm.ts`

## Key codebase areas

| Area | Paths |
|------|-------|
| PWA LLM | `apps/pwa-webapp/summary-llm.js`, MLC/GGUF adapters |
| RN LLM | `apps/rn-app/src/ai/llmNative.ts`, `llmJs.ts`, `llm.ts` |
| Shared | `packages/llm/`, `packages/shared/src/i18n/promptPack.mjs` |
| CI | `scripts/test/llm-golden-prompts.mjs`, `verify:llm-security` |

## Agent runbook (general)

1. Add new `LlmFeature` keys + prompt pack entries for N1-N3, CL5
2. **N5:** Schema-validate LLM output before UI render
3. **N1:** Hard turn limit; no tool/API access; UGC delimiters
4. Verify: `npm run verify:llm-security`, golden prompts, GPU matrix if touching load ladder

## Completion gates

- [ ] New intents wired PWA + RN with fallbacks
- [ ] N4 enforced at inference entry for ar/he/ga
- [ ] **N8 NR** - do not implement (wearables L10 excluded)
- [ ] No regression in existing summary/suggest/MOTD/homeQuestion flows

## Cross-plan notes

- **N2, H6, CL1, CL5, C6** = clinician prep cluster
- **N3** pairs with plan 09 Charts
- **H7** contextual home questions may share prompt infrastructure

## Agent execution

### Phase A - New intents (N2, N3, N5) - clinician and charts cluster

- [ ] Add `LlmFeature` keys in `packages/shared` + prompt pack entries under `i18n-packs/prompt-packs/`
- [ ] **N2** Clinician visit prep: structured 1-page brief; wire PWA `summary-llm.js` + RN `llmNative.ts` / `llm.ts`
- [ ] **N3** Explain chart: pass selected date range + metric series in context; narrate in plain language
- [ ] **N5** JSON schema `{ insights[], actions[], confidence }` - validate before UI render (AI-02)

### Phase B - Bounded chat and home (N1, N6, N7)

| ID | Tasks |
|----|-------|
| **N1** | Max 5 turns; scoped log context only; no external tool APIs; wellness guardrails in system prompt |
| **N6** | Tone presets (encouraging, clinical, minimal) in settings - prompt pack selection |
| **N7** | Sub-100MB model tier for MOTD/suggest; load ladder integration |

### Phase C - Platform parity and paths (N4, N10, N11, N9)

| ID | Tasks |
|----|-------|
| **N4** | Block inference for ar/he/ga when `llmCapability: ui-only`; fallback to deterministic text |
| **N10** | Complete GGUF Path 3 in `summary-llm-gguf.js` / WASM llama.cpp stub |
| **N11** | PWA on-device LLM parity - Transformers.js/ONNX; no user-supplied commercial URL |
| **N9** | Expand `scripts/test/llm-golden-prompts.mjs` per locale + new intents; CI gate |

## Feature checklist (sync with MASTER)

| ID | Status | Blockers |
|----|--------|----------|
| N1 | pending | |
| N2 | pending | CL1, H6 |
| N3 | pending | Plan 09 |
| N4 | pending | |
| N5 | pending | |
| N6 | pending | |
| N7 | pending | |
| N9 | pending | |
| N10 | pending | |
| N11 | pending | |

## Verification

```bash
npm run verify:llm-security
node scripts/test/llm-golden-prompts.mjs
npm run test:unit
```

Regression: existing summary / suggest / MOTD / homeQuestion flows unchanged.

## Master sync

MASTER section 5 rows N1-N11 (excl NR N8); section rollup exec 08.

## Post-plan rollout gate

**Required before** marking this plan done. See [`ROLLOUT-GATE.md`](../ROLLOUT-GATE.md).

```powershell
$env:PROJECTS_EXTRA_VERIFY = "verify:llm-security"
npm run projects:gate
```

Then: CHANGELOG, MASTER section 5, commit/push, `npm run projects:ci-watch` until `CI_GREEN`. **Stop on error; fix; loop.**

## Agent do-nots

- No diagnosis or treatment advice (wellness-only)
- **N8 is NR** - sensor fusion requires excluded wearables (L10)
