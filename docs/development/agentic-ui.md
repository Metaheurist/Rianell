# Agentic AIO UI

Served at `/dev/agentic` from the Python server.

## Surfaces

- **Overview:** progress ring, pack grid, approval queue strip (no Activity cockpit). Pack tiles show **needs approval** when awaiting Approve (not “running”).
- **Run-all:** timeline + current Activity + approval queue; Start live uses Settings prefs (`autoApprove`, etc.)
- **Per-pack tabs:** pipeline preview card — header + model/controls, **Gates → LLM → Proposal → Approve** stage rail, cockpit Activity (Thinking primary / Planned action column)
- **visual:** header + stage rail + live polish iframe only (no Now/Thinking/Done/Planned); model picker in preview Review HUD; QA gate for apply
- **Settings:** concurrency mode, `autoApprove` / mode, `confirmProductWrite`, `allowDependencyBump`, `gitCommitOnApprove`, `i18nFillScope`
- **Clear all + unload** (Overview + Run-all): cancels run-all, kills stuck pack/i18n workers, wipes pending approvals/proposals, resets every pack tab to idle, unloads all Ollama VRAM models (keeps `approval-log.jsonl` + `approved/`)
- **Debug (raw JSON):** collapsed drawer only — not the primary UX

## Activity cockpit

Shown on pack tabs (except **visual**) and Run-all’s current pack.

| Panel | Content |
|-------|---------|
| Now | Status, stage, model, needs-approval |
| Thinking | Streamed LLM markdown or TranslateGemma fill progress; **repo context** chip lists files injected via `pack-context.mjs` |
| Done | Gate results + prior applies |
| Planned | Selectable proposal items + Approve / Reject + write gates |

**i18n:** as soon as a locale plan is written, Planned lists **missing** keys (`locale · key · missing`) while Thinking shows `Filling locale · n/total`. Filled rows become selectable; pending rows stay visible but unchecked.

**Debug (raw JSON)** is always a collapsible `<details>` drawer, collapsed by default (and on tab change). `log()` never auto-expands it; only **Debug report** opens it. Hard-refresh if an older expanded drawer is cached.

Live updates use **soft Activity patches** (fingerprint-gated Thinking / rail / Planned) — Dry-run / Live no longer rebuild the whole tab (visual iframe stays mounted). Scrollbars are hidden in scrollable panels while scroll still works.

Nothing product-applies without **Approve** (and `confirmProductWrite` where required), unless run-all `autoApprove` + `product-write` + confirm are explicitly enabled.

Tk dashboard Tools → **Agentic pipelines** opens the same URL.
