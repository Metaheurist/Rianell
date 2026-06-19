# UI/UX standards — mobile & desktop (all plans)

**Priority:** Every feature ships usable on **phone (PWA + RN)**, **tablet**, and **desktop browser** before plan completion.

**Cross-ref:** Plan 02 (I1–I5 accessibility), Plan 01 (T2 design tokens), Plan 03 (S5 simple mode)

---

## Layout & responsive

| Rule | Implementation |
|------|----------------|
| **Touch targets** | Min 44×44 px (WCAG 2.5.5); adequate spacing on RN and PWA |
| **Breakpoints** | PWA: single-column default &lt;768px; side-by-side settings/charts ≥768px where applicable |
| **Safe areas** | RN: respect notch/home indicator; PWA: `env(safe-area-inset-*)` on fixed FAB/nav |
| **Max font scale** | Manual smoke at 200% system font — no clipped text, overlapping cards, or horizontal scroll on Home/Settings |
| **RTL** | ar, he: `applyDocumentDirection`; mirror carousel and chart legends (Plan 02) |
| **Simple mode (S5)** | Hide AI cards, advanced charts, anon pool CTAs — test on Home (Plan 10) |

---

## Performance UX (perceived speed)

| Pattern | Plans | Rule |
|---------|-------|------|
| Lazy load heavy modules | 01, 09, 08 | Charts, LLM, Storybook dev-only — not on critical path to first paint |
| Skeleton / placeholder | 10, 09 | Home cards and charts show structure before data ready |
| Debounce / cache | 03, 10 | Settings search index once; H1 card order once per session/day |
| Off main thread | 07, 12 | Large-log analysis in worker; PDF generation async |
| Destroy on hide | 09 | ApexCharts instances destroyed when tab hidden |

---

## Accessibility (minimum bar)

- **Keyboard:** All PWA interactive elements focusable; visible focus ring (tokens)
- **Screen readers:** `aria-label` on icon-only buttons; chart summaries as text (I5 high-contrast palettes in Plan 09)
- **Motion:** Respect `prefers-reduced-motion` for chart animations (X14.4)
- **Color:** Do not rely on color alone for severity (use icons + labels)
- **Haptics / TTS** | RN optional (Plan 02 I3/I4); never send log text to cloud TTS without consent

---

## Platform parity matrix

| Surface | Must test before plan gate |
|---------|---------------------------|
| PWA Chrome/Edge desktop | Primary dev target |
| PWA mobile Safari / Chrome | Home, wizard, charts touch |
| RN iOS + Android | Feature parity or documented gap in `scope.md` |
| Offline | L9 queue flush; P3 local-only mode disables cloud features gracefully |

Known acceptable gaps (documented NR/defer):

- I3/I4 haptics/TTS: RN only
- N10 GGUF WASM: PWA experimental tier
- **L10 / N8 wearables:** excluded — requires Xcode, paid Apple Developer account, and platform health APIs

---

## Plan-specific UX notes

| Exec | Plan | Mobile/desktop focus |
|------|------|----------------------|
| 01 | Platform | Token-based components; Storybook documents 5+ patterns at mobile + desktop widths |
| 02 | i18n | 14 locales lazy-loaded; RTL smoke on settings + home |
| 03 | Settings | 9-pane carousel swipe on mobile; search on desktop |
| 04 | Logging | Wizard progressive fields; L8 AM/PM sub-entries thumb-friendly |
| 05 | Privacy | Policy viewer scrollable; P7 biometric lock on both platforms |
| 06 | Cloud | Conflict merge picker readable on small screens |
| 07 | AI | Tap-to-expand "why" panels; no blocking modal on insight load |
| 08 | LLM | 5-turn chat bounded; MOTD non-blocking shell |
| 09 | Charts | Lazy ApexCharts; C6 export opens on mobile share sheet |
| 10 | Home | Adaptive card stack; H4 micro-check-ins one-tap |
| 11 | Notifications | Generic notification body (no PHI); RN permission UX |
| 12 | Clinician | PDF opens iOS/Android; CL2 QR scannable in clinic lighting |
| 13 | Research | Cohort insights readable without horizontal scroll |
| 14 | Cross-cutting | X14.1 5-step ritual ≤5 min; X14.4 telehealth large fonts |

---

## Verification (every plan)

```bash
node docs/plans/plan-NN-*/scripts/verify-plan.mjs
npm run projects:gate
```

Manual (record in CHANGELOG when applicable):

- [ ] PWA at 375px and 1280px width
- [ ] RN simulator or device smoke
- [ ] Max font scale on Home + Settings
- [ ] Simple mode (S5) hides advanced UI
