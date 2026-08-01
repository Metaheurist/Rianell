# Handoff — Agentic AIO harness

**UI:** `http://127.0.0.1:8080/dev/agentic`  
**API:** `POST /api/agentic/run-all` `{ "dryRun": true }` (loopback only)  
**Catalog:** `scripts/dev/agentic-pipeline/model-catalog.json`  
**Client:** `@rianell/build-tools/agentic-api-client`

## Run-all order

design → planning → i18n → rtl → a11y → seo → privacy → security → deps → migration → changelog → wikisync → image → bootllm → perf → visual

## Hard rules

- Recommended models from catalog; TranslateGemma for i18n; Gemma for visual polish.
- Never co-load visual gen + polish; unload between run-all steps.
- Apply / i18n merge / wiki promote deferred — artifacts only until human unlock.
- Sanitize context before LLM (`scripts/dev/sanitize-agent-context.mjs`).

## Smoke

```bash
npm run agentic:catalog
npm run agentic:run-all -- --dry-run
node --test tests/unit/agentic-*.test.mjs
node scripts/verify/doc-links.mjs --strict
```
