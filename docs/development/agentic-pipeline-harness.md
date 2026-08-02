# Agentic pipeline harness (AIO)

Local All-In-One control plane for Rianell developer pipelines.

- **UI:** `http://127.0.0.1:8080/dev/agentic` (via `server/launch-server.ps1`)
- **API:** `http://127.0.0.1:8080/api/agentic/*` (loopback only)
- **Client:** `@rianell/build-tools/agentic-api-client`
- **Catalog:** [`scripts/dev/agentic-pipeline/model-catalog.json`](../../scripts/dev/agentic-pipeline/model-catalog.json)
- **Artifacts:** `artifacts/agentic/` (gitignored)

## Packs (run-all order)

`design` → `planning` → `i18n` → `rtl` → `a11y` → `seo` → `privacy` → `security` → `deps` → `migration` → `changelog` → `wikisync` → `image` → `bootllm` → `perf` → `visual`

## Commands

```bash
npm run agentic:catalog
npm run agentic:hw-profile
npm run agentic:run-all -- --dry-run
npm run agentic:security -- --dry-run
npm run agentic:pause -- --pack=security
npm run brain:ensure -- --pack=security
```

## Rules

- Recommended models always default from the catalog.
- Product apply / i18n merge / wiki promote remain human-gated.
- Visual apply stays blocked until screenshot QA is green.
- Never send health screening data or secrets to Ollama (`sanitize-agent-context`).
- Agentic API is **loopback-only** (never LAN via `SENSITIVE_APIS_ON_LAN`).
- Run-all is always serial with unload between packs; ad-hoc `parallel` mode is VRAM-guarded separately.
- UI uses only `@rianell/build-tools/agentic-api-client` (served at `/dev/agentic/lib/`).
- Gate processes spawn via `spawn-silent.mjs`: `npm run <script>` is resolved to direct `node <file>` (never `cmd.exe` / `npm.cmd`); children use `windowsHide`.
- **Clear all + unload** cancels pipelines, kills workers, clears pending approvals, resets pack tabs, unloads Ollama VRAM.
- **i18n Planned** shows missing keys as soon as each locale plan is written (not only after TranslateGemma finishes).
- Overview / visual tabs omit the Activity cockpit; pack tiles use **needs approval** (not running) when waiting on Approve.

## Codebase-aware Thinking / Planned actions

Pack LLM prompts are assembled by [`scripts/dev/agentic-pipeline/pack-context.mjs`](../../scripts/dev/agentic-pipeline/pack-context.mjs):

- Per-pack **manifest** (registers, docs, focus paths, git path filters, hard constraints)
- **Gate stdout/stderr** excerpts (failures prioritized)
- **Recent git** digests for pack-relevant paths
- Short **architecture anchors** (`docs/architecture-standard.md`, `AGENTS.md`)
- Sanitized via `sanitize-agent-context` before Ollama

Artifacts per pack: `artifacts/agentic/<pack>/llm-context.md` + `llm-context.meta.json`. The Activity cockpit shows a **repo context** chip (file count) above Thinking. System instructions require citing paths from `## Repo context` instead of generic advice.

## Scheduler / concurrency

- Profile probe: `npm run agentic:hw-profile` (`dual_12_16` on 12+16 GB boxes).
- Exclusive groups in `model-catalog.json` (e.g. `visual-gen-polish`, TranslateGemma mutex).
- Decision log: `artifacts/agentic/scheduler-log.jsonl` when workers consult the scheduler.

## CI / unit notes

```bash
node --test tests/unit/agentic-*.test.mjs
npm run agentic:run-all -- --dry-run
node scripts/verify/doc-links.mjs --strict
```

Fixtures cover catalog validation, sanitize deny-list, scheduler mutexes, 16-step run-all order, and client loopback refusal.

### Epic CI rollup (PR #85)

| Workflow | Run | Result |
|----------|-----|--------|
| CI | [30725122095](https://github.com/Metaheurist/Rianell/actions/runs/30725122095) | green |
| Security DAST | [30725122035](https://github.com/Metaheurist/Rianell/actions/runs/30725122035) | green |

See also: [agentic-api.md](agentic-api.md), [agentic-api-client.md](agentic-api-client.md), [agentic-ui.md](agentic-ui.md), [agentic-pack-catalog.md](agentic-pack-catalog.md), [agentic-run-all.md](agentic-run-all.md), [agentic-model-catalog.md](agentic-model-catalog.md), [visual-pack-harness.md](visual-pack-harness.md).
