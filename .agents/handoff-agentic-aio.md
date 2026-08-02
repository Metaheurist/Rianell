# Handoff — Agentic AIO harness

**UI:** `http://127.0.0.1:8080/dev/agentic`  
**API:** `POST /api/agentic/run-all` `{ "dryRun": true }` (loopback only)  
**Catalog:** `scripts/dev/agentic-pipeline/model-catalog.json`  
**Client:** `@rianell/build-tools/agentic-api-client` (`safeClient` when host is localhost / `127.*` / `::1`)

## Run-all order

Model-grouped (unload only on model switch):

design → planning → rtl → a11y → seo → privacy → security → deps → migration → bootllm → perf → changelog → wikisync → image → i18n → visual

## Hard rules

- Recommended models from catalog; TranslateGemma for i18n; Gemma for visual polish.
- Never wait for Approve between packs; Approve enqueues apply work drained by model group.
- Unload only when leaving a model group during run-all (not after every pack).
- Apply / i18n merge / wiki promote deferred — artifacts only until human unlock.
- Sanitize context before LLM (`scripts/dev/sanitize-agent-context.mjs`).
- Pack LLM prompts use `pack-context.mjs` (registers, docs, gates, git digests).
- Rate-limit loopback is off; Agentic API stays loopback-only.

## Smoke

```bash
npm run agentic:catalog
npm run agentic:run-all -- --dry-run
npm run agentic:smoke          # tiny Ollama load (local daemon; CI uses smollm:135m)
node --test --test-concurrency=1 --test-force-exit tests/unit/agentic-*.test.mjs
node scripts/verify/doc-links.mjs --strict
```

## Operator UX

- Activity cockpit: Now / Thinking / Done / Planned; Debug drawer collapsed by default
- Pack tabs: stage wizard (Gates → LLM → Proposal → Approve); **visual** uses Gates → Q&A → Approve → Polish×8 + C-only live embed
- Clear all + unload resets harness + Ollama VRAM
- Live polish model picker lives in Review HUD (`:8766/?agentic=1&cOnly=1`)
- Visual Approve starts qa-loop (max 8) on selected Q&A candidates — not product `visual:apply`

## Apply-deferred confirmation

- Activity cockpit + `proposal.json` approve/reject is the control plane (`GET /:pack/activity`, `POST /:pack/approve`)
- `visual:apply` still blocked until screenshot QA green (`GET /visual/qa`) + Approve + `confirmProductWrite`
- i18n TranslateGemma fill is propose-dir only until Approve + confirm → merge Tier-C
- No security CSP edits; deps bumps need `allowDependencyBump` + confirm; git commit on approve is opt-in local-only (never push)
- Run-all `autoApprove: ack` does not product-write; `product-write` requires confirm

## CI

Four parallel Phase‑1 nodes: **Agentic · unit** · **Agentic · catalog** · **Agentic · ollama-load** · **Agentic · dry-run**.

- PR: https://github.com/Metaheurist/Rianell/pull/85
- CI: https://github.com/Metaheurist/Rianell/actions/runs/30745574631 (green — 4-node suite)
- Security DAST: https://github.com/Metaheurist/Rianell/actions/runs/30745574532 (green)
