# Visual pack harness (local Ollama)

Two-model pipeline to regenerate every discrete SVG/animation in the PWA **without shipping product UI until QA is green**.

Operators can also drive Visual as the last step of the **Agentic AIO** harness (`/dev/agentic`, `npm run agentic:run-all`) — see [agentic-pipeline-harness.md](agentic-pipeline-harness.md). Dedicated `visual:*` commands below remain the source of truth for gen/polish/QA.

## Models (never co-load)

| Stage | Model | npm |
|-------|--------|-----|
| A (original) | Existing PWA sources | — |
| B (generate) | `qwen3.6:35b` | `npm run visual:gen` |
| C (polish) | `gemma4:31b-it-qat` (`VISUAL_POLISH_MODEL`) | `npm run visual:polish` |

Preflight: `npm run brain:ensure` (serves Ollama / pulls the requested tag).

## Commands

| Command | Purpose |
|---------|---------|
| `npm run visual:register` / `:check` | Build/verify `apps/pwa-webapp/assets/visual-register.json` |
| `npm run visual:gen` / `:status` | Qwen Stage 1 queue → `artifacts/visual-gen/` (gitignored) |
| `npm run visual:polish` / `:status` | Gemma Stage 2 (`construct→critique→apply→verify`) → `polished/` |
| `npm run visual:polish:live` | Live A/B/C preview **http://localhost:8766/** |
| `npm run visual:polish:screenshot-qa` | Tiered QA (`--tier=1\|2\|3\|all`, optional `--gemma-review`) |
| `npm run visual:polish:qa-loop` | Wait pending≈0 → QA → re-polish (`--start-round=N`, max 8) |
| `npm run visual:pause` / `visual:resume` / `visual:state` | Durable pause/resume (banks remaining ids + Pass N) |
| `npm run visual:derive-variants` | Derive fancy team sprites via `generate:theme-icons` (no LLM) |
| `npm run audit:icon-a` | Score Stage A corpus → `artifacts/audit/icon-a-audit.*` |
| `npm run verify:icon-spec` | Icon design docs ↔ tokens/CSS guardrail |
| `npm run visual:gallery` | Current-source gallery (standalone) |
| `npm run visual:apply` | **Blocked for product until Phase 3c `broken.length === 0`** |

Design SoT: `docs/style-and-design/` (`ICON_CONTRACT`). Fancy `team` variants are **derived**, not polished one-by-one.

Checkpoints under `artifacts/visual-gen/` stay local (gitignored). The register JSON is committed so CI/tests can run without regenerating.

## Pause / resume

```bash
npm run visual:pause    # stop workers, unload model, write pipeline-state.json
npm run visual:resume   # ensure model + print IDE terminal commands (preview + polish/qa-loop)
npm run visual:resume -- --detached   # old behaviour: spawn invisible background workers

npm run visual:state
```

`--repolish-from-qa` preserves ids already completed after the broken snapshot.

## Debug server / Tk dashboard

With `powershell -File .\server\launch-server.ps1 -NoCompile -SkipUnitTests`:

- **Tools → Visual gallery** → Browser / Chromium → `http://localhost:8080/dev/visual-gallery`
- **Tools → Live polish** → `http://localhost:8766/` (start `visual:polish:live` first)

API: `GET /api/visual-gallery?limit=&offset=` (see `server/visual_gallery.py`).

## Hard rules

- Do **not** run `visual:apply` / wire theme-icon overrides into shipped sprites until screenshot QA reports zero broken.
- Do **not** wipe `polish-checkpoint.json` / `--reset-polished` casually (multi-day work).
- Never co-load Qwen + Gemma on one GPU.

## Tests

`tests/unit/pwa/visual-*.test.mjs` — register, gen validate, polish queue/seamless loop, QA status, galleries.
