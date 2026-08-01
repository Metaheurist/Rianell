# Agentic local API

Base: `http://127.0.0.1:{PORT}/api/agentic`  
Authz: client IP loopback + `Host` localhost/127.0.0.1 — **never** enabled via `SENSITIVE_APIS_ON_LAN`.

## Envelope

```json
{ "ok": true, "schemaVersion": 1, "pack": "security", "data": {}, "error": null }
```

## Routes

| Method | Path | Notes |
|--------|------|-------|
| GET | `/health` | Liveness |
| GET | `/catalog` | Model catalog |
| GET | `/gpus` | Hardware profile |
| GET | `/status` | All pack state |
| GET | `/mode` | `serial` \| `parallel` \| `dry-run` |
| POST | `/mode` | `{ mode }` — parallel still VRAM-guarded; run-all always serial |
| POST | `/models/load` | `{ model }` Ollama warm |
| POST | `/models/unload` | `{ model }` keep_alive 0 |
| POST | `/pause-all` / `/resume-all` | All pack checkpoints |
| POST | `/run-all` | `{ dryRun?, skip?, stopOnBroken? }` |
| GET | `/run-all` | Run-all status |
| POST | `/run-all/pause` \| `/resume` \| `/cancel` | Control running sequencer |
| GET | `/visual/live` | Live polish `:8766` reachability + embed URL |
| GET | `/:pack/status` | Pack checkpoint |
| GET | `/:pack/report` | Latest report JSON |
| POST | `/:pack/start` | `{ dryRun?, model? }` |
| POST | `/:pack/pause` | Pause |
| POST | `/:pack/resume` | Resume |
| POST | `/:pack/model` | Record preferred model (catalog recommended remains default) |

Pack ids: `design|planning|i18n|rtl|a11y|seo|privacy|security|deps|migration|changelog|wikisync|image|bootllm|perf|visual`.

Authz: loopback IP + Host allowlist; browser POST requires same-origin Origin/Referer. Never enable via `SENSITIVE_APIS_ON_LAN`.
