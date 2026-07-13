# Product

## Register

product

## Users

People managing a chronic condition (fatigue, flares, joint pain, mood) who log daily health signals - steps, hydration, sleep, mood, symptoms - often on a phone, sometimes during low-energy or brain-fog days. They are in a quick check-in workflow: glance at today, log an entry, spot a pattern, get out.

## Product Purpose

Rianell is a privacy-first health tracking PWA (+ React Native app) with on-device AI analysis. It helps users connect lifestyle inputs to how they feel, without their health data leaving the device unless they explicitly opt in. Success = a user logs consistently and can see which factors correlate with good and bad days.

## Brand Personality

Calm, alive, trustworthy. "Whimsical but never clinical" - health stats should feel like a living companion, not a spreadsheet. Soft green bioluminescent palette, generous rounding, gentle motion. Reassuring in tone; never alarmist about health data.

## Anti-references

- Clinical EHR dashboards (grey, dense, intimidating).
- Gamified fitness apps that shame missed targets with harsh reds and streak-guilt.
- Generic AI-SaaS gradients and glassmorphism-by-default.
- Anything that makes screening or symptom data feel surveilled.

## Design Principles

1. **Low-energy first** - every flow must be completable on a bad day: large targets, few steps, brain-fog mode respected.
2. **Motion conveys state** - animation signals progress, success, or attention; decoration is tier-gated (device benchmark, reduced-motion, clinical vibe) and never blocks the task.
3. **Private by visible default** - on-device processing is a feature; surfaces say so plainly ("On-device · private").
4. **One accent, semantic states** - the theme primary carries selection and action; amber/red are reserved for genuine below-target / danger semantics.
5. **Depth without weight** - layered surfaces, glow, and 3D moments must stay within CWV budget (lazy-loaded, tier-gated).

## Accessibility & Inclusion

- WCAG 2.1 AA target; `npm run verify:a11y` gate on contrast/focus changes.
- `prefers-reduced-motion` plus an in-app `reducedMotion` pref must disable all nonessential animation, including WebGL scenes.
- Brain-fog mode and clinical vibe classes disable ambient effects entirely.
- Touch targets ≥ 44px; i18n across locale packs (no hardcoded new user-facing strings without keys).
