# Accessibility

Rianell targets WCAG-oriented patterns across PWA and React Native.

## User-facing features

- **Reduce motion:** Honors OS `prefers-reduced-motion` and in-app Settings preference (PWA `body.reduce-motion`, RN `useReduceMotionFlag`).
- **Text scale:** Settings → Accessibility text size.
- **Colorblind modes:** Deuteranopia / protanopia / tritanopia filters in Settings.
- **RTL:** 13 locales including Arabic and Hebrew; layout mirrors where required.
- **Screen reader labels:** Form inputs use associated `<label>` elements; icon-only controls have `aria-label`.

## Developer reference

- Canonical checklist: [docs/accessibility.md](https://github.com/Metaheurist/Rianell/blob/main/docs/accessibility.md)
- Design tokens: `npm run verify:a11y-tokens` and `npm run verify:design-tokens`
- CI: axe audit via `npm run verify:a11y` / `security-dast` workflow

## Reporting issues

If you hit a barrier using Rianell, use [About-and-Support](About-and-Support) or open a GitHub issue with device, locale, and steps to reproduce.
