# Motion catalogue (icon + micro-interaction)

Canonical motion contract for Rianell icon animations and UI micro-motion. Cited by `.cursor/rules/ui-motion.mdc`.

## Token ladder

From `@rianell/tokens` / `apps/pwa-webapp/css/tokens.css`:

| Token | Value | Icon use |
|-------|-------|----------|
| `--dur-instant` | 100ms | Press feedback |
| `--dur-fast` | 180ms | Chip select, chevron flip |
| `--dur-normal` | 280ms | Default enter/exit |
| `--dur-slow` | 450ms | Achievement reveal |
| `--dur-slower` | 700ms | Ambient loops |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Default |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful pops only |

Prefer `transform` + `opacity` (+ `filter` sparingly). Never animate `width` / `height` / layout.

## Loop classes (seamless by construction)

Every infinite loop picks exactly one class and fills its template. Do not invent ad-hoc 0%/100% mismatches.

### `pulse`

Opacity or scale breathe; **0% decls === 100% decls**.

```css
@keyframes rianell-pulse {
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.06); }
}
```

### `cyclic-translate`

Tile scroll. Only `translateX` **or** only `translateY`, same unit, different values — browser wraps seamlessly.

```css
@keyframes rianell-wave-x {
  from { transform: translateX(0); }
  to { transform: translateX(-12px); }
}
```

### `rotate-360`

Single full turn. `|end - start| === 360` (or `0→360` / `360→0`).

```css
@keyframes rianell-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### `breathe`

Combined opacity + gentle scale with matched endpoints (same as pulse, slower).

## Hard rules

1. **One metaphor per motion** — no double-spin (subject rotate + spinner ring).
2. **Seamless** — use a loop class above; do not rely on post-hoc text equality alone.
3. **Reduced motion** — respect `prefers-reduced-motion` and in-app reduced-motion setting; freeze at rest pose.
4. **No layout animation** — transform/opacity only.
5. **Duration** — ambient loops use `--dur-slower` or longer; feedback uses `--dur-fast` / `--dur-normal`.

## Mapping register kinds

- `animation:*` — must declare a loop class in polish metadata / CSS comment `/* loop: pulse */`
- `fx:*` — particle / theme FX; duration gated by `THEME_FX_TOKENS.budgets.particleDurationMs`
