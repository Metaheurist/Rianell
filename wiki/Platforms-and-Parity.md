# Platforms and Parity

Rianell ships two active client surfaces:

- **Web / PWA** — `apps/pwa-webapp/`
- **React Native (Expo SDK 55)** — `apps/rn-app/`

Legacy **Capacitor** was removed in v1.49. CI enforces parity on every PR.

---

## Parity gates

From repo root:

```bash
npm run parity:web
npm run parity:android
npm run parity:ios
npm run parity:inventory:check
```

Machine-readable contract: `docs/platform-parity.json` (v2).

### v1.120.0 note

- **Unified onboarding counter:** PWA and RN share `unifiedOnboardingProgress.mjs` for first-run step totals.
- **Theme accents (PWA):** Global theme now drives modal/AI/mood/chart chrome via CSS `--accent-*` tokens; RN theme parity for this pass is unchanged.

---

## Feature contract (summary)

| Area | Web | Android | iOS |
|------|-----|---------|-----|
| Log wizard | Yes | Yes | Yes |
| Charts + predictions | Yes | Yes | Yes |
| AI Analysis engine | Yes | Yes | Yes |
| On-device LLM | Yes | Yes | Yes |
| Cloud sync + consent | Yes | Yes | Yes |
| 13 UI locales + RTL ar/he | Yes | Yes | Yes |
| Settings carousel | 10 panes | 10 panes | 10 panes |
| Cycle tracking (log wizard) | Yes | Yes | Yes |
| Mood tab | Yes | Yes | Yes |
| Export / import JSON | Yes | Yes | Yes |
| PWA install prompts | Yes | N/A | N/A |
| Native release links in Settings | N/A | Yes | Yes |

Minor UX differences (e.g. install vs GitHub release links) are intentional per platform.

---

## Shared logic

Both platforms import:

- `@rianell/shared` — schema, i18n, merge
- `@rianell/ai-engine` — analysis (bundled on web)
- `@rianell/cloud-sync` — encryption
- `@rianell/llm` — summaries

This avoids duplicating business rules in PWA vs RN.

---

## LLM download parity

Both clients download chunked models from Supabase Storage, with platform-specific cache (IndexedDB/Cache API vs expo-file-system). RN uses `AiModelDownloadGate` until cache is ready.

---

## When parity changes

Update `docs/platform-parity.md` and `docs/platform-parity.json`, then fix failing `parity:*` scripts before merging.

---

## Read more (technical)

- [Platform parity doc](https://github.com/Metaheurist/Rianell/blob/main/docs/platform-parity.md)
- [Parity inventory](https://github.com/Metaheurist/Rianell/blob/main/docs/parity-inventory.md)
