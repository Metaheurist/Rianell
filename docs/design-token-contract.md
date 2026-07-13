# Rianell design token contract (canonical)

**Authority:** `@rianell/tokens` (`packages/tokens/src/index.mjs`) is the single source of truth for shipped UI tokens. PWA CSS custom properties in `apps/pwa-webapp/styles.css` and generated `apps/pwa-webapp/css/tokens.css` mirror this package via `npm run sync:tokens`.

**Reference only:** Root `DESIGN.md` (Airbnb baseline from getdesign) is a crawl/reference artifact for guardrail tooling - not the runtime palette for Rianell health surfaces.

## Token layers

| Layer | Location | Consumed by |
|-------|----------|-------------|
| Primitive | `SPACING_TOKENS`, `SURFACE_TOKENS`, team colors in `@rianell/tokens` | RN `ThemeProvider`, PWA `:root` |
| Semantic | `color.success`, `color.danger`, `color.onAccent`, `surface.*` | Components, screens |
| Component | `ScreenCard`, `PrimaryButton`, `Card`, PWA BEM classes | Deployable apps |

## Spacing scale (4px base)

| Token | px |
|-------|-----|
| `xxs` | 2 |
| `xs` | 4 |
| `sm` | 8 |
| `md` | 12 |
| `base` | 16 |
| `lg` | 24 |
| `xl` | 32 |
| `xxl` | 48 |
| `section` | 64 |

## Radius scale

| Token | px |
|-------|-----|
| `sm` | 8 |
| `md` | 12 |
| `lg` | 16 |
| `xl` | 24 |
| `full` | 999 |

## Surface tokens

Dark and light `surface.card`, `surface.cardSolid`, `surface.glass`, `surface.borderMuted`, `surface.modalBackdrop` - use `themeHelpers` on RN; CSS vars `--surface-*` on PWA.

## Motion contract

Animate only `transform`, `opacity`, `filter`. Progress indicators use `transform: scaleX(var(--progress))` with `transform-origin: left`. Gate decorative motion with `prefers-reduced-motion` / `reducedMotion` pref.

## Change protocol

1. Edit `packages/tokens/src/index.mjs` (+ sync `index.cjs` for Jest).
2. Run `npm run sync:tokens` for PWA CSS vars.
3. Update RN `themeHelpers` if semantic accessors change.
4. Run `npm run test:unit` and `node scripts/verify/verify-design-tokens.mjs`.
