# Contributing

Thank you for contributing to Rianell. This page covers issues, pull requests, and wiki maintenance.

---

## Reporting issues

Use [GitHub Issues](https://github.com/Metaheurist/Rianell/issues) or the in-app bug report.

**Include:**

- Platform (web PWA, Android, iOS) and build/version
- Steps to reproduce, expected vs actual behaviour
- Theme name and locale if UI-related
- For cloud sync: signed-in state and which setting failed
- Console logs (web) or device OS (mobile)

---

## Pull requests

1. Fork and branch from `main`.
2. Keep diffs focused - match existing code style and naming.
3. Run relevant gates locally:
   ```bash
   npm run test:unit
   npm run verify:i18n    # if locales/strings changed
   npm run parity:web     # if PWA changed
   npm run typecheck:mobile  # if RN changed
   ```
4. If you change `package.json`, `requirements.txt`, or PWA CDN URLs:
   ```bash
   npm run docs:dependencies
   ```
   Commit the updated `docs/dependencies.md`.
5. **Never commit** secrets from the `security/` folder, API keys, or model weights.

---

## Code conventions

- Reuse `@rianell/shared` and existing helpers - don’t duplicate merge/analysis logic.
- i18n: add keys to `i18n-packs/locale-packs/v1/en-GB.json`, run sync scripts.
- User notes/symptoms: never auto-translate (UGC policy).
- Client Supabase: publishable key only.

---

## Updating the wiki

The GitHub Wiki is synced from **`wiki/`** in this repo. **Do not edit the GitHub Wiki UI directly** - changes will be overwritten on the next sync.

1. Edit files under `wiki/` in the main repo.
2. Run `npm run wiki:verify`.
3. Run `npm run wiki:sync` locally **or** merge to `main` and let CI push (requires `WIKI_PUSH_TOKEN` repository secret).

After each release, update [[Release-Notes]] and [[Downloads]] build numbers.

---

## Security

See [SECURITY.md](https://github.com/Metaheurist/Rianell/blob/main/docs/SECURITY.md) and project-reference security notes before touching auth, RLS, or CSP.

---

## Contact

**jan.andersson@rianell.com** · [[About-and-Support]]
