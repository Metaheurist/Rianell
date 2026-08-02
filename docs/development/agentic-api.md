# Agentic local API

Base: `http://127.0.0.1:{PORT}/api/agentic`  
Authz: client IP loopback + `Host` localhost / `127.*` / `::1` — **never** enabled via `SENSITIVE_APIS_ON_LAN`.  
Rate limits: **skipped for loopback peers**; remote clients still throttled.

## Envelope

```json
{ "ok": true, "schemaVersion": 1, "pack": "security", "data": {}, "error": null }
```

## Routes

| Method | Path | Notes |
|--------|------|-------|
| GET | `/health` | Liveness + `safeClient` / `loopbackHost` / `loopbackPeer` |
| GET | `/catalog` | Model catalog |
| GET | `/gpus` | Hardware profile |
| GET | `/status` | All pack state |
| GET | `/mode` | Prefs: `mode`, `autoApprove`, `autoApproveMode`, `confirmProductWrite`, `allowDependencyBump`, `gitCommitOnApprove`, `i18nFillScope` |
| POST | `/mode` | Prefs patch (or legacy `{ mode }`) |
| POST | `/models/load` | `{ model }` Ollama warm |
| POST | `/models/unload` | `{ model }` keep_alive 0 |
| POST | `/pause-all` / `/resume-all` | All pack checkpoints |
| POST | `/clear-all` | Cancel run-all, kill stuck workers (`run-all-worker.pid` + node patterns), wipe pack runtime + pending proposals/approvals, unload all Ollama models in VRAM (keeps approval-log + `approved/`) |
| POST | `/run-all` | `{ dryRun?, skip?, background?, autoApprove?, autoApproveMode?, confirmProductWrite?, allowDependencyBump?, gitCommitOnApprove? }` |
| GET | `/run-all` | Run-all status |
| GET | `/run-all/activity` | Current pack activity + approval queue |
| POST | `/run-all/pause` \| `/resume` \| `/cancel` | Control sequencer |
| GET | `/visual/live` | Live polish `:8766` reachability |
| GET | `/visual/qa` | Screenshot QA `brokenCount` / `applyAllowed` |
| GET | `/:pack/status` | Pack checkpoint |
| GET | `/:pack/report` | Latest report JSON |
| GET | `/:pack/activity` | Now / Thinking / Done / Planned aggregate (i18n Planned merges live `fill-proposals/` while filling) |
| GET | `/:pack/proposal` | `proposal.json` |
| GET | `/:pack/stream` | LLM partial or i18n fill progress |
| POST | `/:pack/proposal/select` | `{ itemIds, selected }` |
| POST | `/:pack/approve` | `{ itemIds?, confirmProductWrite?, allowDependencyBump?, gitCommitOnApprove? }` |
| POST | `/:pack/reject` | Archive proposal |
| POST | `/:pack/start` | `{ dryRun?, model? }` |
| POST | `/:pack/pause` \| `/resume` | Pause / resume |
| POST | `/:pack/model` | Record preferred model |

## Approval rules

- Packs end in `pending_approval` with `artifacts/agentic/<pack>/proposal.json` (async queue; run-all continues).
- Product adapters (changelog, wiki:sync, i18n fill+merge, visual:apply, deps bump) require `confirmProductWrite` (and bump/QA unlocks as documented).
- `autoApprove: ack` never product-writes; `product-write` requires confirm.
- Git commit on approve is opt-in, local only, never pushes.
- Audit: `artifacts/agentic/approval-log.jsonl`.
- Client disconnect mid-response (`ConnectionAbortedError`) is not logged as a 500 — normal on tab refresh/poll cancel.

## Windows headless gates

`spawn-silent.mjs` resolves `npm run <script>` to direct `node <file>` (no `cmd.exe` consoles). Python bridge uses `CREATE_NO_WINDOW` + hidden `STARTUPINFO`. Background run-all writes `artifacts/agentic/run-all-worker.pid` for Clear-all kill.

Pack ids: `design|planning|i18n|rtl|a11y|seo|privacy|security|deps|migration|changelog|wikisync|image|bootllm|perf|visual`.
