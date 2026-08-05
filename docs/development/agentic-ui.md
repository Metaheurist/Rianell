# Agentic AIO UI

Served at `/dev/agentic` from the Python server.

## Surfaces

- **Overview:** progress ring, pack grid, approval queue + apply-queue strip (no Activity cockpit). Pack tiles show **needs approval** when awaiting Approve (not “running”). While run-all is running/paused, Overview polls and **soft-patches** tile status + ring + approval queue (no manual Refresh). Primary **Run all** starts a live model-grouped sweep (confirm dialog); Approve later drains apply jobs by model.
- **Run-all:** timeline + current Activity + approval queue; **Run all** (live only — no dry-run / Start live) uses Settings prefs (`autoApprove`, etc.)
- **Per-pack tabs:** stage **wizard** — clickable Gates → Research → LLM → Proposal → Approve rail drives one full-width panel at a time (auto-follows while running; pin a step by clicking). Prev/next pack hop in the wizard footer. Model picker + Dry-run / Live / Pause / Resume stay in the header.
- **visual:** Gates → Research → Q&A → Approve candidates → Polish×8 → optional **Amend to repo** (`visual:apply`) when QA is green; C-only live polish iframe (no A/B); Approve starts Gemma qa-loop (max 8), not product apply unless Amend is used
- **Settings:** single System tab (former **models** + **settings** merged) — hardware profile, concurrency mode, `autoApprove` / mode, `confirmProductWrite`, `visualApplyAfterPolish`, `allowDependencyBump`, `gitCommitOnApprove` (LLM message **per item** → commit each → **push once** per pack Approve), `i18nFillScope`, Firecrawl key (shared Research stage)
- **Clear all + unload** (Overview + Run-all): cancels run-all, kills stuck pack/i18n workers, wipes pending approvals/proposals, resets every pack tab to idle, unloads all Ollama VRAM models (keeps `approval-log.jsonl` + `approved/`)
- **Debug (raw JSON):** collapsed drawer only — not the primary UX

## Activity cockpit

Shown on pack tabs as a **stage wizard** (standard: Gates → Research → LLM → Proposal → Approve; visual: Gates → Research → Q&A → Approve → Polish×8) and as a compact cockpit on Run-all’s current pack.

| Panel | Content |
|-------|---------|
| Now | Status, stage, model, needs-approval |
| Thinking | Streamed LLM markdown or TranslateGemma fill progress; **repo context** chip lists files injected via `pack-context.mjs` |
| Done | Gate results + prior applies |
| Planned | Selectable proposal items + Approve / Reject + write gates |

**i18n:** as soon as a locale plan is written, Planned lists **missing** keys (`locale · key · missing`) while Thinking shows `Filling locale · n/total`. Filled rows become selectable; pending rows stay visible but unchecked.

**Debug (raw JSON)** is always a collapsible `<details>` drawer, collapsed by default (and on tab change). `log()` never auto-expands it; only **Debug report** opens it. Hard-refresh if an older expanded drawer is cached.

Live updates use **soft Activity patches** (fingerprint-gated Thinking / rail / Planned) — Dry-run / Live no longer rebuild the whole tab (visual iframe stays mounted). Scrollbars are hidden in scrollable panels while scroll still works.

Nothing product-applies without **Approve** (and `confirmProductWrite` where required), unless run-all `autoApprove` + `product-write` + confirm are explicitly enabled. Under product-write, advisory packs use **safe-patch** (tracked repo paths) or domain adapters; packs with no mutation write `docs/development/agentic-findings/<pack>.md`. Visual Amend requires QA `broken.length === 0`. Rollout: [agentic-product-write-rollout.md](agentic-product-write-rollout.md).

Tk dashboard Tools → **Agentic pipelines** opens the same URL.
