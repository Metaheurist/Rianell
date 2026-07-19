# Multilingual SEO

Rianell ships **crawlable, per-language static pages** so Google can serve the
right-language result to each searcher, while the PWA at `/` keeps
self-localizing at runtime. This is the correct, cloaking-free approach:
separate localized URLs + reciprocal `hreflang`, never an Accept-Language
redirect for crawlers.

## URL scheme

Subdirectory prefix (best fit for GitHub Pages + Search Console):

| Locale | Prefix | Landing | Example page |
|---|---|---|---|
| English (default) | — | `/` (the app) | `/features/` |
| German | `/de/` | `/de/` | `/de/features/` |
| French | `/fr/` | `/fr/` | `/fr/features/` |
| Spanish | `/es/` | `/es/` | `/es/features/` |
| Italian | `/it/` | `/it/` | `/it/features/` |
| Polish | `/pl/` | `/pl/` | `/pl/features/` |
| Dutch | `/nl/` | `/nl/` | `/nl/features/` |
| Portuguese (BR) | `/pt-br/` | `/pt-br/` | `/pt-br/features/` |
| Portuguese (PT) | `/pt-pt/` | `/pt-pt/` | `/pt-pt/features/` |
| Irish | `/ga/` | `/ga/` | `/ga/features/` |
| Arabic (RTL) | `/ar/` | `/ar/` | `/ar/features/` |
| Hebrew (RTL) | `/he/` | `/he/` | `/he/features/` |

Localized pages: `home` (locale landing), `features`, `symptom-tracking`,
`mental-health-check`, `ai-insights`, `community`, `conditions`, `about`.
**Excluded:** `privacy.html` / `tos.html` (legal text — not machine-translated),
`404`, `connector-success`.

## `hreflang` cluster

Every page (English **and** localized) carries the same reciprocal cluster
between idempotent markers (`<!-- hreflang:start -->` … `<!-- hreflang:end -->`):

- `en`, `en-GB`, `en-US`, `en-AU` → the English URL (root tree)
- one entry per locale → its localized URL
- `x-default` → the English URL

The same cluster is injected into the app shell `apps/pwa-webapp/index.html`.
The sitemap (`sitemap.xml`) additionally lists every clustered URL with
`<xhtml:link rel="alternate" hreflang>` entries.

## Architecture (single source of truth)

```
seo-content/en.json ──translate──▶ seo-content/<locale>.json (x11)
        │                                   │
        └──────────────┬────────────────────┘
                       ▼
        scripts/build/seo-page-template.mjs   (pure render logic)
                       ▼
        scripts/build/generate-localized-pages.mjs
                       ▼
   apps/pwa-webapp/<slug>/<page> + hreflang cluster + index.html injection
                       ▼
        scripts/build/generate-sitemap.mjs  (+ xhtml:hreflang)
```

- **`seo-content/en.json`** — canonical English copy (titles, meta, OG, hero,
  cards, sections, FAQ, CTAs, breadcrumb labels). Editing this is how you change
  page copy; never hand-edit the generated HTML.
- **`seo-content/<locale>.json`** — machine-translated copies (same shape).
- Structure (`page`/`href`/`style`/`kind`/`type`/`jsonldType`) is copied from
  English verbatim; only human-readable strings are translated.

## Commands

| Command | What it does |
|---|---|
| `npm run seo:translate` | Translate `en.json` → 11 locale catalogs (Ollama, checkpointed) |
| `npm run seo:content:check` | Validate translated catalogs |
| `npm run seo:pages` | Regenerate English + localized HTML + inject cluster into `index.html` |
| `npm run seo:pages:check` | Fail if the committed HTML is out of sync with the catalog |
| `npm run seo:sitemap` | Regenerate `sitemap.xml` (incl. localized routes + `xhtml:link`) |
| `npm run seo:og-card` | Regenerate the 1200×630 social card |

### Regenerating after a copy change

```bash
# 1. edit seo-content/en.json
npm run seo:translate         # refresh translations (needs Ollama; see below)
npm run seo:content:check
npm run seo:pages             # rebuild all HTML
npm run seo:sitemap           # rebuild sitemap
npm run test:unit             # gates
```

### Translation backend (Ollama)

`seo:translate` uses the local **TranslateGemma** model via Ollama, sharing the
exact pipeline of the locale-pack gap filler (`scripts/i18n/lib/ollama-translate.mjs`).

```bash
# defaults: model=translategemma:27b, host=http://127.0.0.1:11434
npm run seo:translate -- --locales=de-DE,fr-FR      # subset
npm run seo:translate -- --pages=features,about     # subset
npm run seo:translate -- --force                    # ignore existing, re-translate
```

If Ollama is not running the command exits early — **English still ships** and
localized bodies fall back to English until a later `seo:translate` run
(hreflang structure is unaffected).

Each string is validated (placeholder parity, no HTML, and — for `ar`/`he` —
native script). The first attempt is deterministic (`temperature: 0`); on
failure the helper **retries with escalating temperature and a script-forcing
prompt** (`buildPrompt(..., { strictScript })`) that keeps only brand/clinical
tokens (Rianell, PHQ-9, GAD-7) in Latin. Re-running `seo:translate` without
`--force` retries only the strings that are still identical to English, so a
resumed/interrupted run cheaply fills just the gaps.

## "View in your language" banner

`apps/pwa-webapp/lang-suggest.js` (loaded on the static pages only) reads the
browser language and, if a localized version of the current page exists, shows a
small dismissable banner linking to it. It **never auto-redirects** (that would
be cloaking and traps users), remembers dismissal in `localStorage`, and styles
itself via CSSOM so it needs no CSP change (`script-src 'self'` is sufficient).

## Optional: Cloudflare Accept-Language 302 (not enabled)

If you later want *humans* hitting the bare root to be nudged to their language
server-side, a Cloudflare Rule could `302` `/` → `/<locale>/` based on
`Accept-Language`, **with `Vary: Accept-Language`** and **excluding known crawler
user-agents** (Googlebot etc. must always see the English root to avoid
cloaking). This is deliberately *not* enabled — the client-side banner is the
SEO-safe default. Document any such rule in
[`security/cloudflare-headers-recommended.md`](../security/cloudflare-headers-recommended.md).

## Search Console

1. Submit `https://rianell.com/sitemap.xml`.
2. Confirm the **International Targeting** report shows no `hreflang` "no return
   tags" errors (the cluster is reciprocal, so it should be clean).
3. Localized URLs are discovered from the sitemap's `xhtml:link` alternates.

## Tests & CI

- `tests/unit/seo/multilingual.test.mjs` — cluster reciprocity, per-locale
  rendering (LTR/RTL, `og:locale`, JSON-LD `inLanguage`), generator determinism,
  localized-file presence, and banner mapping.
- `tests/unit/seo/sitemap.test.mjs` — `xhtml:link` alternates + localized routes.
- `tests/unit/seo/meta-tags.test.mjs` — per-page `<title>`/canonical/description/
  og-card/hreflang/JSON-LD invariants.
- CI `prepare-minified-assets` regenerates the localized trees against the built
  site and asserts `de/features/index.html` carries the `x-default` cluster.
