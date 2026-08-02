# Icon stroke and fill

Authoritative stroke / fill contract for Rianell glyphs. Resolves the historical conflict between `--ui-icon-stroke` values `2`, `1.45`, `1.8`, `2.35` in `apps/pwa-webapp/styles.css` and `1.75` in `docs/icons/*.svg`.

## Authoritative 1× stroke

| Token | Value | Role |
|-------|-------|------|
| `--ui-icon-stroke` | **2** | Default UI glyph stroke at 24×24 |
| `--nav-icon-stroke` | **1.75** | Nav-only optical thin (nav icons sit larger) |

All other overrides in CSS must be documented context exceptions:

| Context | Stroke | Why |
|---------|--------|-----|
| Empty-state heroes | 1.45–1.8 | Large display size; thinner reads better |
| Dense chrome chips | 2.35 | Tiny hit targets need weight |

**New icons must not invent a fourth default.** Prefer the cascade (`stroke-width: var(--ui-icon-stroke)`) over inline `stroke-width` on `<path>` / `<circle>`.

## Caps and joins

- `stroke-linecap: round`
- `stroke-linejoin: round`
- No miters unless the metaphor requires a sharp corner (rare)

CSS already forces this on `.ui-svg-icon *` and sprite classes. Symbol bodies should omit redundant inline caps/joins unless they intentionally diverge.

## Corner radius scale (icon geometry)

On the 24 canvas:

| Token | Radius |
|-------|--------|
| `r-xs` | 1 |
| `r-sm` | 1.5 |
| `r-md` | 2 |
| `r-lg` | 3 |

Do not invent one-off radii.

## Fill vs stroke (two-tone)

- Default metaphor is **stroke line-art** with `fill: none` and `stroke: currentColor`.
- `.icon-fill` / `.rianell-icon-fill` may fill closed regions that are part of the metaphor (badge disc, filled check).
- **Forbidden:** converting open stroke arcs to fill-only blobs (breaks stethoscope, tubing, headsets).
- Max two fill regions on a 24 UI glyph unless the subject contract says otherwise.

## Theme paint

When `TEAM` is set (mint / red-black / mono / rainbow), glyph stroke/fill use that team's tokens from `THEME_FX_TOKENS.teams` — not mint `currentColor` with a tinted glow. See [theme-variants.md](theme-variants.md).

## Rule for authors and polishers

Symbols in `index.html` **must not** carry inline `stroke-width` that fights `--ui-icon-stroke`. Inline width is allowed only when a subject contract requires a fixed optical weight independent of theme CSS.
