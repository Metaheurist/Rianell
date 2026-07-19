# Multilingual SEO

Rianell publishes **crawlable, per-language pages** so search engines show
people a result in their own language, while the app itself keeps adapting to
your browser language at runtime (see [[Settings-and-Languages]]).

## What visitors see

- Searching in German, French, Spanish, Italian, Polish, Dutch, Portuguese
  (Brazil & Portugal), Irish, Arabic or Hebrew can surface a localized landing
  or feature page (e.g. `rianell.com/de/features/`).
- Arabic and Hebrew pages render right-to-left.
- On an English page, if your browser is set to another supported language, a
  small dismissable banner offers to switch — it **never** redirects you
  automatically, and it remembers if you dismiss it.
- The app at `rianell.com/` continues to localize itself from your browser/
  account preferences.

## How it works (for developers)

- **Source of truth:** `seo-content/en.json` holds all page copy. Translated
  copies live in `seo-content/<locale>.json`.
- **Rendering:** `scripts/build/generate-localized-pages.mjs` (+
  `seo-page-template.mjs`) emits English + 11 localized page trees, each with a
  reciprocal `hreflang` cluster (+ `x-default`), localized meta/OpenGraph/
  JSON-LD, and RTL handling for `ar`/`he`. The cluster is also injected into the
  app shell `index.html`.
- **Translation:** `scripts/i18n/translate-seo-pages.mjs` uses the local
  TranslateGemma/Ollama pipeline (shared with the locale-pack gap filler).
- **Sitemap:** `scripts/build/generate-sitemap.mjs` lists every localized URL
  with `xhtml:link` hreflang alternates.

### Commands

```bash
npm run seo:translate        # translate en.json -> 11 locale catalogs (needs Ollama)
npm run seo:content:check    # validate translations
npm run seo:pages            # regenerate all HTML + inject hreflang cluster
npm run seo:pages:check      # fail if committed HTML is stale vs catalog
npm run seo:sitemap          # regenerate sitemap.xml
```

Full engineering detail lives in `docs/seo-multilingual.md`. Build/test/CI
context is in [[Build-Test-and-CI]].
