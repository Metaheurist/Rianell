# Agentic AIO UI

Served at `/dev/agentic` from the Python server.

## Surfaces

- **Overview:** progress ring, pack grid, approval queue strip, current-pack Activity; **Clear all + unload** resets harness state and unloads Ollama VRAM models
- **Run-all:** timeline + current Activity + approval queue; Start live uses Settings prefs (`autoApprove`, etc.); same Clear all + unload control
- **Per-pack tabs:** pipeline preview card — header + model/controls, **Gates → LLM → Proposal → Approve** stage rail, cockpit Activity (Thinking primary / Planned action column); visual uses Live QA instead of Approve
- **visual:** Activity + live polish iframe; model picker in preview Review HUD; QA gate for apply
- **Settings:** concurrency mode, `autoApprove` / mode, `confirmProductWrite`, `allowDependencyBump`, `gitCommitOnApprove`, `i18nFillScope`
- **Debug (raw JSON):** collapsed drawer only — not the primary UX

## Activity cockpit

| Panel | Content |
|-------|---------|
| Now | Status, stage, model, needs-approval |
| Thinking | Streamed LLM markdown or TranslateGemma fill progress; **repo context** chip lists files injected via `pack-context.mjs` |
| Done | Gate results + prior applies |
| Planned | Selectable proposal items + Approve / Reject + write gates — **omitted on the visual tab** (apply is QA-gated in Live polish) |

**Debug (raw JSON)** is always a collapsible `<details>` drawer, collapsed by default (and on tab change). `log()` never auto-expands it; only **Debug report** opens it. Hard-refresh if an older expanded drawer is cached.

Live updates use **soft Activity patches** (fingerprint-gated Thinking / rail / Planned) — Dry-run / Live no longer rebuild the whole tab (visual iframe stays mounted). Scrollbars are hidden in scrollable panels while scroll still works.

Nothing product-applies without **Approve** (and `confirmProductWrite` where required), unless run-all `autoApprove` + `product-write` + confirm are explicitly enabled.

Tk dashboard Tools → **Agentic pipelines** opens the same URL.
