# Agentic run-all

```bash
npm run agentic:run-all -- --dry-run
npm run agentic:run-all -- --skip=image,changelog
npm run agentic:run-all -- --stop-on-broken   # optional early abort (default: continue)
POST /api/agentic/run-all { "dryRun": true, "skip": [], "stopOnBroken": false }
```

## Behaviour

1. **Proposal sweep** — runs all 16 packs without waiting for human Approve between packs.  
2. **Model-grouped order** — packs using the same recommended model stay contiguous; Ollama **unload only when the model changes**.  
3. **Terminal status** — `awaiting_approvals` when any pack still needs Approve; otherwise `passed`.  
4. **Approve → apply queue** — Approve enqueues selected items; drain executes jobs sorted by model group (then pack order). No skipping mid-group. **visual** Approve starts Polish×8 (qa-loop) on selected Q&A candidates.

Order (model-grouped):

1–11 · `qwen3.6:35b`: design → planning → rtl → a11y → seo → privacy → security → deps → migration → bootllm → perf  
12–14 · `qwen3:14b`: changelog → wikisync → image  
15 · `translategemma:27b`: i18n  
16 · `gemma4:31b-it-qat`: visual  

State: `artifacts/agentic/run-all-state.json`.  
Apply queue: `artifacts/agentic/apply-queue.json`.  
Worker PID (background live): `artifacts/agentic/run-all-worker.pid`.

### Clear all + unload

`POST /api/agentic/clear-all` (UI: **Clear all + unload**):

1. Signals `cancelled` on the sequencer  
2. Kills stuck `agentic-run-all.mjs` / `agentic-pack-cli.mjs` / `ollama-translate-gaps.mjs` workers (skipped under `node:test`)  
3. Wipes pack runtime + pending `proposal.json` / fill plans / apply queue; resets every pack to `idle`  
4. Unloads all models reported by `ollama ps`  

Approval log + `approved/` archives are kept.
