# Icon grid specification

Canonical geometry contract for Rianell UI glyphs. Consumed by the visual polish pipeline as `ICON_CONTRACT` and enforced by `npm run verify:icon-spec` / `npm run audit:icon-a`.

## Canvases

| Canvas | viewBox | Live area | Trim | Used for |
|--------|---------|-----------|------|----------|
| UI symbol | `0 0 24 24` | 20×20 (inset 2) | 2px | sprite, nav, fancy, fa-replace |
| Metric | `0 0 32 32` | 28×28 (inset 2) | 2px | `metric:*` |
| Emblem small | `0 0 48 48` | 42×42 (inset 3) | 3px | selected emblems |
| Achievement / avatar | `0 0 64 64` | 56×56 (inset 4) | 4px | `achievement:*`, `avatar:*`, badges |
| Hero | `0 0 96 96` | 84×84 (inset 6) | 6px | rare oversized art |

Default for new icons: **24×24**. Portfolio canvases scale from the 24-unit grid by multiplying coordinates by `size/24`.

## Live area and trim

Ink must stay inside the live area. Trim is reserved for stroke overflow, glow, and animation travel. Animated content that needs more travel uses the **animation safe area** (trim × 1.5) and must still read inside the live area at rest (0% / 100% frames).

## Keylines

On the 24 canvas:

- **Circle keyline** — diameter 20, center `(12,12)`, radius 10
- **Square keyline** — `2,2` → `22,22` (20×20)
- **Landscape rect** — `2,4` → `22,20` (20×16)
- **Portrait rect** — `4,2` → `20,22` (16×20)

Larger canvases scale keylines by `size/24`.

## Coordinate grid

Snap to the **half-unit grid** (0.5). Prefer whole units for major anchors. Avoid sub-0.25 precision unless optically required at 64+.

## Optical over mathematical

Center of mass should feel centered even when the bounding box is not. Optical alignment rules live in [icon-optical-alignment.md](icon-optical-alignment.md).

## Principles

1. Recognizability before refinement — silhouette must read at 16px.
2. Family resemblance — stem siblings share geometry; only paint differs.
3. Systematic construction — every shape traces to this grid and a keyline.
