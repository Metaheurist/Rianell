# Contributing to Rianell

Thank you for helping improve Rianell. This guide covers the essentials for contributors.

## Code of conduct

Be respectful and patient - many users live with chronic illness and brain fog. Review our community standards in project docs.

## Developer Certificate of Origin

Sign commits with `git commit -s` (DCO sign-off).

## Branch naming

- `feat/` - new features
- `fix/` - bug fixes
- `security/` - security hardening
- `docs/` - documentation only

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/): `feat(scope): description`, `fix:`, `perf:`, `docs:`, `chore:`, `ci:`, `test:`, `security:`.

## Setup

```bash
npm install
npm run test:unit
```

## Local gate (before PR)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\projects\post-plan-gate.ps1
```

## i18n

Add new strings to `i18n-packs/locale-packs/v1/en-GB.json` first. Run `npm run verify:i18n`.

## New packages

Use `@rianell/` scope and add to root `package.json` workspaces.

## Pull request checklist

- [ ] `npm run test:unit` passes
- [ ] `npm run verify:i18n` passes (if strings changed)
- [ ] `docs/CHANGELOG.md` updated for user-visible changes
- [ ] `docs/plans/MASTER.md` updated if shipping a planned feature
- [ ] Reviewed `security-performance.md` for the affected plan folder
