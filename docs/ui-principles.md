# UI principles - chronic illness design (Plan 26 A11Y13)

## Cognitive load

- Max **3 primary actions** per screen.
- Wizard: **one question per step**; never auto-advance.
- Default to the simplest option; progressive disclosure for advanced features.

## Emotional design

- No shame language - "Welcome back" not "You haven't logged".
- Celebrate consistency, not perfection. Partial logs count.
- Companion tone, not clinical device copy.

## Visual design

- Color never sole severity indicator - pair with icon + text.
- Body text ≥ 16px; minimum 14px for labels.
- Dark theme: off-white on dark grey (`#E8E8E8` on `#121212`), not pure white on black.
- Warm dark (`rianell-appearance-warm-dark`) for light-sensitive users.

## Interaction

- Touch targets ≥ 44×44 px; primary actions on bad days ≥ 64 px height.
- Every swipe has a button equivalent.
- Destructive actions: confirm or 5-second undo toast.
- No time-limited interactions.

## Performance as accessibility

- Meaningful first paint < 2s on Tier 3 profile.
- Skeleton loaders for async cards.
- No UI thread block > 100ms for sync work.

## Accessibility

- Brain fog mode: larger text, fewer home cards, capped AI bullets.
- WCAG 2.2 AA target; axe CI gate on critical/serious violations.
- `forced-colors` focus rings via outline, not box-shadow alone.
