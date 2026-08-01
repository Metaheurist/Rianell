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
| CI | [30721354482](https://github.com/Metaheurist/Rianell/actions/runs/30721354482) | green |
| Security DAST | [30721354377](https://github.com/Metaheurist/Rianell/actions/runs/30721354377) | green |

See also: [agentic-api.md](agentic-api.md), [agentic-api-client.md](agentic-api-client.md), [agentic-ui.md](agentic-ui.md), [agentic-pack-catalog.md](agentic-pack-catalog.md), [agentic-run-all.md](agentic-run-all.md), [agentic-model-catalog.md](agentic-model-catalog.md), [visual-pack-harness.md](visual-pack-harness.md).
