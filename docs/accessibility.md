# Accessibility — Rianell

**Last updated:** 2026-06-23  
**Status:** Launch audit Phase 6.  
**Related:** [plan-02-accessibility-i18n](plans/plan-02-accessibility-i18n/plan.md) · [UI-UX-STANDARDS.md](plans/UI-UX-STANDARDS.md)

---

## 1. Standards target

- **WCAG 2.2 Level AA** for core flows (home, log wizard, settings, charts).
- Platform: PWA (web) + React Native (Android/iOS).

---

## 2. Implemented controls (Phase 6)

| Control | PWA | RN |
|---------|-----|-----|
| Skip to main content | `#main-content` skip link | N/A (native focus order) |
| Focus visible | `:focus-visible` tokens in `styles.css` | Theme focus rings |
| Toggle switches | `role="switch"` + `aria-checked` | Switch components in settings |
| Modals | Focus trap (settings, app lock) | Modal screens |
| Reduced motion | `prefers-reduced-motion` + setting | `AccessibilityInfo` |
| Large text | Settings → Accessibility | System font scale |
| TTS | Optional read-aloud | `expo-speech` |
| Color contrast | Token verify script | Shared `@rianell/tokens` |

---

## 3. CI verification

```bash
npm run verify:a11y-tokens
```

Checks text/background and accent pairs from `@rianell/tokens` for **≥ 4.5:1** (normal text) or **≥ 3:1** (large UI / accent on shell).

---

## 4. Manual test script

1. Keyboard-only: Tab from skip link → main nav → log a metric → open Settings → close with Escape.
2. Screen reader: VoiceOver / TalkBack on home check-in and PHQ-2 button.
3. 200% zoom: no horizontal scroll on home (mobile width).
4. High contrast / colorblind modes in Settings.

---

## 5. Known gaps

- Chart tooltips: partial keyboard access (ApexCharts).
- ONNX model download gate: long progress announcements — improve `aria-live` politeness.
- RN Charts parity: accessibility labels on some sparklines pending.

---

## 6. Reporting

File accessibility bugs via in-app bug report; tag `a11y` in GitHub issue title.
