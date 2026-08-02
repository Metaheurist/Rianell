# Agentic Research stage (shared)

Firecrawl web search/scrape is a **shared wizard step on every pack**, not a separate pack tab.

Pipeline (standard packs): **Gates → Research → LLM → Proposal → Approve**

Visual: **Gates → Research → Q&A → Approve → Polish×8**

## Purpose

After hard gates pass, Research builds a pack-scoped web brief (`web-research.{json,md}` under `artifacts/agentic/<packId>/`) and injects it into the LLM prompt so Thinking / Proposed actions (and human Approvals) are grounded in current sources plus repo context.

## Flow

1. **Gates** — pack verifies
2. **Research (Firecrawl)** — `researchBeforeLlm` in `pack-runner` (skip with `skipResearch` or `AGENTIC_SKIP_RESEARCH=1`)
3. **LLM / pack work** — brief appended as `llmPromptExtra`
4. **Proposal → Approve** — unchanged pack adapters

## Firecrawl key (local only)

- Stored in **`security/.env`** as `FIRECRAWL_API_KEY=` (gitignored)
- Placeholder in [`security/.env.example`](../../security/.env.example)
- Console **Settings → Firecrawl**: paste/replace/clear (API returns redacted hint only)
- Loopback API: `GET/POST /api/agentic/firecrawl`
- Optional: `FIRECRAWL_API_URL`, `RESEARCH_QUERIES=q1|q2`

Never commit real keys. Never log the full key.

## Commands

```bash
npm run agentic:research -- --dry-run
npm run agentic:research -- --pack=security
```

Register (default + per-pack queries): [`research-register.json`](research-register.json).
