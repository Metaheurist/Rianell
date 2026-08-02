# Icon taxonomy

Register id prefixes and kinds produced by `scripts/dev/visual-register-build.mjs` → `apps/pwa-webapp/assets/visual-register.json`.

## Static glyphs

| Prefix / kind | Example | Notes |
|---------------|---------|-------|
| `sprite:` / kind `sprite` | `sprite:icon-user` | Plain UI symbols from `index.html` |
| `fancy:{sym}:{team}` / kind `sprite` | `fancy:icon-user:mint` | Derived team wrap — not LLM-authored |
| `nav:` / kind `nav` | `nav:rianell-nav-home` | Bottom / rail nav |
| `fancy-nav:{nav}:{team}` / kind `nav` | `fancy-nav:rianell-nav-home:mint` | Derived |
| `metric:` | `metric:mood` | 32×32 portfolio |
| `achievement:` | `achievement:cycle_tracker` | 64×64 scenes |
| `emblem-badge:` / `emblem-tier:` / `emblem-cycle:` | badges / rings / phases | Portfolio |
| `avatar:` / `avatar-part:` | companions | 64×64 |
| `fa-replace:` | Font Awesome stand-ins | Must clear subject contracts |

## Motion

| Prefix / kind | Example | Track |
|---------------|---------|-------|
| `animation:` | `animation:drop-bounce` | CSS `@keyframes` — motion track |
| `fx:` | `fx:theme-fx-embers` | Theme FX — motion track |

## Skipped

| Prefix | Notes |
|--------|-------|
| `raster:` / `raster-catalog` | PNG masters — `genStatus: 'skip'` |

## Stem key

For family cohesion, stem is the id with `fancy:` / `fancy-nav:` and trailing `:{team}` stripped, and `sprite:` / `nav:` prefixes removed. All team variants of a stem must share identical core geometry.
