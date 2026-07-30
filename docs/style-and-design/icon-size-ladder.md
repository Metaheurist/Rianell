# Icon size ladder

How Rianell glyphs behave from 16px to 24px (and portfolio sizes).

## Display sizes

| CSS size | Typical use | Detail budget |
|----------|-------------|---------------|
| 16px | Dense lists, chips, inline labels | Silhouette only; drop internal hatching |
| 20px | Secondary controls | One internal accent max |
| 24px | Default UI controls / nav | Full 24-grid detail |
| 32px+ | Metrics, empty states, achievements | Extra ornament allowed |

`--ui-icon-size` defaults to `1.08em` so icons track text. Empty-state heroes may use `clamp()`.

## Minimum legible feature

At 16px render:

- Minimum stroke projection ≈ 1 device px
- Gaps between strokes ≥ 1 device px
- No features thinner than ~1/16 of the canvas after scale

If a glyph fails 16px legibility, simplify geometry — do not thicken stroke ad hoc.

## What drops at each step

Going **24 → 20 → 16**:

1. Remove secondary dots / ticks first
2. Collapse parallel strokes into one
3. Prefer closed silhouette over internal ribs

Going **24 → 32/64** (portfolio):

1. Keep the same metaphor and proportions
2. May add soft fill discs / rings behind the glyph
3. Must remain recognisable if scaled back to 24

## Principles

- Recognizability before refinement
- Optical over mathematical (a slightly thicker 16px stroke can beat a “correct” thin one)
