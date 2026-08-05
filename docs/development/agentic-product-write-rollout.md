# Agentic product-write rollout

Phased rollout for repo-mutating auto-approve. Do **not** jump straight to full 16 live product-write.

## Assumptions (locked)

- Advisory LLM packs previously wrote only `artifacts/agentic/<pack>/approved/*`.
- Live mutations need structured items (`path` + body) and `safe-patch` / domain adapters.
- `researchRefineProposal` runs in `pack-runner` before approve; mutate kinds are re-selected for product-write.
- Patch-author is capped (max 3 items/pack); skip with `AGENTIC_SKIP_PATCH_AUTHOR=1`.
- Prefer `search_replace` / `append`; full-file replace only ≤32KB on allowlisted paths.
- CSP / header product mutations stay refused.
- Visual polish ≠ product apply; amend uses `visual:apply` only when QA `broken.length === 0`.
- Product-write loop does not commit or push.

## Kill-switches

| Switch | Effect |
|--------|--------|
| `autoApproveMode: ack` | Artifact / ack only |
| `confirmProductWrite: false` | Blocks all product adapters |
| `visualApplyAfterPolish: false` (default) | No auto SVG amend after polish |
| `AGENTIC_SKIP_PATCH_AUTHOR=1` | Skip second Ollama patch body pass |
| `allowDependencyBump: false` | No npm bumps |

## Phases

1. **Unit + docs:** `npm run test:unit` + `node scripts/verify/doc-links.mjs --strict`
2. **Adapter fixtures:** unit coverage for safe-patch uniqueness / refuse / changelog Unreleased
3. **Smoke 3 packs:** `design`, `planning`, `seo` with product-write - assert tracked `docs/` (or findings) in `git diff`
4. **Visual amend smoke:** QA green → Amend to repo → `apps/pwa-webapp/` diffs; refuse when broken > 0
5. **Full 16 loop:** `agentic-product-write-loop.mjs` with baseline revert-on-fail
6. **Human review** before any commit/push

## Mutation gate

Under `autoApproveMode: product-write`, each pack must touch ≥1 tracked path outside `artifacts/**` (selected items only). Clean packs append `docs/development/agentic-findings/<packId>.md`. Visual: `polish_complete` OK when amend pref is off; when `visualApplyAfterPolish` is on, amend is required.
