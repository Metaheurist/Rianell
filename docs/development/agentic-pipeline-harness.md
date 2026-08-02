# Agentic pipeline harness (AIO)

Local All-In-One control plane for Rianell developer pipelines.

- **UI:** `http://127.0.0.1:8080/dev/agentic` (via `server/launch-server.ps1`)
- **API:** `http://127.0.0.1:8080/api/agentic/*` (loopback only)
- **Client:** `@rianell/build-tools/agentic-api-client`
- **Catalog:** [`scripts/dev/agentic-pipeline/model-catalog.json`](../../scripts/dev/agentic-pipeline/model-catalog.json)
- **Artifacts:** `artifacts/agentic/` (gitignored)

## Packs (run-all order)

`design` → `planning` → `rtl` → `a11y` → `seo` → `privacy` → `security` → `deps` → `migration` → `bootllm` → `perf` → `changelog` → `wikisync` → `image` → `i18n` → `visual`

(Model-grouped: unload only when recommended model changes. Run-all never waits for Approve between packs.)

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
- Run-all is serial and **model-grouped** (unload only on model switch); it never waits for Approve between packs. Approve enqueues apply work drained by model group. Ad-hoc `parallel` mode is VRAM-guarded separately.
- UI uses only `@rianell/build-tools/agentic-api-client` (served at `/dev/agentic/lib/`).
- Gate processes spawn via `spawn-silent.mjs`: `npm run <script>` is resolved to direct `node <file>` (never `cmd.exe` / `npm.cmd`); children use `windowsHide`.
- **Clear all + unload** cancels pipelines, kills workers, clears pending approvals, resets pack tabs, unloads Ollama VRAM.
- **i18n Planned** shows missing keys as soon as each locale plan is written (not only after TranslateGemma finishes).
- Overview omits the full Activity cockpit; **visual** uses Gates → Q&A → Approve → Polish×8 + C-only iframe. Pack tiles use **needs approval** (not running) when waiting on Approve.
- Visual Live pack runs screenshot Q&A then lists polish candidates; Approve starts `visual:polish:qa-loop` (max 8). Product `visual:apply` stays QA-green + separate.

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

CI suite (Phase 1, four parallel nodes): **Agentic · unit** · **Agentic · catalog** · **Agentic · ollama-load** · **Agentic · dry-run**.

```bash
node --test --test-concurrency=1 --test-force-exit tests/unit/agentic-*.test.mjs
npm run agentic:catalog
npm run agentic:run-all -- --dry-run
npm run agentic:smoke          # tiny Ollama load (needs local daemon; CI uses smollm:135m)
node scripts/verify/doc-links.mjs --strict
```

Clear-all’s cmdline kill uses script basenames (`agentic-run-all.mjs`, …) and skips broad process scans under `node:test` so CI never suicides the suite.

Fixtures cover catalog validation, sanitize deny-list, scheduler mutexes, 16-step run-all order, and client loopback refusal.

### Epic CI rollup (PR #85)

| Workflow | Run | Result |
|----------|-----|--------|
| CI | [30745273249](https://github.com/Metaheurist/Rianell/actions/runs/30745273249) | green (4-node Agentic suite) |
| Security DAST | [30744152361](https://github.com/Metaheurist/Rianell/actions/runs/30744152361) | green |

See also: [agentic-api.md](agentic-api.md), [agentic-api-client.md](agentic-api-client.md), [agentic-ui.md](agentic-ui.md), [agentic-pack-catalog.md](agentic-pack-catalog.md), [agentic-run-all.md](agentic-run-all.md), [agentic-model-catalog.md](agentic-model-catalog.md), [visual-pack-harness.md](visual-pack-harness.md).
