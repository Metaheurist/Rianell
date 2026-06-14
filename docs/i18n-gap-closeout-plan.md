# i18n gap close-out plan (LC-20)

Based on UI audit (de-DE, pl-PL, en-GB screenshots, Jun 2026). Goal: every shipped locale shows **zero raw keys**, **no English fragments** in Tier A UI, and **fully translated MOTD** (all messages, not only top 30).

## Current shipped locales (14)

`en-GB`, `en-US`, `en-AU`, `pt-BR`, `fr-FR`, `de-DE`, `es-ES`, `it-IT`, `nl-NL`, `pl-PL`, `pt-PT`, `ar`, `he`, **`ga` (Gaeilge — new)**

## Gap categories (from audit)

### A. Wiring gaps (code still hardcoded)

| Area | Example from audit | Fix |
|------|-------------------|-----|
| Log wizard food/exercise pickers | `Filter foods…`, `Filter exercises…` in `app.js` | Use `tUi('logs.picker.filterFoods')` / existing `logs.picker.filterExercises`; add missing keys to en-GB |
| God mode overlay | Section titles + all button labels in English/Polish mix | Tokenize `openModalTestOverlay()` sections via `tUi()`; add `godMode.*` namespace |
| Cookie banner body | English body, Polish buttons | Add `common.cookie.bannerText` + `data-i18n` on `.cookie-banner-text` |
| Cookie/GDPR policy modal bodies | Headings translated, paragraphs English | Move policy sections to locale keys (`policy.cookie.*`) or load from policy pack i18n |
| Install modal | `Zainstaluj the app` hybrid | Wire `install.*` keys already in catalog |
| Benchmark modal | Fully English | Add `benchmark.*` keys (device tier, test results, stability) |
| Review wizard step | Section titles English (`Basics`, `Vitals`) | Wire `wizard.review.*` keys |

**Verify:** `npm run verify:no-hardcoded-ui --strict` + manual God mode / cookie / install pass per locale.

### B. Catalog gaps (raw key shown)

| Raw key seen | Likely cause | Fix |
|--------------|--------------|-----|
| `common.none` | Key exists in de-DE — may be stale cache or wrong key path | Confirm `applyDocumentI18n` runs after wizard open; grep for typos |
| `logs.form.noExercise` | Exists in de-DE | Same — ensure catalog loaded before `renderLogs` / wizard |
| `common.no.medications…` | Long key — verify present in all locale JSON | `verify-locale-packs.mjs` |

### C. Partial MT (Tier A “Frankenstein” strings)

de-DE / pl-PL examples: `Protokoll:Exercise`, `Speichern Entry`, `Hinzufügen notes`, `Data Eksportuj is disabled`.

**Root cause:** Rule-based MT + exact overrides leave English fragments when only part of a string is matched.

**Fix pipeline:**

1. `node scripts/verify-translation-coverage.mjs --strict` — list identical-to-en-GB keys
2. `node scripts/audit-hardcoded-strings.mjs --check` — find remaining source hits
3. Expand `scripts/lib/tier-a-exact-overrides.mjs` per locale for wizard, logs, settings, modals
4. Re-run `node scripts/generate-locale-overrides.mjs` → `sync-i18n-assets.mjs`
5. Human review: search packs for `\b(the|and|Entry|Log|Save)\b` inside non-en locales

**Target:** Tier A ≤5% en-GB identity **and** zero mixed-language sentences (new grep script).

### D. Content catalogs (not in locale packs)

Food tiles, exercise tiles, meal categories, metric labels in log review — **hardcoded English arrays** in `app.js`.

**Fix (LC-20d):**

- Extract food/exercise display names to `i18n-packs/content-packs/v1/food-{locale}.json` (or nested keys `content.food.oatmeal`)
- Resolve via `tUi()` when rendering tiles; keep internal IDs English for data model
- RN parity: shared content pack or duplicate resolver in `packages/shared`

### E. MOTD gaps

All locales have ≥30 messages (`verify-motd-packs.mjs`).

**Remaining issue:** de-DE (and others) messages **31–107** still English in MOTD JSON.

**Fix:**

1. Extend `scripts/translate-motd-packs.mjs` to cover **all** messages (not only top 30)
2. Add `scripts/verify-motd-translation-coverage.mjs` — fail if message[i] === en-GB[i] for Tier A / ga
3. CI: add to `verify:i18n`

### F. Prompt packs

Tier A + ar/he have translated LLM system strings. **ga** ships `llmCapability: ui-only` (UI translated; LLM prompts stay en-GB until Irish MT review).

## Irish (`ga`) rollout

| Step | Status |
|------|--------|
| Add `ga` to `SHIPPED_LOCALES` | Done |
| Locale pack scaffold (`generate-locale-overrides.mjs`) | Done — core nav/wizard strings in Irish |
| MOTD pack (30 Irish + en tail) | Done — extend to full 107 in LC-20e |
| Prompt pack (`ui-only`) | Done |
| `sync-i18n-assets.mjs` | Done |
| Full UI MT | Run `USE_MYMEMORY_MT=1 node scripts/auto-translate-ui-strings.mjs --translate` (or DeepL `GA`) |
| Privacy policy strings | `node scripts/auto-translate-policy-strings.mjs` after ga pack exists |
| RN Settings language picker | Auto via shared `localeLabel('ga')` |

## Segmented delivery (versions)

| Version | Scope | Status |
|---------|--------|--------|
| **v1.71.0** | Irish `ga` locale scaffold + MOTD/prompt packs | Done |
| **v1.72.0** | LC-20a: Cookie banner, install modal, picker filter wiring | Done |
| **v1.72.1** | LC-20b: God mode + benchmark modal + wizard review tokenization | Done |
| **v1.73.0** | LC-20c: Tier A mixed-string cleanup (MT pipeline + overrides) | Done |
| **v1.74.0** | LC-20d: Food/exercise content catalogs (`content.*`) | Done |
| **v1.74.1** | LC-20h: Benchmark test label localization | Done |
| **v1.75.0** | LC-20e: MOTD coverage gate + ar/he headline MT | Done |
| **v1.76.0** | LC-20f: Policy/cookie modal body localization | Done |
| **v1.77.0** | CI closure: expanded `verify:i18n` + docs | Done |

## Verification checklist (per locale)

```bash
npm run verify:i18n
# Manual QA matrix:
# - Settings → Language → {locale}
# - Log wizard steps 1–10 + food/exercise modals
# - Logs expand + share/edit/delete
# - Cookie banner + policy modal
# - God mode (`) all sections
# - MOTD line displays translated text
```

## Priority order

1. **Wiring** (A) — fixes raw keys and English chrome immediately  
2. **Tier A MT quality** (C) — fixes mixed de-DE/pl-PL screenshots  
3. **MOTD full set** (E) — user-facing daily quotes  
4. **Content catalogs** (D) — food/exercise tiles  
5. **Policy bodies** (F) — legal text (may stay en-GB authoritative + machine-translated notice)
