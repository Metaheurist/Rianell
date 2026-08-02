# Theme variants (plain + fancy teams)

Art direction for Rianell icon theme packs. **Variants are derived, never hand-drawn as separate metaphors.**

## Teams

| Id | Glyph paint | Glow / particles | Notes |
|----|-------------|------------------|-------|
| *(plain)* | `currentColor` / `--ui-icon-color` | none | Stage A SoT in `index.html` |
| `mint` | `#7bdf8c` / `#a8e6cf` | leaves | Default brand |
| `red-black` | `#ff8d98` / `#ff4d5a` | embers | Ember reds, not mint+pink halo |
| `mono` | `#d0d0d0` / `#a0a0a0` | smoke | **Achromatic glyph** — no hue in the subject |
| `rainbow` | prism stops | rain | Prism accents allowed |

Tokens live in `THEME_FX_TOKENS` (`packages/tokens/src/index.mjs`).

## Derivation rule

1. Polish / author the **plain** stem once.
2. Apply plain into `apps/pwa-webapp/index.html` (Stage A).
3. Run `npm run generate:theme-icons` which wraps via:
   - `fancyHeroInner` for HEROES
   - `fancyWrapRemaining` for the rest
   - optional override fragments under `artifacts/visual-gen/fancy-overrides/`

Do **not** queue `fancy:*` / `fancy-nav:*` through the LLM polish pipeline.

## Decoration budget

- Soft radial blob / dashed ring behind glyph — allowed
- Particle dots — allowed within `THEME_FX_TOKENS.budgets`
- Redesigning the silhouette per team — **forbidden**
- Identical geometry across mint/red-black/mono/rainbow — **required**

## Escape hatch

Bespoke team art: drop an SVG fragment at  
`artifacts/visual-gen/fancy-overrides/fancy__{symbolId}__{team}.svgfrag`  
(or `fancy-nav__…`). Overrides must still share the plain silhouette.
