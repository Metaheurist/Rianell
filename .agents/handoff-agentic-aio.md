# Handoff — Agentic AIO harness

**UI:** `http://127.0.0.1:8080/dev/agentic`  
**API:** `POST /api/agentic/run-all` `{ "dryRun": true }` (loopback only)  
**Catalog:** `scripts/dev/agentic-pipeline/model-catalog.json`  
**Client:** `@rianell/build-tools/agentic-api-client` (`safeClient` when host is localhost / `127.*` / `::1`)

## Run-all order

design → planning → i18n → rtl → a11y → seo → privacy → security → deps → migration → changelog → wikisync → image → bootllm → perf → visual

## Hard rules

- Recommended models from catalog; TranslateGemma for i18n; Gemma for visual polish.
- Never co-load visual gen + polish; unload between run-all steps.
- Apply / i18n merge / wiki promote deferred — artifacts only until human unlock.
- Sanitize context before LLM (`scripts/dev/sanitize-agent-context.mjs`).
- Pack LLM prompts use `pack-context.mjs` (registers, docs, gates, git digests).
- Rate-limit loopback is off; Agentic API stays loopback-only.

## Smoke

```bash
npm run agentic:catalog
npm run agentic:run-all -- --dry-run
node --test tests/unit/agentic-*.test.mjs
node scripts/verify/doc-links.mjs --strict
```

## Operator UX

- Activity cockpit: Now / Thinking / Done / Planned; Debug drawer collapsed by default
- Pack tabs: pipeline preview card + stage rail; visual omits Planned approve (Live QA)
- Clear all + unload resets harness + Ollama VRAM
- Live polish model picker lives in Review HUD (`:8766`)

## Apply-deferred confirmation

- Activity cockpit + `proposal.json` approve/reject is the control plane (`GET /:pack/activity`, `POST /:pack/approve`)
- `visual:apply` still blocked until screenshot QA green (`GET /visual/qa`) + Approve + `confirmProductWrite`
- i18n TranslateGemma fill is propose-dir only until Approve + confirm → merge Tier-C
- No security CSP edits; deps bumps need `allowDependencyBump` + confirm; git commit on approve is opt-in local-only (never push)
- Run-all `autoApprove: ack` does not product-write; `product-write` requires confirm

## CI

- PR: https://github.com/Metaheurist/Rianell/pull/85
- Re-record green run URLs in this section after the Activity/cockpit push lands.
